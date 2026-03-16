/** Supported listing sources */
export type ListingSource = 'zillow' | 'redfin'

const ZILLOW_RE = /^https?:\/\/(www\.)?zillow\.com\/homedetails\//i
const REDFIN_RE = /^https?:\/\/(www\.)?redfin\.com\/(.*\/homes\/|.*-)\d+/i

/**
 * Returns true if the URL matches a known Zillow or Redfin listing pattern.
 */
export function isValidListingUrl(url: string): boolean {
  return ZILLOW_RE.test(url) || REDFIN_RE.test(url)
}

/**
 * Detects the listing source from a URL.
 * Throws if the URL is not a recognised listing.
 */
export function detectSource(url: string): ListingSource {
  if (ZILLOW_RE.test(url)) return 'zillow'
  if (REDFIN_RE.test(url)) return 'redfin'
  throw new Error('URL must be a Zillow (zillow.com/homedetails/…) or Redfin (redfin.com/…) listing.')
}

/**
 * Returns a user-friendly validation message, or null if the URL is valid.
 */
export function validateListingUrl(url: string): string | null {
  if (!url.trim()) return 'Please enter a listing URL.'
  try {
    new URL(url)
  } catch {
    return 'Please enter a valid URL.'
  }
  if (!isValidListingUrl(url)) {
    return 'URL must be a Zillow (zillow.com/homedetails/…) or Redfin (redfin.com/…) listing.'
  }
  return null
}
