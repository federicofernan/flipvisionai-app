export type PlanId = 'free' | 'pro' | 'investor'

export interface Plan {
  id: PlanId
  name: string
  price: string
  billing: string
  features: string[]
  cta: string
  highlighted: boolean
  report_limit: number | null              // renovation analyses per month; null = unlimited
  property_analysis_limit: number | null   // property URL analyses per month; null = unlimited
  // Future: Stripe price ID for billing integration
  stripePriceId?: string
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 'Free',
    billing: 'Forever',
    features: [
      'Forever free — No credit card required',
      '2 property analyses per month',
      'Room-by-room breakdown',
      'Basic renovation suggestions',
      'Cost & value estimates',
    ],
    cta: 'Get Started Free',
    highlighted: false,
    report_limit: 2,
    property_analysis_limit: 2,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    billing: 'per month, billed monthly',
    features: [
      'Unlimited property analyses',
      'AI renovation visualizations',
      'Full renovation reports',
      'Priority support',
      'PDF export',
    ],
    cta: 'Start Pro',
    highlighted: true,
    report_limit: null,
    property_analysis_limit: null,
    stripePriceId: 'price_pro_monthly', // TODO: replace with real Stripe price ID
  },
  {
    id: 'investor',
    name: 'Investor',
    price: '$49',
    billing: 'per month, billed monthly',
    features: [
      'Everything in Pro',
      'ROI & portfolio reports',
      'Downloadable renovation plans',
      'Contractor bid templates',
      'Dedicated account manager',
    ],
    cta: 'Start Investor',
    highlighted: false,
    report_limit: null,
    property_analysis_limit: null,
    stripePriceId: 'price_investor_monthly', // TODO: replace with real Stripe price ID
  },
]

export const PLAN_LABELS: Record<PlanId, string> = {
  free: 'Free Plan',
  pro: 'Pro Plan',
  investor: 'Investor Plan',
}

export const PLAN_BADGE_STYLES: Record<PlanId, string> = {
  free: 'bg-slate-100 text-slate-600',
  pro: 'bg-blue-100 text-blue-700',
  investor: 'bg-indigo-100 text-indigo-700',
}
