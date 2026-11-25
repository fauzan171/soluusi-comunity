-- Kode promo kampanye (kuota claim terbatas)
CREATE TABLE promo_campaigns (
  code TEXT PRIMARY KEY,
  max_claims INTEGER NOT NULL,
  claimed_count INTEGER NOT NULL DEFAULT 0,
  discount_label TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (claimed_count >= 0),
  CHECK (claimed_count <= max_claims)
);

-- Kode promo di tiap voucher (NULL untuk voucher lama sebelum kampanye)
ALTER TABLE vouchers ADD COLUMN promo_code TEXT;

INSERT INTO promo_campaigns (code, max_claims, discount_label) VALUES
  ('AKUPEDULIAKU1', 200, 'Rp 20.000');