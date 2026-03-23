import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, Part } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { RoomType, ROOM_TYPE_LABELS, AnalysisReport, RenovationStyle } from '@/lib/types'
import { type PlanId } from '@/lib/plans'
import { checkLimit, incrementLimit } from '@/lib/user-limits'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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


export async function POST(req: NextRequest) {
  try {
    const { propertyId, rooms, style, includeTimeline }: { propertyId: string; rooms: RoomType[]; style: RenovationStyle; includeTimeline?: boolean } = await req.json()

    if (!propertyId || !rooms?.length) {
      return NextResponse.json({ error: 'Missing propertyId or rooms' }, { status: 400 })
    }
    if (!style?.name) {
      return NextResponse.json({ error: 'Missing renovation style' }, { status: 400 })
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

    // ── Usage limit check ────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('selected_plan')
      .eq('id', user.id)
      .single()

    const planId     = (profile?.selected_plan ?? 'free') as PlanId
    const limitCheck = await checkLimit(user.id, planId, 'renovation_analysis')
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message, code: 'LIMIT_REACHED' }, { status: 403 })
    }

    // Fetch timeline prompt if requested
    let timelineContent = ''
    if (includeTimeline) {
      const { data: timelineRow } = await supabase
        .from('prompts')
        .select('content')
        .eq('name', 'timeline_analysis')
        .single()
      timelineContent = timelineRow?.content ?? ''
    }

    const roomList   = Object.keys(grouped).map((r) => ROOM_TYPE_LABELS[r as RoomType] ?? r).join(', ')
    const styleValue = `${style.label}: ${style.description}`
    const prompt     = promptRow.content
      .replace('{{rooms}}', roomList)
      .replace('{{renovation_style}}', styleValue)
      .replace('{{timeline_analysis}}', timelineContent)

    // The first photo across all analyzed rooms (ordered by created_at asc from the DB query)
    const beforePhotoUrl = photos[0]?.public_url ?? null

    // Build multipart content: prompt text, then per-room label + images
    const parts: Part[] = [{ text: prompt }]

    for (const [roomType, roomPhotos] of Object.entries(grouped)) {
      const label = ROOM_TYPE_LABELS[roomType as RoomType] ?? roomType
      parts.push({
        text: `\n--- Room: ${label} (${roomPhotos.length} photo${roomPhotos.length !== 1 ? 's' : ''}) ---`,
      })
      const imageParts = await Promise.all(roomPhotos.map((p) => urlToInlinePart(p.public_url)))
      parts.push(...imageParts)
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
      .insert({ property_id: propertyId, user_id: user.id, rooms, analysis: JSON.stringify(analysisReport), before_photo_url: beforePhotoUrl, renovation_style: style.label })
      .select('id')
      .single()

    if (insertError) throw insertError

    await incrementLimit(user.id, 'renovation_analysis')

    return NextResponse.json({ report: analysisReport, reportId: saved.id, generatedImageUrl: null })
  } catch (err: unknown) {
    console.error('Analyze error:', err)
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
