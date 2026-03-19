'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, CheckSquare, Square, Images, ChevronRight, ChevronLeft, Info, Clock } from 'lucide-react'
import { PropertyPhoto, RoomType, ROOM_TYPE_LABELS, RenovationStyle } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface RoomSelectionModalProps {
  photos: PropertyPhoto[]
  onConfirm: (selectedRooms: RoomType[], style: RenovationStyle, includeTimeline: boolean) => void
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

const STYLE_ICONS: Record<string, string> = {
  modern_contemporary: '🏙️',
  minimalist:          '◻️',
  industrial:          '🏗️',
  scandinavian:        '🪵',
  biophilic:           '🌿',
}

export function RoomSelectionModal({ photos, onConfirm, onClose }: RoomSelectionModalProps) {
  // ── Step ────────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // ── Step 1: room selection ───────────────────────────────────────────────────
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

  // ── Step 3: timeline option ──────────────────────────────────────────────────
  const [includeTimeline, setIncludeTimeline] = useState(false)

  // ── Step 2: style selection ──────────────────────────────────────────────────
  const FALLBACK_STYLES: RenovationStyle[] = [
    { id: 'modern_contemporary', name: 'modern_contemporary', label: 'Modern / Contemporary', description: 'The most popular choice in new construction and gut renovations today. Defined by clean horizontal and vertical lines, an open-plan layout, and a restrained palette of whites, grays, and blacks punctuated by a single bold accent material — usually steel, glass, or concrete.' },
    { id: 'minimalist',          name: 'minimalist',          label: 'Minimalist',             description: 'Takes modern a step further by aggressively eliminating visual noise. Every surface is intentional. Storage is concealed behind seamless panels. The payoff: a space that feels larger and calmer than its square footage suggests — a great fit for condos and smaller homes.' },
    { id: 'industrial',          name: 'industrial',          label: 'Industrial',             description: 'Works especially well in older buildings and loft-style spaces. Instead of hiding structural elements, it makes them the design feature — exposed HVAC, raw concrete, and reclaimed wood shelving give the space an authentic, lived-in character.' },
    { id: 'scandinavian',        name: 'scandinavian',        label: 'Scandinavian / Nordic',  description: 'The most livable of the five. Borrows minimalism\'s discipline but softens it with warm wood tones, layered textiles, and plants. Highly practical for families — every piece of furniture earns its spot through function and beauty.' },
    { id: 'biophilic',           name: 'biophilic',           label: 'Biophilic',              description: 'The fastest-growing category right now, especially in warm climates like South Florida. Prioritizes natural materials, ventilation, greenery, and water features to actively improve air quality and mental wellbeing — not just aesthetics.' },
  ]

  const [styles, setStyles]               = useState<RenovationStyle[]>([])
  const [stylesLoading, setStylesLoading] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<RenovationStyle | null>(null)
  const [expandedStyleId, setExpandedStyleId] = useState<string | null>(null)

  useEffect(() => {
    if (step !== 2) return
    setStylesLoading(true)
    const supabase = createClient()
    supabase
      .from('renovation_style')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        const rows = data as RenovationStyle[] | null
        setStyles(rows?.length ? rows : FALLBACK_STYLES)
        setStylesLoading(false)
      })
  }, [step])

  const handleConfirm = () => {
    if (!selectedStyle || selected.size === 0) return
    onConfirm(Array.from(selected), selectedStyle, includeTimeline)
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
              <p className="text-xs text-slate-500">
                {step === 1 ? 'Step 1 of 3 — Select rooms' : step === 2 ? 'Step 2 of 3 — Choose a style' : 'Step 3 of 3 — Project timeline'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
              <div className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
              <div className={`w-2 h-2 rounded-full transition-colors ${step === 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Step 1: Rooms ─────────────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div className="px-6 py-5">
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                FlipVision AI will analyze the photos from your selected rooms and generate a detailed
                renovation assessment report.
              </p>

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

            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600
                  hover:bg-slate-50 transition-colors cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={selected.size === 0 || availableRooms.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                  bg-blue-600 text-white text-sm font-semibold shadow-sm shadow-blue-200
                  hover:bg-blue-700 active:scale-95 transition-all cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Style ─────────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div className="px-6 py-5">
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Choose the renovation style you want to target. The AI will tailor its recommendations
                accordingly. Tap <Info className="w-3 h-3 inline-block text-slate-400" /> to see the full description.
              </p>

              {stylesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {styles.map((style) => {
                    const isSelected   = selectedStyle?.id === style.id
                    const showDesc     = expandedStyleId === style.id
                    return (
                      <div key={style.id}>
                        <button
                          onClick={() => setSelectedStyle(style)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left
                            transition-all cursor-pointer
                            ${isSelected
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                            }`}
                        >
                          <span className="text-lg">{STYLE_ICONS[style.name] ?? '🏠'}</span>
                          <p className={`flex-1 text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                            {style.label}
                          </p>
                          {/* Info toggle — stops selection propagation */}
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedStyleId(showDesc ? null : style.id)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation()
                                setExpandedStyleId(showDesc ? null : style.id)
                              }
                            }}
                            className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0
                              ${showDesc ? 'text-blue-500 bg-blue-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                          >
                            <Info className="w-3.5 h-3.5" />
                          </span>
                          {isSelected
                            ? <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                            : <Square className="w-4 h-4 text-slate-300 shrink-0" />
                          }
                        </button>
                        {showDesc && (
                          <div className="mt-1 mx-1 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100
                            text-xs text-slate-700 leading-relaxed">
                            {style.description}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200
                  text-sm text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedStyle || selected.size === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                  bg-blue-600 text-white text-sm font-semibold shadow-sm shadow-blue-200
                  hover:bg-blue-700 active:scale-95 transition-all cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Timeline ───────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <div className="px-6 py-5">
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Optionally include a project timeline in your report. The AI will generate a realistic
                phase-by-phase schedule based on your renovation scope.
              </p>

              <button
                onClick={() => setIncludeTimeline((v) => !v)}
                className={`w-full flex items-start gap-4 px-4 py-4 rounded-xl border text-left
                  transition-all cursor-pointer
                  ${includeTimeline
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                  }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                  ${includeTimeline ? 'bg-blue-600' : 'bg-slate-200'}`}>
                  <Clock className={`w-4 h-4 ${includeTimeline ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold mb-1 ${includeTimeline ? 'text-blue-700' : 'text-slate-800'}`}>
                    Include Project Timeline
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Generate a realistic schedule with phases like demolition, framing, plumbing,
                    electrical, and finishes — with durations and task dependencies.
                  </p>
                </div>
                {includeTimeline
                  ? <CheckSquare className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  : <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                }
              </button>

              {!includeTimeline && (
                <p className="mt-3 text-[11px] text-slate-400 text-center">
                  You can skip this — the timeline can always be added in a future analysis.
                </p>
              )}
            </div>

            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200
                  text-sm text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedStyle || selected.size === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                  bg-blue-600 text-white text-sm font-semibold shadow-sm shadow-blue-200
                  hover:bg-blue-700 active:scale-95 transition-all cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                Analyze {selected.size} room{selected.size !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
