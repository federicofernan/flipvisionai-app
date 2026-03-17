'use client'

import { useEffect, useState } from 'react'
import { Users, FileBarChart2, SearchCheck, TrendingUp, DollarSign, Crown, Sparkles } from 'lucide-react'

interface Metrics {
  users:    number
  reports:  number
  analyses: number
  planCounts: { free: number; pro: number; investor: number }
  mrr: number
}

const PLAN_CONFIG = [
  {
    id:       'free',
    label:    'Free',
    price:    0,
    badge:    'bg-slate-100 text-slate-700',
    bar:      'bg-slate-400',
    icon:     Sparkles,
    iconColor: 'text-slate-500',
  },
  {
    id:       'pro',
    label:    'Pro',
    price:    19,
    badge:    'bg-blue-100 text-blue-700',
    bar:      'bg-blue-500',
    icon:     Crown,
    iconColor: 'text-blue-500',
  },
  {
    id:       'investor',
    label:    'Investor',
    price:    49,
    badge:    'bg-indigo-100 text-indigo-700',
    bar:      'bg-indigo-500',
    icon:     Crown,
    iconColor: 'text-indigo-500',
  },
]

function Skeleton({ w, h }: { w: string; h: string }) {
  return <div className={`${h} ${w} bg-slate-100 rounded-lg animate-pulse`} />
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

  const totalPaid = (metrics?.planCounts.pro ?? 0) + (metrics?.planCounts.investor ?? 0)
  const totalUsers = metrics?.users ?? 0
  const paidPct = totalUsers > 0 ? Math.round((totalPaid / totalUsers) * 100) : 0

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

      {/* Top metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total users */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
            <Users className="w-4.5 h-4.5 text-blue-600" />
          </div>
          {loading ? <><Skeleton h="h-7" w="w-14" /><Skeleton h="h-3 mt-2" w="w-20" /></> : (
            <>
              <p className="text-2xl font-bold text-slate-900">{totalUsers.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total users</p>
            </>
          )}
        </div>

        {/* MRR */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
            <DollarSign className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          {loading ? <><Skeleton h="h-7" w="w-20" /><Skeleton h="h-3 mt-2" w="w-28" /></> : (
            <>
              <p className="text-2xl font-bold text-slate-900">
                ${(metrics?.mrr ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Est. monthly revenue</p>
            </>
          )}
        </div>

        {/* Renovation reports */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3">
            <FileBarChart2 className="w-4.5 h-4.5 text-indigo-600" />
          </div>
          {loading ? <><Skeleton h="h-7" w="w-14" /><Skeleton h="h-3 mt-2" w="w-24" /></> : (
            <>
              <p className="text-2xl font-bold text-slate-900">{(metrics?.reports ?? 0).toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-0.5">Renovation reports</p>
            </>
          )}
        </div>

        {/* Property analyses */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-3">
            <SearchCheck className="w-4.5 h-4.5 text-violet-600" />
          </div>
          {loading ? <><Skeleton h="h-7" w="w-14" /><Skeleton h="h-3 mt-2" w="w-28" /></> : (
            <>
              <p className="text-2xl font-bold text-slate-900">{(metrics?.analyses ?? 0).toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-0.5">Property analyses</p>
            </>
          )}
        </div>
      </div>

      {/* Users by plan */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Users by Plan</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {loading ? '—' : `${paidPct}% paid conversion`}
            </p>
          </div>
          {!loading && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              ${(metrics?.mrr ?? 0).toLocaleString()} / mo
            </span>
          )}
        </div>

        <div className="space-y-4">
          {PLAN_CONFIG.map(({ id, label, price, badge, bar, icon: Icon, iconColor }) => {
            const count = metrics?.planCounts[id as keyof typeof metrics.planCounts] ?? 0
            const pct   = totalUsers > 0 ? (count / totalUsers) * 100 : 0
            const revenue = count * price

            return (
              <div key={id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>
                      {label}
                    </span>
                    {loading
                      ? <Skeleton h="h-3" w="w-6" />
                      : <span className="text-xs text-slate-600 font-medium">{count.toLocaleString()} users</span>
                    }
                  </div>
                  <div className="flex items-center gap-3">
                    {price > 0 && !loading && (
                      <span className="text-xs text-slate-400">
                        ${revenue.toLocaleString()}/mo
                      </span>
                    )}
                    {loading
                      ? <Skeleton h="h-3" w="w-8" />
                      : <span className="text-xs font-medium text-slate-500 w-9 text-right">
                          {pct.toFixed(0)}%
                        </span>
                    }
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  {!loading && (
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  )}
                  {loading && <div className="h-full w-1/2 bg-slate-100 animate-pulse rounded-full" />}
                </div>
              </div>
            )
          })}
        </div>
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
