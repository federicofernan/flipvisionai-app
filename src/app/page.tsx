import Link from 'next/link'
import {
  ArrowRight,
  Upload,
  Brain,
  FileText,
  TrendingUp,
  Clock,
  Eye,
  BarChart3,
  Check,
  Star,
} from 'lucide-react'
import { PLANS } from '@/lib/plans'

// ─── Shared class helpers ────────────────────────────────────────────────────
const serif = 'font-[family-name:var(--font-serif)]'
const sans  = 'font-[family-name:var(--font-dm-sans)]'

// ─── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <header className={`${sans} fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-[#0b0e1a]/80 backdrop-blur-md`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-7 h-7">
            <div className="absolute inset-0 rounded-lg bg-blue-500 blur-sm opacity-60" />
            <div className="relative w-7 h-7 rounded-lg bg-[#1a4fff] flex items-center justify-center">
              <span className="text-white text-xs font-black">F</span>
            </div>
          </div>
          <span className="text-white font-semibold tracking-tight text-sm">FlipVision AI</span>
        </Link>

        {/* Nav links — desktop only */}
        <nav className="hidden md:flex items-center gap-6">
          {['How it Works', 'Preview', 'Pricing'].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(' ', '-')}`}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* CTA buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-white/70 hover:text-white transition-colors hidden sm:block"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1a4fff] text-white
              text-sm font-semibold hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-900/40"
          >
            Start Free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className={`${sans} relative min-h-screen bg-[#0b0e1a] flex flex-col items-center justify-center px-6 pt-16 pb-20 overflow-hidden`}>
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-indigo-600/8 blur-[80px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs text-blue-300 font-medium">AI-powered renovation intelligence</span>
        </div>

        {/* Headline */}
        <h1 className={`${serif} text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.05] mb-6`}>
          See the <em className="text-[#c9a84c] not-italic">Profit</em> Inside<br />
          Every Property
        </h1>

        <p className={`text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed`}>
          Upload photos of any home and let AI reveal the renovations that increase value —
          with visualizations before you spend a dollar.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#1a4fff] text-white
              font-semibold hover:bg-blue-600 active:scale-95 transition-all
              shadow-xl shadow-blue-900/40 text-sm"
          >
            Analyze a Property
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/15
              text-white/80 hover:text-white hover:border-white/30 transition-all text-sm font-medium"
          >
            See How It Works
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto mb-16">
          {[
            { value: '$42K', label: 'avg. value increase identified' },
            { value: '2 min', label: 'per property analysis' },
            { value: '8,400+', label: 'properties analyzed' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className={`${serif} text-3xl text-white mb-0.5`}>{value}</p>
              <p className="text-xs text-white/40 leading-snug">{label}</p>
            </div>
          ))}
        </div>

        {/* Dashboard preview mockup */}
        <div className="relative mx-auto max-w-3xl">
          <div className="absolute -inset-4 rounded-3xl bg-blue-500/10 blur-xl" />
          <div className="relative rounded-2xl border border-white/10 bg-[#111827] overflow-hidden shadow-2xl">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-[#0d1117]">
              {['bg-red-500', 'bg-amber-500', 'bg-emerald-500'].map((c) => (
                <div key={c} className={`w-2.5 h-2.5 rounded-full ${c} opacity-70`} />
              ))}
              <div className="ml-3 flex-1 max-w-xs h-5 rounded-full bg-white/5 text-white/20 text-[10px] flex items-center px-3">
                flipvision.ai/dashboard
              </div>
            </div>

            {/* Dashboard content mock */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-white/40 mb-0.5">Property Analysis</p>
                  <p className="text-sm font-semibold text-white">142 Maple Street</p>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20">
                  <span className="text-xs text-emerald-400 font-semibold">+$61,000 potential</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { room: 'Kitchen', cost: '$8,200', gain: '+$18,500', roi: 88, color: 'blue' },
                  { room: 'Bathroom', cost: '$12,400', gain: '+$22,000', roi: 76, color: 'purple' },
                  { room: 'Living Room', cost: '$5,800', gain: '+$11,000', roi: 82, color: 'indigo' },
                  { room: 'Exterior', cost: '$3,200', gain: '+$9,500', roi: 92, color: 'emerald' },
                ].map(({ room, cost, gain, roi }) => (
                  <div key={room} className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-white/80">{room}</p>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
                        ROI {roi}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mb-0.5">Cost {cost}</p>
                    <p className="text-sm font-semibold text-emerald-400">{gain}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Trust bar ────────────────────────────────────────────────────────────────
function TrustBar() {
  const audiences = ['Real Estate Investors', 'House Flippers', 'Airbnb Hosts', 'Realtors', 'Homeowners']
  return (
    <section className={`${sans} bg-[#0f1220] border-y border-white/5 py-5`}>
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        <span className="text-xs text-white/30 font-medium uppercase tracking-widest">Trusted by</span>
        {audiences.map((a) => (
          <span key={a} className="text-sm text-white/50 font-medium">{a}</span>
        ))}
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: 'Upload Property Photos',
      desc: 'Drop in photos of any room — kitchen, bathroom, living area, or exterior. The more photos, the richer the analysis.',
      num: '01',
    },
    {
      icon: Brain,
      title: 'AI Analyzes Every Room',
      desc: 'FlipVision scans each photo, identifies renovation opportunities, and estimates costs and value increases for each upgrade.',
      num: '02',
    },
    {
      icon: FileText,
      title: 'Get Your Profit Report',
      desc: 'Receive a full renovation roadmap with AI-generated visuals, estimated costs, ROI scores, and prioritized action items.',
      num: '03',
    },
  ]

  return (
    <section id="how-it-works" className={`${sans} bg-[#f7f6f2] py-24 px-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">How It Works</p>
          <h2 className={`${serif} text-4xl sm:text-5xl text-[#0f0e0b] mb-4`}>
            From photos to <em className="text-[#1a4fff] not-italic">profit plan</em> in minutes
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            No expertise needed. Just upload, and let the AI do the heavy lifting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(({ icon: Icon, title, desc, num }) => (
            <div key={num} className="relative bg-white rounded-2xl border border-slate-100 p-7 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200">
              <span className="absolute top-5 right-5 text-5xl font-black text-slate-100 select-none leading-none">
                {num}
              </span>
              <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Product Preview ──────────────────────────────────────────────────────────
function ProductPreview() {
  const rooms = [
    { name: 'Kitchen',     task: 'Quartz counters, cabinet hardware', cost: '$8,200',  gain: '+$18,500', roi: 88 },
    { name: 'Bathroom',    task: 'Walk-in shower, fixtures, tile',    cost: '$12,400', gain: '+$22,000', roi: 76 },
    { name: 'Living Room', task: 'Hardwood floors, recessed lighting',cost: '$5,800',  gain: '+$11,000', roi: 82 },
    { name: 'Exterior',    task: 'Paint, door, landscaping',          cost: '$3,200',  gain: '+$9,500',  roi: 92 },
  ]

  return (
    <section id="preview" className={`${sans} bg-[#0b0e1a] py-24 px-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Product Preview</p>
          <h2 className={`${serif} text-4xl sm:text-5xl text-white mb-4`}>
            Your <em className="text-[#c9a84c] not-italic">renovation dashboard</em> at a glance
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Every room. Every opportunity. One clear view of where to invest your renovation budget.
          </p>
        </div>

        {/* Dashboard card */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-white/10 bg-[#111827] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40 mb-0.5">Property Dashboard</p>
              <p className="text-sm font-semibold text-white">142 Maple Street</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Total investment:</span>
              <span className="text-sm font-bold text-white">$29,600</span>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full">→ +$61,000</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 pt-4 pb-0">
            {['All Rooms', 'Kitchen', 'Bathroom', 'Living Room', 'Exterior'].map((tab, i) => (
              <span
                key={tab}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-default
                  ${i === 0 ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white/60'}`}
              >
                {tab}
              </span>
            ))}
          </div>

          {/* Room rows */}
          <div className="p-6 space-y-3">
            {rooms.map(({ name, task, cost, gain, roi }) => (
              <div key={name} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/8 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white mb-0.5">{name}</p>
                  <p className="text-xs text-white/40 truncate">{task}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-white/40 mb-0.5">Cost</p>
                  <p className="text-sm font-medium text-white">{cost}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-white/40 mb-0.5">Value Gain</p>
                  <p className="text-sm font-semibold text-emerald-400">{gain}</p>
                </div>
                <div className="shrink-0">
                  <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center
                    ${roi >= 90 ? 'bg-emerald-500/20' : roi >= 80 ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                    <span className={`text-sm font-black leading-none
                      ${roi >= 90 ? 'text-emerald-400' : roi >= 80 ? 'text-blue-400' : 'text-purple-400'}`}>
                      {roi}
                    </span>
                    <span className="text-[8px] text-white/30">ROI</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Benefits ─────────────────────────────────────────────────────────────────
function Benefits() {
  const items = [
    { icon: TrendingUp, title: 'Maximize Property Value',   desc: 'Identify the highest-ROI renovations so every dollar you spend generates multiple dollars in value.' },
    { icon: Clock,      title: 'Save Weeks of Research',    desc: 'Get contractor-grade renovation insights in under 2 minutes instead of weeks of consultations.'   },
    { icon: Eye,        title: 'Visualize Before You Build',desc: 'AI-generated images let you see the result before committing budget or talking to a contractor.'  },
    { icon: BarChart3,  title: 'Know Your Numbers',         desc: 'Every suggestion comes with cost estimates and projected value increases — no financial surprises.' },
  ]

  return (
    <section className={`${sans} bg-[#f7f6f2] py-24 px-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Why FlipVision</p>
          <h2 className={`${serif} text-4xl sm:text-5xl text-[#0f0e0b] mb-4`}>
            Every decision <em className="text-[#1a4fff] not-italic">backed by AI</em>
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Stop guessing which renovations matter. Let data drive your investment strategy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-100 p-7 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  return (
    <section id="pricing" className={`${sans} bg-[#0b0e1a] py-24 px-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className={`${serif} text-4xl sm:text-5xl text-white mb-4`}>
            Simple, <em className="text-[#c9a84c] not-italic">transparent</em> pricing
          </h2>
          <p className="text-white/50 max-w-md mx-auto">
            Start for free. Scale as your portfolio grows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-7 transition-all duration-150
                ${plan.highlighted
                  ? 'bg-[#1a4fff] border-2 border-blue-400 shadow-xl shadow-blue-900/40'
                  : 'bg-white/5 border border-white/10'
                }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#c9a84c] text-[#0f0e0b] text-[10px] font-black uppercase tracking-wide">
                    <Star className="w-2.5 h-2.5" /> Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${plan.highlighted ? 'text-blue-200' : 'text-white/40'}`}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-0.5">
                  <span className="text-3xl font-black text-white tracking-tight">{plan.price}</span>
                  {plan.id !== 'free' && <span className={`text-sm mb-1 ${plan.highlighted ? 'text-blue-200' : 'text-white/40'}`}>/ mo</span>}
                </div>
                <p className={`text-xs ${plan.highlighted ? 'text-blue-200' : 'text-white/30'}`}>{plan.billing}</p>
              </div>

              <ul className="space-y-2.5 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className={`flex items-start gap-2 text-xs leading-snug ${plan.highlighted ? 'text-blue-100' : 'text-white/60'}`}>
                    <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${plan.highlighted ? 'text-white' : 'text-emerald-400'}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`block w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-all active:scale-95
                  ${plan.highlighted
                    ? 'bg-white text-[#1a4fff] hover:bg-blue-50'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ───────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className={`${sans} bg-[#0f1220] py-24 px-6 border-t border-white/5`}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className={`${serif} text-4xl sm:text-5xl text-white mb-4`}>
          Turn Any Property Into an{' '}
          <em className="text-[#c9a84c] not-italic">Investment Opportunity</em>
        </h2>
        <p className="text-white/50 mb-10 leading-relaxed">
          Join thousands of investors, flippers, and hosts who use FlipVision AI
          to find profit hidden in plain sight.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#1a4fff] text-white
              font-semibold hover:bg-blue-600 active:scale-95 transition-all shadow-xl shadow-blue-900/40 text-sm"
          >
            Start Free Analysis
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/15
              text-white/80 hover:text-white hover:border-white/30 transition-all text-sm font-medium"
          >
            See How It Works
          </Link>
        </div>
        <p className="text-xs text-white/30">
          Free forever · No credit card required · 2 analyses included
        </p>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  const cols = [
    {
      heading: 'Product',
      links: ['Features', 'Pricing', 'Example Reports', 'API Access'],
    },
    {
      heading: 'Use Cases',
      links: ['House Flipping', 'Airbnb Hosting', 'Real Estate Agents', 'Homeowners'],
    },
    {
      heading: 'Company',
      links: ['About', 'Blog', 'Contact', 'Careers'],
    },
    {
      heading: 'Legal',
      links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
    },
  ]

  return (
    <footer className={`${sans} bg-[#080a12] border-t border-white/5 pt-16 pb-10 px-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#1a4fff] flex items-center justify-center">
                <span className="text-white text-xs font-black">F</span>
              </div>
              <span className="text-white font-semibold text-sm">FlipVision AI</span>
            </div>
            <p className="text-xs text-white/30 leading-relaxed">
              See the profit inside every property. AI-powered renovation intelligence.
            </p>
          </div>

          {/* Link columns */}
          {cols.map(({ heading, links }) => (
            <div key={heading}>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">
                {heading}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <span className="text-sm text-white/40 hover:text-white/70 transition-colors cursor-default">
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/25">© 2025 FlipVision AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/login"  className="text-xs text-white/30 hover:text-white/60 transition-colors">Log In</Link>
            <Link href="/signup" className="text-xs text-white/30 hover:text-white/60 transition-colors">Sign Up</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="font-[family-name:var(--font-dm-sans)]">
      <Nav />
      <Hero />
      <TrustBar />
      <HowItWorks />
      <ProductPreview />
      <Benefits />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  )
}
