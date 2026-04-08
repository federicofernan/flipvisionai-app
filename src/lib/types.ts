export type RoomType =
  | 'kitchen'
  | 'half_bathroom'
  | 'full_bathroom'
  | 'master_bathroom'
  | 'living_room'
  | 'bedroom'
  | 'exterior'
  | 'backyard'
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
  kitchen:         'Kitchen',
  half_bathroom:   'Half Bathroom',
  full_bathroom:   'Full Bathroom',
  master_bathroom: 'Master Bathroom',
  living_room:     'Living Room',
  bedroom:         'Bedroom',
  exterior:        'Exterior',
  backyard:        'Backyard',
  other:           'Other',
}

export const ROOM_TYPES: RoomType[] = [
  'kitchen',
  'half_bathroom',
  'full_bathroom',
  'master_bathroom',
  'living_room',
  'bedroom',
  'exterior',
  'backyard',
  'other',
]

// ── Renovation style ─────────────────────────────────────────────────────────
export interface RenovationStyle {
  id: string
  name: string
  label: string
  description: string
}

// ── AI analysis report shape ─────────────────────────────────────────────────
export interface RenovationItem {
  area: string
  recommendation: string
  priority: 'High' | 'Medium' | 'Low'
  roi_impact: 'High' | 'Medium' | 'Low'
}

export interface CostLineItem {
  task: string
  materials_low: number
  materials_high: number
  labor_low: number
  labor_high: number
  total_low: number
  total_high: number
}

export interface RoomCostEstimate {
  line_items: CostLineItem[]
  room_total: {
    total_low: number
    total_high: number
  }
}

export interface RoomAnalysis {
  room_type: RoomType
  room_label: string
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor'
  issues: string[]
  renovations: RenovationItem[]
  cost_estimate?: RoomCostEstimate
}

export interface TimelinePhase {
  phase_number: number
  phase_name: string
  start_week: number
  duration_weeks: number
  rooms_affected: string[]
  description: string
  dependencies: string
  notes?: string
}

export interface ProjectTimeline {
  total_duration_weeks: number
  daily_holding_cost: number
  total_holding_cost: number
  phases: TimelinePhase[]
}

export interface AnalysisReport {
  overall_assessment: {
    condition: string
    summary: string
  }
  rooms: RoomAnalysis[]
  top_priorities: {
    renovation: string
    reason: string
    roi_impact: 'High' | 'Medium' | 'Low'
  }[]
  investment_potential: {
    rating: 'Low' | 'Medium' | 'High'
    summary: string
  }
  grand_total?: {
    total_low: number
    total_high: number
  }
  project_timeline?: ProjectTimeline
}
