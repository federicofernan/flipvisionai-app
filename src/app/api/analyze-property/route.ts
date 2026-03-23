import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateListingUrl } from '@/utils/url-validator'
import { scrapeListingUrl } from '@/services/scraper.service'
import { enrichPropertyData } from '@/services/enrichment.service'
import { analyzeProperty } from '@/services/analysis.service'
import { PropertyAnalysisRow } from '@/lib/property-analysis-types'
import { type PlanId } from '@/lib/plans'
import { checkLimit, incrementLimit } from '@/lib/user-limits'

// Cache TTL in hours (default 24)
const CACHE_TTL_HOURS = parseInt(process.env.CACHE_TTL_HOURS ?? '24', 10)

export async function POST(req: NextRequest) {
  try {
    const { url, listPrice: manualListPrice }: { url: string; listPrice?: number } = await req.json()

    // 1. Validate URL format
    const urlError = validateListingUrl(url)
    if (urlError) {
      return NextResponse.json({ error: urlError }, { status: 400 })
    }

    const supabase = await createClient()

    // 2. Authenticate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Check for a cached result (not expired, any user)
    const { data: cached } = await supabase
      .from('property_analyses')
      .select('*')
      .eq('source_url', url)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cached) {
      return NextResponse.json({
        report: cached.analysis_report,
        analysisId: cached.id,
        address: cached.address,
        listPrice: cached.list_price,
        cached: true,
        cachedAt: cached.created_at,
      })
    }

    // 4. Usage limit check
    const { data: profile } = await supabase
      .from('profiles')
      .select('selected_plan')
      .eq('id', user.id)
      .single()

    const planId     = (profile?.selected_plan ?? 'free') as PlanId
    const limitCheck = await checkLimit(user.id, planId, 'property_analysis')
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message, code: 'LIMIT_REACHED' }, { status: 403 })
    }

    // 5. Scrape the listing
    let rawData
    try {
      rawData = await scrapeListingUrl(url)
    } catch (scrapeErr) {
      const msg = scrapeErr instanceof Error ? scrapeErr.message : 'Failed to fetch listing'
      return NextResponse.json({ error: msg }, { status: 422 })
    }

    // 6. Enrich with market data (manual price overrides scraped/API price)
    const enrichedData = await enrichPropertyData(rawData, manualListPrice)

    // 7. Run Claude AI analysis
    const report = await analyzeProperty(enrichedData)

    // 8. Persist to Supabase
    // Use enrichedData fields — enrichment may have corrected price/address
    // from the Rentcast listing API when the scraper returned zeros.
    const effectiveAddress = enrichedData.address
    const addressStr = [
      effectiveAddress.street,
      effectiveAddress.city,
      effectiveAddress.state,
      effectiveAddress.zip,
    ].filter(Boolean).join(', ')

    const effectivePrice = enrichedData.price || rawData.price || null

    const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString()

    const { data: saved, error: insertError } = await supabase
      .from('property_analyses')
      .insert({
        user_id: user.id,
        source_url: url,
        address: addressStr,
        list_price: effectivePrice,
        raw_data: rawData,
        enriched_data: enrichedData,
        analysis_report: report,
        cached: false,
        expires_at: expiresAt,
      } satisfies Omit<PropertyAnalysisRow, 'id' | 'created_at'>)
      .select('id')
      .single()

    if (insertError) throw insertError

    await incrementLimit(user.id, 'property_analysis')

    return NextResponse.json({
      report,
      analysisId: saved.id,
      address: addressStr,
      listPrice: effectivePrice,
      photos: enrichedData.photos?.length ? enrichedData.photos : rawData.photos,
      cached: false,
    })
  } catch (err: unknown) {
    console.error('analyze-property error:', err)
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
