import { RawPropertyData } from '@/lib/property-analysis-types'
import { detectSource } from '@/utils/url-validator'

const TIMEOUT_MS = parseInt(process.env.SCRAPER_TIMEOUT_MS ?? '30000', 10)
const MAX_RETRIES = 3

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
]

function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ── Fetch-based HTML retrieval ────────────────────────────────────────────────

/**
 * Tries to fetch page HTML without launching a browser.
 * Faster and less detectable for sites that serve SSR HTML.
 */
async function fetchPageHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(url, {
      headers: {
        'User-Agent': randomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}

// ── HTML parsers (no DOM required) ───────────────────────────────────────────

function extractJsonLdFromHtml(html: string): string[] {
  const blocks: string[] = []
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    if (m[1]?.trim()) blocks.push(m[1])
  }
  return blocks
}

function extractNextDataFromHtml(html: string): Record<string, unknown> {
  try {
    const m = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!m?.[1]) return {}
    return JSON.parse(m[1]) as Record<string, unknown>
  } catch {
    return {}
  }
}

// ── Zillow __NEXT_DATA__ parser ───────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseZillowNextData(nextData: Record<string, unknown>): Partial<RawPropertyData> {
  try {
    const pageProps = (nextData as any)?.props?.pageProps ?? {}

    // ── Strategy 1: gdpClientCache (most Zillow pages) ──────────────────────
    const cacheStr = pageProps?.gdpClientCache
    if (cacheStr) {
      const cache = typeof cacheStr === 'string' ? JSON.parse(cacheStr) : cacheStr
      for (const entry of Object.values(cache) as any[]) {
        const prop = entry?.property
        if (!prop?.price) continue

        const photos: string[] = []
        for (const p of prop.photos ?? []) {
          const url =
            p.mixedSources?.jpeg?.[0]?.url ??
            p.mixedSources?.webp?.[0]?.url ??
            p.url ??
            ''
          if (url) photos.push(url)
        }

        return {
          address: {
            street: prop.streetAddress ?? prop.address?.streetAddress ?? '',
            city:   prop.city ?? prop.address?.city ?? '',
            state:  prop.state ?? prop.address?.state ?? '',
            zip:    prop.zipcode ?? prop.address?.zipcode ?? prop.zip ?? '',
          },
          price:        Number(prop.price ?? 0),
          beds:         Number(prop.bedrooms ?? prop.beds ?? 0),
          baths:        Number(prop.bathrooms ?? prop.baths ?? 0),
          sqft:         Number(prop.livingArea ?? prop.sqft ?? 0),
          yearBuilt:    prop.yearBuilt ?? undefined,
          hoaFees:      prop.monthlyHoaFee ?? undefined,
          description:  prop.description ?? '',
          daysOnMarket: prop.daysOnZillow ?? undefined,
          estimatedValue: prop.zestimate ?? undefined,
          photos:       photos.slice(0, 10),
        }
      }
    }

    // ── Strategy 2: initialData (some Zillow pages) ──────────────────────────
    const initial = pageProps?.initialData
    const prop = initial?.data?.home ?? initial?.property
    if (prop?.price) {
      return {
        address: {
          street: prop.streetAddress ?? '',
          city:   prop.city ?? '',
          state:  prop.state ?? '',
          zip:    prop.zipcode ?? '',
        },
        price: Number(prop.price ?? 0),
        beds:  Number(prop.bedrooms ?? 0),
        baths: Number(prop.bathrooms ?? 0),
        sqft:  Number(prop.livingArea ?? 0),
        yearBuilt: prop.yearBuilt ?? undefined,
        description: prop.description ?? '',
        estimatedValue: prop.zestimate ?? undefined,
        photos: [],
      }
    }
  } catch {
    // fall through
  }
  return {}
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Address from Zillow URL ───────────────────────────────────────────────────

/**
 * Extracts a partial address from a Zillow URL slug as a last-resort fallback.
 * e.g. /homedetails/123-Main-St-Springfield-IL-62701/12345_zpid/
 */
function parseAddressFromZillowUrl(url: string): Partial<RawPropertyData['address']> {
  try {
    const m = url.match(/homedetails\/([^/]+)\/\d+_zpid/)
    if (!m) return {}
    const slug = m[1]

    // ZIP is always 5 digits at the end
    const zipM = slug.match(/-(\d{5})$/)
    const zip  = zipM?.[1] ?? ''
    const withoutZip = zip ? slug.slice(0, -(zip.length + 1)) : slug

    // State is 2 uppercase letters before zip
    const stateM = withoutZip.match(/-([A-Z]{2})$/)
    const state  = stateM?.[1] ?? ''
    const withoutState = state ? withoutZip.slice(0, -(state.length + 1)) : withoutZip

    // Replace remaining hyphens with spaces — best-effort street/city
    const readable = withoutState.replace(/-/g, ' ')

    return { street: readable, city: '', state, zip }
  } catch {
    return {}
  }
}

