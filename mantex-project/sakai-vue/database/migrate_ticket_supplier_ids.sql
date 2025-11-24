-- Migrate ticket supplier_ids from suppliers table to supplier_profiles table
-- This script updates existing tickets to point to the correct supplier_profiles IDs

DO $$
DECLARE
    v_ticket RECORD;
    v_new_supplier_id UUID;
BEGIN
    -- Loop through all tickets that have a supplier_id
    FOR v_ticket IN 
        SELECT id, supplier_id 
        FROM tickets 
        WHERE supplier_id IS NOT NULL
    LOOP
        -- Try to find the corresponding supplier_profile by matching user_id
        -- First, get the user_id from the old suppliers table
        SELECT sp.id INTO v_new_supplier_id
        FROM supplier_profiles sp
        WHERE sp.user_id = (
            SELECT s.user_id 
            FROM suppliers s 
            WHERE s.id = v_ticket.supplier_id
        );

        -- If we found a match, update the ticket
        IF v_new_supplier_id IS NOT NULL THEN
            UPDATE tickets 
            SET supplier_id = v_new_supplier_id 
            WHERE id = v_ticket.id;
            
            RAISE NOTICE 'Updated ticket % from supplier % to supplier_profile %', 
                v_ticket.id, v_ticket.supplier_id, v_new_supplier_id;
        ELSE
            RAISE NOTICE 'No supplier_profile found for ticket % (old supplier_id: %)', 
                v_ticket.id, v_ticket.supplier_id;
        END IF;
    END LOOP;

    RAISE NOTICE '✅ Ticket supplier_id migration completed';
END $$;
