'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Eye, EyeOff, Loader2, ChevronRight, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FormState {
  email:          string
  password:       string
  first_name:     string
  last_name:      string
  address_line_1: string
  address_line_2: string
  state:          string
  country:        string
}

const INITIAL_FORM: FormState = {
  email: '', password: '', first_name: '', last_name: '',
  address_line_1: '', address_line_2: '', state: '', country: '',
}

function StepIndicator({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      <div className="flex items-center gap-1.5">
        <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
          ${current >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
          1
        </div>
        <span className={`text-xs font-medium ${current === 1 ? 'text-blue-600' : 'text-slate-400'}`}>
          Create Account
        </span>
      </div>
      <div className="w-8 h-px bg-slate-200" />
      <div className="flex items-center gap-1.5">
        <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
          ${current >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
          2
        </div>
        <span className={`text-xs font-medium ${current === 2 ? 'text-blue-600' : 'text-slate-400'}`}>
          Choose Plan
        </span>
      </div>
    </div>
  )
}

function inputClass(extra?: string) {
  return `w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm
    placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500
    focus:border-transparent ${extra ?? ''}`
}

export default function SignUpPage() {
  const router = useRouter()
  const [form, setForm]               = useState<FormState>(INITIAL_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [emailSent, setEmailSent]     = useState(false)

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // 1. Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options: {
        data: { first_name: form.first_name, last_name: form.last_name },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // 2. Create profile record
    if (data.user) {
      await supabase.from('profiles').upsert({
        id:             data.user.id,
        email:          form.email,
        first_name:     form.first_name,
        last_name:      form.last_name,
        address_line_1: form.address_line_1 || null,
        address_line_2: form.address_line_2 || null,
        state:          form.state          || null,
        country:        form.country        || null,
        selected_plan:  'free',
      })
    }

    // 3. Email confirmation required (session is null) or logged in directly
    if (!data.session) {
      setEmailSent(true)
      setLoading(false)
      return
    }

    router.push('/signup/plan')
  }

  // ── Email confirmation waiting screen ──
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb] px-4">
        <div className="w-full max-w-sm text-center animate-slide-up">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Check your email</h2>
          <p className="text-sm text-slate-500 mb-1 leading-relaxed">
            We sent a confirmation link to
          </p>
          <p className="text-sm font-semibold text-slate-800 mb-6">{form.email}</p>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Click the link to activate your account, then sign in to choose your plan.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white
              text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  // ── Registration form ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb] px-4 py-10">
      <div className="w-full max-w-md animate-slide-up">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">FlipVision AI</span>
        </div>

        <StepIndicator current={1} />

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Create your account</h1>
          <p className="text-sm text-slate-500 mb-6">
            Start analyzing properties with AI in minutes.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" value={form.first_name} onChange={set('first_name')}
                  placeholder="Federico" required autoComplete="given-name"
                  className={inputClass()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" value={form.last_name} onChange={set('last_name')}
                  placeholder="Fernandez" required autoComplete="family-name"
                  className={inputClass()}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email" value={form.email} onChange={set('email')}
                placeholder="you@example.com" required autoComplete="email"
                className={inputClass()}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={set('password')}
                  placeholder="Min. 8 characters" required minLength={8}
                  autoComplete="new-password"
                  className={inputClass('pr-10')}
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

            {/* Optional address section */}
            <div className="pt-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Address (optional)
              </p>
              <div className="space-y-3">
                <input
                  type="text" value={form.address_line_1} onChange={set('address_line_1')}
                  placeholder="Address Line 1" autoComplete="address-line1"
                  className={inputClass()}
                />
                <input
                  type="text" value={form.address_line_2} onChange={set('address_line_2')}
                  placeholder="Address Line 2" autoComplete="address-line2"
                  className={inputClass()}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text" value={form.state} onChange={set('state')}
                    placeholder="State" autoComplete="address-level1"
                    className={inputClass()}
                  />
                  <input
                    type="text" value={form.country} onChange={set('country')}
                    placeholder="Country" autoComplete="country-name"
                    className={inputClass()}
                  />
                </div>
              </div>
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
                cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
