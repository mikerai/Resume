-- Fix Tickets Foreign Key and Standardize Ticket Numbers

DO $$
BEGIN
    -- 1. Drop existing Foreign Key to clients if it exists
    ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_client_id_fkey;

    -- 2. CLEANUP: Delete tickets with invalid client_ids that don't exist in client_profiles
    -- This prevents the FK violation error (Error 23503).
    DELETE FROM tickets 
    WHERE client_id NOT IN (SELECT id FROM client_profiles);
    
    RAISE NOTICE '✅ Deleted orphan tickets that had invalid client_ids.';

    -- 3. Add new Foreign Key to client_profiles
    ALTER TABLE tickets
    ADD CONSTRAINT tickets_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES client_profiles(id)
    ON DELETE CASCADE;

    RAISE NOTICE '✅ Tickets Foreign Key updated to reference client_profiles.';

    -- 3. Update generate_ticket_number function to use TKT- prefix
    CREATE OR REPLACE FUNCTION generate_ticket_number()
    RETURNS TEXT AS $func$
    DECLARE
        current_year TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
        sequence_num INTEGER;
        ticket_num TEXT;
    BEGIN
        -- Find the max number for the current year pattern TKT-YYYY-NNN
        SELECT COALESCE(MAX(
            CAST(SPLIT_PART(ticket_number, '-', 3) AS INTEGER)
        ), 0) + 1
        INTO sequence_num
        FROM tickets
        WHERE ticket_number LIKE 'TKT-' || current_year || '-%';

        ticket_num := 'TKT-' || current_year || '-' || LPAD(sequence_num::TEXT, 3, '0');
        RETURN ticket_num;
    END;
    $func$ LANGUAGE plpgsql;

    RAISE NOTICE '✅ Ticket number generation updated to TKT- format.';

    -- 4. Notify PostgREST to reload schema cache
    NOTIFY pgrst, 'reload config';

END $$;
