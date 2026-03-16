// ── Raw data scraped from Zillow / Redfin ─────────────────────────────────────
export interface RawPropertyData {
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  price: number
  beds: number
  baths: number
  sqft: number
  lotSize?: number
  yearBuilt?: number
  propertyTaxes?: number
  hoaFees?: number
  description: string
  propertyType: string
  daysOnMarket?: number
  priceHistory?: { date: string; price: number; event: string }[]
  photos: string[]
  estimatedValue?: number
  source: 'zillow' | 'redfin'
  scrapedAt: string
}

// ── Market enrichment from Rentcast + Attom ──────────────────────────────────
export interface MarketEnrichment {
  estimatedMonthlyRent: number
  rentRangeLow: number
  rentRangeHigh: number
  rentComps: { address: string; rent: number; beds: number; sqft: number }[]
  arvEstimate: number
  assessedValue?: number
  taxHistory?: { year: number; amount: number }[]
  neighborhoodMedianPrice: number
  neighborhoodMedianRent: number
  medianDaysOnMarket: number
  pricePerSqft: number
  neighborhoodPricePerSqft: number
}

// ── Merged property data passed to Claude ────────────────────────────────────
export interface EnrichedPropertyData extends RawPropertyData {
  marketEnrichment: Partial<MarketEnrichment>
  enrichmentErrors: string[]
}

// ── Claude AI analysis report ─────────────────────────────────────────────────
export interface PropertyReport {
  summary: {
    investmentGrade: 'A' | 'B' | 'C' | 'D'
    primaryStrategy: 'flip' | 'rental' | 'flip_then_rent' | 'pass'
    headline: string
    keyHighlights: string[]
    redFlags: string[]
  }
  rentalAnalysis: {
    estimatedMonthlyRent: number
    monthlyExpenses: {
      mortgage: number
      taxes: number
      insurance: number
      hoa: number
      maintenance: number
      vacancy: number
      propertyManagement: number
    }
    monthlyCashFlow: number
    annualCashFlow: number
    capRate: number
    grossYield: number
    cashOnCashReturn: number
    breakEvenOccupancy: number
    rentToValueRatio: number
    verdict: string
  }
  flipAnalysis: {
    purchasePrice: number
    estimatedRenovationCost: number
    renovationCostRange: { low: number; high: number }
    arvEstimate: number
    estimatedProfit: number
    profitMargin: number
    holdingCosts: number
    totalInvestment: number
    roi: number
    estimatedTimelineMonths: number
    verdict: string
  }
  renovationPlan: {
    totalEstimatedCost: number
    priorityLevel: 'cosmetic' | 'moderate' | 'full_gut'
    items: {
      category: string
      item: string
      priority: 'must_do' | 'high_roi' | 'nice_to_have'
      estimatedCost: number
      estimatedRoiImpact: number
      description: string
    }[]
    recommendedStyle: string
    styleRationale: string
  }
  marketContext: {
    marketStrength: 'hot' | 'warm' | 'neutral' | 'cool'
    buyerDemand: string
    competitionLevel: string
    bestExitStrategy: string
    marketRisks: string[]
  }
  financialSummary: {
    minimumCapitalRequired: number
    recommendedReserves: number
    breakEvenPrice: number
    maximumAllowableOffer: number
  }
}

// ── Supabase row shape ────────────────────────────────────────────────────────
export interface PropertyAnalysisRow {
  id: string
  user_id: string
  source_url: string
  address: string
  list_price: number | null
  raw_data: RawPropertyData | null
  enriched_data: EnrichedPropertyData | null
  analysis_report: PropertyReport | null
  cached: boolean
  created_at: string
  expires_at: string
}
