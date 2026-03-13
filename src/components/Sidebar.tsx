'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Building2,
  LayoutGrid,
  FileBarChart2,
  User,
  CreditCard,
  ChevronRight,
  Sparkles,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PLAN_LABELS, PLAN_BADGE_STYLES, type PlanId } from '@/lib/plans'

interface UserProfile {
  first_name: string
  last_name:  string
  email:      string
  selected_plan: PlanId
}

const NAV_ITEMS = [
  {
    label: 'My Properties',
    href:  '/dashboard',
    icon:  LayoutGrid,
    match: (p: string) => p === '/dashboard' || p.startsWith('/property'),
  },
  {
    label: 'My Reports',
    href:  '/reports',
    icon:  FileBarChart2,
    match: (p: string) => p === '/reports',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('first_name, last_name, email, selected_plan')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data as UserProfile)
        })
    })
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = profile
    ? `${profile.first_name[0] ?? ''}${profile.last_name[0] ?? ''}`.toUpperCase()
    : '··'

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : ''

  const plan      = (profile?.selected_plan ?? 'free') as PlanId
  const planLabel = PLAN_LABELS[plan]
  const planBadge = PLAN_BADGE_STYLES[plan]

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 min-h-screen bg-white border-r border-slate-100">
      {/* Logo */}
      <div className="px-5 h-14 flex items-center gap-2.5 border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-slate-900 tracking-tight">FlipVision AI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-2 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          Navigation
        </p>

        {NAV_ITEMS.map(({ label, href, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium
                transition-all duration-150 group
                ${active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors
                  ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Account section */}
      <div className="px-3 pb-4 border-t border-slate-100 pt-3 space-y-1">
        <p className="px-2 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          Account
        </p>

        <Link
          href="/account"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium
            transition-all duration-150 group
            ${pathname === '/account'
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
        >
          <User
            className={`w-4 h-4 shrink-0 transition-colors
              ${pathname === '/account' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
          />
          Account
        </Link>

        {/* User card */}
        <Link
          href="/account"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50
            transition-colors group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700
            flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">
              {profile ? initials : <span className="opacity-50">··</span>}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {profile ? (
              <>
                <p className="text-xs font-semibold text-slate-800 truncate">{displayName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                  <p className="text-[10px] text-blue-600 font-medium">{planLabel}</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-2.5 bg-slate-100 rounded-full w-24 mb-1.5 animate-pulse" />
                <div className="h-2 bg-slate-100 rounded-full w-14 animate-pulse" />
              </>
            )}
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
        </Link>

        {/* Subscription badge */}
        <div className={`mx-1 mt-1 p-2.5 rounded-xl border
          ${plan === 'free'     ? 'bg-slate-50 border-slate-100'     : ''}
          ${plan === 'pro'      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100' : ''}
          ${plan === 'investor' ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100' : ''}
        `}>
          <div className="flex items-center gap-1.5 mb-1">
            <CreditCard className={`w-3 h-3 ${plan === 'free' ? 'text-slate-400' : 'text-blue-500'}`} />
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${planBadge}`}>
              {planLabel}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            {plan === 'free'     && 'Upgrade to unlock AI analysis.'}
            {plan === 'pro'      && 'Unlimited properties & AI analysis.'}
            {plan === 'investor' && 'Full access + ROI & portfolio reports.'}
          </p>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium
            text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150
            cursor-pointer group mt-1"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-red-500 transition-colors" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
