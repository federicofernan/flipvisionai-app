'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Building2,
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href:  '/admin',
    icon:  LayoutDashboard,
    match: (p: string) => p === '/admin',
  },
  {
    label: 'Plans',
    href:  '/admin/plans',
    icon:  CreditCard,
    match: (p: string) => p === '/admin/plans',
  },
  {
    label: 'Prompts',
    href:  '/admin/prompts',
    icon:  MessageSquare,
    match: (p: string) => p === '/admin/prompts',
  },
]

export function AdminSidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('admin-sidebar-collapsed')
    if (stored !== null) setCollapsed(stored === 'true')
  }, [])

  const toggle = () => {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem('admin-sidebar-collapsed', String(next))
      return next
    })
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 min-h-screen bg-white border-r border-slate-100
        transition-all duration-200 ease-in-out
        ${collapsed ? 'w-16' : 'w-60'}`}
    >
      {/* Logo + toggle */}
      <div className="h-14 flex items-center border-b border-slate-100 px-3 gap-2">
        <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="flex-1 text-sm font-semibold text-slate-900 tracking-tight truncate">
            Admin Panel
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

      {/* Admin badge */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
            <ShieldCheck className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="text-[11px] font-semibold text-red-600">Administrator</span>
          </div>
        </div>
      )}

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
                  ? 'bg-red-50 text-red-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors
                  ${active ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600'}`}
              />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={`pb-4 border-t border-slate-100 pt-3 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
        <Link
          href="/dashboard"
          title={collapsed ? 'Back to App' : undefined}
          className={`flex items-center gap-2.5 py-2 rounded-xl text-sm font-medium
            text-slate-500 hover:bg-slate-50 hover:text-slate-900
            transition-all duration-150 group
            ${collapsed ? 'justify-center px-2' : 'px-3'}`}
        >
          <Building2 className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors" />
          {!collapsed && 'Back to App'}
        </Link>
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className={`flex items-center gap-2.5 py-2 rounded-xl text-sm font-medium
            text-slate-500 hover:bg-red-50 hover:text-red-600
            transition-all duration-150 cursor-pointer group
            ${collapsed ? 'justify-center px-2 w-full' : 'w-full px-3'}`}
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-red-500 transition-colors" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
