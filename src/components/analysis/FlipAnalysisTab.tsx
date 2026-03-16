'use client'

import { PropertyReport } from '@/lib/property-analysis-types'

interface Props { report: PropertyReport }

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function WaterfallRow({
  label, value, type = 'neutral', sub,
}: {
  label: string
  value: string
  type?: 'add' | 'subtract' | 'total' | 'profit' | 'neutral'
  sub?: string
}) {
  const colors = {
    add:      'text-slate-800',
    subtract: 'text-red-600',
    total:    'text-slate-900 font-bold',
    profit:   'text-green-600 font-bold',
    neutral:  'text-slate-800',
  }
  const prefix = type === 'subtract' ? '– ' : type === 'add' ? '+ ' : ''
  return (
    <div className={`flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0
      ${type === 'total' || type === 'profit' ? 'border-t-2 border-slate-200 mt-1' : ''}`}>
      <div>
        <span className={`text-sm ${type === 'total' || type === 'profit' ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{label}</span>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <span className={`text-sm ${colors[type]}`}>{prefix}{value}</span>
    </div>
  )
}

export function FlipAnalysisTab({ report }: Props) {
  const f = report.flipAnalysis
  const profitable = f.estimatedProfit >= 0

  return (
    <div className="space-y-6">
      {/* Waterfall */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Deal Waterfall</h4>

        <WaterfallRow label="Purchase Price" value={fmt(f.purchasePrice)} type="subtract" />
        <WaterfallRow
          label="Renovation Costs"
          value={fmt(f.estimatedRenovationCost)}
          type="subtract"
          sub={`Range: ${fmt(f.renovationCostRange.low)} – ${fmt(f.renovationCostRange.high)}`}
        />
        <WaterfallRow
          label="Holding Costs"
          value={fmt(f.holdingCosts)}
          type="subtract"
          sub={`${f.estimatedTimelineMonths} month timeline`}
        />
        <WaterfallRow label="Total Investment" value={fmt(f.totalInvestment)} type="total" />
        <WaterfallRow
          label="After-Repair Value (ARV)"
          value={fmt(f.arvEstimate)}
          type="add"
        />
        <WaterfallRow
          label="Estimated Profit"
          value={fmt(f.estimatedProfit)}
          type={profitable ? 'profit' : 'subtract'}
        />
      </div>

      {/* ROI + margin */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-4 rounded-2xl border ${profitable ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">ROI</p>
          <p className={`text-2xl font-black ${profitable ? 'text-green-700' : 'text-red-600'}`}>
            {f.roi.toFixed(1)}%
          </p>
        </div>
        <div className="p-4 rounded-2xl border bg-blue-50 border-blue-100">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Profit Margin</p>
          <p className="text-2xl font-black text-blue-700">{f.profitMargin.toFixed(1)}%</p>
        </div>
      </div>

      {/* Verdict */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Analyst Verdict</p>
        <p className="text-sm text-slate-700 leading-relaxed">{f.verdict}</p>
      </div>
    </div>
  )
}
