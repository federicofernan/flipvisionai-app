'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Images } from 'lucide-react'
import { PropertyPhoto, RoomType, ROOM_TYPE_LABELS } from '@/lib/types'

interface PropertyGalleryProps {
  photos: PropertyPhoto[]
}

function groupByRoom(photos: PropertyPhoto[]): Record<string, PropertyPhoto[]> {
  return photos.reduce<Record<string, PropertyPhoto[]>>((acc, photo) => {
    const key = photo.room_type
    if (!acc[key]) acc[key] = []
    acc[key].push(photo)
    return acc
  }, {})
}

export function PropertyGallery({ photos }: PropertyGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const grouped = groupByRoom(photos)
  const roomKeys = Object.keys(grouped) as RoomType[]

  const openLightbox = (globalIndex: number) => setLightboxIndex(globalIndex)
  const closeLightbox = () => setLightboxIndex(null)

  const prev = () =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null))
  const next = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null))

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
        <Images className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">No photos uploaded yet.</p>
      </div>
    )
  }

  let globalIndex = 0

  return (
    <>
      <div className="space-y-10">
        {roomKeys.map((room) => {
          const roomPhotos = grouped[room]
          const startIndex = globalIndex
          globalIndex += roomPhotos.length

          return (
            <section key={room}>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold text-slate-800">
                  {ROOM_TYPE_LABELS[room]}
                </h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {roomPhotos.length}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {roomPhotos.map((photo, i) => {
                  const idx = startIndex + i
                  return (
                    <button
                      key={photo.id}
                      onClick={() => openLightbox(idx)}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer"
                    >
                      <Image
                        src={photo.public_url}
                        alt={photo.file_name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center animate-fade-in"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            onClick={closeLightbox}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              className="absolute left-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); prev() }}
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-4xl max-h-[85vh] w-full mx-16 rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[lightboxIndex].public_url}
              alt={photos[lightboxIndex].file_name}
              width={1200}
              height={900}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          </div>

          {/* Next */}
          {photos.length > 1 && (
            <button
              className="absolute right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); next() }}
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}

          {/* Counter */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs tabular-nums">
            {lightboxIndex + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  )
}
