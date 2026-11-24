-- Community Wellbeing — initial schema
CREATE TABLE respondents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'registered',   -- registered | completed
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  domicile TEXT NOT NULL,
  birth_date TEXT NOT NULL,                    -- YYYY-MM-DD
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('L','P')),
  complaint TEXT NOT NULL,
  q1 INTEGER,
  q2 INTEGER,
  q3 INTEGER,
  q4 INTEGER,
  q5 INTEGER,
  CHECK (q1 IS NULL OR (q1 BETWEEN 0 AND 5)),
  CHECK (q2 IS NULL OR (q2 BETWEEN 0 AND 5)),
  CHECK (q3 IS NULL OR (q3 BETWEEN 0 AND 5)),
  CHECK (q4 IS NULL OR (q4 BETWEEN 0 AND 5)),
  CHECK (q5 IS NULL OR (q5 BETWEEN 0 AND 5))
);
CREATE INDEX idx_respondents_status ON respondents(status);
