-- Voucher konsultasi (Soluusi x Gerakan Binar)
CREATE TABLE vouchers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  respondent_id INTEGER NOT NULL UNIQUE,
  consultant_slug TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  redeemed_at TEXT,
  FOREIGN KEY (respondent_id) REFERENCES respondents(id) ON DELETE CASCADE
);
CREATE INDEX idx_vouchers_code ON vouchers(code);
