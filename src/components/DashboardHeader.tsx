'use client'

import { Building2 } from 'lucide-react'

interface DashboardHeaderProps {
  onAddProperty: () => void
}

export function DashboardHeader({ onAddProperty }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-10">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-5 h-5 text-blue-600" />
          <span className="text-xs font-semibold tracking-widest text-blue-600 uppercase">
            FlipVision AI
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          My Properties
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your portfolio and analyze renovation opportunities.
        </p>
      </div>

      <button
        onClick={onAddProperty}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium
          shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95
          transition-all duration-150 cursor-pointer"
      >
        <span className="text-lg leading-none">+</span>
        Add Property
      </button>
    </header>
  )
}
