'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Save, Loader2, CheckCircle2, AlertCircle, Infinity } from 'lucide-react'

interface PlanConfig {
  id:                       string
  name:                     string
  price:                    string
  billing:                  string
  report_limit:             number | null
  property_analysis_limit:  number | null
  stripe_price_id:          string | null
  updated_at:               string
}

const PLAN_STYLES: Record<string, { badge: string; ring: string }> = {
  free:     { badge: 'bg-slate-100 text-slate-700',   ring: 'ring-slate-200'  },
  pro:      { badge: 'bg-blue-100 text-blue-700',     ring: 'ring-blue-200'   },
  investor: { badge: 'bg-indigo-100 text-indigo-700', ring: 'ring-indigo-200' },
}

export default function AdminPlansPage() {
  const [plans, setPlans]     = useState<PlanConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState<string | null>(null)   // plan id being saved
  const [saved, setSaved]     = useState<string | null>(null)   // plan id just saved
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/plans')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPlans(data)
        else setError(data.error ?? 'Failed to load plans')
      })
      .catch(() => setError('Failed to load plans'))
      .finally(() => setLoading(false))
  }, [])

  const update = (id: string, field: keyof PlanConfig, raw: string) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        if (field === 'report_limit' || field === 'property_analysis_limit') {
          const val = raw.trim() === '' || raw.trim().toLowerCase() === 'unlimited'
            ? null
            : parseInt(raw, 10)
          return { ...p, [field]: isNaN(val as number) ? null : val }
        }
        return { ...p, [field]: raw }
      })
    )
  }

  const save = async (plan: PlanConfig) => {
    setSaving(plan.id)
    setError(null)
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Save failed'); return }
      setSaved(plan.id)
      setTimeout(() => setSaved(null), 2500)
    } catch {
      setError('Save failed')
    } finally {
      setSaving(null)
    }
  }

  const limitDisplay = (val: number | null) =>
    val === null ? '' : String(val)

  const limitPlaceholder = (val: number | null) =>
    val === null ? 'Unlimited' : ''

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-5 h-5 text-slate-500" />
          <h1 className="text-2xl font-bold text-slate-900">Plans</h1>
        </div>
        <p className="text-sm text-slate-500">
          Configure pricing and usage limits for each plan.
          Leave a limit field empty to set it as unlimited.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 animate-pulse">
              <div className="h-5 w-20 bg-slate-100 rounded-full" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-9 bg-slate-100 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const style = PLAN_STYLES[plan.id] ?? PLAN_STYLES.free
            const isSaving = saving === plan.id
            const isSaved  = saved  === plan.id

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ring-1 ${style.ring}`}
              >
                {/* Plan badge */}
                <div className="flex items-center justify-between mb-5">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}>
                    {plan.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Updated {new Date(plan.updated_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Price */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Price (display)
                    </label>
                    <input
                      type="text"
                      value={plan.price}
                      onChange={(e) => update(plan.id, 'price', e.target.value)}
                      placeholder="e.g. Free, $19"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Billing */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Billing period
                    </label>
                    <input
                      type="text"
                      value={plan.billing}
                      onChange={(e) => update(plan.id, 'billing', e.target.value)}
                      placeholder="e.g. per month, Forever"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Report limit */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
                      Renovation report limit / month
                      {plan.report_limit === null && (
                        <Infinity className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={limitDisplay(plan.report_limit)}
                      onChange={(e) => update(plan.id, 'report_limit', e.target.value)}
                      placeholder={limitPlaceholder(plan.report_limit) || 'Unlimited'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        placeholder:text-slate-400"
                    />
                  </div>

                  {/* Property analysis limit */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
                      Property analysis limit / month
                      {plan.property_analysis_limit === null && (
                        <Infinity className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={limitDisplay(plan.property_analysis_limit)}
                      onChange={(e) => update(plan.id, 'property_analysis_limit', e.target.value)}
                      placeholder={limitPlaceholder(plan.property_analysis_limit) || 'Unlimited'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        placeholder:text-slate-400"
                    />
                  </div>

                  {/* Stripe price ID */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Stripe Price ID
                    </label>
                    <input
                      type="text"
                      value={plan.stripe_price_id ?? ''}
                      onChange={(e) => update(plan.id, 'stripe_price_id', e.target.value)}
                      placeholder="price_xxxx"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        placeholder:text-slate-400 font-mono"
                    />
                  </div>

                  {/* Save button */}
                  <button
                    onClick={() => save(plan)}
                    disabled={isSaving}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                      text-sm font-medium transition-all active:scale-95 cursor-pointer
                      disabled:opacity-60
                      ${isSaved
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700'
                      }`}
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSaved  && <CheckCircle2 className="w-4 h-4" />}
                    {!isSaving && !isSaved && <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving…' : isSaved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-slate-400">
        Note: changes here update the <code className="font-mono">plan_configs</code> table.
        The app reads limits at runtime from the database.
      </p>
    </main>
  )
}
