-- ============================================
-- ADD created_by COLUMN TO tickets TABLE
-- ============================================
-- This column tracks which user created the ticket
-- Useful for audit trails and permissions

-- Step 1: Add column as nullable
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Step 2: Try to backfill from client's user_id
UPDATE tickets t
SET created_by = c.user_id
FROM clients c
WHERE t.client_id = c.id
AND t.created_by IS NULL
AND c.user_id IS NOT NULL;

-- Step 3: For any remaining nulls, set to the first admin user (fallback)
UPDATE tickets
SET created_by = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
WHERE created_by IS NULL;

-- Step 4: Now make it NOT NULL
ALTER TABLE tickets
ALTER COLUMN created_by SET NOT NULL;

-- Step 5: Add index for performance
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);

-- Verify
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name = 'created_by';
