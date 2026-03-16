'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/AppShell'
import { PropertyUrlInput } from '@/components/PropertyUrlInput'
import { PropertyAnalysisDashboard } from '@/components/PropertyAnalysisDashboard'
import { PropertyReport, PropertyAnalysisRow } from '@/lib/property-analysis-types'
import { PLANS, type PlanId } from '@/lib/plans'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Zap, BarChart2, TrendingUp, Home,
  Bookmark, Crown, AlertTriangle, ExternalLink,
  Building2, Clock,
} from 'lucide-react'

interface AnalysisResult {
  report: PropertyReport
  analysisId: string
  address: string
  listPrice: number
  photos: string[]
  cached: boolean
  cachedAt?: string
}

// ── Grade helpers ─────────────────────────────────────────────────────────────

const GRADE_STYLES: Record<string, string> = {
  A: 'bg-green-100 text-green-700 border-green-200',
  B: 'bg-blue-100 text-blue-700 border-blue-200',
  C: 'bg-amber-100 text-amber-700 border-amber-200',
  D: 'bg-red-100 text-red-700 border-red-200',
}

const STRATEGY_LABELS: Record<string, string> = {
  flip:          'Flip',
  rental:        'Rental',
  flip_then_rent: 'Flip → Rent',
  pass:          'Pass',
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  const features = [
    { icon: Search,     label: 'Paste any Zillow or Redfin URL',           sub: 'Supports single-family, condo, and multi-family' },
    { icon: Zap,        label: 'AI scrapes & enriches listing data',         sub: 'Rentcast rental comps + Attom AVM data' },
    { icon: BarChart2,  label: 'Get rental ROI & flip profit analysis',      sub: 'Cap rate, cash-on-cash, MAO, and more' },
    { icon: TrendingUp, label: 'Full renovation plan with cost estimates',   sub: 'Prioritized by ROI impact' },
  ]

  return (
    <div className="max-w-lg mx-auto text-center py-10">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600
        flex items-center justify-center mx-auto mb-5 shadow-sm shadow-blue-200">
        <Home className="w-7 h-7 text-white" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Analyze Any Property</h2>
      <p className="text-sm text-slate-500 mb-8 leading-relaxed">
        Paste a Zillow or Redfin listing URL to get a full AI-powered investment analysis —
        rental ROI, flip profit, renovation plan, and market insights.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8">
        {features.map((f) => (
          <div key={f.label} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
              <f.icon className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">{f.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{f.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Saved report card ─────────────────────────────────────────────────────────

function SavedReportCard({
  row,
  onView,
}: {
  row: PropertyAnalysisRow
  onView: (row: PropertyAnalysisRow) => void
}) {
  const report = row.analysis_report
  const grade = report?.summary?.investmentGrade
  const strategy = report?.summary?.primaryStrategy

  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
          <Building2 className="w-4 h-4 text-slate-500" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{row.address}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {grade && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${GRADE_STYLES[grade] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                Grade {grade}
              </span>
            )}
            {strategy && (
              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {STRATEGY_LABELS[strategy] ?? strategy}
              </span>
            )}
            {row.list_price && (
              <span className="text-[10px] text-slate-500">
                ${row.list_price.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400">
            <Clock className="w-3 h-3" />
            {new Date(row.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </div>
        </div>
      </div>
      <button
        onClick={() => onView(row)}
        className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold
          text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
      >
        View
        <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PropertyAnalysisPage() {
  const [result, setResult]             = useState<AnalysisResult | null>(null)
  const [activeSection, setActiveSection] = useState<'analyze' | 'history'>('analyze')

  // Usage tracking
  const [monthlyCount, setMonthlyCount] = useState(0)
  const [usageLimit, setUsageLimit]     = useState<number | null>(null)
  const [loadingUsage, setLoadingUsage] = useState(true)

  // Saved reports
  const [savedReports, setSavedReports]     = useState<PropertyAnalysisRow[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const limitReached = usageLimit !== null && monthlyCount >= usageLimit

  // ── Load usage count + plan info ──────────────────────────────────────────

  const loadUsage = useCallback(async () => {
    setLoadingUsage(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingUsage(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('selected_plan')
      .eq('id', user.id)
      .single()

    const planId = (profile?.selected_plan ?? 'free') as PlanId
    const planInfo = PLANS.find((p) => p.id === planId)
    const limit = planInfo?.property_analysis_limit ?? null
    setUsageLimit(limit)

    if (limit !== null) {
      const startOfMonth = new Date(
        new Date().getFullYear(), new Date().getMonth(), 1
      ).toISOString()
      const { count } = await supabase
        .from('property_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth)
      setMonthlyCount(count ?? 0)
    }
    setLoadingUsage(false)
  }, [])

  // ── Load saved reports history ────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('property_analyses')
      .select('id, address, list_price, analysis_report, source_url, created_at, cached')
      .order('created_at', { ascending: false })
      .limit(50)
    setSavedReports((data ?? []) as PropertyAnalysisRow[])
    setLoadingHistory(false)
  }, [])

  useEffect(() => { loadUsage() }, [loadUsage])

  useEffect(() => {
    if (activeSection === 'history') loadHistory()
  }, [activeSection, loadHistory])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const [viewingFromHistory, setViewingFromHistory] = useState(false)

  const handleAnalysisComplete = (r: AnalysisResult) => {
    setResult(r)
    setViewingFromHistory(false)
    if (!r.cached) setMonthlyCount((c) => c + 1)
  }

  const handleViewSaved = (row: PropertyAnalysisRow) => {
    if (!row.analysis_report) return
    setResult({
      report:     row.analysis_report,
      analysisId: row.id,
      address:    row.address,
      listPrice:  row.list_price ?? 0,
      photos:     [],
      cached:     true,
      cachedAt:   row.created_at,
    })
    setViewingFromHistory(true)
    setActiveSection('analyze')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 mb-1">Property Analysis</h1>
            <p className="text-sm text-slate-500">
              Paste a Zillow or Redfin listing URL to get an AI-powered investment report.
            </p>
          </div>

          {/* Usage badge */}
          {!loadingUsage && usageLimit !== null && (
            <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border
              ${limitReached
                ? 'bg-red-50 border-red-200 text-red-700'
                : monthlyCount >= usageLimit - 1
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
              <BarChart2 className="w-3.5 h-3.5" />
              {monthlyCount} / {usageLimit} this month
            </div>
          )}
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
          {(['analyze', 'history'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer
                ${activeSection === s
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {s === 'analyze' ? <Search className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              {s === 'analyze' ? 'Analyze' : 'Saved Reports'}
              {s === 'history' && savedReports.length > 0 && (
                <span className="ml-0.5 bg-blue-100 text-blue-600 rounded-full px-1.5 py-px text-[10px] font-bold">
                  {savedReports.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Analyze section ────────────────────────────────────────────────── */}
        {activeSection === 'analyze' && (
          <>
            {/* When viewing a saved report: show a back button instead of the input */}
            {viewingFromHistory ? (
              <button
                onClick={() => { setResult(null); setViewingFromHistory(false); setActiveSection('history') }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800
                  transition-colors mb-6 cursor-pointer"
              >
                ← Back to Saved Reports
              </button>
            ) : (
              <>
                {/* Free plan limit banner */}
                {limitReached && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-800">
                        Free plan limit reached ({usageLimit}/{usageLimit} analyses used this month)
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Upgrade to Pro for unlimited property analyses, AI visualizations, and PDF exports.
                      </p>
                      <a
                        href="/signup/plan"
                        className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-lg
                          bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors"
                      >
                        <Crown className="w-3 h-3" />
                        Upgrade to Pro
                      </a>
                    </div>
                  </div>
                )}

                {/* URL input card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                      <Search className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h2 className="text-sm font-semibold text-slate-900">Analyze a listing</h2>
                  </div>

                  <div className={limitReached ? 'pointer-events-none opacity-50 select-none' : ''}>
                    <PropertyUrlInput onAnalysisComplete={handleAnalysisComplete} />
                  </div>

                  {result && (
                    <button
                      onClick={() => setResult(null)}
                      className="mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      ← Analyze a different property
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Results or empty state */}
            {result ? (
              <>
                {!viewingFromHistory && (
                  <div className="flex items-center gap-1.5 mb-3 text-xs text-green-700 font-medium">
                    <Bookmark className="w-3.5 h-3.5 fill-green-600" />
                    Report saved — view it anytime in Saved Reports
                  </div>
                )}
                <PropertyAnalysisDashboard
                  report={result.report}
                  analysisId={result.analysisId}
                  address={result.address}
                  listPrice={result.listPrice}
                  photos={result.photos ?? []}
                  cached={result.cached}
                  cachedAt={result.cachedAt}
                />
              </>
            ) : (
              <EmptyState />
            )}
          </>
        )}

        {/* ── Saved Reports section ──────────────────────────────────────────── */}
        {activeSection === 'history' && (
          <div>
            {loadingHistory ? (
              <div className="text-sm text-slate-400 py-10 text-center">Loading saved reports…</div>
            ) : savedReports.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Bookmark className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600 mb-1">No saved reports yet</p>
                <p className="text-xs text-slate-400">
                  Analyze a property and your report will appear here automatically.
                </p>
                <button
                  onClick={() => setActiveSection('analyze')}
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold
                    hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Analyze a property
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-500">
                    {savedReports.length} {savedReports.length === 1 ? 'report' : 'reports'} saved
                  </p>
                  {usageLimit !== null && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border
                      ${limitReached
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                      {monthlyCount} / {usageLimit} analyses used this month
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {savedReports.map((row) => (
                    <SavedReportCard key={row.id} row={row} onView={handleViewSaved} />
                  ))}
                </div>

                {limitReached && (
                  <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100">
                    <Crown className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-indigo-800">
                        You&apos;ve used all {usageLimit} free analyses this month
                      </p>
                      <p className="text-xs text-indigo-600 mt-0.5">
                        Upgrade to Pro for unlimited analyses and advanced features.
                      </p>
                    </div>
                    <a
                      href="/signup/plan"
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold
                        hover:bg-indigo-700 transition-colors"
                    >
                      Upgrade
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </AppShell>
  )
}
