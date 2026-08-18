ALTER TABLE products ADD COLUMN brand varchar(255);
ALTER TABLE prices ADD COLUMN return_amount float(53) DEFAULT 0 NOT NULL;