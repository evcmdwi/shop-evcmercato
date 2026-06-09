# Architecture Decisions — shop.evcmercato.com

---

## [2026-06-09] Xendit Webhook Router: EVC sebagai forwarder untuk LOTI

**Konteks:**
Akun Xendit dipakai bersama EVC Mercato dan LOTI Bakes. Xendit hanya mengizinkan satu URL webhook "Invoice paid" per akun. URL webhook sudah menunjuk ke `shop.evcmercato.com/api/xendit/webhook`.

**Keputusan:**
EVC menjadi router webhook. Pembedaan berdasarkan prefix `external_id`:
- `LOTI-*` → forward ke LOTI webhook (`LOTI_WEBHOOK_URL` env var)
- Selain itu → proses sebagai order EVC seperti biasa

**Invariants:**
- EVC murni (`external_id` = UUID atau `redeem-*`) tidak pernah di-forward ke LOTI
- Forward menggunakan raw body apa adanya + teruskan `x-callback-token` asli
- `await` response LOTI → return status yang sama ke Xendit (bukan selalu 200)
- Kalau LOTI down (non-2xx), Xendit akan retry — LOTI handler wajib idempoten
- `LOTI_WEBHOOK_URL` saat ini = `https://loti-bakes.vercel.app/api/xendit/webhook` (test); ganti ke `https://loti.id/api/xendit/webhook` saat LOTI live

**Env baru di Vercel EVC:**
- `LOTI_WEBHOOK_URL` (wajib diisi sebelum LOTI live)

**File yang diubah:**
- `app/api/xendit/webhook/route.ts` — tambah blok router LOTI setelah token verification

**Jangan ubah:**
- URL webhook di dashboard Xendit — tetap `shop.evcmercato.com/api/xendit/webhook`
- Format `external_id` EVC yang sudah ada

---
