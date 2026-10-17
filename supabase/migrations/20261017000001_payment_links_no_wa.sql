-- Payment Link: nomor WA pembeli + penanda notifikasi "terima kasih" sudah dikirim.
alter table payment_links add column if not exists no_wa text;
alter table payment_links add column if not exists wa_sent_at timestamptz;
