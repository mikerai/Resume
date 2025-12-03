-- Fix: Clean up orphaned asset_ids before adding Foreign Key
-- This script first removes references to non-existent assets, then adds the constraint.

DO $$
BEGIN
    -- 1. Identify and fix tickets with invalid asset_id
    -- We set asset_id to NULL for tickets pointing to deleted/missing assets
    UPDATE tickets
    SET asset_id = NULL
    WHERE asset_id IS NOT NULL
    AND asset_id NOT IN (SELECT id FROM client_assets);
    
    RAISE NOTICE 'Cleaned up orphaned asset_ids in tickets table';

    -- 2. Add the foreign key constraint safely
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'tickets_asset_id_fkey' 
        AND table_name = 'tickets'
    ) THEN
        ALTER TABLE tickets
        ADD CONSTRAINT tickets_asset_id_fkey
        FOREIGN KEY (asset_id)
        REFERENCES client_assets(id)
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key tickets_asset_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key tickets_asset_id_fkey already exists';
    END IF;

    -- Refresh schema cache
    NOTIFY pgrst, 'reload config';
END $$;