// ── JSON-LD extraction helpers ────────────────────────────────────────────────

interface JsonLdSingleFamily {
  '@type'?: string
  name?: string
  description?: string
  address?: {
    streetAddress?: string
    addressLocality?: string
    addressRegion?: string
    postalCode?: string
  }
  floorSize?: { value?: number }
  numberOfRooms?: number
  numberOfBathroomsTotal?: number
  yearBuilt?: number
  image?: string | string[]
  offers?: { price?: number | string }
  [key: string]: unknown
}

function extractFromJsonLd(jsonLdBlocks: string[]): Partial<RawPropertyData> {
  for (const block of jsonLdBlocks) {
    try {
      const data: JsonLdSingleFamily = JSON.parse(block)
      if (!data['@type'] || !String(data['@type']).match(/SingleFamilyResidence|Apartment|House|Residence/i)) continue

      const addr   = data.address ?? {}
      const images = Array.isArray(data.image) ? data.image : data.image ? [data.image] : []
      const price  = data.offers?.price ? Number(data.offers.price) : undefined

      return {
        address: {
          street: addr.streetAddress ?? '',
          city:   addr.addressLocality ?? '',
          state:  addr.addressRegion ?? '',
          zip:    addr.postalCode ?? '',
        },
        price:       price ?? 0,
        beds:        data.numberOfRooms ?? 0,
        baths:       data.numberOfBathroomsTotal ?? 0,
        sqft:        data.floorSize?.value ?? 0,
        yearBuilt:   data.yearBuilt,
        description: data.description ?? '',
        photos:      images.slice(0, 10),
      }
    } catch {
      // try next block
    }
  }
  return {}
}

// ── Playwright browser launcher ───────────────────────────────────────────────

async function launchBrowser() {
  const isServerless = !!(
    process.env.NETLIFY ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.VERCEL
  )

  if (isServerless) {
    const chromium = (await import('@sparticuz/chromium')).default
    const { chromium: playwright } = await import('playwright-core')
    const executablePath = await chromium.executablePath()
    return playwright.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath,
      headless: true,
    })
  }

  const { chromium } = await import('playwright')
  return chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
}

// ── Zillow scraper ────────────────────────────────────────────────────────────

