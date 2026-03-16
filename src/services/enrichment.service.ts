import { RawPropertyData, EnrichedPropertyData, MarketEnrichment } from '@/lib/property-analysis-types'

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY ?? ''
const ATTOM_API_KEY    = process.env.ATTOM_API_KEY ?? ''
const RENTCAST_BASE    = process.env.RENTCAST_API_URL ?? 'https://api.rentcast.io/v1'
const ATTOM_BASE       = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0'

// ── Rentcast listing lookup ───────────────────────────────────────────────────

interface RentcastListing {
  listPrice?: number
  bedrooms?: number
  bathrooms?: number
  squareFootage?: number
  yearBuilt?: number
  daysOnMarket?: number
  propertyType?: string
  addressLine1?: string
  city?: string
  state?: string
  zipCode?: string
  hoa?: { fee?: number }
}

/**
 * Fetches the active sale listing for a property address from Rentcast.
 * Used as a fallback when the scraper can't extract price / property details.
 */
async function fetchRentcastListingDetails(
  raw: RawPropertyData
): Promise<Partial<RawPropertyData>> {
  if (!RENTCAST_API_KEY) return {}

  // Build the best address string we can from what the scraper returned
  const parts = [raw.address.street, raw.address.city, raw.address.state, raw.address.zip].filter(Boolean)
  if (parts.length < 2) return {}

  const addressStr = parts.join(', ')
  const headers = { 'X-Api-Key': RENTCAST_API_KEY }

  try {
    const res = await fetch(
      `${RENTCAST_BASE}/listings/sale?address=${encodeURIComponent(addressStr)}&status=Active&limit=1`,
      { headers }
    )
    if (!res.ok) return {}

    const data = await res.json()
    const listing: RentcastListing = Array.isArray(data) ? data[0] : data
    if (!listing?.listPrice) return {}

    return {
      price:        listing.listPrice,
      beds:         listing.bedrooms  ?? raw.beds,
      baths:        listing.bathrooms ?? raw.baths,
      sqft:         listing.squareFootage ?? raw.sqft,
      yearBuilt:    listing.yearBuilt ?? raw.yearBuilt,
      daysOnMarket: listing.daysOnMarket ?? raw.daysOnMarket,
      hoaFees:      listing.hoa?.fee ?? raw.hoaFees,
      propertyType: listing.propertyType ?? raw.propertyType,
      address: {
        street: listing.addressLine1 ?? raw.address.street,
        city:   listing.city         ?? raw.address.city,
        state:  listing.state        ?? raw.address.state,
        zip:    listing.zipCode      ?? raw.address.zip,
      },
    }
  } catch {
    return {}
  }
}

// ── Rentcast ──────────────────────────────────────────────────────────────────

interface RentcastAvm {
  rent?: number
  rentRangeLow?: number
  rentRangeHigh?: number
  comparables?: {
    address?: string
    rent?: number
    bedrooms?: number
    squareFootage?: number
  }[]
}

interface RentcastMarket {
  averageRent?: number
  medianDaysOnMarket?: number
}

/**
 * Fetches estimated rental data for a property address from Rentcast.
 */
async function fetchRentcastData(
  raw: RawPropertyData
): Promise<Partial<MarketEnrichment>> {
  if (!RENTCAST_API_KEY) return {}

  const addressStr = `${raw.address.street}, ${raw.address.city}, ${raw.address.state} ${raw.address.zip}`
  const headers = { 'X-Api-Key': RENTCAST_API_KEY }

  const [avmRes, marketRes] = await Promise.allSettled([
    fetch(
      `${RENTCAST_BASE}/avm/rent/long-term?address=${encodeURIComponent(addressStr)}&bedrooms=${raw.beds}&bathrooms=${raw.baths}&squareFootage=${raw.sqft}`,
      { headers }
    ),
    fetch(
      `${RENTCAST_BASE}/markets?zipCode=${raw.address.zip}`,
      { headers }
    ),
  ])

  const result: Partial<MarketEnrichment> = {}

  if (avmRes.status === 'fulfilled' && avmRes.value.ok) {
    const avm: RentcastAvm = await avmRes.value.json()
    result.estimatedMonthlyRent = avm.rent ?? 0
    result.rentRangeLow = avm.rentRangeLow ?? 0
    result.rentRangeHigh = avm.rentRangeHigh ?? 0
    result.rentComps = (avm.comparables ?? []).slice(0, 5).map((c) => ({
      address: c.address ?? '',
      rent: c.rent ?? 0,
      beds: c.bedrooms ?? 0,
      sqft: c.squareFootage ?? 0,
    }))
  }

  if (marketRes.status === 'fulfilled' && marketRes.value.ok) {
    const market: RentcastMarket = await marketRes.value.json()
    result.neighborhoodMedianRent = market.averageRent ?? 0
    result.medianDaysOnMarket = market.medianDaysOnMarket ?? 0
  }

  return result
}

// ── Attom ─────────────────────────────────────────────────────────────────────

interface AttomPropertyDetail {
  property?: {
    summary?: { proptype?: string; yearbuilt?: number }
    lot?: { lotsize2?: number }
    building?: { size?: { bldgsize?: number }; rooms?: { beds?: number; bathstotal?: number } }
  }[]
}

interface AttomAssessment {
  property?: {
    assessment?: {
      assessed?: { assdttlvalue?: number }
      tax?: { taxamt?: number }
      market?: { mktttlvalue?: number }
    }
    assessmenthistory?: { taxyear?: number; taxamt?: number }[]
  }[]
}

interface AttomAvm {
  property?: {
    avm?: { amount?: { value?: number } }
  }[]
}

/**
 * Fetches property details, assessed value, and AVM from Attom Data.
 */
