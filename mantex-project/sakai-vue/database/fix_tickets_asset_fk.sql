-- Add missing Foreign Key relationship for tickets.asset_id -> client_assets.id
-- This fixes the PGRST200 error: "Could not find a relationship between 'tickets' and 'client_assets'"

DO $$
BEGIN
    -- Check if the constraint already exists to avoid errors
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'tickets_asset_id_fkey' 
        AND table_name = 'tickets'
    ) THEN
        -- Add the foreign key
        ALTER TABLE tickets
        ADD CONSTRAINT tickets_asset_id_fkey
        FOREIGN KEY (asset_id)
        REFERENCES client_assets(id)
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key tickets_asset_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key tickets_asset_id_fkey already exists';
    END IF;

    -- Refresh the schema cache (PostgREST needs this sometimes, though usually auto-detects)
    NOTIFY pgrst, 'reload config';
END $$;

-- Verify the relationship is visible to PostgREST
COMMENT ON CONSTRAINT tickets_asset_id_fkey ON tickets IS 'Links ticket to a specific asset';
