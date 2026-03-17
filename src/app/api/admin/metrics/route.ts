import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    const [usersRes, reportsRes, analysesRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }),
      supabase.from('property_analyses').select('*', { count: 'exact', head: true }),
    ])

    return NextResponse.json({
      users:    usersRes.count    ?? 0,
      reports:  reportsRes.count  ?? 0,
      analyses: analysesRes.count ?? 0,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
