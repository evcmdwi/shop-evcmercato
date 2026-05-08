// ═══════════════════════════════════════════════════════════════════
// EVC Affiliate Program — TypeScript Types
// Generated: 8 Mei 2026
// ═══════════════════════════════════════════════════════════════════

export type AffiliateStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'terminated'
export type UserRole = 'customer' | 'admin_evc' | 'super_admin'
export type CommissionStatus = 'pending' | 'valid' | 'settled' | 'voided' | 'owed_back'
export type ShortLinkType = 'homepage' | 'product' | 'category'

export interface Affiliate {
  id: string
  user_id: string
  affiliate_code: string | null
  full_name_kkd: string
  kki_member_id: string
  director_leader: string
  whatsapp: string
  email: string
  status: AffiliateStatus
  rejected_reason?: string
  suspended_reason?: string
  suspended_at?: string
  applied_at: string
  approved_at?: string
  show_in_leaderboard: boolean
  lifetime_pv: number
  lifetime_orders: number
  lifetime_members: number
  created_at: string
  updated_at: string
}

export interface AffiliateChannel {
  id: string
  affiliate_id: string
  platform: 'instagram' | 'tiktok' | 'facebook' | 'whatsapp_status' | 'youtube' | 'telegram' | 'website' | 'other'
  link_or_username?: string
  created_at: string
}

export interface ShortLink {
  id: string
  short_code: string
  affiliate_id: string
  link_type: ShortLinkType
  target_id?: string
  target_url: string
  click_count: number
  last_clicked_at?: string
  status: 'active' | 'disabled'
  created_at: string
}

export interface ReferralClick {
  id: string
  short_link_id: string
  affiliate_code: string
  ip_address?: string
  user_agent?: string
  fingerprint_hash?: string
  session_id?: string
  converted_to_user_id?: string
  converted_to_order_id?: string
  clicked_at: string
}

export interface Commission {
  id: string
  affiliate_id: string
  affiliate_code: string
  order_id: string
  user_id: string
  order_total: number
  pv_earned: number
  status: CommissionStatus
  order_delivered_at?: string
  valid_at?: string
  settled_at?: string
  settlement_id?: string
  voided_reason?: string
  created_at: string
  updated_at: string
}

export interface CommissionLineItem {
  id: string
  commission_id: string
  product_variant_id?: string
  product_name: string
  variant_name?: string
  quantity: number
  pv_per_unit: number
  total_pv: number
}

export interface Settlement {
  id: string
  period_label: string
  period_start: string
  period_end: string
  settlement_date: string
  total_affiliates: number
  total_orders: number
  total_pv: number
  excel_path?: string
  csv_path?: string
  status: 'preview' | 'finalized'
  generated_at?: string
  created_at: string
}

export interface SettlementDetail {
  id: string
  settlement_id: string
  affiliate_id: string
  affiliate_code: string
  affiliate_name: string
  kki_member_id: string
  total_orders: number
  total_pv: number
  owed_back_pv: number
  net_pv: number
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  metadata?: Record<string, unknown>
  channels_sent?: {
    wa?: boolean
    email?: boolean
    in_app?: boolean
  }
  read_at?: string
  created_at: string
}

export interface KkiConversion {
  id: string
  user_id: string
  kki_member_id: string
  sponsor_affiliate_code?: string
  conversion_date: string
  recorded_by_user_id?: string
  notes?: string
  created_at: string
}
