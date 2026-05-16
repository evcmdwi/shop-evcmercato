import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { emitOrderPaid } from '@/lib/events/order-events'
import { setupEventListeners } from '@/lib/events/setup-listeners'
import { notifyCommissionValid } from '@/lib/affiliate/notifications'

// Initialize listeners
setupEventListeners()

interface PaidOrder {
  id: string
  user_id: string
  total_amount: number
  subtotal: number
  shipping_cost: number | null
  shipping_cost_discount: number | null
  shipping_method: string | null
  shipping_recipient_name: string | null
  shipping_phone: string | null
  shipping_full_address: string | null
  shipping_city: string | null
  shipping_province: string | null
  shipping_postal_code: string | null
  points_earned: number | null
  attributed_affiliate_code: string | null
  commission_id: string | null
  notifications_sent: boolean
  points_credited: boolean
  commission_created: boolean
}

export async function GET(req: NextRequest) {
  // Auth: CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const t0 = Date.now()
  const admin = getSupabaseAdmin()

  // Fetch paid orders that still need post-payment processing
  // Wait 10s after paid_at to avoid race with webhook update
  const { data: orders, error: fetchError } = await admin
    .from('orders')
    .select(
      'id, user_id, total_amount, subtotal, shipping_cost, shipping_cost_discount, ' +
      'shipping_method, shipping_recipient_name, shipping_phone, shipping_full_address, ' +
      'shipping_city, shipping_province, shipping_postal_code, ' +
      'points_earned, attributed_affiliate_code, commission_id, ' +
      'notifications_sent, points_credited, commission_created'
    )
    .eq('status', 'paid')
    .or('notifications_sent.eq.false,points_credited.eq.false,commission_created.eq.false')
    .lt('paid_at', new Date(Date.now() - 10_000).toISOString())
    .order('paid_at', { ascending: true })
    .limit(20) as unknown as { data: PaidOrder[] | null; error: { message: string } | null }

  if (fetchError) {
    console.error('[process-paid-orders] fetch error:', fetchError.message)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!orders?.length) {
    return NextResponse.json({ processed: 0, ms: Date.now() - t0 })
  }

  let processed = 0
  let errors = 0

  for (const order of orders) {
    try {
      const orderId = order.id

      // Fetch order_items + user in parallel (reused across all processing steps)
      const [
        { data: items },
        { data: user },
      ] = await Promise.all([
        admin
          .from('order_items')
          .select('product_id, variant_id, product_name, variant_name, quantity, price')
          .eq('order_id', orderId),
        admin
          .from('users')
          .select('name, email, phone, total_points')
          .eq('id', order.user_id)
          .single(),
      ])

      // ─── CREDIT POINTS ───────────────────────────────────────────────────────
      if (!order.points_credited) {
        const basePoints = order.points_earned || Math.floor((order.subtotal || 0) / 1000)

        // Fetch point multipliers in parallel (bonusPromo needs product_ids from items)
        const [{ data: bonusPromo }, { data: extraPromo }] = await Promise.all([
          admin
            .from('point_promos')
            .select('points_multiplier')
            .eq('promo_type', 'purchase_bonus')
            .eq('is_active', true)
            .or(`active_until.is.null,active_until.gt.${new Date().toISOString()}`)
            .in('product_id', (items || []).map(i => i.product_id))
            .order('points_multiplier', { ascending: false })
            .limit(1)
            .maybeSingle(),
          admin
            .from('user_extra_point_promos')
            .select('multiplier')
            .eq('user_id', order.user_id)
            .eq('is_active', true)
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .order('multiplier', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])

        const multiplier = bonusPromo?.points_multiplier || 1.0
        const extraMultiplier = extraPromo?.multiplier || 1.0
        const pointsWithBonus = Math.floor(basePoints * multiplier)
        const extraPoints = Math.floor(basePoints * (Number(extraMultiplier) - 1))
        const totalEarned = pointsWithBonus + extraPoints
        const currentPoints = user?.total_points || 0
        const newTierPoints = currentPoints + pointsWithBonus
        const newTotal = currentPoints + totalEarned

        // Tier based on base+bonus only (not extra)
        const newTier =
          newTierPoints >= 3001 ? 'platinum' : newTierPoints >= 1001 ? 'gold' : 'silver'

        // Update user + insert point_transactions in parallel
        await Promise.all([
          admin
            .from('users')
            .update({ total_points: newTotal, tier: newTier })
            .eq('id', order.user_id),
          pointsWithBonus > 0
            ? admin.from('point_transactions').insert({
                user_id: order.user_id,
                type: 'earned',
                amount: pointsWithBonus,
                balance_after: currentPoints + pointsWithBonus,
                related_order_id: orderId,
                notes: `Pembelian Order #${orderId.slice(0, 8).toUpperCase()}`,
              })
            : Promise.resolve(),
          extraPoints > 0
            ? admin.from('point_transactions').insert({
                user_id: order.user_id,
                type: 'bonus',
                amount: extraPoints,
                balance_after: currentPoints + pointsWithBonus + extraPoints,
                related_order_id: orderId,
                notes: `Extra Point Khusus (${extraMultiplier}x)`,
              })
            : Promise.resolve(),
        ])

        await admin.from('orders').update({ points_credited: true }).eq('id', orderId)

        console.log(
          `[process-paid-orders] points credited: +${totalEarned} → user ${order.user_id} total: ${newTotal}`
        )
      }

      // ─── SEND NOTIFICATIONS ───────────────────────────────────────────────────
      if (!order.notifications_sent) {
        // Re-fetch user to get updated total_points after credit
        const { data: freshUser } = await admin
          .from('users')
          .select('name, email, phone, total_points')
          .eq('id', order.user_id)
          .single()

        const basePoints = order.points_earned || Math.floor((order.subtotal || 0) / 1000)
        const shippingFee = Math.max(
          0,
          (order.shipping_cost || 10_000) - (order.shipping_cost_discount || 0)
        )

        await emitOrderPaid({
          orderId: order.id,
          orderShortId: order.id.slice(0, 8).toUpperCase(),
          customerName: freshUser?.name || 'Customer',
          payerEmail: freshUser?.email || '',
          payerPhone: freshUser?.phone || order.shipping_phone || '',
          totalAmount: order.total_amount,
          items: (items || []).map(item => ({
            product_name: item.variant_name
              ? `${item.product_name} (${item.variant_name})`
              : item.product_name,
            quantity: item.quantity,
            unit_price: item.price,
            subtotal: item.price * item.quantity,
          })),
          subtotal: order.subtotal,
          shipping_fee: shippingFee,
          shipping_address: {
            name: order.shipping_recipient_name || '',
            phone: order.shipping_phone || '',
            address: order.shipping_full_address || '',
            city: order.shipping_city || '',
            province: order.shipping_province || '',
            postal_code: order.shipping_postal_code || '',
          },
          evc_points_earned: basePoints,
          total_points_after: freshUser?.total_points || 0,
          paid_at: new Date().toISOString(),
          shipping_method:
            (order.shipping_method as 'reguler' | 'instan' | 'sameday') || 'reguler',
        })

        await admin.from('orders').update({ notifications_sent: true }).eq('id', orderId)

        console.log(`[process-paid-orders] notifications sent: ${orderId}`)
      }

      // ─── CREATE AFFILIATE COMMISSION ─────────────────────────────────────────
      if (
        !order.commission_created &&
        order.attributed_affiliate_code &&
        !order.commission_id
      ) {
        const { data: aff } = await admin
          .from('affiliates')
          .select('id')
          .eq('affiliate_code', order.attributed_affiliate_code)
          .eq('status', 'approved')
          .single()

        if (aff) {
          let totalPV = 0
          const lineItems: {
            product_variant_id: string
            product_name: string
            variant_name: string
            quantity: number
            pv_per_unit: number
            total_pv: number
          }[] = []

          for (const item of items || []) {
            const { data: variant } = await admin
              .from('product_variants')
              .select('affiliate_pv_value')
              .eq('id', item.variant_id)
              .single()
            const pvPerUnit = variant?.affiliate_pv_value || 0
            totalPV += pvPerUnit * item.quantity
            lineItems.push({
              product_variant_id: item.variant_id,
              product_name: item.product_name,
              variant_name: item.variant_name || '',
              quantity: item.quantity,
              pv_per_unit: pvPerUnit,
              total_pv: pvPerUnit * item.quantity,
            })
          }

          const { data: commission } = await admin
            .from('commissions')
            .insert({
              affiliate_id: aff.id,
              affiliate_code: order.attributed_affiliate_code,
              order_id: orderId,
              user_id: order.user_id,
              order_total: order.total_amount || 0,
              pv_earned: totalPV,
              status: 'pending',
            })
            .select('id')
            .single()

          if (commission?.id) {
            if (lineItems.length > 0) {
              await admin
                .from('commission_line_items')
                .insert(lineItems.map(li => ({ ...li, commission_id: commission.id })))
            }
            await admin
              .from('orders')
              .update({ commission_id: commission.id, commission_created: true })
              .eq('id', orderId)
          }

          console.log(
            `[process-paid-orders] commission created: ${orderId} | code: ${order.attributed_affiliate_code} | PV: ${totalPV}`
          )

          // Send WA notif to affiliate about new valid order
          if (commission?.id) {
            notifyCommissionValid(commission.id).catch(e =>
              console.error('[process-paid-orders] affiliate notif error:', e)
            )
          }
        } else {
          // No valid affiliate — mark done so we don't retry forever
          await admin.from('orders').update({ commission_created: true }).eq('id', orderId)
        }
      } else if (!order.commission_created) {
        // No affiliate code on order — mark done
        await admin.from('orders').update({ commission_created: true }).eq('id', orderId)
      }

      processed++
    } catch (err) {
      console.error('[process-paid-orders] order failed:', order.id, err)
      errors++
    }
  }

  const ms = Date.now() - t0
  console.log('[process-paid-orders] done', { processed, errors, ms })
  return NextResponse.json({ processed, errors, ms })
}
