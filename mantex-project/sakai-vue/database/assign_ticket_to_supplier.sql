-- Assign specific ticket to the first available supplier to enable RLS access
DO $$
DECLARE
    v_supplier_id UUID;
    v_ticket_id UUID := '50b17d4b-bbea-4fd5-ba32-6400304a7cee';
BEGIN
    -- Get the first supplier profile
    SELECT id INTO v_supplier_id FROM supplier_profiles LIMIT 1;

    IF v_supplier_id IS NULL THEN
        RAISE NOTICE '⚠️ No supplier profile found. Cannot assign ticket.';
        RETURN;
    END IF;

    -- Update the ticket
    UPDATE tickets
    SET supplier_id = v_supplier_id,
        status = 'assigned' -- Update status to reflect assignment
    WHERE id = v_ticket_id;

    IF FOUND THEN
        RAISE NOTICE '✅ Ticket % assigned to supplier %', v_ticket_id, v_supplier_id;
    ELSE
        RAISE NOTICE '⚠️ Ticket % not found.', v_ticket_id;
    END IF;
END $$;
