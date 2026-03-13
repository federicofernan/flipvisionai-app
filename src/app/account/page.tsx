'use client'

import { useEffect, useState } from 'react'
import { User, Mail, CreditCard, Sparkles, ShieldCheck, Bell, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/AppShell'
import { PLANS, PLAN_LABELS, type PlanId } from '@/lib/plans'

interface Profile {
  email:          string
  first_name:     string
  last_name:      string
  address_line_1: string | null
  address_line_2: string | null
  state:          string | null
  country:        string | null
  selected_plan:  PlanId
  account_created_at: string
}

function formatMemberSince(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setProfile(data as Profile)
          setLoading(false)
        })
    })
  }, [])

  const plan        = (profile?.selected_plan ?? 'free') as PlanId
  const planLabel   = PLAN_LABELS[plan]
  const planDetails = PLANS.find((p) => p.id === plan)
  const initials    = profile
    ? `${profile.first_name[0] ?? ''}${profile.last_name[0] ?? ''}`.toUpperCase()
    : '··'
  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : '—'

  return (
    <AppShell>
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Account</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your profile and subscription settings.
          </p>
        </div>

        <div className="space-y-5">

          {/* ── Profile card ── */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
              Profile
            </h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700
                flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
                {loading
                  ? <div className="w-6 h-6 rounded-full bg-blue-400/50 animate-pulse" />
                  : <span className="text-lg font-bold text-white">{initials}</span>
                }
              </div>
              <div>
                {loading ? (
                  <>
                    <div className="h-3.5 bg-slate-100 rounded-full w-36 mb-2 animate-pulse" />
                    <div className="h-2.5 bg-slate-100 rounded-full w-24 animate-pulse" />
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {plan.charAt(0).toUpperCase() + plan.slice(1)} member since{' '}
                      {profile ? formatMemberSince(profile.account_created_at) : '—'}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 mb-0.5">Full Name</p>
                  {loading
                    ? <div className="h-3 bg-slate-100 rounded-full w-32 animate-pulse" />
                    : <p className="text-sm font-medium text-slate-800">{displayName}</p>
                  }
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors">
                  Edit
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 mb-0.5">Email</p>
                  {loading
                    ? <div className="h-3 bg-slate-100 rounded-full w-44 animate-pulse" />
                    : <p className="text-sm font-medium text-slate-800">{profile?.email ?? '—'}</p>
                  }
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors">
                  Edit
                </button>
              </div>
            </div>
          </section>

          {/* ── Subscription card ── */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
              Subscription
            </h2>

            <div className={`flex items-center justify-between p-4 rounded-xl border mb-5
              ${plan === 'free'     ? 'bg-slate-50 border-slate-100'                                    : ''}
              ${plan === 'pro'      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'    : ''}
              ${plan === 'investor' ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100': ''}
            `}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                  ${plan === 'free' ? 'bg-slate-200' : 'bg-blue-600'}`}>
                  <Sparkles className={`w-4 h-4 ${plan === 'free' ? 'text-slate-500' : 'text-white'}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{planLabel}</p>
                  <p className="text-xs text-slate-500">
                    {plan === 'free'
                      ? 'Free forever — no credit card required'
                      : `${planDetails?.price}/mo · Payment integration coming soon`}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                ${plan === 'free'     ? 'bg-slate-200 text-slate-600'    : ''}
                ${plan === 'pro'      ? 'bg-blue-100 text-blue-700'      : ''}
                ${plan === 'investor' ? 'bg-indigo-100 text-indigo-700'  : ''}
              `}>
                Active
              </span>
            </div>

            {/* Plan features */}
            {planDetails && (
              <ul className="space-y-2 mb-5">
                {planDetails.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            {/* Billing row */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 mb-0.5">Payment</p>
                <p className="text-sm font-medium text-slate-800">
                  {plan === 'free' ? 'No payment required' : 'Stripe integration coming soon'}
                </p>
              </div>
            </div>

            {plan !== 'free' && (
              <div className="flex gap-2 mt-4">
                <button className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600
                  hover:bg-slate-50 transition-colors cursor-pointer font-medium">
                  Manage Billing
                </button>
                <button className="flex-1 py-2 rounded-xl border border-red-100 text-sm text-red-500
                  hover:bg-red-50 transition-colors cursor-pointer font-medium">
                  Cancel Plan
                </button>
              </div>
            )}
          </section>

          {/* ── Notifications ── */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
              Notifications
            </h2>
            <div className="space-y-1">
              {[
                { label: 'AI analysis complete',  sub: 'Get notified when your renovation report is ready' },
                { label: 'New property tips',      sub: 'Weekly renovation insights for your properties'    },
                { label: 'Billing reminders',      sub: 'Upcoming renewal and payment notifications'        },
              ].map(({ label, sub }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 py-3 border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{label}</p>
                      <p className="text-xs text-slate-400">{sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
    </AppShell>
  )
}
