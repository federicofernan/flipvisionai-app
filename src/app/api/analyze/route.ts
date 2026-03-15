import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, Part } from '@google/generative-ai'
import { GoogleGenAI, Modality } from '@google/genai'
import { createClient } from '@/lib/supabase/server'
import { RoomType, ROOM_TYPE_LABELS, AnalysisReport } from '@/lib/types'

const genAI    = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const googleAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

async function urlToInlinePart(url: string): Promise<Part> {
  const res = await fetch(url)
  const buffer = await res.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const mimeType = res.headers.get('content-type') ?? 'image/jpeg'
  return { inlineData: { data: base64, mimeType } }
}

function parseGeminiJson(text: string): AnalysisReport {
  // Strip markdown code fences if Gemini wraps the JSON in them
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return JSON.parse(cleaned)
}

function buildImagePrompt(template: string, report: AnalysisReport): string {
  const topRenos = report.top_priorities
    .slice(0, 3)
    .map((p) => p.renovation)
    .join(', ')

  const rooms = report.rooms.map((r) => r.room_label).join(', ')

  return template
    .replace('{{rooms}}', rooms)
    .replace('{{top_renovations}}', topRenos)
}

export async function POST(req: NextRequest) {
  try {
    const { propertyId, rooms } = await req.json()

    if (!propertyId || !rooms?.length) {
      return NextResponse.json({ error: 'Missing propertyId or rooms' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch photos for selected rooms, grouped by room type
    const { data: photos, error: photosError } = await supabase
      .from('property_photos')
      .select('public_url, room_type, file_name')
      .eq('property_id', propertyId)
      .in('room_type', rooms)
      .order('room_type')
      .order('created_at', { ascending: true })

    if (photosError) throw photosError
    if (!photos?.length) {
      return NextResponse.json({ error: 'No photos found for the selected rooms' }, { status: 400 })
    }

    // Group photos by room type
    const grouped = photos.reduce<Record<string, typeof photos>>((acc, p) => {
      if (!acc[p.room_type]) acc[p.room_type] = []
      acc[p.room_type].push(p)
      return acc
    }, {})

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash' })

    // Fetch the analysis prompt from the database
    const { data: promptRow, error: promptError } = await supabase
      .from('prompts')
      .select('content')
      .eq('name', 'renovation_analysis')
      .single()

    if (promptError || !promptRow) {
      console.error('Failed to load prompt from DB:', promptError)
      return NextResponse.json({ error: 'Prompt configuration not found. Run prompts-schema.sql in Supabase.' }, { status: 500 })
    }

    const roomList = Object.keys(grouped).map((r) => ROOM_TYPE_LABELS[r as RoomType] ?? r).join(', ')
    const prompt   = promptRow.content.replace('{{rooms}}', roomList)

    // The first photo across all analyzed rooms (ordered by created_at asc from the DB query)
    const beforePhotoUrl = photos[0]?.public_url ?? null

    // Build multipart content: prompt text, then per-room label + images
    const parts: Part[] = [{ text: prompt }]
    const allImageParts: Part[] = []

    for (const [roomType, roomPhotos] of Object.entries(grouped)) {
      const label = ROOM_TYPE_LABELS[roomType as RoomType] ?? roomType
      parts.push({
        text: `\n--- Room: ${label} (${roomPhotos.length} photo${roomPhotos.length !== 1 ? 's' : ''}) ---`,
      })
      const imageParts = await Promise.all(roomPhotos.map((p) => urlToInlinePart(p.public_url)))
      parts.push(...imageParts)
      allImageParts.push(...imageParts)
    }

    const result = await model.generateContent(parts)
    const rawText = result.response.text()

    let analysisReport: AnalysisReport
    try {
      analysisReport = parseGeminiJson(rawText)
    } catch {
      console.error('Gemini JSON parse error. Raw:', rawText)
      return NextResponse.json(
        { error: 'AI returned an unexpected format. Please try again.' },
        { status: 502 }
      )
    }

    // Persist the text report first so we have the reportId
    const { data: saved, error: insertError } = await supabase
      .from('reports')
      .insert({ property_id: propertyId, rooms, analysis: JSON.stringify(analysisReport), before_photo_url: beforePhotoUrl })
      .select('id')
      .single()

    if (insertError) throw insertError

    // ── Generate a rendered-after image with Gemini image generation ─────────
    let generatedImageUrl: string | null = null
    try {
      // Fetch image generation prompt template from DB
      const { data: imagePromptRow } = await supabase
        .from('prompts')
        .select('content')
        .eq('name', 'image_generation')
        .single()

      const imagePromptTemplate = imagePromptRow?.content ?? 'Photorealistic rendering of a renovated home interior. Rooms: {{rooms}}. Improvements: {{top_renovations}}. No people, no text.'
      const imagePrompt = buildImagePrompt(imagePromptTemplate, analysisReport)
      console.log('[image_generation] prompt:', imagePrompt)

      const imageResponse = await googleAI.models.generateContent({
        model: process.env.IMAGEN_MODEL ?? 'gemini-3.1-flash-image-preview',
        contents: [{ role: 'user', parts: [{ text: imagePrompt }, ...allImageParts] }],
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
      })

      // Find the first image part in the response
      const parts = imageResponse.candidates?.[0]?.content?.parts ?? []
      const imagePart = parts.find((p) => p.inlineData?.data)

      if (imagePart?.inlineData?.data) {
        const imageBytes = Buffer.from(imagePart.inlineData.data, 'base64')
        const mimeType   = imagePart.inlineData.mimeType ?? 'image/jpeg'
        const ext        = mimeType.includes('png') ? 'png' : 'jpg'
        const imagePath  = `reports/${saved.id}.${ext}`

        const { error: storageError } = await supabase.storage
          .from('property-photos')
          .upload(imagePath, imageBytes, { contentType: mimeType, upsert: true })

        if (!storageError) {
          const { data: { publicUrl } } = supabase.storage
            .from('property-photos')
            .getPublicUrl(imagePath)

          generatedImageUrl = publicUrl

          await supabase
            .from('reports')
            .update({ generated_image_url: generatedImageUrl })
            .eq('id', saved.id)
        }
      }
    } catch (imgErr) {
      // Image generation is best-effort — don't fail the whole request
      console.error('Image generation error:', imgErr)
    }

    return NextResponse.json({ report: analysisReport, reportId: saved.id, generatedImageUrl })
  } catch (err: unknown) {
    console.error('Analyze error:', err)
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
