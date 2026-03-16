import { NextRequest, NextResponse } from 'next/server'
import { Part } from '@google/generative-ai'
import { GoogleGenAI, Modality, type Content } from '@google/genai'
import { createClient } from '@/lib/supabase/server'
import { RoomType, ROOM_TYPE_LABELS, AnalysisReport, RenovationStyle } from '@/lib/types'

const googleAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

async function urlToInlinePart(url: string): Promise<Part> {
  const res = await fetch(url)
  const buffer = await res.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const mimeType = res.headers.get('content-type') ?? 'image/jpeg'
  return { inlineData: { data: base64, mimeType } }
}

function buildImagePrompt(template: string, report: AnalysisReport, style: RenovationStyle): string {
  const topRenos = report.top_priorities
    .slice(0, 3)
    .map((p) => p.renovation)
    .join(', ')
  const rooms = report.rooms.map((r) => r.room_label).join(', ')
  return template
    .replace('{{rooms}}', rooms)
    .replace('{{top_renovations}}', topRenos)
    .replace('{{renovation_style}}', `${style.label}: ${style.description}`)
}

export async function POST(req: NextRequest) {
  try {
    const { reportId, propertyId, rooms, style, analysis }:
      { reportId: string; propertyId: string; rooms: RoomType[]; style: RenovationStyle; analysis: AnalysisReport } =
      await req.json()

    if (!reportId || !propertyId || !rooms?.length || !style || !analysis) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch photos for selected rooms
    const { data: photos, error: photosError } = await supabase
      .from('property_photos')
      .select('public_url, room_type')
      .eq('property_id', propertyId)
      .in('room_type', rooms)
      .order('created_at', { ascending: true })

    if (photosError) throw photosError
    if (!photos?.length) {
      return NextResponse.json({ error: 'No photos found' }, { status: 400 })
    }

    // Fetch image generation prompt from DB
    const { data: imagePromptRow } = await supabase
      .from('prompts')
      .select('content')
      .eq('name', 'image_generation')
      .single()

    const imagePromptTemplate =
      imagePromptRow?.content ??
      'Photorealistic rendering of a renovated home interior. Design style: {{renovation_style}}. Rooms: {{rooms}}. Improvements: {{top_renovations}}. No people, no text.'

    const imagePrompt = buildImagePrompt(imagePromptTemplate, analysis, style)
    console.log('[generate-image] prompt:', imagePrompt)

    // Convert photos to inline parts
    const allImageParts = await Promise.all(photos.map((p) => urlToInlinePart(p.public_url)))

    const imageResponse = await googleAI.models.generateContent({
      model: process.env.IMAGEN_MODEL ?? 'gemini-3.1-flash-image-preview',
      contents: [{ role: 'user', parts: [{ text: imagePrompt }, ...allImageParts] }] as unknown as Content[],
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    })

    const responseParts = imageResponse.candidates?.[0]?.content?.parts ?? []
    const imagePart = responseParts.find((p) => p.inlineData?.data)

    if (!imagePart?.inlineData?.data) {
      return NextResponse.json({ error: 'No image returned by AI' }, { status: 502 })
    }

    const imageBytes = Buffer.from(imagePart.inlineData.data, 'base64')
    const mimeType   = imagePart.inlineData.mimeType ?? 'image/jpeg'
    const ext        = mimeType.includes('png') ? 'png' : 'jpg'
    const imagePath  = `reports/${reportId}.${ext}`

    const { error: storageError } = await supabase.storage
      .from('property-photos')
      .upload(imagePath, imageBytes, { contentType: mimeType, upsert: true })

    if (storageError) throw storageError

    const { data: { publicUrl } } = supabase.storage
      .from('property-photos')
      .getPublicUrl(imagePath)

    await supabase
      .from('reports')
      .update({ generated_image_url: publicUrl })
      .eq('id', reportId)

    return NextResponse.json({ generatedImageUrl: publicUrl })
  } catch (err: unknown) {
    console.error('Generate-image error:', err)
    const message = err instanceof Error ? err.message : 'Image generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
