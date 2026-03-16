'use client'

import { PropertyReport } from '@/lib/property-analysis-types'
import { MapPin, DollarSign, TrendingUp } from 'lucide-react'

interface SummaryHeaderProps {
  report: PropertyReport
  address: string
  listPrice: number
  photos: string[]
}

const GRADE_STYLES: Record<string, string> = {
  A: 'bg-green-500 text-white',
  B: 'bg-blue-500 text-white',
  C: 'bg-amber-500 text-white',
  D: 'bg-red-500 text-white',
}

const STRATEGY_STYLES: Record<string, string> = {
  flip:           'bg-purple-100 text-purple-700 border border-purple-200',
  rental:         'bg-blue-100 text-blue-700 border border-blue-200',
  flip_then_rent: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  pass:           'bg-slate-100 text-slate-600 border border-slate-200',
}

const STRATEGY_LABELS: Record<string, string> = {
  flip:           '🔨 Flip',
  rental:         '🏠 Rental',
  flip_then_rent: '🔄 Flip then Rent',
  pass:           '⏭️ Pass',
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function SummaryHeader({ report, address, listPrice, photos }: SummaryHeaderProps) {
  const { summary } = report
  const coverPhoto = photos?.[0]

  return (
    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
      {/* Cover photo */}
      {coverPhoto && (
        <div className="h-48 bg-slate-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverPhoto} alt={address} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-6">
        {/* Grade + strategy row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shadow-sm ${GRADE_STYLES[summary.investmentGrade] ?? GRADE_STYLES.C}`}>
            {summary.investmentGrade}
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STRATEGY_STYLES[summary.primaryStrategy] ?? ''}`}>
            {STRATEGY_LABELS[summary.primaryStrategy] ?? summary.primaryStrategy}
          </span>
        </div>

        {/* Address + price */}
        <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
          <div>
            <p className="flex items-center gap-1.5 text-slate-500 text-xs mb-0.5">
              <MapPin className="w-3.5 h-3.5" />
              Property Address
            </p>
            <h2 className="text-base font-semibold text-slate-900 leading-snug">{address}</h2>
          </div>
          {listPrice > 0 && (
            <div className="text-right shrink-0">
              <p className="flex items-center gap-1 text-slate-500 text-xs mb-0.5 justify-end">
                <DollarSign className="w-3.5 h-3.5" />
                List Price
              </p>
              <p className="text-lg font-bold text-slate-900">{fmt(listPrice)}</p>
            </div>
          )}
        </div>

        {/* Headline */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4">
          <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-700 leading-relaxed font-medium">{summary.headline}</p>
        </div>

        {/* Highlights + red flags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {summary.keyHighlights.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Key Highlights</p>
              <ul className="space-y-1.5">
                {summary.keyHighlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {summary.redFlags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">Red Flags</p>
              <ul className="space-y-1.5">
                {summary.redFlags.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="text-red-400 mt-0.5 shrink-0">⚠</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
