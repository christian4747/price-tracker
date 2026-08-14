ALTER TABLE prices
    ALTER COLUMN return_amount SET DEFAULT 0.0,
    ALTER COLUMN return_amount SET NOT NULL;