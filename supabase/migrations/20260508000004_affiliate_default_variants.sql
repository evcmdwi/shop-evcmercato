-- ═══════════════════════════════════════════════════════════════════
-- AFFILIATE PROGRAM — Step 4: Insert default variants + update has_variants
-- SAFE: hanya INSERT untuk produk yang belum punya variant sama sekali
-- Date: 8 Mei 2026
-- ═══════════════════════════════════════════════════════════════════

-- 1D. Auto-create default variant untuk produk tanpa varian (has_variants=false)
INSERT INTO product_variants (product_id, name, price, stock, is_default)
SELECT p.id, 'Default', p.price, p.stock, TRUE
FROM products p
WHERE p.has_variants = FALSE
  AND NOT EXISTS (
    SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
  );

-- Set has_variants = true untuk produk yang baru dapat default variant
UPDATE products SET has_variants = TRUE
WHERE has_variants = FALSE
  AND EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = products.id);
