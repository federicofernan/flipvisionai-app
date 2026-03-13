'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PLANS, PlanId } from '@/lib/plans'

function StepIndicator() {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <span className="text-xs font-medium text-slate-400">Create Account</span>
      </div>
      <div className="w-8 h-px bg-slate-200" />
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
          2
        </div>
        <span className="text-xs font-medium text-blue-600">Choose Plan</span>
      </div>
    </div>
  )
}

export default function PlanSelectionPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const handleContinue = async () => {
    if (!selectedPlan) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ selected_plan: selectedPlan })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // FREE → dashboard immediately
    // PRO / INVESTOR → payment placeholder (structure ready for Stripe)
    if (selectedPlan === 'free') {
      router.push('/dashboard')
    } else {
      router.push('/signup/payment')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#f8f9fb] px-4 py-10 animate-fade-in">

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-slate-900 tracking-tight">FlipVision AI</span>
      </div>

      <StepIndicator />

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2 tracking-tight">
          Choose your plan
        </h1>
        <p className="text-sm text-slate-500">Start free. Upgrade anytime as your portfolio grows.</p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl mb-8">
        {PLANS.map((plan) => {
          const isSelected    = selectedPlan === plan.id
          const isHighlighted = plan.highlighted

          return (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative text-left rounded-2xl border-2 p-6 transition-all duration-150 cursor-pointer
                ${isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                  : isHighlighted
                    ? 'border-blue-200 bg-white shadow-md hover:border-blue-300'
                    : 'border-slate-100 bg-white shadow-sm hover:border-slate-200 hover:shadow-md'
                }`}
            >
              {/* Recommended badge */}
              {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                    bg-blue-600 text-white text-[10px] font-semibold shadow-sm">
                    <Sparkles className="w-2.5 h-2.5" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-blue-600
                  flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Plan name + price */}
              <div className="mb-5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-0.5">
                  <span className="text-3xl font-bold text-slate-900 tracking-tight">
                    {plan.price}
                  </span>
                  {plan.id !== 'free' && (
                    <span className="text-sm text-slate-400 mb-1">/ mo</span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{plan.billing}</p>
              </div>

              {/* Features */}
              <ul className="space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-slate-600 leading-snug">
                    <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0
                      ${isSelected ? 'text-blue-600' : 'text-emerald-500'}`}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">
          {error}
        </p>
      )}

      {/* CTA */}
      <button
        onClick={handleContinue}
        disabled={!selectedPlan || loading}
        className="px-10 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium
          shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all
          cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading
          ? 'Saving…'
          : selectedPlan
            ? PLANS.find((p) => p.id === selectedPlan)?.cta
            : 'Select a plan to continue'
        }
      </button>

      <p className="text-xs text-slate-400 mt-4 text-center">
        You can change your plan at any time from your account settings.
      </p>
    </div>
  )
}
