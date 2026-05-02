export async function sendWhatsApp({
  to,
  message,
}: {
  to: string
  message: string
}) {
  const token = process.env.FONNTE_TOKEN
  if (!token) {
    console.warn('[whatsapp] FONNTE_TOKEN not set, skipping')
    return { success: false, error: 'FONNTE_TOKEN not configured' }
  }

  try {
    const normalizedPhone = formatPhoneForWA(to)
    if (!normalizedPhone) {
      console.warn('[whatsapp] Invalid phone number, skipping:', to)
      return { success: false, error: 'Invalid phone number' }
    }

    const body = new URLSearchParams({
      target: normalizedPhone,
      message,
      countryCode: '62',
    })

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const data = await response.json()
    console.log('[whatsapp] sent', { to: normalizedPhone, status: data.status, id: data.id })
    return { success: !!data.status, id: data.id, detail: data }
  } catch (err) {
    console.error('[whatsapp] failed', { to, error: err })
    return { success: false, error: err }
  }
}

function formatPhoneForWA(phone: string): string | null {
  if (!phone) return null
  const clean = phone.replace(/\D/g, '')
  if (clean.length < 8) return null
  if (clean.startsWith('0')) return '62' + clean.slice(1)
  if (clean.startsWith('62')) return clean
  if (clean.startsWith('+62')) return clean.slice(1)
  return '62' + clean
}
