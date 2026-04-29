-- Tambah kolom initial_sold_count ke products
ALTER TABLE products ADD COLUMN IF NOT EXISTS initial_sold_count INTEGER NOT NULL DEFAULT 0;

-- Set nilai awal 18 untuk semua produk yang sudah ada
UPDATE products SET initial_sold_count = 18;

-- View untuk hitung total sold (initial + dari orders)
CREATE OR REPLACE VIEW product_sold_counts AS
SELECT 
  p.id as product_id,
  p.initial_sold_count + COALESCE(SUM(oi.quantity), 0) as total_sold
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status IN ('paid', 'completed')
GROUP BY p.id, p.initial_sold_count;
