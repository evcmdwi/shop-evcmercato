import { sendWhatsApp } from '@/lib/whatsapp'
import { sendEmail } from '@/lib/email'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  generateAffiliateApprovedWA,
  generateAffiliateRejectedWA,
  generateAffiliateNewMemberWA,
  generateAffiliateOrderValidWA,
  generateAffiliateSuspendedWA,
} from '@/lib/whatsapp-templates/affiliate'
import {
  generateAffiliateApprovedEmail,
  generateAffiliateRejectedEmail,
  generateAffiliateSuspendedEmail,
} from '@/lib/email-templates/affiliate'

// Helper: get user phone + email from users table
async function getUserContact(userId: string): Promise<{ phone: string | null; email: string | null; name: string }> {
  const admin = getSupabaseAdmin()
  const { data } = await admin.from('users').select('phone, email, name').eq('id', userId).single()
  return { phone: data?.phone || null, email: data?.email || null, name: data?.name || 'Member' }
}

// Helper: insert in-app notification
async function insertNotification(userId: string, type: string, title: string, body: string, metadata?: object) {
  const admin = getSupabaseAdmin()
  await admin.from('notifications').insert({ user_id: userId, type, title, body, metadata: metadata || null })
}

export async function notifyAffiliateApproved(affiliateId: string, customNotes?: string) {
  const admin = getSupabaseAdmin()
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('user_id, full_name_kkd, affiliate_code')
    .eq('id', affiliateId)
    .single()
  if (!affiliate) return

  const { phone, email, name } = await getUserContact(affiliate.user_id)
  const waMsg = generateAffiliateApprovedWA(affiliate.full_name_kkd || name, affiliate.affiliate_code!, customNotes)

  if (phone) await sendWhatsApp({ to: phone, message: waMsg }).catch(console.error)
  if (email) {
    const { subject, html } = generateAffiliateApprovedEmail(affiliate.full_name_kkd || name, affiliate.affiliate_code!, customNotes)
    await sendEmail({ to: email, subject, html }).catch(console.error)
  }
  await insertNotification(
    affiliate.user_id,
    'affiliate.approved',
    'Pengajuan Affiliate Disetujui! 🎉',
    `Kode affiliate Anda: ${affiliate.affiliate_code}`,
    { affiliate_code: affiliate.affiliate_code }
  )
}

export async function notifyAffiliateRejected(affiliateId: string, reason: string) {
  const admin = getSupabaseAdmin()
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('user_id, full_name_kkd')
    .eq('id', affiliateId)
    .single()
  if (!affiliate) return

  const { phone, email, name } = await getUserContact(affiliate.user_id)
  const waMsg = generateAffiliateRejectedWA(affiliate.full_name_kkd || name, reason)

  if (phone) await sendWhatsApp({ to: phone, message: waMsg }).catch(console.error)
  if (email) {
    const { subject, html } = generateAffiliateRejectedEmail(affiliate.full_name_kkd || name, reason)
    await sendEmail({ to: email, subject, html }).catch(console.error)
  }
  await insertNotification(
    affiliate.user_id,
    'affiliate.rejected',
    'Update Pengajuan Affiliate',
    reason,
    { reason }
  )
}

export async function notifyNewReferralMember(affiliateCode: string, newUserId: string) {
  const admin = getSupabaseAdmin()
  // Get affiliate user
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('user_id, full_name_kkd')
    .eq('affiliate_code', affiliateCode)
    .single()
  if (!affiliate) return

  // Get new member first name
  const { data: newUser } = await admin.from('users').select('name').eq('id', newUserId).single()
  const memberName = newUser?.name || 'Member'
  const parts = memberName.split(' ')
  const firstName = parts[0]
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] : ''

  const { phone } = await getUserContact(affiliate.user_id)
  const waMsg = generateAffiliateNewMemberWA(affiliate.full_name_kkd, firstName, lastInitial)

  if (phone) await sendWhatsApp({ to: phone, message: waMsg }).catch(console.error)
  await insertNotification(
    affiliate.user_id,
    'affiliate.new_member',
    'Member Baru! ✨',
    `${firstName} ${lastInitial}. bergabung via link Anda`
  )
}

export async function notifyCommissionValid(commissionId: string) {
  const admin = getSupabaseAdmin()
  const { data: commission } = await admin
    .from('commissions')
    .select('affiliate_id, affiliate_code, pv_earned, order_id')
    .eq('id', commissionId)
    .single()
  if (!commission) return

  const { data: affiliate } = await admin
    .from('affiliates')
    .select('user_id, lifetime_pv')
    .eq('id', commission.affiliate_id)
    .single()
  if (!affiliate) return

  // Get buyer info for masking
  const { data: order } = await admin
    .from('orders')
    .select('shipping_recipient_name')
    .eq('id', commission.order_id)
    .single()
  const buyerName = order?.shipping_recipient_name || 'Member'
  const parts = buyerName.split(' ')
  const firstName = parts[0]
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] : ''

  const { phone } = await getUserContact(affiliate.user_id)
  const waMsg = generateAffiliateOrderValidWA(
    '',
    commission.order_id.slice(0, 8).toUpperCase(),
    firstName,
    lastInitial,
    commission.pv_earned,
    affiliate.lifetime_pv
  )

  if (phone) await sendWhatsApp({ to: phone, message: waMsg }).catch(console.error)
  await insertNotification(
    affiliate.user_id,
    'affiliate.order_valid',
    'PV Baru! 🎉',
    `${commission.pv_earned} PV dari order #${commission.order_id.slice(0, 8).toUpperCase()}`,
    { commission_id: commissionId, pv_earned: commission.pv_earned, order_id: commission.order_id }
  )
}

export async function notifyAffiliateSuspended(affiliateId: string, reason: string) {
  const admin = getSupabaseAdmin()
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('user_id, full_name_kkd')
    .eq('id', affiliateId)
    .single()
  if (!affiliate) return

  const { phone, email, name } = await getUserContact(affiliate.user_id)
  const waMsg = generateAffiliateSuspendedWA(affiliate.full_name_kkd || name, reason)

  if (phone) await sendWhatsApp({ to: phone, message: waMsg }).catch(console.error)
  if (email) {
    const { subject, html } = generateAffiliateSuspendedEmail(affiliate.full_name_kkd || name, reason)
    await sendEmail({ to: email, subject, html }).catch(console.error)
  }
  await insertNotification(
    affiliate.user_id,
    'affiliate.suspended',
    'Akun Affiliate Disuspend ⚠️',
    reason,
    { reason }
  )
}
