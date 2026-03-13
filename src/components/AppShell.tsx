'use client'

import { Sidebar } from './Sidebar'

/**
 * AppShell wraps every protected page with the persistent sidebar.
 * Auth pages (login, signup) do NOT use AppShell.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
