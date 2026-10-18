-- Pengingat WA "selesaikan pembayaran" (dikirim sekali, ±5 menit setelah pesanan dibuat & belum dibayar).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_reminder_sent_at timestamptz;
