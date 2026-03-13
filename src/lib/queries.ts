import { createClient } from './supabase/client'
import { Property, PropertyPhoto } from './types'

export async function fetchProperties(): Promise<Property[]> {
  const supabase = createClient()

  // Fetch properties
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!properties?.length) return []

  // Fetch photo counts + first photo per property for cover image
  const ids = properties.map((p) => p.id)

  const { data: photos } = await supabase
    .from('property_photos')
    .select('property_id, public_url')
    .in('property_id', ids)
    .order('created_at', { ascending: true })

  const countMap: Record<string, number>  = {}
  const coverMap: Record<string, string>  = {}

  for (const photo of photos ?? []) {
    countMap[photo.property_id] = (countMap[photo.property_id] ?? 0) + 1
    if (!coverMap[photo.property_id]) {
      coverMap[photo.property_id] = photo.public_url
    }
  }

  return properties.map((p) => ({
    ...p,
    photo_count:      countMap[p.id] ?? 0,
    cover_image_url:  coverMap[p.id] ?? null,
  }))
}

export async function fetchProperty(id: string): Promise<Property | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function fetchPropertyPhotos(propertyId: string): Promise<PropertyPhoto[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('property_photos')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}
