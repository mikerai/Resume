-- Consolidated Fix Script: Clean Data, Schema, Cache, and Insert
-- 1. Cleans up invalid supplier_ids in existing tickets
-- 2. Ensures Foreign Key exists
-- 3. Reloads Schema Cache
-- 4. Inserts Test Tickets (with maintenance_type)

-- PART 1: Clean up invalid data preventing FK creation
UPDATE public.tickets
SET supplier_id = NULL
WHERE supplier_id IS NOT NULL 
AND supplier_id NOT IN (SELECT id FROM public.supplier_profiles);

-- PART 2: Ensure Foreign Key Exists
DO $$
BEGIN
    -- Check if constraint exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_supplier_id_fkey') THEN
        RAISE NOTICE '🔧 Adding missing foreign key constraint...';
        ALTER TABLE public.tickets
        ADD CONSTRAINT tickets_supplier_id_fkey
        FOREIGN KEY (supplier_id)
        REFERENCES public.supplier_profiles (id)
        ON DELETE SET NULL;
    ELSE
        RAISE NOTICE '✅ Foreign key constraint already exists.';
    END IF;
END $$;

-- PART 3: Force Schema Cache Reload
NOTIFY pgrst, 'reload config';

-- PART 4: Insert Test Tickets
DO $$
DECLARE
    v_client_user_id UUID;
    v_client_profile_id UUID;
    v_ticket_id UUID;
BEGIN
    -- Get client user
    SELECT id INTO v_client_user_id 
    FROM auth.users 
    WHERE email = 'ingenieromike+client@gmail.com'
    LIMIT 1;

    -- Get client profile
    SELECT id INTO v_client_profile_id
    FROM client_profiles
    WHERE user_id = v_client_user_id
    LIMIT 1;

    IF v_client_profile_id IS NULL THEN
        RAISE EXCEPTION 'Client profile not found. Please run insert_test_client_profile.sql first.';
    END IF;

    -- Insert Ticket 1
    INSERT INTO tickets (
        ticket_number, title, description, category, priority, status, 
        client_id, supplier_id, location_address, location_city, location_state, 
        scheduled_date, created_by, created_at, maintenance_type
    ) VALUES (
        'TKT-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
        'Reparación de Aire Acondicionado',
        'El aire acondicionado de la oficina principal no enfría correctamente.',
        'HVAC', 'high', 'pending', 
        v_client_profile_id, null,
        'Av. Insurgentes Sur 1602', 'CDMX', 'CDMX', 
        NOW() + INTERVAL '2 days', v_client_user_id, NOW() - INTERVAL '1 hour',
        'Correctivo' -- Added maintenance_type
    ) RETURNING id INTO v_ticket_id;
    RAISE NOTICE '📋 Created ticket 1: %', v_ticket_id;

    -- Insert Ticket 2
    INSERT INTO tickets (
        ticket_number, title, description, category, priority, status, 
        client_id, supplier_id, location_address, location_city, location_state, 
        scheduled_date, created_by, created_at, maintenance_type
    ) VALUES (
        'TKT-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
        'Mantenimiento Elevador',
        'Mantenimiento trimestral programado.',
        'Mantenimiento', 'medium', 'in_progress', 
        v_client_profile_id, null,
        'Paseo de la Reforma 505', 'CDMX', 'CDMX', 
        NOW(), v_client_user_id, NOW() - INTERVAL '3 hours',
        'Preventivo' -- Added maintenance_type
    ) RETURNING id INTO v_ticket_id;
    RAISE NOTICE '📋 Created ticket 2: %', v_ticket_id;

    RAISE NOTICE '✅ SUCCESS! Data cleaned, schema fixed, and tickets created.';
END $$;
