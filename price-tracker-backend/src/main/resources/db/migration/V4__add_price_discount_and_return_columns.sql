ALTER TABLE prices ADD COLUMN discount_amount float(53) DEFAULT 0 NOT NULL;
ALTER TABLE prices ADD COLUMN discount_percentage float(53) DEFAULT 0 NOT NULL;
ALTER TABLE prices ADD COLUMN return_percentage float(53) DEFAULT 0 NOT NULL;