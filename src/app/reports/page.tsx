'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AppShell } from '@/components/AppShell'
import { createClient } from '@/lib/supabase/client'
import { ROOM_TYPE_LABELS, RoomType, AnalysisReport, ProjectTimeline } from '@/lib/types'
import {
  FileBarChart2,
  Sparkles,
  MapPin,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
  Clock,
  AlertCircle,
  TrendingUp,
  Star,
  Download,
  DollarSign,
  CalendarDays,
  ArrowRight,
} from 'lucide-react'

interface Report {
  id: string
  property_id: string
  rooms: RoomType[]
  analysis: string
  before_photo_url: string | null
  generated_image_url: string | null
  renovation_style: string | null
  created_at: string
  properties: {
    address: string
    name: string | null
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function PriorityBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    High:   'bg-red-50 text-red-700 border-red-100',
    Medium: 'bg-amber-50 text-amber-700 border-amber-100',
    Low:    'bg-slate-50 text-slate-600 border-slate-100',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles[level] ?? styles.Low}`}>
      {level}
    </span>
  )
}

function RoiBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    High:   'bg-green-50 text-green-700 border-green-100',
    Medium: 'bg-blue-50 text-blue-700 border-blue-100',
    Low:    'bg-slate-50 text-slate-500 border-slate-100',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles[level] ?? styles.Low}`}>
      ROI: {level}
    </span>
  )
}

