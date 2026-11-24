-- Migrate to PSS-10 (10 answers) + full Indonesian region (province + city).
-- Existing rows keep q1..q5 columns unused; new columns hold PSS-10 answers.
ALTER TABLE respondents ADD COLUMN province TEXT;
ALTER TABLE respondents ADD COLUMN q6 INTEGER;
ALTER TABLE respondents ADD COLUMN q7 INTEGER;
ALTER TABLE respondents ADD COLUMN q8 INTEGER;
ALTER TABLE respondents ADD COLUMN q9 INTEGER;
ALTER TABLE respondents ADD COLUMN q10 INTEGER;

-- Backfill province for existing rows (old domicile held the city name).
UPDATE respondents SET province = 'DKI Jakarta' WHERE province IS NULL;
