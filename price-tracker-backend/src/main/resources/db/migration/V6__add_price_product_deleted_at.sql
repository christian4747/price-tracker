ALTER TABLE prices ADD COLUMN deleted_at timestamp(6) DEFAULT null;
ALTER TABLE products ADD COLUMN deleted_at timestamp(6) DEFAULT null;