-- Tambah kolom resi ke orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS courier_type TEXT,
  ADD COLUMN IF NOT EXISTS resi_barcode_url TEXT,
  ADD COLUMN IF NOT EXISTS delivery_note TEXT,
  ADD COLUMN IF NOT EXISTS resi_generated_at TIMESTAMPTZ;

-- Buat storage bucket untuk barcode (private)
-- Note: bucket creation via SQL migration tidak bisa langsung
-- Dwi perlu buat manual via Supabase Dashboard → Storage → New Bucket
-- Nama: resi-barcodes, Public: false
