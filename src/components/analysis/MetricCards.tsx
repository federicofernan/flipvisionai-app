'use client'

import { PropertyReport } from '@/lib/property-analysis-types'
import { TrendingUp, DollarSign, BarChart2, Percent } from 'lucide-react'

interface MetricCardsProps {
  report: PropertyReport
}

function fmt(n: number, style: 'currency' | 'percent' | 'number' = 'currency') {
  if (style === 'currency') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  }
  if (style === 'percent') {
    return `${n.toFixed(1)}%`
  }
  return n.toLocaleString()
}

function sign(n: number) {
  return n >= 0 ? 'positive' : 'negative'
}

export function MetricCards({ report }: MetricCardsProps) {
  const cashFlow = report.rentalAnalysis.monthlyCashFlow
  const profit   = report.flipAnalysis.estimatedProfit
  const capRate  = report.rentalAnalysis.capRate
  const roi      = report.flipAnalysis.roi ?? (report.flipAnalysis.totalInvestment > 0 ? (report.flipAnalysis.estimatedProfit / report.flipAnalysis.totalInvestment) * 100 : 0)

  const cards = [
    {
      label:   'Monthly Cash Flow',
      value:   fmt(cashFlow),
      sub:     'rental strategy',
      icon:    DollarSign,
      color:   sign(cashFlow) === 'positive' ? 'green' : 'red',
      iconBg:  sign(cashFlow) === 'positive' ? 'bg-green-50' : 'bg-red-50',
      iconColor: sign(cashFlow) === 'positive' ? 'text-green-500' : 'text-red-500',
      valueColor: sign(cashFlow) === 'positive' ? 'text-green-700' : 'text-red-600',
    },
    {
      label:   'Flip Profit Est.',
      value:   fmt(profit),
      sub:     'after all costs',
      icon:    TrendingUp,
      color:   sign(profit) === 'positive' ? 'green' : 'red',
      iconBg:  sign(profit) === 'positive' ? 'bg-purple-50' : 'bg-red-50',
      iconColor: sign(profit) === 'positive' ? 'text-purple-500' : 'text-red-500',
      valueColor: sign(profit) === 'positive' ? 'text-purple-700' : 'text-red-600',
    },
    {
      label:   'Cap Rate',
      value:   fmt(capRate, 'percent'),
      sub:     'net operating income / price',
      icon:    BarChart2,
      iconBg:  'bg-blue-50',
      iconColor: 'text-blue-500',
      valueColor: 'text-blue-700',
    },
    {
      label:   'Flip ROI',
      value:   fmt(roi, 'percent'),
      sub:     'return on investment',
      icon:    Percent,
      iconBg:  sign(roi) === 'positive' ? 'bg-indigo-50' : 'bg-red-50',
      iconColor: sign(roi) === 'positive' ? 'text-indigo-500' : 'text-red-500',
      valueColor: sign(roi) === 'positive' ? 'text-indigo-700' : 'text-red-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center mb-3`}>
            <card.icon className={`w-4 h-4 ${card.iconColor}`} />
          </div>
          <p className={`text-xl font-bold ${card.valueColor} leading-none mb-1`}>{card.value}</p>
          <p className="text-xs font-semibold text-slate-700">{card.label}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  )
}
