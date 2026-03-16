'use client'

import { PropertyReport } from '@/lib/property-analysis-types'

interface Props { report: PropertyReport }

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0
      ${highlight ? 'font-semibold' : ''}`}>
      <span className={`text-sm ${highlight ? 'text-slate-900' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-sm ${highlight ? 'text-slate-900' : 'text-slate-800'}`}>{value}</span>
    </div>
  )
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`flex flex-col items-center p-3 rounded-xl border ${color}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-center mt-0.5 opacity-70">{label}</p>
    </div>
  )
}

export function RentalAnalysisTab({ report }: Props) {
  const r = report.rentalAnalysis
  const positive = r.monthlyCashFlow >= 0

  const totalExpenses = Object.values(r.monthlyExpenses).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      {/* Key stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill
          label="Cap Rate"
          value={`${r.capRate.toFixed(1)}%`}
          color="bg-blue-50 border-blue-100 text-blue-700"
        />
        <StatPill
          label="Gross Yield"
          value={`${r.grossYield.toFixed(1)}%`}
          color="bg-indigo-50 border-indigo-100 text-indigo-700"
        />
        <StatPill
          label="Cash-on-Cash"
          value={`${r.cashOnCashReturn.toFixed(1)}%`}
          color="bg-purple-50 border-purple-100 text-purple-700"
        />
      </div>

      {/* Monthly breakdown */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Monthly P&L</h4>

        <Row label="Estimated Rent" value={fmt(r.estimatedMonthlyRent)} highlight />

        <div className="mt-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 mt-3">Expenses</p>
          <Row label="Mortgage (PITI)" value={`– ${fmt(r.monthlyExpenses.mortgage)}`} />
          <Row label="Property Taxes" value={`– ${fmt(r.monthlyExpenses.taxes)}`} />
          <Row label="Insurance" value={`– ${fmt(r.monthlyExpenses.insurance)}`} />
          {r.monthlyExpenses.hoa > 0 && <Row label="HOA" value={`– ${fmt(r.monthlyExpenses.hoa)}`} />}
          <Row label="Maintenance (1%)" value={`– ${fmt(r.monthlyExpenses.maintenance)}`} />
          <Row label="Vacancy (8%)" value={`– ${fmt(r.monthlyExpenses.vacancy)}`} />
          <Row label="Property Mgmt" value={`– ${fmt(r.monthlyExpenses.propertyManagement)}`} />
          <Row label="Total Expenses" value={`– ${fmt(totalExpenses)}`} highlight />
        </div>

        <div className={`flex items-center justify-between pt-3 mt-2 border-t-2
          ${positive ? 'border-green-200' : 'border-red-200'}`}>
          <span className="text-sm font-bold text-slate-900">Monthly Cash Flow</span>
          <span className={`text-lg font-black ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {positive ? '+' : ''}{fmt(r.monthlyCashFlow)}
          </span>
        </div>
      </div>

      {/* Additional metrics */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Key Metrics</h4>
        <Row label="Annual Cash Flow" value={fmt(r.annualCashFlow)} />
        <Row label="Break-Even Occupancy" value={`${r.breakEvenOccupancy.toFixed(0)}%`} />
        <Row label="Rent-to-Value Ratio" value={`${(r.rentToValueRatio * 100).toFixed(2)}%`} />
      </div>

      {/* Verdict */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Analyst Verdict</p>
        <p className="text-sm text-slate-700 leading-relaxed">{r.verdict}</p>
      </div>
    </div>
  )
}
