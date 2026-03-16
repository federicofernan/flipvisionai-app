-- FlipVision AI — Property Analyses table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS property_analyses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_url  TEXT NOT NULL,
  address     TEXT NOT NULL,
  list_price  INTEGER,
  raw_data    JSONB,
  enriched_data JSONB,
  analysis_report JSONB,
  cached      BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

-- Fast cache lookups and user-scoped queries
CREATE INDEX IF NOT EXISTS idx_property_analyses_url     ON property_analyses(source_url);
CREATE INDEX IF NOT EXISTS idx_property_analyses_user    ON property_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_property_analyses_expires ON property_analyses(expires_at);

-- Enable Row Level Security
ALTER TABLE property_analyses ENABLE ROW LEVEL SECURITY;

-- Users can only read their own analyses
CREATE POLICY "Users can view own analyses"
  ON property_analyses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own analyses
CREATE POLICY "Users can insert own analyses"
  ON property_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own analyses
CREATE POLICY "Users can delete own analyses"
  ON property_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- If the table already exists, you may need to add the expires_at column:
-- ALTER TABLE property_analyses ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours';
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: property analysis prompt (Claude system + user prompt)
-- ─────────────────────────────────────────────────────────────────────────────
insert into prompts (name, description, content) values (
  'property_analysis',
  'System + user prompt sent to Claude when analyzing a property listing URL for investment potential.',
  'You are FlipVision AI, an expert real estate investment analyst specializing in house flipping, rental property analysis, and renovation strategy. You have deep knowledge of construction costs, renovation ROI, real estate markets, and investment fundamentals.

Your job is to analyze property data and return a comprehensive investment analysis as a valid JSON object. Be specific, data-driven, and actionable. Always base financial projections on the provided data. Flag risks honestly.

---USER_PROMPT---

Analyze this property for real estate investment potential. Return ONLY a valid JSON object matching the PropertyReport schema — no markdown, no preamble.

PROPERTY DATA:
{{property_data}}

{{enrichment_note}}

Return a JSON object with this exact structure:
{
  "summary": {
    "investmentGrade": "A" | "B" | "C" | "D",
    "primaryStrategy": "flip" | "rental" | "flip_then_rent" | "pass",
    "headline": "string (one compelling sentence summarizing the opportunity)",
    "keyHighlights": ["string", "string", "string"],
    "redFlags": ["string", "string"]
  },
  "rentalAnalysis": {
    "estimatedMonthlyRent": 0,
    "monthlyExpenses": {
      "mortgage": 0,
      "taxes": 0,
      "insurance": 0,
      "hoa": 0,
      "maintenance": 0,
      "vacancy": 0,
      "propertyManagement": 0
    },
    "monthlyCashFlow": 0,
    "annualCashFlow": 0,
    "capRate": 0,
    "grossYield": 0,
    "cashOnCashReturn": 0,
    "breakEvenOccupancy": 0,
    "rentToValueRatio": 0,
    "verdict": "string"
  },
  "flipAnalysis": {
    "purchasePrice": 0,
    "estimatedRenovationCost": 0,
    "renovationCostRange": { "low": 0, "high": 0 },
    "arvEstimate": 0,
    "estimatedProfit": 0,
    "profitMargin": 0,
    "holdingCosts": 0,
    "totalInvestment": 0,
    "roi": 0,
    "estimatedTimelineMonths": 0,
    "verdict": "string"
  },
  "renovationPlan": {
    "totalEstimatedCost": 0,
    "priorityLevel": "cosmetic" | "moderate" | "full_gut",
    "items": [
      {
        "category": "string",
        "item": "string",
        "priority": "must_do" | "high_roi" | "nice_to_have",
        "estimatedCost": 0,
        "estimatedRoiImpact": 0,
        "description": "string"
      }
    ],
    "recommendedStyle": "string",
    "styleRationale": "string"
  },
  "marketContext": {
    "marketStrength": "hot" | "warm" | "neutral" | "cool",
    "buyerDemand": "string",
    "competitionLevel": "string",
    "bestExitStrategy": "string",
    "marketRisks": ["string"]
  },
  "financialSummary": {
    "minimumCapitalRequired": 0,
    "recommendedReserves": 0,
    "breakEvenPrice": 0,
    "maximumAllowableOffer": 0
  }
}'
) on conflict (name) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- To force-update the prompt after it already exists:
-- delete from prompts where name = 'property_analysis';
-- Then re-run the insert above.
-- ─────────────────────────────────────────────────────────────────────────────
