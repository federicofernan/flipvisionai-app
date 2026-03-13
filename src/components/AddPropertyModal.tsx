'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PhotoUploader, PendingPhoto } from './PhotoUploader'

interface AddPropertyModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function AddPropertyModal({ open, onClose, onCreated }: AddPropertyModalProps) {
  const [address, setAddress] = useState('')
  const [name, setName]       = useState('')
  const [photos, setPhotos]   = useState<PendingPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const addressRef = useRef<HTMLInputElement>(null)

  // Focus address on open
  useEffect(() => {
    if (open) {
      setAddress(''); setName(''); setPhotos([]); setError(null); setStatusMsg('')
      setTimeout(() => addressRef.current?.focus(), 50)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) { setError('Property address is required.'); return }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // 1. Insert property record
      setStatusMsg('Creating property…')
      const { data: property, error: propErr } = await supabase
        .from('properties')
        .insert({ address: address.trim(), name: name.trim() || null })
        .select()
        .single()

      if (propErr) throw propErr

      // 2. Upload each photo to Supabase Storage
      if (photos.length > 0) {
        setStatusMsg(`Uploading ${photos.length} photo${photos.length > 1 ? 's' : ''}…`)

        await Promise.all(
          photos.map(async (photo) => {
            const ext = photo.file.name.split('.').pop() ?? 'jpg'
            const storagePath = `${property.id}/${crypto.randomUUID()}.${ext}`

            const { error: uploadErr } = await supabase.storage
              .from('property-photos')
              .upload(storagePath, photo.file, { upsert: false })

            if (uploadErr) throw uploadErr

            const { data: { publicUrl } } = supabase.storage
              .from('property-photos')
              .getPublicUrl(storagePath)

            await supabase.from('property_photos').insert({
              property_id:  property.id,
              storage_path: storagePath,
              public_url:   publicUrl,
              room_type:    photo.roomType,
              file_name:    photo.file.name,
            })
          })
        )
      }

      onCreated()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setError(msg)
    } finally {
      setLoading(false)
      setStatusMsg('')
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Add New Property</h2>
            <p className="text-xs text-slate-500 mt-0.5">Fill in the details and upload photos.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Property Address <span className="text-red-500">*</span>
            </label>
            <input
              ref={addressRef}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Palm Street, Miami, FL"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900
                placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Property Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Property Name <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Miami Beach Condo"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900
                placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Photo Uploader */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Photos <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <PhotoUploader onChange={setPhotos} />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">{statusMsg}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-xl
                  hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white
                  text-sm font-medium shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95
                  transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? statusMsg || 'Saving…' : 'Save Property'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
