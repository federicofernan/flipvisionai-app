'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Images, Trash2, Loader2 } from 'lucide-react'
import { PropertyPhoto, RoomType, ROOM_TYPE_LABELS } from '@/lib/types'

interface PropertyGalleryProps {
  photos: PropertyPhoto[]
  onDelete?: (photo: PropertyPhoto) => Promise<void>
}

function groupByRoom(photos: PropertyPhoto[]): Record<string, PropertyPhoto[]> {
  return photos.reduce<Record<string, PropertyPhoto[]>>((acc, photo) => {
    const key = photo.room_type
    if (!acc[key]) acc[key] = []
    acc[key].push(photo)
    return acc
  }, {})
}

export function PropertyGallery({ photos, onDelete }: PropertyGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [deletingId, setDeletingId]       = useState<string | null>(null)

  const grouped  = groupByRoom(photos)
  const roomKeys = Object.keys(grouped) as RoomType[]

  const openLightbox  = (idx: number) => setLightboxIndex(idx)
  const closeLightbox = () => setLightboxIndex(null)

  const prev = () =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null))
  const next = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null))

  const handleDelete = async (photo: PropertyPhoto, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!onDelete || deletingId) return
    setDeletingId(photo.id)
    try {
      await onDelete(photo)
      // If we just deleted the lightbox photo, close or step back
      if (lightboxIndex !== null) {
        const newLength = photos.length - 1
        if (newLength === 0) {
          setLightboxIndex(null)
        } else {
          setLightboxIndex((i) => (i !== null ? Math.min(i, newLength - 1) : null))
        }
      }
    } finally {
      setDeletingId(null)
    }
  }

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
                <h3 className="text-sm font-semibold text-slate-800">{ROOM_TYPE_LABELS[room]}</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {roomPhotos.length}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {roomPhotos.map((photo, i) => {
                  const idx      = startIndex + i
                  const deleting = deletingId === photo.id

                  return (
                    <div
                      key={photo.id}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100"
                    >
                      {/* Clickable image area */}
                      <button
                        onClick={() => openLightbox(idx)}
                        className="absolute inset-0 w-full h-full cursor-pointer"
                        disabled={deleting}
                      >
                        <Image
                          src={photo.public_url}
                          alt={photo.file_name}
                          fill
                          className={`object-cover transition-all duration-300 group-hover:scale-105
                            ${deleting ? 'opacity-40' : ''}`}
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </button>

                      {/* Delete button — top-right, shows on hover */}
                      {onDelete && !deleting && (
                        <button
                          onClick={(e) => handleDelete(photo, e)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500
                            text-white opacity-0 group-hover:opacity-100 transition-opacity
                            flex items-center justify-center shadow-md hover:bg-red-600
                            cursor-pointer z-10"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Deleting spinner */}
                      {deleting && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <Loader2 className="w-5 h-5 text-white animate-spin drop-shadow" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center animate-fade-in"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full
              hover:bg-white/10 transition-colors cursor-pointer"
            onClick={closeLightbox}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Delete from lightbox */}
          {onDelete && (
            <button
              className="absolute top-4 right-16 text-white/60 hover:text-red-400 p-2 rounded-full
                hover:bg-white/10 transition-colors cursor-pointer"
              title="Delete photo"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(photos[lightboxIndex])
              }}
              disabled={!!deletingId}
            >
              {deletingId === photos[lightboxIndex]?.id
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Trash2 className="w-5 h-5" />
              }
            </button>
          )}

          {/* Prev */}
          {photos.length > 1 && (
            <button
              className="absolute left-4 text-white/70 hover:text-white p-2 rounded-full
                hover:bg-white/10 transition-colors cursor-pointer"
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
              className="absolute right-4 text-white/70 hover:text-white p-2 rounded-full
                hover:bg-white/10 transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); next() }}
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}

          {/* Counter + filename */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
            <p className="text-white/60 text-xs tabular-nums">
              {lightboxIndex + 1} / {photos.length}
            </p>
            <p className="text-white/40 text-[10px] mt-0.5 truncate max-w-xs">
              {photos[lightboxIndex].file_name}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
