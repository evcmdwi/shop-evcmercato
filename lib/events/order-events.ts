export interface OrderPaidPayload {
  orderId: string
  orderShortId: string
  customerName: string
  payerEmail: string
  payerPhone: string
  totalAmount: number
  items: Array<{
    product_name: string
    quantity: number
    unit_price: number
    subtotal: number
  }>
  subtotal: number
  shipping_fee: number
  shipping_address: {
    name: string
    phone: string
    address: string
    city: string
    province: string
    postal_code: string
  }
  evc_points_earned: number
  total_points_after?: number
  paid_at: string
  shipping_method?: 'reguler' | 'instan' | 'sameday'
}

type Listener<T> = (payload: T) => Promise<void>

const orderPaidListeners: Listener<OrderPaidPayload>[] = []
const orderExpiredListeners: Listener<{ orderId: string }>[] = []

export function subscribeToOrderPaid(listener: Listener<OrderPaidPayload>) {
  orderPaidListeners.push(listener)
}

export function subscribeToOrderExpired(listener: Listener<{ orderId: string }>) {
  orderExpiredListeners.push(listener)
}

export async function emitOrderPaid(payload: OrderPaidPayload) {
  const results = await Promise.allSettled(
    orderPaidListeners.map(async (listener) => {
      try {
        await listener(payload)
      } catch (err) {
        console.error('[event] order.paid listener failed:', err)
        throw err
      }
    })
  )
  const failed = results.filter(r => r.status === 'rejected')
  if (failed.length > 0) {
    console.warn(`[event] ${failed.length}/${orderPaidListeners.length} order.paid listeners failed`)
  }
}

export interface OrderStatusChangePayload {
  orderId: string
  orderShortId: string
  customerName: string
  payerPhone: string
  status: string
  courier?: string
  trackingNumber?: string
  deliveredNote?: string
}

const orderProcessedListeners: Listener<OrderStatusChangePayload>[] = []
const orderShippedListeners: Listener<OrderStatusChangePayload>[] = []
const orderDeliveredListeners: Listener<OrderStatusChangePayload>[] = []

export function subscribeToOrderProcessed(l: Listener<OrderStatusChangePayload>) { orderProcessedListeners.push(l) }
export function subscribeToOrderShipped(l: Listener<OrderStatusChangePayload>) { orderShippedListeners.push(l) }
export function subscribeToOrderDelivered(l: Listener<OrderStatusChangePayload>) { orderDeliveredListeners.push(l) }

export async function emitOrderProcessed(p: OrderStatusChangePayload) {
  await Promise.allSettled(orderProcessedListeners.map(l => l(p).catch(e => console.error(e))))
}
export async function emitOrderShipped(p: OrderStatusChangePayload) {
  await Promise.allSettled(orderShippedListeners.map(l => l(p).catch(e => console.error(e))))
}
export async function emitOrderDelivered(p: OrderStatusChangePayload) {
  await Promise.allSettled(orderDeliveredListeners.map(l => l(p).catch(e => console.error(e))))
}

export async function emitOrderExpired(orderId: string) {
  await Promise.allSettled(
    orderExpiredListeners.map(listener => listener({ orderId }))
  )
}
