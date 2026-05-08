export function generateAffiliateApprovedEmail(
  customerName: string,
  affiliateCode: string,
  customNotes?: string
): { subject: string; html: string } {
  const subject = 'Pengajuan Affiliate Disetujui 🎉'

  const notesSection = customNotes?.trim()
    ? `<div style="background-color: #f0f7e6; border-left: 4px solid #7FB300; padding: 12px 16px; margin-top: 16px; border-radius: 4px;">
        <p style="margin: 0; color: #555; font-size: 14px;"><strong>📝 Catatan dari admin:</strong><br>${customNotes.trim()}</p>
      </div>`
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; max-width: 600px; width: 100%;">

        <!-- Header -->
        <tr><td style="background-color: #7FB300; padding: 20px 24px;">
          <div>
            <img src="https://shop.evcmercato.com/logo-evcmercato.jpg" alt="EVC Mercato" style="width: 44px; height: 44px; border-radius: 50%; display: inline-block; vertical-align: middle;" />
            <span style="color: #ffffff; font-size: 22px; font-weight: bold; vertical-align: middle; margin-left: 10px;">EVC Mercato</span>
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding: 32px 24px;">
          <h2 style="color: #1a7f37; margin: 0 0 8px;">🎉 Pengajuan Affiliate Disetujui!</h2>
          <p style="color: #555; margin: 0 0 24px;">Halo <strong>${customerName}</strong>, selamat! Pengajuan Anda untuk menjadi affiliate EVC Mercato telah disetujui.</p>

          <!-- Code Box -->
          <div style="background-color: #f0f7e6; border: 2px solid #7FB300; border-radius: 8px; padding: 20px 24px; text-align: center; margin: 24px 0;">
            <p style="color: #555; margin: 0 0 8px; font-size: 14px;">Kode Affiliate Anda</p>
            <p style="color: #1a7f37; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 2px;">${affiliateCode}</p>
          </div>

          ${notesSection}

          <p style="color: #555; margin: 24px 0 8px;">Mulai sekarang Anda dapat:</p>
          <ul style="color: #555; padding-left: 20px; line-height: 1.8; margin: 0 0 24px;">
            <li>Generate link affiliate personal Anda</li>
            <li>Bagikan ke teman dan komunitas</li>
            <li>Dapatkan PV setiap ada pembelian dari referral Anda</li>
            <li>Pantau progress dan komisi di dashboard affiliate</li>
          </ul>

          <div style="text-align: center; margin: 32px 0;">
            <a href="https://shop.evcmercato.com/affiliate" style="background-color: #7FB300; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Buka Affiliate Dashboard →</a>
          </div>

          <p style="color: #555; margin: 24px 0 0;">Selamat berbisnis!</p>
          <p style="color: #888; margin: 4px 0 0; font-size: 14px;">— Tim EVC Mercato</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color: #f9f9f9; padding: 16px 24px; border-top: 1px solid #eee;">
          <p style="color: #aaa; font-size: 12px; margin: 0; text-align: center;">EVC Mercato · Balikpapan, Kalimantan Timur · <a href="https://shop.evcmercato.com" style="color: #7FB300; text-decoration: none;">shop.evcmercato.com</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html }
}

