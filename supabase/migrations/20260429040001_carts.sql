-- Table carts
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_carts_user_id ON carts(user_id);

-- RLS
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "carts_own" ON carts FOR ALL USING (auth.uid() = user_id);

-- Table cart_items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cart_id, product_id, variant_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

-- RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart_items_own" ON cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
);