async function fetchAttomData(
  raw: RawPropertyData
): Promise<Partial<MarketEnrichment>> {
  if (!ATTOM_API_KEY) return {}

  const address1 = raw.address.street
  const address2 = `${raw.address.city} ${raw.address.state} ${raw.address.zip}`
  const headers = {
    apikey: ATTOM_API_KEY,
    Accept: 'application/json',
  }

  const [detailRes, assessRes, avmRes] = await Promise.allSettled([
    fetch(
      `${ATTOM_BASE}/property/detail?address1=${encodeURIComponent(address1)}&address2=${encodeURIComponent(address2)}`,
      { headers }
    ),
    fetch(
      `${ATTOM_BASE}/assessment/detail?address1=${encodeURIComponent(address1)}&address2=${encodeURIComponent(address2)}`,
      { headers }
    ),
    fetch(
      `${ATTOM_BASE}/avm/detail?address1=${encodeURIComponent(address1)}&address2=${encodeURIComponent(address2)}`,
      { headers }
    ),
  ])

  const result: Partial<MarketEnrichment> = {}

  if (assessRes.status === 'fulfilled' && assessRes.value.ok) {
    const assess: AttomAssessment = await assessRes.value.json()
    const prop = assess.property?.[0]
    result.assessedValue = prop?.assessment?.assessed?.assdttlvalue
    result.taxHistory = (prop?.assessmenthistory ?? [])
      .slice(0, 5)
      .map((h) => ({ year: h.taxyear ?? 0, amount: h.taxamt ?? 0 }))
  }

  if (avmRes.status === 'fulfilled' && avmRes.value.ok) {
    const avm: AttomAvm = await avmRes.value.json()
    result.arvEstimate = avm.property?.[0]?.avm?.amount?.value ?? raw.estimatedValue ?? raw.price * 1.15
  }

  // Fallback ARV if Attom didn't return one
  if (!result.arvEstimate) {
    result.arvEstimate = raw.estimatedValue ?? Math.round(raw.price * 1.15)
  }

  // Price per sqft
  if (raw.price && raw.sqft) {
    result.pricePerSqft = Math.round(raw.price / raw.sqft)
  }

  // Suppress unused variable
  void detailRes

  return result
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Enriches raw scraped property data with rental comps and market data.
 * Each API call is attempted independently — failures are collected as
 * enrichmentErrors and do not prevent the analysis from proceeding.
 */
export async function enrichPropertyData(
  raw: RawPropertyData,
  manualListPrice?: number
): Promise<EnrichedPropertyData> {
  const errors: string[] = []

  // ── Step 1: Apply manual price override (highest priority) ────────────────
  // If the user entered the listing price in the form, use it directly.
  let effective: RawPropertyData = manualListPrice
    ? { ...raw, price: manualListPrice }
    : raw

  // ── Step 2: Fill in missing details via Rentcast listing lookup ───────────
  // Runs when price is still 0 (scraper blocked AND no manual price entered).
  if (!effective.price || !effective.beds || !effective.sqft) {
    const listingData = await fetchRentcastListingDetails(effective)
    if (listingData.price || listingData.beds) {
      effective = {
        ...effective,
        price:        listingData.price        ?? effective.price,
        beds:         listingData.beds         ?? effective.beds,
        baths:        listingData.baths        ?? effective.baths,
        sqft:         listingData.sqft         ?? effective.sqft,
        yearBuilt:    listingData.yearBuilt    ?? effective.yearBuilt,
        daysOnMarket: listingData.daysOnMarket ?? effective.daysOnMarket,
        hoaFees:      listingData.hoaFees      ?? effective.hoaFees,
        propertyType: listingData.propertyType ?? effective.propertyType,
        address:      listingData.address      ?? effective.address,
      }
    }
  }

  // ── Step 2: Fetch rental comps + AVM using the best available address ──────
  const [rentcastData, attomData] = await Promise.allSettled([
    fetchRentcastData(effective),
    fetchAttomData(effective),
  ])

  const rentcast = rentcastData.status === 'fulfilled' ? rentcastData.value : {}
  const attom    = attomData.status    === 'fulfilled' ? attomData.value    : {}

  if (rentcastData.status === 'rejected') errors.push(`Rentcast: ${String(rentcastData.reason)}`)
  if (attomData.status    === 'rejected') errors.push(`Attom: ${String(attomData.reason)}`)

  const marketEnrichment: Partial<MarketEnrichment> = {
    estimatedMonthlyRent:     rentcast.estimatedMonthlyRent ?? Math.round(effective.price * 0.007),
    rentRangeLow:             rentcast.rentRangeLow ?? 0,
    rentRangeHigh:            rentcast.rentRangeHigh ?? 0,
    rentComps:                rentcast.rentComps ?? [],
    arvEstimate:              attom.arvEstimate ?? effective.estimatedValue ?? Math.round(effective.price * 1.15),
    assessedValue:            attom.assessedValue,
    taxHistory:               attom.taxHistory ?? [],
    neighborhoodMedianPrice:  attom.neighborhoodMedianPrice ?? effective.price,
    neighborhoodMedianRent:   rentcast.neighborhoodMedianRent ?? 0,
    medianDaysOnMarket:       rentcast.medianDaysOnMarket ?? effective.daysOnMarket ?? 30,
    pricePerSqft:             attom.pricePerSqft ?? (effective.sqft ? Math.round(effective.price / effective.sqft) : 0),
    neighborhoodPricePerSqft: attom.neighborhoodPricePerSqft ?? 0,
  }

  return {
    ...effective,   // spread effective (may have listing-corrected price/address/details)
    marketEnrichment,
    enrichmentErrors: errors,
  }
}
