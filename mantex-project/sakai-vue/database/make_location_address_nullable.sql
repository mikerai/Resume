-- ============================================
-- MAKE location_address NULLABLE IN tickets
-- ============================================
-- Not all tickets need a specific location address
-- They can inherit from the client's address

ALTER TABLE tickets
ALTER COLUMN location_address DROP NOT NULL;

-- Verify
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name = 'location_address';
