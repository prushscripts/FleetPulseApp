export type ChecklistItem = {
  id: string
  category: string
  label: string
  required: boolean
}

/** Pre-trip only: Exterior 6 + Interior 6 (matches web driver inspection). */
export const INSPECTION_ITEMS: ChecklistItem[] = [
  { id: 'ext-1', category: 'Exterior', label: 'Headlights & taillights working', required: true },
  { id: 'ext-2', category: 'Exterior', label: 'Turn signals & hazards working', required: true },
  { id: 'ext-3', category: 'Exterior', label: 'Tires — no visible damage or low pressure', required: true },
  { id: 'ext-4', category: 'Exterior', label: 'No new body damage', required: true },
  { id: 'ext-5', category: 'Exterior', label: 'Mirrors clean and properly adjusted', required: true },
  { id: 'ext-6', category: 'Exterior', label: 'Windshield — no cracks or obstructions', required: true },
  { id: 'int-1', category: 'Interior', label: 'Brakes feel normal', required: true },
  { id: 'int-2', category: 'Interior', label: 'Steering feels normal', required: true },
  { id: 'int-3', category: 'Interior', label: 'Horn works', required: true },
  { id: 'int-4', category: 'Interior', label: 'Seatbelt works', required: true },
  { id: 'int-5', category: 'Interior', label: 'No warning lights on dashboard', required: true },
  { id: 'int-6', category: 'Interior', label: 'Wipers working', required: true },
]
