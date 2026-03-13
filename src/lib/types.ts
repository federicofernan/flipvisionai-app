export type RoomType =
  | 'kitchen'
  | 'bathroom'
  | 'living_room'
  | 'bedroom'
  | 'exterior'
  | 'other'

export interface Property {
  id: string
  name: string | null
  address: string
  created_at: string
  photo_count?: number
  cover_image_url?: string | null
}

export interface PropertyPhoto {
  id: string
  property_id: string
  storage_path: string
  public_url: string
  room_type: RoomType
  file_name: string
  created_at: string
}

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  kitchen: 'Kitchen',
  bathroom: 'Bathroom',
  living_room: 'Living Room',
  bedroom: 'Bedroom',
  exterior: 'Exterior',
  other: 'Other',
}

export const ROOM_TYPES: RoomType[] = [
  'kitchen',
  'bathroom',
  'living_room',
  'bedroom',
  'exterior',
  'other',
]
