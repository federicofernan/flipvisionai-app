'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Save, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface Prompt {
  id:          string
  name:        string
  description: string | null
  content:     string
  updated_at:  string
  created_at:  string
}

export default function AdminPromptsPage() {
  const [prompts, setPrompts]   = useState<Prompt[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState<string | null>(null)
  const [saved, setSaved]       = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/admin/prompts')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPrompts(data)
          // expand first prompt by default
          if (data.length > 0) setExpanded({ [data[0].id]: true })
        } else {
          setError(data.error ?? 'Failed to load prompts')
        }
      })
      .catch(() => setError('Failed to load prompts'))
      .finally(() => setLoading(false))
  }, [])

  const updateContent = (id: string, content: string) => {
    setPrompts((prev) => prev.map((p) => p.id === id ? { ...p, content } : p))
  }

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const save = async (prompt: Prompt) => {
    setSaving(prompt.id)
    setError(null)
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prompt.id, content: prompt.content }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Save failed'); return }
      setPrompts((prev) => prev.map((p) => p.id === data.id ? data : p))
      setSaved(prompt.id)
      setTimeout(() => setSaved(null), 2500)
    } catch {
      setError('Save failed')
    } finally {
      setSaving(null)
    }
  }

  const PROMPT_BADGE: Record<string, string> = {
    renovation_analysis: 'bg-blue-100 text-blue-700',
    image_generation:    'bg-purple-100 text-purple-700',
    property_analysis:   'bg-indigo-100 text-indigo-700',
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-5 h-5 text-slate-500" />
          <h1 className="text-2xl font-bold text-slate-900">Prompts</h1>
        </div>
        <p className="text-sm text-slate-500">
          Edit AI prompt templates. Changes take effect immediately on the next analysis.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-5 w-40 bg-slate-100 rounded-full" />
                <div className="h-4 w-4 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prompt cards */}
      {!loading && (
        <div className="space-y-4">
          {prompts.map((prompt) => {
            const isExpanded = expanded[prompt.id] ?? false
            const isSaving   = saving === prompt.id
            const isSaved    = saved  === prompt.id
            const badge      = PROMPT_BADGE[prompt.name] ?? 'bg-slate-100 text-slate-700'

            return (
              <div
                key={prompt.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                {/* Collapsed header */}
                <button
                  onClick={() => toggle(prompt.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50
                    transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full font-mono ${badge}`}>
                      {prompt.name}
                    </span>
                    {prompt.description && (
                      <span className="text-sm text-slate-500 hidden sm:block">
                        {prompt.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-slate-400 hidden sm:block">
                      {new Date(prompt.updated_at).toLocaleDateString()}
                    </span>
                    {isExpanded
                      ? <ChevronUp   className="w-4 h-4 text-slate-400" />
                      : <ChevronDown className="w-4 h-4 text-slate-400" />
                    }
                  </div>
                </button>

                {/* Expanded editor */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                    {prompt.description && (
                      <p className="text-xs text-slate-500 mb-3 sm:hidden">{prompt.description}</p>
                    )}

                    <div className="mb-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Prompt content
                        <span className="ml-2 text-slate-400 font-normal">
                          — use {'{{variable}}'} placeholders
                        </span>
                      </label>
                      <textarea
                        value={prompt.content}
                        onChange={(e) => updateContent(prompt.id, e.target.value)}
                        rows={20}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm
                          font-mono leading-relaxed resize-y
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          placeholder:text-slate-400"
                        spellCheck={false}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-400">
                        {prompt.content.length.toLocaleString()} characters
                      </span>
                      <button
                        onClick={() => save(prompt)}
                        disabled={isSaving}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl
                          text-sm font-medium transition-all active:scale-95 cursor-pointer
                          disabled:opacity-60
                          ${isSaved
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700'
                          }`}
                      >
                        {isSaving && <Loader2    className="w-4 h-4 animate-spin" />}
                        {isSaved  && <CheckCircle2 className="w-4 h-4" />}
                        {!isSaving && !isSaved && <Save className="w-4 h-4" />}
                        {isSaving ? 'Saving…' : isSaved ? 'Saved!' : 'Save Prompt'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
