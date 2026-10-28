-- Permintaan Dwi 28 Okt 2026: Order #B6FA4A7D — nomor HP penerima diganti ke nomor member
-- (Handy, 081332426891) supaya WA konfirmasi berikutnya (dikirim/diterima) masuk ke Handy.
-- WA status memakai orders.shipping_phone lebih dulu, baru users.phone.
-- Sebelumnya: 08113661129 (penerima Novita Mediawati, Banyuwangi). Nama & alamat tidak diubah.
update public.orders
   set shipping_phone = '081332426891'
 where id = 'b6fa4a7d-a8fb-4970-8d22-c8e288409cd8'
   and shipping_phone = '08113661129'
returning id, status, shipping_recipient_name, shipping_phone;