function ConditionDot({ condition }: { condition: string }) {
  const colors: Record<string, string> = {
    Excellent: 'bg-green-500', Good: 'bg-blue-500', Fair: 'bg-amber-500', Poor: 'bg-red-500',
  }
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full shrink-0 ${colors[condition] ?? 'bg-slate-400'}`} />
      <span className="text-xs font-medium text-slate-700">{condition}</span>
    </span>
  )
}

function JsonReport({ report }: { report: AnalysisReport }) {
  const ratingColors: Record<string, string> = {
    'Excellent':               'bg-green-50 border-green-100 text-green-700',
    'Good':                    'bg-blue-50 border-blue-100 text-blue-700',
    'Fair':                    'bg-amber-50 border-amber-100 text-amber-700',
    'Needs Work':              'bg-orange-50 border-orange-100 text-orange-700',
    'Major Renovation Required': 'bg-red-50 border-red-100 text-red-700',
  }
  const investRating: Record<string, string> = {
    High:   'bg-green-50 border-green-100 text-green-700',
    Medium: 'bg-blue-50 border-blue-100 text-blue-700',
    Low:    'bg-slate-50 border-slate-100 text-slate-600',
  }

  return (
    <div className="space-y-5">
      <div data-pdf-section className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
              ${ratingColors[report.overall_assessment.condition] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              {report.overall_assessment.condition}
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{report.overall_assessment.summary}</p>
        </div>
      </div>

      {report.rooms.map((room) => (
        <div data-pdf-section key={room.room_type} className="rounded-xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-800">{room.room_label}</h3>
            <ConditionDot condition={room.condition} />
          </div>
          <div className="p-3 space-y-3">
            {room.issues.length > 0 && (
              <ul className="space-y-1">
                {room.issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            )}
            <div className="space-y-1.5">
              {room.renovations.map((reno, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-white border border-slate-100">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-[11px] font-semibold text-slate-800">{reno.area}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <PriorityBadge level={reno.priority} />
                      <RoiBadge level={reno.roi_impact} />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{reno.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {report.top_priorities.length > 0 && (
        <div data-pdf-section>
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-xs font-semibold text-slate-800">Top Priorities</p>
          </div>
          <div className="space-y-1.5">
            {report.top_priorities.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold
                  flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-[11px] font-semibold text-slate-800">{item.renovation}</p>
                    <RoiBadge level={item.roi_impact} />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div data-pdf-section className="p-3 rounded-xl border border-slate-100 bg-slate-50">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
          <p className="text-xs font-semibold text-slate-800">Investment Potential</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
            ${investRating[report.investment_potential.rating] ?? ''}`}>
            {report.investment_potential.rating}
          </span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">{report.investment_potential.summary}</p>
      </div>
    </div>
  )
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function CostReport({ report }: { report: AnalysisReport }) {
  const roomsWithCost = report.rooms.filter((r) => r.cost_estimate?.line_items?.length)

  return (
    <div className="space-y-5">
      {/* Grand total banner */}
      {report.grand_total && (
        <div data-pdf-section className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-semibold text-slate-800">Total Estimated Cost</p>
          </div>
          <p className="text-sm font-bold text-blue-700">
            {fmt(report.grand_total.total_low)} – {fmt(report.grand_total.total_high)}
          </p>
        </div>
      )}

      {/* Per-room cost breakdowns */}
      {roomsWithCost.map((room) => {
        const est = room.cost_estimate!
        return (
          <div data-pdf-section key={room.room_type} className="rounded-xl border border-slate-100 overflow-hidden">
            {/* Room header with subtotal */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-800">{room.room_label}</h3>
              <p className="text-xs font-semibold text-slate-700">
                {fmt(est.room_total.total_low)} – {fmt(est.room_total.total_high)}
              </p>
            </div>

            {/* Line items table */}
            <div className="divide-y divide-slate-50">
              {/* Header row */}
              <div className="grid grid-cols-4 gap-2 px-3 py-1.5 bg-slate-50/50">
                <p className="text-[10px] font-semibold text-slate-400 col-span-2">Task</p>
                <p className="text-[10px] font-semibold text-slate-400 text-right">Materials</p>
                <p className="text-[10px] font-semibold text-slate-400 text-right">Labor</p>
              </div>
              {est.line_items.map((item, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 px-3 py-2 items-start">
                  <div className="col-span-2">
                    <p className="text-[11px] font-medium text-slate-800">{item.task}</p>
                    <p className="text-[10px] font-semibold text-slate-600 mt-0.5">
                      Total: {fmt(item.total_low)} – {fmt(item.total_high)}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 text-right">
                    {fmt(item.materials_low)} – {fmt(item.materials_high)}
                  </p>
                  <p className="text-[10px] text-slate-500 text-right">
                    {fmt(item.labor_low)} – {fmt(item.labor_high)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
        Estimates are based on 2024–2025 US national average contractor rates and may vary by region, materials, and scope.
      </p>
    </div>
  )
}

const PHASE_COLORS = [
  { bar: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-100' },
  { bar: 'bg-indigo-500',  badge: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { bar: 'bg-violet-500',  badge: 'bg-violet-50 text-violet-700 border-violet-100' },
  { bar: 'bg-purple-500',  badge: 'bg-purple-50 text-purple-700 border-purple-100' },
  { bar: 'bg-fuchsia-500', badge: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100' },
  { bar: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-100' },
  { bar: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-700 border-orange-100' },
  { bar: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-100' },
  { bar: 'bg-teal-500',    badge: 'bg-teal-50 text-teal-700 border-teal-100' },
  { bar: 'bg-cyan-500',    badge: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
]

function fmtCurrency(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function TimelineReport({ timeline }: { timeline: ProjectTimeline }) {
  const totalWeeks = timeline.total_duration_weeks
  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div data-pdf-section className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 text-center">
          <CalendarDays className="w-4 h-4 text-indigo-500 mb-1" />
          <p className="text-sm font-bold text-indigo-700">{totalWeeks} wks</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Duration</p>
        </div>
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 text-center">
          <DollarSign className="w-4 h-4 text-amber-500 mb-1" />
          <p className="text-sm font-bold text-amber-700">{fmtCurrency(timeline.daily_holding_cost)}/day</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Holding Cost</p>
        </div>
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 text-center">
          <TrendingUp className="w-4 h-4 text-red-500 mb-1" />
          <p className="text-sm font-bold text-red-700">{fmtCurrency(timeline.total_holding_cost)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Total Holding</p>
        </div>
      </div>

      {/* Gantt-style bar chart */}
      {timeline.phases.length > 0 && (
        <div data-pdf-section className="rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-100">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Schedule Overview</p>
          </div>
          <div className="p-3 space-y-2">
            {timeline.phases.map((phase, i) => {
              const color   = PHASE_COLORS[i % PHASE_COLORS.length]
              const pct     = Math.round((phase.duration_weeks / totalWeeks) * 100)
              const offset  = Math.round(((phase.start_week - 1) / totalWeeks) * 100)
              return (
                <div key={i} className="flex items-center gap-2">
                  <p className="text-[10px] text-slate-600 w-28 shrink-0 truncate">{phase.phase_name}</p>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                      className={`absolute top-0 h-full rounded-full ${color.bar}`}
                      style={{ left: `${Math.min(offset, 95)}%`, width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 w-10 text-right shrink-0">
                    {phase.duration_weeks}w
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Phase details */}
      {timeline.phases.map((phase, i) => {
        const color = PHASE_COLORS[i % PHASE_COLORS.length]
        return (
          <div data-pdf-section key={i} className="rounded-xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.bar}`} />
                <h3 className="text-xs font-semibold text-slate-800">
                  {phase.phase_number}. {phase.phase_name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Wk {phase.start_week}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${color.badge}`}>
                  {phase.duration_weeks} wk{phase.duration_weeks !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {phase.description && (
                <p className="text-xs text-slate-700 leading-relaxed">{phase.description}</p>
              )}
              {phase.rooms_affected.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {phase.rooms_affected.map((room, j) => (
                    <span key={j} className="text-[10px] font-medium text-blue-700 bg-blue-50
                      border border-blue-100 px-2 py-0.5 rounded-full capitalize">
                      {room.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
              {phase.dependencies && (
                <div className="flex items-start gap-1.5">
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    <span className="font-medium text-slate-500">Depends on:</span> {phase.dependencies}
                  </p>
                </div>
              )}
              {phase.notes && (
                <div className="flex items-start gap-1.5 mt-1">
                  <AlertCircle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-500 leading-relaxed">{phase.notes}</p>
                </div>
              )}
            </div>
          </div>
        )
      })}

      <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
        Timeline assumes a single GC managing subcontractors in a normal (non-peak) US market. Actual durations may vary based on permit timelines, material lead times, and contractor availability.
      </p>
    </div>
  )
}

function ReportCard({ report }: { report: Report }) {
  const [expanded, setExpanded]           = useState(false)
  const [activeTab, setActiveTab]         = useState<'analysis' | 'cost' | 'timeline'>('analysis')
  const [pdfMode, setPdfMode]             = useState(false)
  const [downloading, setDownloading]     = useState(false)
  const [beforePhotoUrl, setBeforePhotoUrl] = useState<string | null>(report.before_photo_url)
  const cardRef         = useRef<HTMLDivElement>(null)
  const pdfContentRef   = useRef<HTMLDivElement>(null)
  const photoSectionRef = useRef<HTMLDivElement>(null)
  const reportHeaderRef = useRef<HTMLDivElement>(null)

  // Parse analysis JSON; fall back gracefully
  let parsed: AnalysisReport | null = null
  try { parsed = JSON.parse(report.analysis) } catch { /* legacy text report */ }

  const hasCost     = parsed?.rooms.some((r) => r.cost_estimate?.line_items?.length)
  const hasTimeline = !!(parsed?.project_timeline?.phases?.length && parsed.project_timeline.total_duration_weeks)

  const preview = parsed?.overall_assessment.summary?.slice(0, 130) + '…'

  const handleDownloadPdf = async () => {
    setDownloading(true)
    if (!expanded) setExpanded(true)
    setPdfMode(true)
    await new Promise((r) => setTimeout(r, 400))

    try {
      const [{ default: jsPDF }, { toJpeg }] = await Promise.all([
        import('jspdf'),
        import('html-to-image'),
      ])

      const container = pdfContentRef.current
      if (!container) return

      const sections = Array.from(container.querySelectorAll<HTMLElement>('[data-pdf-section]'))
      if (!sections.length) return

      const pdf        = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth  = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin     = 10
      const maxWidth   = pageWidth - margin * 2
      let y = margin

      // ── 1. Capture report header ─────────────────────────────────────────────
      if (reportHeaderRef.current) {
        const headerImg = await toJpeg(reportHeaderRef.current, {
          quality: 0.95,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
        })
        const header = new window.Image()
        await new Promise<void>((res) => { header.onload = () => res(); header.src = headerImg })
        const headerH = (header.naturalHeight * maxWidth) / header.naturalWidth
        pdf.addImage(headerImg, 'JPEG', margin, y, maxWidth, headerH)
        y += headerH + 5
      }

      // ── 2. Capture before/after photos ───────────────────────────────────────
      if (photoSectionRef.current) {
        const photoImg = await toJpeg(photoSectionRef.current, {
          quality: 0.93,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
        })
        const photo = new window.Image()
        await new Promise<void>((res) => { photo.onload = () => res(); photo.src = photoImg })
        const photoH = (photo.naturalHeight * maxWidth) / photo.naturalWidth
        pdf.addImage(photoImg, 'JPEG', margin, y, maxWidth, photoH)
        y += photoH + 4
      }

      // ── 3. Capture each report section ──────────────────────────────────────
      for (const section of sections) {
        const forceBreak = section.hasAttribute('data-pdf-page-break')

        const imgData = await toJpeg(section, {
          quality: 0.93,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
        })
        const img = new window.Image()
        await new Promise<void>((res) => { img.onload = () => res(); img.src = imgData })

        const sectionH = (img.naturalHeight * maxWidth) / img.naturalWidth

        // Force a new page for flagged sections, otherwise break when no space left
        if (forceBreak || y + sectionH > pageHeight - margin) {
          pdf.addPage()
          y = margin
        }

        pdf.addImage(imgData, 'JPEG', margin, y, maxWidth, sectionH)
        y += sectionH + 3
      }

      const slug = (report.properties?.address ?? report.id)
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)
      pdf.save(`flipvision-report-${slug}.pdf`)
    } finally {
      setPdfMode(false)
      setDownloading(false)
    }
  }

  return (
    <div ref={cardRef} id={report.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-6">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
            flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
            <FileBarChart2 className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {report.properties?.name
                    ? `${report.properties.name} — ${report.properties.address}`
                    : report.properties?.address ?? 'Unknown property'
                  }
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <p className="text-xs text-slate-500 truncate">{report.properties?.address}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold
                  text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" />
                  Analyzed
                </span>
                {report.generated_image_url && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold
                    text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI Render
                  </span>
                )}
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock className="w-2.5 h-2.5" />
                  {formatDate(report.created_at)} · {formatTime(report.created_at)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {report.rooms.map((room) => (
                <span key={room} className="text-[10px] font-medium text-blue-700 bg-blue-50
                  border border-blue-100 px-2 py-0.5 rounded-full">
                  {ROOM_TYPE_LABELS[room] ?? room}
                </span>
              ))}
              {report.renovation_style && (
                <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50
                  border border-indigo-100 px-2 py-0.5 rounded-full">
                  ✦ {report.renovation_style}
                </span>
              )}
            </div>

            {parsed && !expanded && (
              <p className="text-xs text-slate-500 mt-3 leading-relaxed line-clamp-2">{preview}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
          <button
            onClick={async () => {
              const next = !expanded
              setExpanded(next)
              // Fallback for reports generated before before_photo_url was stored
              if (next && !beforePhotoUrl) {
                const supabase = createClient()
                const { data } = await supabase
                  .from('property_photos')
                  .select('public_url')
                  .eq('property_id', report.property_id)
                  .in('room_type', report.rooms)
                  .order('created_at', { ascending: true })
                  .limit(1)
                  .single()
                if (data) setBeforePhotoUrl(data.public_url)
              }
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600
              hover:text-blue-700 transition-colors cursor-pointer"
          >
            {expanded
              ? <><ChevronUp className="w-3.5 h-3.5" /> Hide report</>
              : <><ChevronDown className="w-3.5 h-3.5" /> Read full report</>
            }
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500
              hover:text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {downloading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
              : <><Download className="w-3.5 h-3.5" /> Download PDF</>
            }
          </button>
          <Link
            href={`/property/${report.property_id}`}
            className="ml-auto flex items-center gap-1.5 text-xs font-medium text-slate-500
              hover:text-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View property
          </Link>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-50">
          {/* Before / After */}
          {(beforePhotoUrl || report.generated_image_url) && (
            <div ref={photoSectionRef} className="grid grid-cols-2 divide-x divide-slate-100">
              {/* Before */}
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                {beforePhotoUrl
                  ? <Image src={beforePhotoUrl} alt="Before renovation" fill className="object-cover" sizes="50vw" />
                  : <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No photo</div>
                }
                <div className="absolute bottom-0 inset-x-0 px-3 py-1.5 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-[10px] font-semibold text-white/80">Before</p>
                </div>
              </div>
              {/* After */}
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                {report.generated_image_url
                  ? <Image src={report.generated_image_url} alt="AI-generated renovation render" fill className="object-cover" sizes="50vw" />
                  : <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Render unavailable</div>
                }
                <div className="absolute bottom-0 inset-x-0 px-3 py-1.5 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-[10px] font-semibold text-white/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    After (AI Render)
                  </p>
                </div>
              </div>
            </div>
          )}

          {parsed && !pdfMode && (
            <div className="px-5 pt-4 pb-2">
              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4">
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                    ${activeTab === 'analysis' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <FileBarChart2 className="w-3.5 h-3.5" />
                  Analysis
                </button>
                {hasCost && (
                  <button
                    onClick={() => setActiveTab('cost')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                      ${activeTab === 'cost' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Cost Estimate
                  </button>
                )}
                {hasTimeline && (
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                      ${activeTab === 'timeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    Timeline
                  </button>
                )}
              </div>
              <div className="pb-5">
                {activeTab === 'analysis' && <JsonReport report={parsed} />}
                {activeTab === 'cost' && hasCost && <CostReport report={parsed} />}
                {activeTab === 'timeline' && hasTimeline && <TimelineReport timeline={parsed.project_timeline!} />}
              </div>
            </div>
          )}

          {/* PDF mode: render all sections stacked without tabs */}
          {parsed && pdfMode && (
            <div className="px-5 pt-5 pb-6 space-y-3">

              {/* ── Report header (logo + property title) ── */}
              <div ref={reportHeaderRef} className="flex items-center justify-between py-3 border-b-2 border-slate-900 mb-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-900 tracking-tight">FlipVision AI</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {report.properties?.name
                      ? `${report.properties.name} — ${report.properties.address}`
                      : report.properties?.address ?? 'Renovation Report'
                    }
                  </p>
                  {report.renovation_style && (
                    <p className="text-[10px] font-medium text-indigo-600 mt-0.5">✦ {report.renovation_style}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Generated {formatDate(report.created_at)} · {formatTime(report.created_at)}
                  </p>
                </div>
              </div>

              <div ref={pdfContentRef} className="space-y-3">
                <div data-pdf-section className="pb-2 border-b border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Renovation Analysis</p>
                </div>
                <JsonReport report={parsed} />
                {hasCost && (
                  <>
                    <div data-pdf-section data-pdf-page-break className="pb-2 border-b border-slate-200 pt-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Cost Estimation</p>
                    </div>
                    <CostReport report={parsed} />
                  </>
                )}
                {hasTimeline && (
                  <>
                    <div data-pdf-section data-pdf-page-break className="pb-2 border-b border-slate-200 pt-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Project Timeline</p>
                    </div>
                    <TimelineReport timeline={parsed.project_timeline!} />
                  </>
                )}
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('reports')
      .select('*, properties(address, name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReports((data as Report[]) ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <AppShell>
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-6 py-10">

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">My Reports</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              AI-generated renovation analysis for your properties.
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24 gap-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-500">Loading reports…</p>
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1 mb-4">
              {reports.length} Report{reports.length !== 1 ? 's' : ''}
            </p>
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600
              flex items-center justify-center mb-5 shadow-sm shadow-blue-200">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-2">No reports yet</h2>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-6">
              Open a property, upload photos, and click{' '}
              <span className="font-medium text-slate-700">Analyze with AI</span> to generate
              your first renovation report.
            </p>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white
                text-sm font-medium shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors"
            >
              Go to My Properties
            </Link>
          </div>
        )}

      </main>
    </div>
    </AppShell>
  )
}
