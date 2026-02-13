-- Fix efficacy scores that were imported on a 0-10 scale instead of 0-1
-- Any score > 1.0 was stored in the raw scraper scale and needs normalising
UPDATE product_catalog
SET efficacy_score = LEAST(efficacy_score / 10.0, 1.0),
    updated_at = NOW()
WHERE efficacy_score > 1.0;
