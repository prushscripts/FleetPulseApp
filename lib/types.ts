export type UserRole = 'owner' | 'manager' | 'driver' | string

export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole | null
  company_id: string | null
  territory: string | null
}

