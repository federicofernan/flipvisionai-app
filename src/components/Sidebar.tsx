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
  ChevronLeft,
  Sparkles,
  LogOut,
  SearchCheck,
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
    match: (p: string) => p === '/dashboard' || (p.startsWith('/property') && !p.startsWith('/property-analysis')),
  },
  {
    label: 'My Renovation Reports',
    href:  '/reports',
    icon:  FileBarChart2,
    match: (p: string) => p === '/reports',
  },
  {
    label: 'Property Analysis',
    href:  '/property-analysis',
    icon:  SearchCheck,
    match: (p: string) => p === '/property-analysis',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [profile, setProfile]     = useState<UserProfile | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  // Restore persisted state after mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored !== null) setCollapsed(stored === 'true')
  }, [])

  const toggle = () => {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

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
          if (data) {
            setProfile(data as UserProfile)
          } else {
            const meta = user.user_metadata ?? {}
            const fullName: string =
              meta.full_name ??
              [meta.first_name, meta.last_name].filter(Boolean).join(' ') ??
              ''
            const nameParts = fullName.trim().split(' ')
            setProfile({
              first_name:    nameParts[0] ?? '',
              last_name:     nameParts.slice(1).join(' '),
              email:         user.email ?? '',
              selected_plan: 'free',
            })
          }
        })
    })
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : ''

  const initials = displayName
    ? displayName.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    : '··'

  const plan      = (profile?.selected_plan ?? 'free') as PlanId
  const planLabel = PLAN_LABELS[plan]
  const planBadge = PLAN_BADGE_STYLES[plan]

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 min-h-screen bg-white border-r border-slate-100
        transition-all duration-200 ease-in-out
        ${collapsed ? 'w-16' : 'w-60'}`}
    >
      {/* Logo + toggle */}
      <div className="h-14 flex items-center border-b border-slate-100 px-3 gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="flex-1 text-sm font-semibold text-slate-900 tracking-tight truncate">
            FlipVision AI
          </span>
        )}
        <button
          onClick={toggle}
          className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100
            transition-colors cursor-pointer shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <ChevronLeft  className="w-4 h-4" />
          }
        </button>
      </div>

      {/* Account section */}
      <div className={`pt-3 pb-3 border-b border-slate-100 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        {!collapsed && (
          <p className="px-2 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Account
          </p>
        )}

        <Link
          href="/account"
          title={collapsed ? 'Account' : undefined}
          className={`flex items-center gap-2.5 py-2 rounded-xl text-sm font-medium
            transition-all duration-150 group
            ${collapsed ? 'justify-center px-2' : 'px-3'}
            ${pathname === '/account'
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
        >
          <User
            className={`w-4 h-4 shrink-0 transition-colors
              ${pathname === '/account' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
          />
          {!collapsed && 'Account'}
        </Link>

        {/* User card */}
        <Link
          href="/account"
          title={collapsed ? (displayName || 'Profile') : undefined}
          className={`flex items-center gap-3 py-2.5 rounded-xl hover:bg-slate-50
            transition-colors group cursor-pointer
            ${collapsed ? 'justify-center px-2' : 'px-3'}`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700
            flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">
              {profile ? initials : <span className="opacity-50">··</span>}
            </span>
          </div>

          {!collapsed && (
            <>
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
            </>
          )}
        </Link>

        {/* Plan badge — hidden when collapsed */}
        {!collapsed && (
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
              {plan === 'free'     && 'Upgrade to unlock additional features.'}
              {plan === 'pro'      && 'Unlimited properties & AI analysis.'}
              {plan === 'investor' && 'Full access + ROI & portfolio reports.'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-4 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
        {!collapsed && (
          <p className="px-2 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Navigation
          </p>
        )}

        {NAV_ITEMS.map(({ label, href, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-2.5 py-2 rounded-xl text-sm font-medium
                transition-all duration-150 group
                ${collapsed ? 'justify-center px-2' : 'px-3'}
                ${active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors
                  ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
              />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className={`pb-4 border-t border-slate-100 pt-3 ${collapsed ? 'px-2' : 'px-3'}`}>
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className={`flex items-center gap-2.5 py-2 rounded-xl text-sm font-medium
            text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150
            cursor-pointer group
            ${collapsed ? 'justify-center px-2 w-full' : 'w-full px-3'}`}
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-red-500 transition-colors" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
