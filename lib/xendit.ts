interface CreateInvoiceParams {
  external_id: string
  amount: number
  description: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  success_redirect_url: string
  failure_redirect_url: string
}

interface InvoiceResult {
  id: string
  invoice_url: string
}

export async function createInvoice(params: CreateInvoiceParams): Promise<InvoiceResult> {
  if (!process.env.XENDIT_SECRET_KEY) {
    // STUB MODE — return mock untuk testing
    console.log('[Xendit STUB] createInvoice:', params)
    return {
      id: 'mock_inv_' + Date.now(),
      invoice_url: params.success_redirect_url + '?mock=1',
    }
  }

  // Real implementation (akan diaktifkan saat XENDIT_SECRET_KEY di-set)
  const response = await fetch('https://api.xendit.co/v2/invoices', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_id: params.external_id,
      amount: params.amount,
      description: params.description,
      invoice_duration: 86400,
      customer: {
        given_names: params.customer_name,
        email: params.customer_email,
        mobile_number: params.customer_phone,
      },
      success_redirect_url: params.success_redirect_url,
      failure_redirect_url: params.failure_redirect_url,
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error('Xendit error: ' + JSON.stringify(err))
  }

  const data = await response.json()
  return { id: data.id, invoice_url: data.invoice_url }
}
