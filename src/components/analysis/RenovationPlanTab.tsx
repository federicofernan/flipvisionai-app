'use client'

import { PropertyReport } from '@/lib/property-analysis-types'

interface Props { report: PropertyReport }

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

const PRIORITY_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  must_do:      { badge: 'bg-red-50 border-red-200 text-red-700',    dot: 'bg-red-500',   label: 'Must Do' },
  high_roi:     { badge: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-500', label: 'High ROI' },
  nice_to_have: { badge: 'bg-slate-50 border-slate-200 text-slate-600', dot: 'bg-slate-400', label: 'Nice to Have' },
}

const PRIORITY_ORDER = ['must_do', 'high_roi', 'nice_to_have']

const LEVEL_LABELS: Record<string, string> = {
  cosmetic:  'Cosmetic',
  moderate:  'Moderate',
  full_gut:  'Full Gut',
}

const LEVEL_STYLES: Record<string, string> = {
  cosmetic: 'bg-green-50 text-green-700 border-green-200',
  moderate: 'bg-amber-50 text-amber-700 border-amber-200',
  full_gut: 'bg-red-50 text-red-700 border-red-200',
}

export function RenovationPlanTab({ report }: Props) {
  const plan = report.renovationPlan

  // Group items by priority
  const grouped = PRIORITY_ORDER.map((priority) => ({
    priority,
    items: plan.items.filter((i) => i.priority === priority),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-white rounded-2xl border border-slate-100">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Total Estimated Cost</p>
          <p className="text-2xl font-black text-slate-900">{fmt(plan.totalEstimatedCost)}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${LEVEL_STYLES[plan.priorityLevel] ?? ''}`}>
          {LEVEL_LABELS[plan.priorityLevel] ?? plan.priorityLevel}
        </span>
      </div>

      {/* Recommended style */}
      <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Recommended Style</p>
        <p className="text-sm font-semibold text-slate-900 mb-1">{plan.recommendedStyle}</p>
        <p className="text-xs text-slate-600 leading-relaxed">{plan.styleRationale}</p>
      </div>

      {/* Items by priority group */}
      {grouped.map(({ priority, items }) => {
        const style = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.nice_to_have
        const groupTotal = items.reduce((s, i) => s + i.estimatedCost, 0)
        return (
          <div key={priority}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{style.label}</span>
              </div>
              <span className="text-xs text-slate-500">{fmt(groupTotal)}</span>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className={`p-4 rounded-xl border ${style.badge}`}>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.item}</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{item.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900">{fmt(item.estimatedCost)}</p>
                      {item.estimatedRoiImpact > 0 && (
                        <p className="text-[10px] text-green-600 font-medium">+{fmt(item.estimatedRoiImpact)} ROI</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
