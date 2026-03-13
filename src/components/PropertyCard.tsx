'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Images, Calendar } from 'lucide-react'
import { Property } from '@/lib/types'

interface PropertyCardProps {
  property: Property
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Link href={`/property/${property.id}`} className="group block">
      <article
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden
          shadow-sm transition-all duration-200 ease-out
          group-hover:-translate-y-1 group-hover:shadow-lg group-hover:border-slate-200"
      >
        {/* Image */}
        <div className="relative h-48 bg-slate-100 overflow-hidden">
          {property.cover_image_url ? (
            <Image
              src={property.cover_image_url}
              alt={property.address}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center">
                <Images className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-400">No photos yet</p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {property.name && (
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">
              {property.name}
            </p>
          )}

          <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-3 line-clamp-2">
            <MapPin className="inline w-3.5 h-3.5 text-slate-400 mr-1 -mt-0.5" />
            {property.address}
          </h3>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Images className="w-3.5 h-3.5" />
              {property.photo_count ?? 0} photo{property.photo_count !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(property.created_at)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
