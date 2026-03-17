import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/dashboard', '/account', '/property/', '/reports', '/property-analysis'],
      },
    ],
    sitemap: 'https://flipvisionai.com/sitemap.xml',
  }
}
