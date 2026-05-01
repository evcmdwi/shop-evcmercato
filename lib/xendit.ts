interface XenditInvoiceItem {
  name: string
  quantity: number
  price: number
  category?: string
}

interface CreateInvoiceParams {
  external_id: string
  amount: number
  payer_email: string
  description: string
  items: XenditInvoiceItem[]
  success_redirect_url: string
  failure_redirect_url: string
  customer_name: string
  customer_phone?: string
}

interface XenditInvoiceResponse {
  id: string
  invoice_url: string
  external_id: string
  status: string
}

export async function createInvoice(params: CreateInvoiceParams): Promise<XenditInvoiceResponse> {
  const secretKey = process.env.XENDIT_SECRET_KEY

  // STUB MODE — jika tidak ada key (dev/test)
  if (!secretKey) {
    console.log('[Xendit STUB] createInvoice:', params.external_id)
    return {
      id: 'mock_inv_' + Date.now(),
      invoice_url: params.success_redirect_url + '?mock=1',
      external_id: params.external_id,
      status: 'PENDING',
    }
  }

  const authHeader = 'Basic ' + Buffer.from(secretKey + ':').toString('base64')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

  try {
    const response = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: params.external_id,
        amount: params.amount,
        payer_email: params.payer_email,
        description: params.description,
        items: params.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          category: item.category || 'Produk Kesehatan Wanita',
        })),
        success_redirect_url: params.success_redirect_url,
        failure_redirect_url: params.failure_redirect_url,
        invoice_duration: 86400,
        currency: 'IDR',
        customer: {
          given_names: params.customer_name,
          email: params.payer_email,
          mobile_number: params.customer_phone,
        },
        customer_notification_preference: {
          invoice_created: ['email'],
          invoice_reminder: ['email'],
          invoice_paid: ['email'],
        },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('[Xendit] createInvoice failed:', response.status, error)
      throw new Error(`Xendit error ${response.status}: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    return {
      id: data.id,
      invoice_url: data.invoice_url,
      external_id: data.external_id,
      status: data.status,
    }
  } finally {
    clearTimeout(timeout)
  }
}
