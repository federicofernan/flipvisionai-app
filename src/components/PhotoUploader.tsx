'use client'

import { useCallback, useRef, useState } from 'react'
import { UploadCloud, X, ImageIcon } from 'lucide-react'
import { RoomType, ROOM_TYPE_LABELS, ROOM_TYPES } from '@/lib/types'

export interface PendingPhoto {
  file: File
  previewUrl: string
  roomType: RoomType
}

interface PhotoUploaderProps {
  onChange: (photos: PendingPhoto[]) => void
}

export function PhotoUploader({ onChange }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const newPhotos: PendingPhoto[] = Array.from(files)
        .filter((f) => f.type.startsWith('image/'))
        .map((file) => ({
          file,
          previewUrl: URL.createObjectURL(file),
          roomType: 'other' as RoomType,
        }))

      setPhotos((prev) => {
        const updated = [...prev, ...newPhotos]
        onChange(updated)
        return updated
      })
    },
    [onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
    },
    [addFiles]
  )

  const handleRoomChange = (index: number, roomType: RoomType) => {
    setPhotos((prev) => {
      const updated = prev.map((p, i) => (i === index ? { ...p, roomType } : p))
      onChange(updated)
      return updated
    })
  }

  const handleRemove = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl)
      const updated = prev.filter((_, i) => i !== index)
      onChange(updated)
      return updated
    })
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2
          transition-colors cursor-pointer
          ${dragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50'
          }`}
      >
        <UploadCloud className={`w-7 h-7 ${dragging ? 'text-blue-500' : 'text-slate-400'}`} />
        <p className="text-sm font-medium text-slate-600">
          Drag & drop photos here
        </p>
        <p className="text-xs text-slate-400">or click to browse — JPG, PNG, WEBP</p>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) addFiles(e.target.files) }}
      />

      {/* Preview grid */}
      {photos.length > 0 && (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {photos.map((photo, index) => (
            <div
              key={photo.previewUrl}
              className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-2"
            >
              {/* Thumbnail */}
              <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={photo.file.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* File name */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-slate-400 shrink-0" />
                  {photo.file.name}
                </p>
                <p className="text-xs text-slate-400">
                  {(photo.file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>

              {/* Room type selector */}
              <select
                value={photo.roomType}
                onChange={(e) => handleRoomChange(index, e.target.value as RoomType)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white
                  text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROOM_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {ROOM_TYPE_LABELS[rt]}
                  </option>
                ))}
              </select>

              {/* Remove */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
