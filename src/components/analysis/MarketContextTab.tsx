'use client'

import { PropertyReport } from '@/lib/property-analysis-types'
import { TrendingUp, AlertCircle } from 'lucide-react'

interface Props { report: PropertyReport }

const STRENGTH_STYLES: Record<string, { bar: string; badge: string; label: string; width: string }> = {
  hot:     { bar: 'bg-red-500',    badge: 'bg-red-50 border-red-200 text-red-700',       label: '🔥 Hot Market',    width: 'w-full' },
  warm:    { bar: 'bg-amber-500',  badge: 'bg-amber-50 border-amber-200 text-amber-700', label: '☀️ Warm Market',   width: 'w-3/4' },
  neutral: { bar: 'bg-blue-400',   badge: 'bg-blue-50 border-blue-200 text-blue-700',    label: '⚖️ Neutral Market', width: 'w-1/2' },
  cool:    { bar: 'bg-slate-400',  badge: 'bg-slate-50 border-slate-200 text-slate-600', label: '❄️ Cool Market',   width: 'w-1/4' },
}

export function MarketContextTab({ report }: Props) {
  const ctx = report.marketContext
  const fin = report.financialSummary
  const strength = STRENGTH_STYLES[ctx.marketStrength] ?? STRENGTH_STYLES.neutral

  function fmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  }

  return (
    <div className="space-y-6">
      {/* Market strength */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Market Strength</h4>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${strength.badge}`}>
            {strength.label}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
          <div className={`h-full rounded-full transition-all ${strength.bar} ${strength.width}`} />
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Buyer Demand</p>
            <p className="text-sm text-slate-700">{ctx.buyerDemand}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Competition Level</p>
            <p className="text-sm text-slate-700">{ctx.competitionLevel}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Best Exit Strategy</p>
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-700">{ctx.bestExitStrategy}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Market risks */}
      {ctx.marketRisks.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Market Risks</h4>
          <ul className="space-y-2">
            {ctx.marketRisks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-700">{risk}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Financial summary */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Financial Summary</h4>
        <div className="space-y-0">
          {[
            { label: 'Minimum Capital Required',  value: fmt(fin.minimumCapitalRequired) },
            { label: 'Recommended Reserves',      value: fmt(fin.recommendedReserves) },
            { label: 'Break-Even Price',           value: fmt(fin.breakEvenPrice) },
            { label: 'Maximum Allowable Offer',   value: fmt(fin.maximumAllowableOffer) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
              <span className="text-sm text-slate-600">{label}</span>
              <span className="text-sm font-semibold text-slate-900">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
