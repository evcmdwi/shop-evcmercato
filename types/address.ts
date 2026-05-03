export interface Address {
  id: string
  user_id: string
  recipient_name: string
  phone: string
  province: string
  city: string
  postal_code: string
  full_address: string
  is_default: boolean
  created_at: string
  updated_at: string
  // New region fields (from AddressAutocomplete)
  district_id?: string
  district_name?: string
  regency_id?: string
  regency_name?: string
  province_id?: string
  province_name?: string
}
