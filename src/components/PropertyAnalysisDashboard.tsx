'use client'

import { useState } from 'react'
import { PropertyReport } from '@/lib/property-analysis-types'
import { SummaryHeader } from './analysis/SummaryHeader'
import { MetricCards } from './analysis/MetricCards'
import { RentalAnalysisTab } from './analysis/RentalAnalysisTab'
import { FlipAnalysisTab } from './analysis/FlipAnalysisTab'
import { RenovationPlanTab } from './analysis/RenovationPlanTab'
import { MarketContextTab } from './analysis/MarketContextTab'
import { Clock } from 'lucide-react'

interface PropertyAnalysisDashboardProps {
  report: PropertyReport
  analysisId: string
  address: string
  listPrice: number
  photos: string[]
  cached?: boolean
  cachedAt?: string
}

const TABS = [
  { id: 'rental',     label: 'Rental Analysis' },
  { id: 'flip',       label: 'Flip Analysis' },
  { id: 'renovation', label: 'Renovation Plan' },
  { id: 'market',     label: 'Market Context' },
] as const

type TabId = typeof TABS[number]['id']

export function PropertyAnalysisDashboard({
  report,
  address,
  listPrice,
  photos,
  cached,
  cachedAt,
}: PropertyAnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('rental')

  return (
    <div className="space-y-6">
      {/* Cache banner */}
      {cached && cachedAt && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>
            Showing cached result from {new Date(cachedAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
            })}
          </span>
        </div>
      )}

      {/* Summary header */}
      <SummaryHeader report={report} address={address} listPrice={listPrice} photos={photos} />

      {/* Metric cards */}
      <MetricCards report={report} />

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-max px-5 py-3.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer
                ${activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'rental'     && <RentalAnalysisTab report={report} />}
          {activeTab === 'flip'       && <FlipAnalysisTab report={report} />}
          {activeTab === 'renovation' && <RenovationPlanTab report={report} />}
          {activeTab === 'market'     && <MarketContextTab report={report} />}
        </div>
      </div>
    </div>
  )
}
