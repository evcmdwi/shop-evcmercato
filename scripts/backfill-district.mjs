/**
 * Backfill addresses.district and orders.shipping_district_name
 * where values are null but district_id exists.
 *
 * Run: node scripts/backfill-district.mjs
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wetmalavmkokmosrawez.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY env var required')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function backfillAddresses() {
  console.log('--- Backfill addresses.district ---')
  const { data: addrs, error } = await admin
    .from('addresses')
    .select('id, district_id')
    .is('district', null)
    .not('district_id', 'is', null)

  if (error) { console.error('Error fetching addresses:', error); return }
  console.log(`Found ${addrs?.length ?? 0} addresses to backfill`)

  for (const addr of addrs ?? []) {
    const { data: d } = await admin.from('districts').select('name').eq('id', addr.district_id).single()
    if (d?.name) {
      const { error: upErr } = await admin.from('addresses').update({ district: d.name }).eq('id', addr.id)
      if (upErr) console.error(`  Failed addr ${addr.id}:`, upErr.message)
      else console.log(`  ✅ addr ${addr.id} → ${d.name}`)
    } else {
      console.log(`  ⚠️ No district found for district_id ${addr.district_id}`)
    }
  }
}

async function backfillOrders() {
  console.log('--- Backfill orders.shipping_district_name ---')
  const { data: orders, error } = await admin
    .from('orders')
    .select('id, shipping_address_id')
    .is('shipping_district_name', null)
    .not('shipping_address_id', 'is', null)

  if (error) { console.error('Error fetching orders:', error); return }
  console.log(`Found ${orders?.length ?? 0} orders to backfill`)

  for (const order of orders ?? []) {
    const { data: addr } = await admin
      .from('addresses')
      .select('district, district_id')
      .eq('id', order.shipping_address_id)
      .single()

    let districtName = addr?.district ?? null
    if (!districtName && addr?.district_id) {
      const { data: d } = await admin.from('districts').select('name').eq('id', addr.district_id).single()
      districtName = d?.name ?? null
    }

    if (districtName) {
      const { error: upErr } = await admin
        .from('orders')
        .update({ shipping_district_name: districtName })
        .eq('id', order.id)
      if (upErr) console.error(`  Failed order ${order.id}:`, upErr.message)
      else console.log(`  ✅ order ${order.id} → ${districtName}`)
    } else {
      console.log(`  ⚠️ No district for order ${order.id} (addr ${order.shipping_address_id})`)
    }
  }
}

await backfillAddresses()
await backfillOrders()
console.log('Backfill done.')
