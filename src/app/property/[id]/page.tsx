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
  UploadCloud,
  FileBarChart2,
  Brain,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Star,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { PropertyGallery } from '@/components/PropertyGallery'
import { PhotoUploader, PendingPhoto } from '@/components/PhotoUploader'
import { RoomSelectionModal } from '@/components/RoomSelectionModal'
import { fetchProperty, fetchPropertyPhotos } from '@/lib/queries'
import { Property, PropertyPhoto, RoomType, AnalysisReport } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

// ── Priority badge ───────────────────────────────────────────────────────────
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

// ── ROI badge ────────────────────────────────────────────────────────────────
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

// ── Condition dot ─────────────────────────────────────────────────────────────
function ConditionDot({ condition }: { condition: string }) {
  const colors: Record<string, string> = {
    Excellent: 'bg-green-500',
    Good:      'bg-blue-500',
    Fair:      'bg-amber-500',
    Poor:      'bg-red-500',
  }
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full shrink-0 ${colors[condition] ?? 'bg-slate-400'}`} />
      <span className="text-xs font-medium text-slate-700">{condition}</span>
    </span>
  )
}

// ── JSON report renderer ─────────────────────────────────────────────────────
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
    <div className="space-y-6">
      {/* Overall assessment */}
      <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border
              ${ratingColors[report.overall_assessment.condition] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              {report.overall_assessment.condition}
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{report.overall_assessment.summary}</p>
        </div>
      </div>

      {/* Rooms */}
      {report.rooms.map((room) => (
        <div key={room.room_type} className="rounded-xl border border-slate-100 overflow-hidden">
          {/* Room header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">{room.room_label}</h3>
            <ConditionDot condition={room.condition} />
          </div>

          <div className="p-4 space-y-4">
            {/* Issues */}
            {room.issues.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Issues Identified</p>
                <ul className="space-y-1">
                  {room.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Renovations */}
            {room.renovations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Renovations</p>
                <div className="space-y-2">
                  {room.renovations.map((reno, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white border border-slate-100">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold text-slate-800">{reno.area}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <PriorityBadge level={reno.priority} />
                          <RoiBadge level={reno.roi_impact} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{reno.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Top priorities */}
      {report.top_priorities.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-800">Top Priority Renovations</h3>
          </div>
          <div className="space-y-2">
            {report.top_priorities.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold
                  flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-semibold text-slate-800">{item.renovation}</p>
                    <RoiBadge level={item.roi_impact} />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investment potential */}
      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-800">Investment Potential</h3>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
            ${investRating[report.investment_potential.rating] ?? ''}`}>
            {report.investment_potential.rating}
          </span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{report.investment_potential.summary}</p>
      </div>
    </div>
  )
}

