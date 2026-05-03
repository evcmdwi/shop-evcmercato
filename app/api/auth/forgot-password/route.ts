import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 'placeholder') {
    throw new Error('[forgot-password] RESEND_API_KEY not configured')
  }
  return new Resend(apiKey)
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email tidak valid' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Langsung generate link — kalau user tidak exist, Supabase return error (silently ignored)
    // Anti-enumeration tetap terjaga karena kita selalu return success
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: email.toLowerCase(),
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.evcmercato.com'}/reset-password`,
      },
    })

    if (!error && data?.properties?.action_link) {
      const resetLink = data.properties.action_link

      try {
        const resend = getResend()
        await resend.emails.send({
          from: 'Evie EVC <evie@send.evcmercato.com>',
          to: email,
          subject: 'Reset Password - EVC Mercato',
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: system-ui, sans-serif; background: #f5f5f5; padding: 40px 20px;">
              <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <img src="https://shop.evcmercato.com/logo-evcmercato.jpg" alt="EVC Mercato" style="height: 48px; width: auto;" />
                </div>
                <h2 style="color: #1a2332; margin-bottom: 8px;">Reset Password</h2>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                  Kamu menerima email ini karena ada permintaan reset password untuk akun EVC Mercato kamu.
                  Klik tombol di bawah untuk membuat password baru.
                </p>
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${resetLink}"
                     style="display: inline-block; background: #7FB300; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px;">
                    Reset Password Sekarang
                  </a>
                </div>
                <p style="color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.6;">
                  Link ini berlaku selama 1 jam. Jika kamu tidak meminta reset password, abaikan email ini.<br/>
                  Butuh bantuan? Chat dengan <strong>Evie</strong> di <a href="https://t.me/evie_evc_bot" style="color: #7FB300;">t.me/evie_evc_bot</a>
                </p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  &copy; 2026 EVC Mercato &middot; shop.evcmercato.com
                </p>
              </div>
            </body>
            </html>
          `,
        })
      } catch (emailErr) {
        console.error('[forgot-password] email send failed:', emailErr)
        // Don't throw — still return success to prevent enumeration
      }
    } else if (error) {
      console.error('[forgot-password] generateLink error:', error)
    }

    // Always return success (prevent email enumeration)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ success: true })
  }
}
