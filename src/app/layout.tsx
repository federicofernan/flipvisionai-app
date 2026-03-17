import type { Metadata } from 'next'
import { Inter, Instrument_Serif, DM_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const BASE_URL = 'https://flipvisionai.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: 'FlipVision AI — See the Profit Inside Every Property',
    template: '%s | FlipVision AI',
  },

  description:
    'Upload property photos and let AI reveal the renovations that increase value — with cost estimates, ROI scores, and before/after visualizations. Used by house flippers, real estate investors, and Airbnb hosts.',

  keywords: [
    'house flipping AI',
    'property renovation analysis',
    'real estate investment tool',
    'renovation ROI calculator',
    'AI renovation planner',
    'property value estimator',
    'flip property software',
    'real estate AI',
    'home renovation cost estimator',
    'investment property analyzer',
  ],

  authors: [{ name: 'FlipVision AI', url: BASE_URL }],
  creator: 'FlipVision AI',
  publisher: 'FlipVision AI',

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'FlipVision AI',
    title: 'FlipVision AI — See the Profit Inside Every Property',
    description:
      'AI-powered renovation intelligence. Upload photos, get instant cost estimates, ROI scores, and visualizations for any property.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FlipVision AI — AI-powered renovation analysis for real estate investors',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    site: '@flipvisionai',
    creator: '@flipvisionai',
    title: 'FlipVision AI — See the Profit Inside Every Property',
    description:
      'AI-powered renovation intelligence. Upload photos, get instant cost estimates, ROI scores, and visualizations.',
    images: ['/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
  },

  category: 'technology',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} ${dmSans.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
