CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_location TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT NOT NULL,
  source TEXT DEFAULT 'curated_with_consent',
  customer_consent_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  consent_proof TEXT,
  original_marketplace TEXT,
  original_review_screenshot TEXT,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_review_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_review_featured ON product_reviews(is_featured) WHERE is_featured = true;

-- RLS: public read approved reviews, admin manage all
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY reviews_public_read ON product_reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY reviews_admin_all ON product_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin_evc'))
  );
