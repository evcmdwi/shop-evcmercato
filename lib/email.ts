import { Resend } from 'resend'

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 'placeholder') {
    throw new Error('[email] RESEND_API_KEY not configured')
  }
  return new Resend(apiKey)
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    const resend = getResend()
    const result = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME || 'EVC Mercato'} <${process.env.RESEND_FROM_EMAIL || 'orders@evcmercato.com'}>`,
      to,
      subject,
      html,
    })

    // Check for error in result
    if (result.error) {
      console.error('[email] Resend API error:', result.error)
      return { success: false, error: result.error }
    }

    console.log('[email] sent successfully', { to, subject, id: result.data?.id })
    return { success: true, id: result.data?.id }
  } catch (err) {
    console.error('[email] failed', { to, subject, error: String(err) })
    return { success: false, error: err }
  }
}
