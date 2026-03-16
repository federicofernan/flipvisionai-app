'use client'

import { useState } from 'react'
import { Search, Loader2, AlertCircle, CheckCircle2, Link, DollarSign } from 'lucide-react'
import { validateListingUrl } from '@/utils/url-validator'
import { PropertyReport } from '@/lib/property-analysis-types'

interface PropertyUrlInputProps {
  onAnalysisComplete: (result: {
    report: PropertyReport
    analysisId: string
    address: string
    listPrice: number
    photos: string[]
    cached: boolean
    cachedAt?: string
  }) => void
}

const STEPS = [
  'Fetching listing data…',
  'Enriching with market data…',
  'Running AI analysis…',
]

export function PropertyUrlInput({ onAnalysisComplete }: PropertyUrlInputProps) {
  const [url, setUrl]               = useState('')
  const [listPrice, setListPrice]   = useState('')
  const [urlError, setUrlError]     = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)
  const [step, setStep]             = useState(0)
  const [error, setError]           = useState<string | null>(null)
  const [isLimitError, setIsLimitError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateListingUrl(url)
    if (validationError) {
      setUrlError(validationError)
      return
    }

    setUrlError(null)
    setError(null)
    setIsLimitError(false)
    setLoading(true)
    setStep(0)

    const t1 = setTimeout(() => setStep(1), 5000)
    const t2 = setTimeout(() => setStep(2), 15000)

    // Parse price — strip non-numeric characters (commas, $, spaces)
    const parsedPrice = listPrice
      ? parseInt(listPrice.replace(/[^\d]/g, ''), 10) || undefined
      : undefined

    try {
      const res = await fetch('/api/analyze-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, listPrice: parsedPrice }),
      })
      const json = await res.json()

      if (!res.ok) {
        if (json.code === 'LIMIT_REACHED') setIsLimitError(true)
        throw new Error(json.error ?? 'Analysis failed')
      }

      onAnalysisComplete(json)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      clearTimeout(t1)
      clearTimeout(t2)
      setLoading(false)
      setStep(0)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* URL input */}
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Link className="w-4 h-4" />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              if (urlError) setUrlError(null)
              if (error) setError(null)
            }}
            placeholder="Paste a Zillow or Redfin listing URL…"
            disabled={loading}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm bg-white text-slate-900
              placeholder:text-slate-400 outline-none transition-all
              ${urlError ? 'border-red-300 focus:ring-2 focus:ring-red-100' : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50'}
              disabled:opacity-60 disabled:cursor-not-allowed`}
          />
        </div>

        {urlError && (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {urlError}
          </p>
        )}

        {/* Listing price input */}
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={listPrice}
            onChange={(e) => setListPrice(e.target.value)}
            placeholder="Listing price (e.g. 450000)"
            disabled={loading}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm bg-white
              text-slate-900 placeholder:text-slate-400 outline-none transition-all
              focus:border-blue-400 focus:ring-2 focus:ring-blue-50
              disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
        <p className="text-[11px] text-slate-400 -mt-1 pl-1">
          Enter the listing price for accurate financial projections. Required for best results.
        </p>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
            bg-blue-600 text-white text-sm font-semibold shadow-sm shadow-blue-200
            hover:bg-blue-700 active:scale-95 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
          ) : (
            <><Search className="w-4 h-4" /> Analyze Property</>
          )}
        </button>
      </form>

      {/* Step progress */}
      {loading && (
        <div className="mt-5 space-y-2.5">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500
                ${i < step ? 'bg-green-500' : i === step ? 'bg-blue-500 animate-pulse' : 'bg-slate-200'}`}>
                {i < step
                  ? <CheckCircle2 className="w-3 h-3 text-white" />
                  : <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                }
              </div>
              <span className={`text-sm transition-colors duration-300
                ${i < step ? 'text-green-600' : i === step ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                {s}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700">{error}</p>
              {isLimitError && (
                <a
                  href="/signup/plan"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-semibold
                    text-blue-600 hover:text-blue-700 underline underline-offset-2"
                >
                  Upgrade to Pro for unlimited analyses →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
