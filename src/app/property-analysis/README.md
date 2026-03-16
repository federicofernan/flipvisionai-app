# Property Analysis Feature

AI-powered investment analysis for Zillow and Redfin listings. Paste a URL and get rental ROI, flip profit potential, renovation recommendations, and market insights powered by Claude.

## How It Works

1. User pastes a Zillow or Redfin listing URL
2. Playwright scrapes structured property data from the listing
3. Rentcast API provides rental comps; Attom Data provides AVM + tax history
4. Claude AI generates a structured investment analysis report
5. FlipVision renders a tabbed analysis dashboard

## Required Environment Variables

Add these to your `.env.local` (local dev) and to your deployment platform (Netlify):

```env
# Scraping (optional — without this, no proxy rotation is used)
PROXY_URL=your_brightdata_or_scraperapi_proxy_url
SCRAPER_TIMEOUT_MS=30000

# Data enrichment (optional — AI analysis proceeds without these, using fallback estimates)
RENTCAST_API_KEY=your_rentcast_key       # https://app.rentcast.io
ATTOM_API_KEY=your_attom_key             # https://api.gateway.attomdata.com

# AI analysis (required — same keys used by the renovation analysis feature)
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.0-flash

# Cache TTL (optional, default 24)
CACHE_TTL_HOURS=24
```

> `RENTCAST_API_KEY` and `ATTOM_API_KEY` are optional. If omitted, the AI analysis still runs using data scraped from the listing plus fallback estimates. Enrichment errors are flagged in the report.

## Supabase Migration

Run `supabase/property-analysis-schema.sql` in your Supabase SQL Editor to create the `property_analyses` table with RLS policies.

## Scraper Notes

The Playwright scraper uses `playwright-core` + `@sparticuz/chromium` for serverless-compatible headless Chrome.

**Local development:** Works out of the box.

**Netlify / serverless:** The scraper may hit the 10-second function timeout. Consider:
- Upgrading to Netlify Pro (26s timeout)
- Using Railway, Render, or Fly.io for longer-running functions
- Setting `PROXY_URL` to a BrightData or ScraperAPI endpoint which handles the scraping remotely

## Plan Limits

| Plan     | Property Analyses / month |
|----------|--------------------------|
| Free     | 2                        |
| Pro      | Unlimited                |
| Investor | Unlimited                |

When a free user hits the limit, the API returns `{ code: 'LIMIT_REACHED', error: '...' }` with a 403 status and the UI shows an upgrade CTA.

## Caching

Analyses are cached for 24 hours (configurable via `CACHE_TTL_HOURS`). If the same URL is analyzed again within the cache window, the stored result is returned immediately with `cached: true` and a timestamp — no API calls are made.

## File Structure

```
src/
  app/
    property-analysis/
      page.tsx                 ← Main page
    api/
      analyze-property/
        route.ts               ← API endpoint
  components/
    PropertyUrlInput.tsx       ← URL input with progress steps
    PropertyAnalysisDashboard.tsx ← Tabbed results dashboard
    analysis/
      SummaryHeader.tsx        ← Grade, strategy, headline, highlights
      MetricCards.tsx          ← 4 key metric cards
      RentalAnalysisTab.tsx    ← Cash flow, cap rate, expenses
      FlipAnalysisTab.tsx      ← Deal waterfall, ROI, profit margin
      RenovationPlanTab.tsx    ← Prioritized renovation items
      MarketContextTab.tsx     ← Market strength, financial summary
  services/
    scraper.service.ts         ← Playwright scraper (Zillow + Redfin)
    enrichment.service.ts      ← Rentcast + Attom enrichment
    analysis.service.ts        ← Claude AI analysis
  lib/
    property-analysis-types.ts ← All TypeScript interfaces
  utils/
    url-validator.ts           ← URL validation helpers
supabase/
  property-analysis-schema.sql ← DB migration
```
