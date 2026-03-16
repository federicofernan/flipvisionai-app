import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { EnrichedPropertyData, PropertyReport } from '@/lib/property-analysis-types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'

// ── Fallback prompt (used when DB row is missing) ─────────────────────────────

const FALLBACK_SYSTEM = `You are FlipVision AI, an expert real estate investment analyst specializing in house flipping, rental property analysis, and renovation strategy. You have deep knowledge of construction costs, renovation ROI, real estate markets, and investment fundamentals.

Your job is to analyze property data and return a comprehensive investment analysis as a valid JSON object. Be specific, data-driven, and actionable. Always base financial projections on the provided data. Flag risks honestly.`

const FALLBACK_USER_TEMPLATE = `Analyze this property for real estate investment potential. Return ONLY a valid JSON object matching the PropertyReport schema — no markdown, no preamble.

PROPERTY DATA:
{{property_data}}

{{enrichment_note}}

Return a JSON object with the full PropertyReport schema including summary, rentalAnalysis, flipAnalysis, renovationPlan, marketContext, and financialSummary.`

// ── Prompt loader ─────────────────────────────────────────────────────────────

interface ParsedPrompt {
  system: string
  userTemplate: string
}

/**
 * Loads the `property_analysis` prompt from the `prompts` table.
 * The prompt content uses `---USER_PROMPT---` as a separator between
 * the system instruction and the user message template.
 * Falls back to hardcoded defaults if the row is missing.
 */
async function loadPrompt(): Promise<ParsedPrompt> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('prompts')
      .select('content')
      .eq('name', 'property_analysis')
      .single()

    if (error || !data?.content) {
      console.warn('property_analysis prompt not found in DB, using fallback')
      return { system: FALLBACK_SYSTEM, userTemplate: FALLBACK_USER_TEMPLATE }
    }

    const SEPARATOR = '---USER_PROMPT---'
    const idx = data.content.indexOf(SEPARATOR)

    if (idx === -1) {
      return { system: FALLBACK_SYSTEM, userTemplate: data.content }
    }

    return {
      system:       data.content.slice(0, idx).trim(),
      userTemplate: data.content.slice(idx + SEPARATOR.length).trim(),
    }
  } catch {
    return { system: FALLBACK_SYSTEM, userTemplate: FALLBACK_USER_TEMPLATE }
  }
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildUserPrompt(template: string, data: EnrichedPropertyData): string {
  const enrichmentNote = data.enrichmentErrors.length > 0
    ? `NOTE: The following data could not be fetched and should be estimated: ${data.enrichmentErrors.join(', ')}`
    : ''

  return template
    .replace('{{property_data}}', JSON.stringify(data, null, 2))
    .replace('{{enrichment_note}}', enrichmentNote)
}

// ── Parser + validator ────────────────────────────────────────────────────────

function parseReport(text: string): PropertyReport {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
  return JSON.parse(cleaned) as PropertyReport
}

function validateReport(report: PropertyReport): void {
  const required = ['summary', 'rentalAnalysis', 'flipAnalysis', 'renovationPlan', 'marketContext', 'financialSummary'] as const
  for (const key of required) {
    if (!report[key]) throw new Error(`Missing required field: ${key}`)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Calls the Gemini API with enriched property data and returns a structured
 * investment analysis report.
 *
 * The system and user prompts are loaded from the `prompts` DB table
 * (name = 'property_analysis'). Falls back to hardcoded defaults if missing.
 * Retries once with a stricter prompt if the first response cannot be parsed.
 */
export async function analyzeProperty(data: EnrichedPropertyData): Promise<PropertyReport> {
  const { system, userTemplate } = await loadPrompt()
  const userPrompt = buildUserPrompt(userTemplate, data)

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
  })

  let rawText = ''

  // First attempt
  try {
    const result = await model.generateContent(userPrompt)
    rawText = result.response.text()
    const report = parseReport(rawText)
    validateReport(report)
    return report
  } catch (firstError) {
    console.warn('First Gemini parse attempt failed:', firstError)
  }

  // Retry with a stricter prompt
  const retryPrompt = `${userPrompt}

IMPORTANT: Your previous response could not be parsed as valid JSON. Return ONLY the raw JSON object with no additional text, no markdown code fences, and no explanation. Start your response with { and end with }.`

  let report: PropertyReport
  try {
    const retryResult = await model.generateContent(retryPrompt)
    rawText = retryResult.response.text()
    report = parseReport(rawText)
    validateReport(report)
  } catch (retryError) {
    console.error('Gemini retry also failed. Raw:', rawText)
    throw new Error(`AI returned an invalid response after retry: ${String(retryError)}`)
  }

  return report
}
