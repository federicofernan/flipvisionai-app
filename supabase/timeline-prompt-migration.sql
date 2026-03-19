-- FlipVision AI — Timeline prompt + renovation_analysis update
-- Run this in your Supabase SQL Editor

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Patch renovation_analysis to include the {{timeline_analysis}} placeholder
--    Safe to run multiple times (only applies if placeholder is not yet present)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE prompts
SET content = replace(
  content,
  'The rooms being analyzed are: {{rooms}}.',
  'The rooms being analyzed are: {{rooms}}.

{{timeline_analysis}}'
)
WHERE name = 'renovation_analysis'
  AND content NOT LIKE '%{{timeline_analysis}}%';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Insert timeline_analysis prompt
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO prompts (name, description, content) VALUES (
  'timeline_analysis',
  'Appended to renovation_analysis when the user requests a project timeline. Instructs the AI to generate phase-by-phase schedule with holding cost calculation.',
  'TIMELINE GENERATION RULES
Generate a realistic project timeline based on the renovation scope identified.
Phases must be ordered logically (demo before finish work, rough-ins before drywall, etc.).
Account for dry times, inspection waits, and contractor scheduling gaps.
Assume a single general contractor managing subcontractors (not owner-builder DIY).
Base durations on US contractor availability in a normal (non-peak) market.

PHASE ORDER LOGIC (follow this sequence when applicable):
1. Planning & Permits
2. Demo & Structural
3. Rough-In (Plumbing, Electrical, HVAC)
4. Inspections
5. Insulation & Drywall
6. Flooring (subfloor/prep)
7. Cabinetry & Millwork
8. Tile Work
9. Painting
10. Fixture & Appliance Installation
11. Finish Flooring (hardwood, LVP, carpet)
12. Final Touches & Punch List
13. Final Inspection & CO (if applicable)

Only include phases that are relevant to the renovations identified.
If a room has only cosmetic work (paint, fixtures), skip structural phases.

Each phase must include:
- A start_week (integer, week number from project start)
- A duration_weeks (integer, minimum 1)
- The rooms affected in that phase
- A holding_cost_note only on the last phase (total weeks x daily holding cost)

HOLDING COST ASSUMPTION
Assume $85/day holding cost (mortgage + taxes + insurance) unless the scope suggests a higher-value property, in which case use $150/day.
Calculate total holding cost as: total_duration_weeks x 7 x daily_rate.

Add the following field to the root JSON object, after grand_total:
"project_timeline": {
  "total_duration_weeks": 0,
  "daily_holding_cost": 85,
  "total_holding_cost": 0,
  "phases": [
    {
      "phase_number": 1,
      "phase_name": "Planning & Permits",
      "start_week": 1,
      "duration_weeks": 1,
      "rooms_affected": ["kitchen", "bathroom"],
      "description": "Brief description of what happens in this phase",
      "dependencies": "What must be completed before this phase starts (empty string for phase 1)",
      "notes": "Optional: inspection waits, lead times, or scheduling notes"
    }
  ]
}'
) ON CONFLICT (name) DO UPDATE
  SET content     = EXCLUDED.content,
      description = EXCLUDED.description,
      updated_at  = now();