async function scrapeZillow(url: string): Promise<RawPropertyData> {
  const source = 'zillow' as const

  // ── Pass 1: fetch-based (fast, low detection) ──────────────────────────────
  const html = await fetchPageHtml(url)
  if (html && html.length > 5000 && !html.includes('captcha')) {
    const jsonLdBlocks = extractJsonLdFromHtml(html)
    const nextData     = extractNextDataFromHtml(html)
    const fromNextData = parseZillowNextData(nextData)
    const fromJsonLd   = extractFromJsonLd(jsonLdBlocks)

    // Merge: nextData is the most reliable source
    const merged = { ...fromJsonLd, ...fromNextData }

    if (merged.price && merged.price > 0) {
      const urlAddress = parseAddressFromZillowUrl(url)
      const address = {
        street: merged.address?.street || urlAddress.street || '',
        city:   merged.address?.city   || urlAddress.city   || '',
        state:  merged.address?.state  || urlAddress.state  || '',
        zip:    merged.address?.zip    || urlAddress.zip    || '',
      }
      return {
        address,
        price:        merged.price ?? 0,
        beds:         merged.beds ?? 0,
        baths:        merged.baths ?? 0,
        sqft:         merged.sqft ?? 0,
        lotSize:      undefined,
        yearBuilt:    merged.yearBuilt,
        propertyTaxes: undefined,
        hoaFees:      merged.hoaFees,
        description:  merged.description ?? '',
        propertyType: 'Single Family',
        daysOnMarket: merged.daysOnMarket,
        priceHistory: [],
        photos:       merged.photos ?? [],
        estimatedValue: merged.estimatedValue,
        source,
        scrapedAt: new Date().toISOString(),
      }
    }
  }

  // ── Pass 2: Playwright with stealth ───────────────────────────────────────
  const browser = await launchBrowser()
  try {
    const context = await browser.newContext({
      userAgent: randomUserAgent(),
      ...(process.env.PROXY_URL ? { proxy: { server: process.env.PROXY_URL } } : {}),
    })

    const page = await context.newPage()
    await page.setDefaultTimeout(TIMEOUT_MS)

    // Override webdriver flag to reduce bot detection
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
    })

    // Block heavy non-essential assets
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,otf}', (route) => {
      const u = route.request().url()
      if (u.includes('zillowstatic.com')) route.continue()
      else route.abort()
    })

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS })

    // Wait a moment for JS hydration
    await sleep(1500)

    // Extract __NEXT_DATA__
    let nextData: Record<string, unknown> = {}
    try {
      const raw = await page.$eval('#__NEXT_DATA__', (el) => el.textContent ?? '')
      nextData = JSON.parse(raw)
    } catch { /* no next data */ }

    const fromNextData = parseZillowNextData(nextData)

    // Extract JSON-LD
    const jsonLdBlocks = await page.$$eval(
      'script[type="application/ld+json"]',
      (els) => els.map((el) => el.textContent ?? '')
    )
    const fromJsonLd = extractFromJsonLd(jsonLdBlocks)

    // DOM fallbacks for price / beds / baths / sqft
    let beds  = fromNextData.beds  ?? fromJsonLd.beds  ?? 0
    let baths = fromNextData.baths ?? fromJsonLd.baths ?? 0
    let sqft  = fromNextData.sqft  ?? fromJsonLd.sqft  ?? 0
    try {
      const facts = await page.$$eval('[data-testid="bed-bath-sqft-fact-container"]', (els) =>
        els.map((el) => el.textContent ?? '')
      )
      for (const f of facts) {
        const n = parseFloat(f.replace(/[^\d.]/g, ''))
        if (/bd|bed/i.test(f) && !beds)  beds  = n
        if (/ba|bath/i.test(f) && !baths) baths = n
        if (/sqft|sq ft/i.test(f) && !sqft) sqft = n
      }
    } catch { /* ignore */ }

    let estimatedValue: number | undefined = fromNextData.estimatedValue
    if (!estimatedValue) {
      try {
        const zestText = await page.$eval('[data-testid="zestimate-text"]', (el) => el.textContent ?? '')
        estimatedValue = parseInt(zestText.replace(/\D/g, ''), 10) || undefined
      } catch { /* no zestimate */ }
    }

    const domPhotos = await page.$$eval('img[src*="photos.zillowstatic.com"]', (imgs) =>
      imgs.map((img) => (img as HTMLImageElement).src).slice(0, 10)
    ).catch(() => [] as string[])

    const domPrice = await page.$eval('[data-testid="price"]', (el) => el.textContent ?? '').catch(() => '')
    const parsedDomPrice = parseInt((fromJsonLd.price ? String(fromJsonLd.price) : domPrice).replace(/\D/g, ''), 10) || 0
    const priceNum = fromNextData.price ?? parsedDomPrice

    const urlAddress = parseAddressFromZillowUrl(url)
    const address = {
      street: fromNextData.address?.street ?? fromJsonLd.address?.street ?? urlAddress.street ?? '',
      city:   fromNextData.address?.city   ?? fromJsonLd.address?.city   ?? urlAddress.city   ?? '',
      state:  fromNextData.address?.state  ?? fromJsonLd.address?.state  ?? urlAddress.state  ?? '',
      zip:    fromNextData.address?.zip    ?? fromJsonLd.address?.zip    ?? urlAddress.zip    ?? '',
    }

    await browser.close()

    return {
      address,
      price:         priceNum,
      beds,
      baths,
      sqft,
      lotSize:       undefined,
      yearBuilt:     fromNextData.yearBuilt ?? fromJsonLd.yearBuilt,
      propertyTaxes: undefined,
      hoaFees:       fromNextData.hoaFees,
      description:   fromNextData.description ?? fromJsonLd.description ?? '',
      propertyType:  'Single Family',
      daysOnMarket:  fromNextData.daysOnMarket,
      priceHistory:  [],
      photos:        fromNextData.photos?.length ? fromNextData.photos : (fromJsonLd.photos?.length ? fromJsonLd.photos : domPhotos),
      estimatedValue,
      source,
      scrapedAt: new Date().toISOString(),
    }
  } catch (err) {
    await browser.close()
    throw err
  }
}

// ── Redfin scraper ────────────────────────────────────────────────────────────

