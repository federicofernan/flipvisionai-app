'use client'

import { useEffect, useState } from 'react'
import { Users, FileBarChart2, SearchCheck, TrendingUp } from 'lucide-react'

interface Metrics {
  users:    number
  reports:  number
  analyses: number
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/metrics')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setMetrics(data)
      })
      .catch(() => setError('Failed to load metrics'))
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    {
      label:    'Total Users',
      value:    metrics?.users,
      icon:     Users,
      bg:       'bg-blue-50',
      iconColor: 'text-blue-600',
      border:   'border-blue-100',
    },
    {
      label:    'Renovation Reports',
      value:    metrics?.reports,
      icon:     FileBarChart2,
      bg:       'bg-indigo-50',
      iconColor: 'text-indigo-600',
      border:   'border-indigo-100',
    },
    {
      label:    'Property Analyses',
      value:    metrics?.analyses,
      icon:     SearchCheck,
      bg:       'bg-emerald-50',
      iconColor: 'text-emerald-600',
      border:   'border-emerald-100',
    },
  ]

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-slate-500" />
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        </div>
        <p className="text-sm text-slate-500">Overview of FlipVision AI platform activity.</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        {cards.map(({ label, value, icon: Icon, bg, iconColor, border }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${bg} border ${border}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            {loading ? (
              <>
                <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse mb-1.5" />
                <div className="h-3 w-28 bg-slate-100 rounded-full animate-pulse" />
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-slate-900 mb-0.5">
                  {(value ?? 0).toLocaleString()}
                </p>
                <p className="text-sm text-slate-500">{label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="/admin/plans"
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100
              shadow-sm hover:border-blue-200 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                Manage Plans
              </p>
              <p className="text-xs text-slate-500">Configure pricing and usage limits</p>
            </div>
          </a>
          <a
            href="/admin/prompts"
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100
              shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <FileBarChart2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                Edit Prompts
              </p>
              <p className="text-xs text-slate-500">Update AI prompt templates</p>
            </div>
          </a>
        </div>
      </div>
    </main>
  )
}
