'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Images,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { PropertyGallery } from '@/components/PropertyGallery'
import { fetchProperty, fetchPropertyPhotos } from '@/lib/queries'
import { Property, PropertyPhoto } from '@/lib/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const AI_PLACEHOLDERS = [
  { room: 'Kitchen', icon: '🍳', description: 'Renovation insights coming soon.' },
  { room: 'Bathroom', icon: '🚿', description: 'Renovation insights coming soon.' },
  { room: 'Living Room', icon: '🛋️', description: 'Renovation insights coming soon.' },
]

export default function PropertyDetailPage() {
  const params   = useParams()
  const router   = useRouter()
  const id       = params.id as string

  const [property, setProperty] = useState<Property | null>(null)
  const [photos, setPhotos]     = useState<PropertyPhoto[]>([])
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [prop, pics] = await Promise.all([
        fetchProperty(id),
        fetchPropertyPhotos(id),
      ])
      if (!prop) { router.replace('/'); return }
      setProperty(prop)
      setPhotos(pics)
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { load() }, [load])

  return (
    <AppShell>
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900
            transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Properties
        </Link>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-500">Loading property…</p>
          </div>
        )}

        {!loading && property && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ── Left column: gallery ── */}
            <div className="flex-1 min-w-0">
              {/* Property header */}
              <div className="mb-8">
                {property.name && (
                  <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-1">
                    {property.name}
                  </p>
                )}
                <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  {property.address}
                </h1>
                <p className="text-xs text-slate-500 ml-6">
                  Added {formatDate(property.created_at)}
                </p>
              </div>

              {/* Gallery */}
              <div>
                <h2 className="text-sm font-semibold text-slate-700 mb-5">
                  Photo Gallery
                </h2>
                <PropertyGallery photos={photos} />
              </div>
            </div>

            {/* ── Right sidebar ── */}
            <aside className="w-full lg:w-72 shrink-0 space-y-5">
              {/* Property info card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  Property Info
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Address</p>
                      <p className="text-slate-800 font-medium leading-snug">{property.address}</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Images className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Photos</p>
                      <p className="text-slate-800 font-medium">
                        {photos.length} photo{photos.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Uploaded</p>
                      <p className="text-slate-800 font-medium">{formatDate(property.created_at)}</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* AI Analysis placeholder */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    AI Renovation Analysis
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  AI-powered insights will appear here once analysis is triggered.
                </p>

                <div className="space-y-2">
                  {AI_PLACEHOLDERS.map(({ room, icon, description }) => (
                    <div
                      key={room}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <span className="text-lg">{icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{room}</p>
                        <p className="text-xs text-slate-400">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  disabled
                  className="mt-4 w-full py-2 rounded-xl bg-blue-50 text-blue-400 text-xs font-medium
                    border border-blue-100 cursor-not-allowed"
                >
                  Analyze with AI — Coming Soon
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
    </AppShell>
  )
}