async function scrapeRedfin(url: string): Promise<RawPropertyData> {
  // Try fetch first
  const html = await fetchPageHtml(url)
  if (html && html.length > 5000) {
    const jsonLdBlocks = extractJsonLdFromHtml(html)
    const fromJsonLd   = extractFromJsonLd(jsonLdBlocks)
    if (fromJsonLd.price && fromJsonLd.price > 0) {
      return {
        address:      fromJsonLd.address ?? { street: '', city: '', state: '', zip: '' },
        price:        fromJsonLd.price ?? 0,
        beds:         fromJsonLd.beds ?? 0,
        baths:        fromJsonLd.baths ?? 0,
        sqft:         fromJsonLd.sqft ?? 0,
        lotSize:      undefined,
        yearBuilt:    fromJsonLd.yearBuilt,
        propertyTaxes: undefined,
        hoaFees:      undefined,
        description:  fromJsonLd.description ?? '',
        propertyType: 'Single Family',
        daysOnMarket: undefined,
        priceHistory: [],
        photos:       fromJsonLd.photos ?? [],
        estimatedValue: undefined,
        source:       'redfin',
        scrapedAt:    new Date().toISOString(),
      }
    }
  }

  // Playwright fallback
  const browser = await launchBrowser()
  try {
    const context = await browser.newContext({
      userAgent: randomUserAgent(),
      ...(process.env.PROXY_URL ? { proxy: { server: process.env.PROXY_URL } } : {}),
    })

    const page = await context.newPage()
    await page.setDefaultTimeout(TIMEOUT_MS)

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
    })

    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,otf}', (route) => {
      const u = route.request().url()
      if (u.includes('ssl.cdn-redfin.com')) route.continue()
      else route.abort()
    })

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS })
    await sleep(1000)

    const jsonLdBlocks = await page.$$eval(
      'script[type="application/ld+json"]',
      (els) => els.map((el) => el.textContent ?? '')
    )
    const fromJsonLd = extractFromJsonLd(jsonLdBlocks)

    const domPrice = await page.$eval('.homePriceSection .price .stat-block-value', (el) => el.textContent ?? '').catch(() => '')
    const priceNum = parseInt((fromJsonLd.price ? String(fromJsonLd.price) : domPrice).replace(/\D/g, ''), 10) || 0

    let beds  = fromJsonLd.beds  ?? 0
    let baths = fromJsonLd.baths ?? 0
    let sqft  = fromJsonLd.sqft  ?? 0
    try {
      const statsText = await page.$$eval('.stats-list .stat', (els) => els.map((el) => el.textContent ?? ''))
      for (const s of statsText) {
        const n = parseFloat(s.replace(/[^\d.]/g, ''))
        if (/bed/i.test(s) && !beds)    beds  = n
        if (/bath/i.test(s) && !baths)  baths = n
        if (/sq ft/i.test(s) && !sqft)  sqft  = n
      }
    } catch { /* ignore */ }

    const domPhotos = await page.$$eval('.slider-container img', (imgs) =>
      imgs.map((img) => (img as HTMLImageElement).src).slice(0, 10)
    ).catch(() => [] as string[])

    let estimatedValue: number | undefined
    try {
      const estText = await page.$eval('.avm-current-value', (el) => el.textContent ?? '')
      estimatedValue = parseInt(estText.replace(/\D/g, ''), 10) || undefined
    } catch { /* no estimate */ }

    const domAddress = await page.$eval('.street-address', (el) => el.textContent ?? '').catch(() => '')

    await browser.close()

    return {
      address: fromJsonLd.address ?? { street: domAddress, city: '', state: '', zip: '' },
      price:         priceNum,
      beds,
      baths,
      sqft,
      lotSize:       undefined,
      yearBuilt:     fromJsonLd.yearBuilt,
      propertyTaxes: undefined,
      hoaFees:       undefined,
      description:   fromJsonLd.description ?? '',
      propertyType:  'Single Family',
      daysOnMarket:  undefined,
      priceHistory:  [],
      photos:        fromJsonLd.photos?.length ? fromJsonLd.photos : domPhotos,
      estimatedValue,
      source:        'redfin',
      scrapedAt:     new Date().toISOString(),
    }
  } catch (err) {
    await browser.close()
    throw err
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Scrapes a Zillow or Redfin listing URL and returns structured property data.
 *
 * Strategy:
 * 1. Fast fetch-based HTML extraction (parses JSON-LD + __NEXT_DATA__)
 * 2. Playwright fallback with anti-detection measures
 * 3. URL-based address extraction as absolute fallback
 *
 * Retries up to MAX_RETRIES times with exponential backoff on failure.
 */
export async function scrapeListingUrl(url: string): Promise<RawPropertyData> {
  const source = detectSource(url)
  let lastError: Error = new Error('Unknown scraper error')

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) await sleep(Math.pow(2, attempt) * 1000)

    try {
      return source === 'zillow'
        ? await scrapeZillow(url)
        : await scrapeRedfin(url)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      if (lastError.message.includes('blocked') || lastError.message.includes('captcha')) {
        throw new Error('This listing is temporarily unavailable. Try again in a few minutes.')
      }
    }
  }

  throw lastError
}
