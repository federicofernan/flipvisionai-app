'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [ready, setReady]               = useState(false)

  // Supabase puts the session tokens in the URL hash after the redirect.
  // We need to wait for the client to exchange them before the user can update.
  useEffect(() => {
    const supabase = createClient()
    // onAuthStateChange fires with SIGNED_IN / PASSWORD_RECOVERY once the
    // hash tokens are consumed by the Supabase client on mount.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (err) { setError(err.message); return }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb] px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200">
            <Building2 className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">FlipVision AI</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Set new password</h1>
          <p className="text-sm text-slate-500 mb-6">Choose a new password for your account.</p>

          {!ready ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              Verifying reset link…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    autoComplete="new-password"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm
                      placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                      hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Confirm password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm
                    placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium
                  shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all
                  cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
