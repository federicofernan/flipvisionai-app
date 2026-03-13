'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, CreditCard, ArrowRight, Wrench } from 'lucide-react'

// TODO: Replace this page with Stripe Checkout integration.
// Preparation checklist:
//   1. Install @stripe/stripe-js and stripe packages
//   2. Create a Stripe product + price for each plan (pro, investor)
//   3. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY to .env.local
//   4. Create /api/checkout/route.ts → stripe.checkout.sessions.create()
//   5. Create /api/webhooks/stripe/route.ts → handle payment success + update profiles.selected_plan
//   6. Add STRIPE_WEBHOOK_SECRET to .env.local
//   7. Update this page to call the checkout API and redirect to Stripe

const UPCOMING_FEATURES = [
  { icon: '💳', label: 'Stripe subscriptions', desc: 'Secure checkout & recurring billing' },
  { icon: '🔄', label: 'Plan upgrades & downgrades', desc: 'Switch plans from your account' },
  { icon: '🧾', label: 'Billing portal', desc: 'Manage invoices and payment methods' },
  { icon: '📊', label: 'Plan-based feature limits', desc: 'Feature gates per tier' },
]

export default function PaymentPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb] px-4 animate-fade-in">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">FlipVision AI</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
            <Wrench className="w-7 h-7 text-amber-500" />
          </div>

          <h1 className="text-xl font-semibold text-slate-900 mb-2 text-center">
            Payment Integration<br />Coming Soon
          </h1>
          <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
            Your plan has been saved. Billing will go live shortly — you&apos;ll be notified
            when payment processing is enabled.
          </p>

          {/* Upcoming features */}
          <div className="space-y-2.5 mb-6">
            {UPCOMING_FEATURES.map(({ icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <span className="text-base shrink-0">{icon}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-700">{label}</p>
                  <p className="text-[10px] text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Powered-by hint */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-6">
            <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="text-xs text-slate-500">
              Payment will be powered by <span className="font-semibold text-slate-700">Stripe</span>
            </p>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium
              shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all
              cursor-pointer flex items-center justify-center gap-2"
          >
            Continue to Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          Questions?{' '}
          <Link href="/account" className="text-blue-600 hover:text-blue-700 transition-colors">
            Visit your account
          </Link>
        </p>
      </div>
    </div>
  )
}