// ── AI loading overlay ───────────────────────────────────────────────────────
function AnalyzingOverlay() {
  const steps = [
    'Reading property photos…',
    'Identifying room conditions…',
    'Assessing renovation needs…',
    'Generating recommendations…',
    'Compiling investment analysis…',
  ]
  const [step, setStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 2800)
    return () => clearInterval(interval)
  }, [steps.length])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
      <div className="w-full max-w-sm mx-4 text-center">
        <div className="relative flex items-center justify-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600
            flex items-center justify-center shadow-2xl shadow-blue-900/40">
            <Brain className="w-9 h-9 text-white" />
          </div>
          <div className="absolute w-20 h-20 rounded-2xl bg-blue-500/30 animate-ping" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">AI is analyzing your property</h2>
        <p className="text-sm text-slate-400 mb-8">
          FlipVision AI is reviewing your photos as a renovation and investment expert.
        </p>

        <div className="space-y-2.5 text-left">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500
                ${i < step ? 'bg-green-500' : i === step ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}>
                {i < step
                  ? <CheckCircle2 className="w-3 h-3 text-white" />
                  : <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                }
              </div>
              <span className={`text-sm transition-colors duration-300
                ${i < step ? 'text-green-400' : i === step ? 'text-white' : 'text-slate-600'}`}>
                {s}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          This may take up to 30 seconds
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id     = params.id as string

  const [property, setProperty]           = useState<Property | null>(null)
  const [photos, setPhotos]               = useState<PropertyPhoto[]>([])
  const [loading, setLoading]             = useState(true)
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([])
  const [uploaderKey, setUploaderKey]     = useState(0)
  const [uploading, setUploading]         = useState(false)
  const [uploadError, setUploadError]     = useState<string | null>(null)

  // AI flow
  const [showRoomModal, setShowRoomModal]     = useState(false)
  const [analyzing, setAnalyzing]             = useState(false)
  const [analysisReport, setAnalysisReport]   = useState<AnalysisReport | null>(null)
  const [reportId, setReportId]               = useState<string | null>(null)
  const [analyzeError, setAnalyzeError]       = useState<string | null>(null)
  const [showReportPrompt, setShowReportPrompt] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [prop, pics] = await Promise.all([fetchProperty(id), fetchPropertyPhotos(id)])
      if (!prop) { router.replace('/dashboard'); return }
      setProperty(prop)
      setPhotos(pics)
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { load() }, [load])

  // ── Delete photo handler ────────────────────────────────────────────────
  const handleDeletePhoto = async (photo: PropertyPhoto) => {
    const supabase = createClient()
    await supabase.storage.from('property-photos').remove([photo.storage_path])
    await supabase.from('property_photos').delete().eq('id', photo.id)
    await load()
  }

  // ── Upload handler ──────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!pendingPhotos.length) return
    setUploading(true)
    setUploadError(null)
    try {
      const supabase = createClient()
      for (const pending of pendingPhotos) {
        const ext  = pending.file.name.split('.').pop() ?? 'jpg'
        const path = `${id}/${crypto.randomUUID()}.${ext}`
        const { error: storageError } = await supabase.storage
          .from('property-photos').upload(path, pending.file)
        if (storageError) throw storageError
        const { data: { publicUrl } } = supabase.storage
          .from('property-photos').getPublicUrl(path)
        const { error: dbError } = await supabase.from('property_photos').insert({
          property_id: id, storage_path: path, public_url: publicUrl,
          room_type: pending.roomType, file_name: pending.file.name,
        })
        if (dbError) throw dbError
      }
      setPendingPhotos([])
      setUploaderKey((k) => k + 1)
      await load()
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // ── AI analysis handler ─────────────────────────────────────────────────
  const handleAnalyze = async (selectedRooms: RoomType[]) => {
    setShowRoomModal(false)
    setAnalyzing(true)
    setAnalyzeError(null)
    setAnalysisReport(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id, rooms: selectedRooms }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Analysis failed')
      setAnalysisReport(json.report)
      setReportId(json.reportId)
      setShowReportPrompt(true)
    } catch (err: unknown) {
      setAnalyzeError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const hasPhotos = photos.length > 0

  return (
    <AppShell>
    <div className="min-h-screen">
      {showRoomModal && (
        <RoomSelectionModal
          photos={photos}
          onConfirm={handleAnalyze}
          onClose={() => setShowRoomModal(false)}
        />
      )}
      {analyzing && <AnalyzingOverlay />}

      {/* Analysis error modal */}
      {analyzeError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100
              flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Analysis failed</h2>
            <p className="text-sm text-slate-500 mb-2 leading-relaxed">
              Something went wrong while analyzing your property.
            </p>
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-6 text-left break-words">
              {analyzeError}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setAnalyzeError(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600
                  border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Continue
              </button>
              <button
                onClick={() => { setAnalyzeError(null); setShowRoomModal(true) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white
                  bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report-ready prompt */}
      {showReportPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600
              flex items-center justify-center mx-auto mb-4 shadow-sm shadow-blue-200">
              <FileBarChart2 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Report ready!</h2>
            <p className="text-sm text-slate-500 mb-6">
              Your AI renovation report has been generated and saved. Would you like to view it now?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReportPrompt(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600
                  border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Not now
              </button>
              <button
                onClick={() => router.push(`/reports${reportId ? `#${reportId}` : ''}`)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white
                  bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors cursor-pointer"
              >
                View Report
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900
            transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Properties
        </Link>

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-500">Loading property…</p>
          </div>
        )}

        {!loading && property && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ── Left column ── */}
            <div className="flex-1 min-w-0">
              {/* Header */}
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
                <p className="text-xs text-slate-500 ml-6">Added {formatDate(property.created_at)}</p>
              </div>

              {/* Gallery */}
              <div>
                <h2 className="text-sm font-semibold text-slate-700 mb-5">Photo Gallery</h2>
                <PropertyGallery photos={photos} onDelete={handleDeletePhoto} />
              </div>

              {/* Upload */}
              <div className="mt-10">
                <h2 className="text-sm font-semibold text-slate-700 mb-5">Upload Photos</h2>
                <PhotoUploader key={uploaderKey} onChange={setPendingPhotos} />
                {uploadError && (
                  <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {uploadError}
                  </p>
                )}
                <button
                  onClick={handleUpload}
                  disabled={uploading || pendingPhotos.length === 0}
                  className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white
                    text-sm font-medium shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95
                    transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                    : <><UploadCloud className="w-4 h-4" /> Upload{pendingPhotos.length > 0 ? ` ${pendingPhotos.length} photo${pendingPhotos.length !== 1 ? 's' : ''}` : ' Photos'}</>
                  }
                </button>
              </div>


              {/* AI result */}
              {analysisReport && (
                <div className="mt-10">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <h2 className="text-sm font-semibold text-slate-900">AI Renovation Report</h2>
                    </div>
                    {reportId && (
                      <Link
                        href="/reports"
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700
                          font-medium transition-colors"
                      >
                        <FileBarChart2 className="w-3.5 h-3.5" />
                        View in Reports
                      </Link>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <JsonReport report={analysisReport} />
                  </div>

                  <button
                    onClick={() => setShowRoomModal(true)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                      text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Run new analysis
                  </button>
                </div>
              )}
            </div>

            {/* ── Right sidebar ── */}
            <aside className="w-full lg:w-72 shrink-0 space-y-5">
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
                      <p className="text-slate-800 font-medium">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Added</p>
                      <p className="text-slate-800 font-medium">{formatDate(property.created_at)}</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    AI Renovation Analysis
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  {hasPhotos
                    ? 'Analyze your property photos with AI to get renovation insights.'
                    : 'Upload photos first to enable AI analysis.'
                  }
                </p>
                <button
                  onClick={() => setShowRoomModal(true)}
                  disabled={!hasPhotos}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                    flex items-center justify-center gap-2
                    ${hasPhotos
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  <Sparkles className="w-4 h-4" />
                  {hasPhotos ? 'Analyze with AI' : 'Upload photos first'}
                </button>
                {analysisReport && (
                  <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-green-50 border border-green-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    <p className="text-xs text-green-700 font-medium">Analysis complete — saved to reports</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
    </AppShell>
  )
}
