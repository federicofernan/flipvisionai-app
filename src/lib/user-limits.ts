import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanId } from '@/lib/plans'

export type LimitType = 'renovation_analysis' | 'property_analysis'

interface UserLimitsRow {
  user_id:                   string
  plan:                      string
  renovation_analysis_limit: number | null
  property_analysis_limit:   number | null
  renovation_analysis_used:  number
  property_analysis_used:    number
  expires_at:                string
}

export interface LimitCheckResult {
  allowed: boolean
  used:    number
  limit:   number | null
  message?: string
}

/** Returns a timestamp 30 days from now (rolling billing period). */
function thirtyDaysFromNow(): string {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * Fetches the user_limits row, creating it on first call.
 * On creation, bootstraps counts from existing records so existing users
 * don't get a free reset of their current-month usage.
 * Also handles period expiry (monthly reset) and plan changes.
 */
async function ensureRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId:  string,
  planId:  PlanId,
): Promise<UserLimitsRow> {
  const planInfo      = PLANS.find((p) => p.id === planId)
  const renovLimit    = planInfo?.report_limit            ?? null
  const propertyLimit = planInfo?.property_analysis_limit ?? null
  const expiry        = thirtyDaysFromNow()

  // ── Fetch existing row ──────────────────────────────────────────────────
  const { data: existing } = await supabase
    .from('user_limits')
    .select('*')
    .eq('user_id', userId)
    .single()

  // ── First time: create row, seeding counts from existing records ────────
  if (!existing) {
    const startOfMonth = new Date(
      new Date().getFullYear(), new Date().getMonth(), 1,
    ).toISOString()

    const [{ count: renovUsed }, { count: propUsed }] = await Promise.all([
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth),
      supabase
        .from('property_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth),
    ])

    const newRow = {
      user_id:                   userId,
      plan:                      planId,
      renovation_analysis_limit: renovLimit,
      property_analysis_limit:   propertyLimit,
      renovation_analysis_used:  renovUsed   ?? 0,
      property_analysis_used:    propUsed    ?? 0,
      expires_at:                expiry,
    }

    await supabase
      .from('user_limits')
      .upsert(newRow, { onConflict: 'user_id' })

    return newRow as UserLimitsRow
  }

  // ── Handle period expiry (monthly reset) or plan change ─────────────────
  const periodExpired = new Date(existing.expires_at) <= new Date()
  const planChanged   = existing.plan !== planId

  if (periodExpired || planChanged) {
    const updates: Record<string, unknown> = {
      plan:                      planId,
      renovation_analysis_limit: renovLimit,
      property_analysis_limit:   propertyLimit,
      updated_at:                new Date().toISOString(),
    }

    if (periodExpired) {
      updates.renovation_analysis_used = 0
      updates.property_analysis_used   = 0
      updates.expires_at               = expiry
    }

    const { data: updated } = await supabase
      .from('user_limits')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    return (updated ?? { ...existing, ...updates }) as UserLimitsRow
  }

  return existing as UserLimitsRow
}

/**
 * Checks whether the user has capacity for the given action.
 * Call this BEFORE running the analysis.
 */
export async function checkLimit(
  userId:    string,
  planId:    PlanId,
  limitType: LimitType,
): Promise<LimitCheckResult> {
  const supabase = await createClient()
  const row      = await ensureRow(supabase, userId, planId)

  const limit = limitType === 'renovation_analysis'
    ? row.renovation_analysis_limit
    : row.property_analysis_limit

  const used = limitType === 'renovation_analysis'
    ? row.renovation_analysis_used
    : row.property_analysis_used

  // Unlimited plan
  if (limit === null) return { allowed: true, used, limit: null }

  if (used >= limit) {
    const label = limitType === 'renovation_analysis'
      ? 'renovation analysis'
      : 'property analysis'
    return {
      allowed: false,
      used,
      limit,
      message: `You have reached your ${limit} ${label} limit for this month. Upgrade to Pro for unlimited analyses.`,
    }
  }

  return { allowed: true, used, limit }
}

/**
 * Increments the usage counter for the given action.
 * Call this AFTER the analysis has been successfully saved.
 */
export async function incrementLimit(
  userId:    string,
  limitType: LimitType,
): Promise<void> {
  const supabase  = await createClient()
  const usedField = `${limitType}_used`

  const { data } = await supabase
    .from('user_limits')
    .select(usedField)
    .eq('user_id', userId)
    .single()

  if (!data) return

  await supabase
    .from('user_limits')
    .update({
      [usedField]: ((data as unknown as Record<string, number>)[usedField] ?? 0) + 1,
      updated_at:  new Date().toISOString(),
    })
    .eq('user_id', userId)
}
