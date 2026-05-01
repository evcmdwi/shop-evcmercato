import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
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
    console.log('[email] sent', { to, subject, id: result.data?.id })
    return { success: true, id: result.data?.id }
  } catch (err) {
    console.error('[email] failed', { to, subject, error: err })
    return { success: false, error: err }
  }
}
