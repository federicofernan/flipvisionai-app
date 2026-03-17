import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PLAN_PRICES: Record<string, number> = {
  free:     0,
  pro:      19,
  investor: 49,
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    const [profilesRes, reportsRes, analysesRes] = await Promise.all([
      supabase.from('profiles').select('selected_plan'),
      supabase.from('reports').select('*', { count: 'exact', head: true }),
      supabase.from('property_analyses').select('*', { count: 'exact', head: true }),
    ])

    // Count users per plan
    const planCounts: Record<string, number> = { free: 0, pro: 0, investor: 0 }
    for (const row of profilesRes.data ?? []) {
      const plan = row.selected_plan ?? 'free'
      planCounts[plan] = (planCounts[plan] ?? 0) + 1
    }

    // Estimated MRR
    const mrr = Object.entries(planCounts).reduce((sum, [plan, count]) => {
      return sum + count * (PLAN_PRICES[plan] ?? 0)
    }, 0)

    return NextResponse.json({
      users:    (profilesRes.data ?? []).length,
      reports:  reportsRes.count  ?? 0,
      analyses: analysesRes.count ?? 0,
      planCounts,
      mrr,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
