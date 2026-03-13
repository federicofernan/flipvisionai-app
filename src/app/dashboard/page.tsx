'use client'

import { useCallback, useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { DashboardHeader } from '@/components/DashboardHeader'
import { PropertyCard } from '@/components/PropertyCard'
import { AddPropertyModal } from '@/components/AddPropertyModal'
import { fetchProperties } from '@/lib/queries'
import { Property } from '@/lib/types'

export default function DashboardPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading]       = useState(true)
  const [modalOpen, setModalOpen]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchProperties()
      setProperties(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <AppShell>
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-6 py-10">
        <DashboardHeader onAddProperty={() => setModalOpen(true)} />

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm animate-pulse">
                <div className="h-48 bg-slate-100" />
                <div className="p-4 space-y-3">
                  <div className="h-3.5 bg-slate-100 rounded-full w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && properties.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-blue-500" />
            </div>
            <h2 className="text-base font-semibold text-slate-800 mb-1">
              You haven&apos;t added any properties yet.
            </h2>
            <p className="text-sm text-slate-500 mb-6 max-w-xs">
              Start by adding your first property to analyze renovation opportunities with AI.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white
                text-sm font-medium shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
            >
              <span className="text-base leading-none">+</span>
              Add Your First Property
            </button>
          </div>
        )}

        {/* Property grid */}
        {!loading && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>

      <AddPropertyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={load}
      />
    </div>
    </AppShell>
  )
}
