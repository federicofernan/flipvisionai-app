'use client'

import { useState } from 'react'
import { X, Sparkles, CheckSquare, Square, Images } from 'lucide-react'
import { PropertyPhoto, RoomType, ROOM_TYPE_LABELS } from '@/lib/types'

interface RoomSelectionModalProps {
  photos: PropertyPhoto[]
  onConfirm: (selectedRooms: RoomType[]) => void
  onClose: () => void
}

const ROOM_ICONS: Record<RoomType, string> = {
  kitchen:     '🍳',
  bathroom:    '🚿',
  living_room: '🛋️',
  bedroom:     '🛏️',
  exterior:    '🏠',
  other:       '📷',
}

export function RoomSelectionModal({ photos, onConfirm, onClose }: RoomSelectionModalProps) {
  // Group photos by room and count
  const roomGroups = photos.reduce<Record<RoomType, number>>((acc, p) => {
    acc[p.room_type] = (acc[p.room_type] ?? 0) + 1
    return acc
  }, {} as Record<RoomType, number>)

  const availableRooms = Object.keys(roomGroups) as RoomType[]

  const [selected, setSelected] = useState<Set<RoomType>>(new Set(availableRooms))

  const toggle = (room: RoomType) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(room)) next.delete(room)
      else next.add(room)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === availableRooms.length) setSelected(new Set())
    else setSelected(new Set(availableRooms))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">AI Analysis</h2>
              <p className="text-xs text-slate-500">Select rooms to analyze</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            FlipVision AI will analyze the photos from your selected rooms and generate a detailed
            renovation assessment report.
          </p>

          {/* Select all toggle */}
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700
              mb-3 transition-colors cursor-pointer"
          >
            {selected.size === availableRooms.length
              ? <CheckSquare className="w-3.5 h-3.5" />
              : <Square className="w-3.5 h-3.5" />
            }
            {selected.size === availableRooms.length ? 'Deselect all' : 'Select all'}
          </button>

          {/* Room list */}
          <div className="space-y-2">
            {availableRooms.map((room) => {
              const isSelected = selected.has(room)
              return (
                <button
                  key={room}
                  onClick={() => toggle(room)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left
                    transition-all cursor-pointer
                    ${isSelected
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200'
                    }`}
                >
                  <span className="text-lg">{ROOM_ICONS[room]}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                      {ROOM_TYPE_LABELS[room]}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Images className="w-3 h-3 text-slate-400" />
                      <p className="text-xs text-slate-400">
                        {roomGroups[room]} photo{roomGroups[room] !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {isSelected
                    ? <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                    : <Square className="w-4 h-4 text-slate-300 shrink-0" />
                  }
                </button>
              )
            })}
          </div>

          {availableRooms.length === 0 && (
            <div className="text-center py-8">
              <Images className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No photos uploaded yet.</p>
              <p className="text-xs text-slate-400 mt-1">Upload photos first to run AI analysis.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600
              hover:bg-slate-50 transition-colors cursor-pointer font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => selected.size > 0 && onConfirm(Array.from(selected))}
            disabled={selected.size === 0 || availableRooms.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
              bg-blue-600 text-white text-sm font-semibold shadow-sm shadow-blue-200
              hover:bg-blue-700 active:scale-95 transition-all cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            Analyze {selected.size > 0 ? `${selected.size} room${selected.size !== 1 ? 's' : ''}` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
