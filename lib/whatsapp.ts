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

  const normalizedPhone = formatPhoneForWA(to)
  if (!normalizedPhone) {
    console.warn('[whatsapp] Invalid phone number, skipping:', to)
    return { success: false, error: 'Invalid phone number' }
  }

  const MAX_RETRIES = 3
  const RETRY_DELAYS = [500, 1000, 2000]

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt - 1]))
        console.log(`[whatsapp] retry attempt ${attempt + 1}/${MAX_RETRIES} for ${normalizedPhone}`)
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

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
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseText = await response.text()
      let data: any = {}
      try {
        data = JSON.parse(responseText)
      } catch {
        console.warn('[whatsapp] Non-JSON response:', responseText.slice(0, 200))
      }

      if (!response.ok) {
        console.error('[whatsapp] HTTP error:', response.status, responseText.slice(0, 200))
        if (attempt < MAX_RETRIES - 1) continue
        return { success: false, error: `HTTP ${response.status}` }
      }

      console.log('[whatsapp] sent OK', { to: normalizedPhone, status: data.status, id: data.id })
      return { success: true, id: data.id, detail: data }

    } catch (err: any) {
      const isRetryable = err?.cause?.code === 'ECONNRESET' ||
                         err?.cause?.code === 'ECONNREFUSED' ||
                         err?.name === 'AbortError'

      console.error(`[whatsapp] attempt ${attempt + 1} failed:`, {
        to: normalizedPhone,
        error: err?.message,
        cause: err?.cause?.code,
        retryable: isRetryable
      })

      if (!isRetryable || attempt === MAX_RETRIES - 1) {
        return { success: false, error: err }
      }
    }
  }

  return { success: false, error: 'Max retries exceeded' }
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