export function generateAffiliateRejectedEmail(
  customerName: string,
  reason: string
): { subject: string; html: string } {
  const subject = 'Update Pengajuan Affiliate'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; max-width: 600px; width: 100%;">

        <!-- Header -->
        <tr><td style="background-color: #7FB300; padding: 20px 24px;">
          <div>
            <img src="https://shop.evcmercato.com/logo-evcmercato.jpg" alt="EVC Mercato" style="width: 44px; height: 44px; border-radius: 50%; display: inline-block; vertical-align: middle;" />
            <span style="color: #ffffff; font-size: 22px; font-weight: bold; vertical-align: middle; margin-left: 10px;">EVC Mercato</span>
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding: 32px 24px;">
          <h2 style="color: #333; margin: 0 0 8px;">Update Pengajuan Affiliate</h2>
          <p style="color: #555; margin: 0 0 24px;">Halo <strong>${customerName}</strong>, terima kasih sudah mengajukan diri sebagai affiliate EVC Mercato.</p>

          <p style="color: #555; margin: 0 0 16px;">Mohon maaf, pengajuan Anda belum dapat kami setujui saat ini dengan alasan:</p>

          <div style="background-color: #fff8f8; border-left: 4px solid #e53e3e; padding: 12px 16px; border-radius: 4px; margin: 0 0 24px;">
            <p style="color: #555; margin: 0; font-size: 14px;">${reason}</p>
          </div>

          <p style="color: #555; margin: 0 0 8px;">Jangan menyerah! Anda dapat mengajukan kembali setelah memperbaiki informasi yang diperlukan.</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="https://shop.evcmercato.com/affiliate/daftar" style="background-color: #7FB300; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Ajukan Kembali →</a>
          </div>

          <p style="color: #555; margin: 24px 0 0;">Ada pertanyaan? Hubungi admin EVC Mercato.</p>
          <p style="color: #888; margin: 4px 0 0; font-size: 14px;">— Tim EVC Mercato</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color: #f9f9f9; padding: 16px 24px; border-top: 1px solid #eee;">
          <p style="color: #aaa; font-size: 12px; margin: 0; text-align: center;">EVC Mercato · Balikpapan, Kalimantan Timur · <a href="https://shop.evcmercato.com" style="color: #7FB300; text-decoration: none;">shop.evcmercato.com</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html }
}

export function generateAffiliateSuspendedEmail(
  customerName: string,
  reason: string
): { subject: string; html: string } {
  const subject = 'Akun Affiliate Disuspend'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; max-width: 600px; width: 100%;">

        <!-- Header -->
        <tr><td style="background-color: #7FB300; padding: 20px 24px;">
          <div>
            <img src="https://shop.evcmercato.com/logo-evcmercato.jpg" alt="EVC Mercato" style="width: 44px; height: 44px; border-radius: 50%; display: inline-block; vertical-align: middle;" />
            <span style="color: #ffffff; font-size: 22px; font-weight: bold; vertical-align: middle; margin-left: 10px;">EVC Mercato</span>
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding: 32px 24px;">
          <h2 style="color: #e53e3e; margin: 0 0 8px;">⚠️ Akun Affiliate Disuspend</h2>
          <p style="color: #555; margin: 0 0 24px;">Halo <strong>${customerName}</strong>,</p>

          <p style="color: #555; margin: 0 0 16px;">Kami memberitahu bahwa akun affiliate Anda di EVC Mercato telah disuspend dengan alasan:</p>

          <div style="background-color: #fff8f8; border-left: 4px solid #e53e3e; padding: 12px 16px; border-radius: 4px; margin: 0 0 24px;">
            <p style="color: #555; margin: 0; font-size: 14px;">${reason}</p>
          </div>

          <p style="color: #555; margin: 0 0 8px;">Selama akun disuspend, link affiliate Anda tidak aktif dan tidak dapat menghasilkan komisi baru.</p>
          <p style="color: #555; margin: 0 0 24px;">Silakan hubungi admin EVC Mercato jika Anda memiliki pertanyaan atau ingin mengajukan banding.</p>

          <p style="color: #555; margin: 24px 0 0;">Terima kasih atas pengertian Anda.</p>
          <p style="color: #888; margin: 4px 0 0; font-size: 14px;">— Tim EVC Mercato</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color: #f9f9f9; padding: 16px 24px; border-top: 1px solid #eee;">
          <p style="color: #aaa; font-size: 12px; margin: 0; text-align: center;">EVC Mercato · Balikpapan, Kalimantan Timur · <a href="https://shop.evcmercato.com" style="color: #7FB300; text-decoration: none;">shop.evcmercato.com</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html }
}
