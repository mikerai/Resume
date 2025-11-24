-- Fix Client Permissions and Add Test Tickets
-- This script does two things:
-- 1. Assigns 'owner' sub_role to your client profile (enables ticket creation)
-- 2. Inserts test tickets so you can see data in the app

-- STEP 1: Fix Client Permissions
-- Update your client profile to have 'owner' sub_role
UPDATE client_profiles
SET sub_role = 'owner'
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'ingenieromike+client@gmail.com' -- CHANGE THIS TO YOUR EMAIL
);

-- Verify the update
SELECT 
    cp.id,
    u.email,
    cp.sub_role,
    cp.id
FROM client_profiles cp
JOIN auth.users u ON u.id = cp.user_id
WHERE u.email = 'ingenieromike+client@gmail.com'; -- CHANGE THIS TO YOUR EMAIL

-- STEP 2: Insert Test Tickets
DO $$
DECLARE
    v_client_user_id UUID;
    v_supplier_user_id UUID;
    v_client_profile_id UUID;
    v_supplier_profile_id UUID;
    v_ticket_id UUID;
BEGIN
    -- Get client user (CHANGE THE EMAIL)
    SELECT id INTO v_client_user_id 
    FROM auth.users 
    WHERE email = 'ingenieromike+client@gmail.com' -- CHANGE THIS TO YOUR EMAIL
    LIMIT 1;

    -- Get supplier user (any supplier will do)
    SELECT u.id INTO v_supplier_user_id 
    FROM auth.users u
    JOIN profiles p ON p.id = u.id
    WHERE p.role = 'supplier' 
    LIMIT 1;

    -- Get client profile
    SELECT id INTO v_client_profile_id
    FROM client_profiles
    WHERE user_id = v_client_user_id
    LIMIT 1;

    -- Get supplier profile
    SELECT id INTO v_supplier_profile_id
    FROM supplier_profiles
    WHERE user_id = v_supplier_user_id
    LIMIT 1;

    -- Check if we have the required data
    IF v_client_user_id IS NULL THEN
        RAISE EXCEPTION 'Client user not found. Please update the email in the script.';
    END IF;

    IF v_client_profile_id IS NULL THEN
        RAISE EXCEPTION 'Client profile not found for user. Create a client profile first.';
    END IF;

    RAISE NOTICE '✅ Found client user: %', v_client_user_id;
    RAISE NOTICE '✅ Found client profile: %', v_client_profile_id;
    RAISE NOTICE 'ℹ️  Supplier user: %', COALESCE(v_supplier_user_id::TEXT, 'None (tickets will be unassigned)');

    -- Insert Test Ticket 1: Pending (High Priority)
    INSERT INTO tickets (
        ticket_number,
        title,
        description,
        category,
        priority,
        status,
        client_id,
        supplier_id,
        location_address,
        location_city,
        location_state,
        scheduled_date,
        created_by,
        created_at
    ) VALUES (
        'TKT-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
        'Reparación de Aire Acondicionado',
        'El aire acondicionado de la oficina principal no enfría correctamente. Necesita revisión urgente antes de la ola de calor.',
        'HVAC',
        'high',
        'pending',
        v_client_profile_id,
        null,
        'Av. Insurgentes Sur 1602, Crédito Constructor',
        'Ciudad de México',
        'CDMX',
        NOW() + INTERVAL '2 days',
        v_client_user_id,
        NOW() - INTERVAL '1 hour'
    )
    RETURNING id INTO v_ticket_id;
    RAISE NOTICE '📋 Created ticket: Reparación de Aire Acondicionado (ID: %)', v_ticket_id;

    -- Insert Test Ticket 2: In Progress
    INSERT INTO tickets (
        ticket_number,
        title,
        description,
        category,
        priority,
        status,
        client_id,
        supplier_id,
        location_address,
        location_city,
        location_state,
        scheduled_date,
        started_at,
        created_by,
        created_at
    ) VALUES (
        'TKT-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
        'Mantenimiento Preventivo Elevador',
        'Mantenimiento trimestral programado para el elevador del edificio. Incluye revisión de cables, frenos y sistema eléctrico.',
        'Mantenimiento',
        'medium',
        'in_progress',
        v_client_profile_id,
        null,
        'Paseo de la Reforma 505, Cuauhtémoc',
        'Ciudad de México',
        'CDMX',
        NOW(),
        NOW() - INTERVAL '30 minutes',
        v_client_user_id,
        NOW() - INTERVAL '3 hours'
    )
    RETURNING id INTO v_ticket_id;
    RAISE NOTICE '📋 Created ticket: Mantenimiento Preventivo Elevador (ID: %)', v_ticket_id;

    -- Insert Test Ticket 3: Completed
    INSERT INTO tickets (
        ticket_number,
        title,
        description,
        category,
        priority,
        status,
        client_id,
        supplier_id,
        location_address,
        location_city,
        location_state,
        scheduled_date,
        started_at,
        completed_at,
        created_by,
        created_at
    ) VALUES (
        'TKT-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
        'Instalación de Cámaras de Seguridad',
        'Instalación de 4 cámaras de seguridad HD en el estacionamiento con sistema de grabación 24/7.',
        'Seguridad',
        'medium',
        'completed',
        v_client_profile_id,
        null,
        'Av. Revolución 1267, Álamos',
        'Ciudad de México',
        'CDMX',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '1 day',
        v_client_user_id,
        NOW() - INTERVAL '5 days'
    )
    RETURNING id INTO v_ticket_id;
    RAISE NOTICE '📋 Created ticket: Instalación de Cámaras (ID: %)', v_ticket_id;

    -- Insert Test Ticket 4: Assigned (Urgent)
    INSERT INTO tickets (
        ticket_number,
        title,
        description,
        category,
        priority,
        status,
        client_id,
        supplier_id,
        location_address,
        location_city,
        location_state,
        scheduled_date,
        created_by,
        created_at
    ) VALUES (
        'TKT-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
        'Reparación de Fuga de Agua',
        'Fuga de agua detectada en el baño del segundo piso. Requiere atención inmediata para evitar daños mayores.',
        'Plomería',
        'urgente',
        'assigned',
        v_client_profile_id,
        null,
        'Av. Universidad 1200, Del Valle',
        'Ciudad de México',
        'CDMX',
        NOW() + INTERVAL '1 day',
        v_client_user_id,
        NOW() - INTERVAL '30 minutes'
    )
    RETURNING id INTO v_ticket_id;
    RAISE NOTICE '📋 Created ticket: Reparación de Fuga (ID: %)', v_ticket_id;

    -- Insert Test Ticket 5: Cancelled
    INSERT INTO tickets (
        ticket_number,
        title,
        description,
        category,
        priority,
        status,
        client_id,
        location_address,
        location_city,
        location_state,
        scheduled_date,
        created_by,
        created_at
    ) VALUES (
        'TKT-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
        'Limpieza Profunda de Oficinas',
        'Servicio de limpieza profunda cancelado por el cliente debido a cambio de planes.',
        'Limpieza',
        'low',
        'cancelled',
        v_client_profile_id,
        'Av. Chapultepec 100, Roma Norte',
        'Ciudad de México',
        'CDMX',
        NOW() + INTERVAL '3 days',
        v_client_user_id,
        NOW() - INTERVAL '1 day'
    )
    RETURNING id INTO v_ticket_id;
    RAISE NOTICE '📋 Created ticket: Limpieza Profunda (ID: %)', v_ticket_id;

    RAISE NOTICE '';
    RAISE NOTICE '✅ SUCCESS! Created 5 test tickets';
    RAISE NOTICE '✅ Client sub_role updated to "owner"';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next steps:';
    RAISE NOTICE '1. Reload your mobile app (npm run dev)';
    RAISE NOTICE '2. You should now see tickets in the dashboard';
    RAISE NOTICE '3. You should be able to create new tickets';
    RAISE NOTICE '4. Click on any ticket to see details and chat';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error: %', SQLERRM;
        RAISE NOTICE '';
        RAISE NOTICE '💡 Common issues:';
        RAISE NOTICE '1. Email not found - Update line 13 with your actual email';
        RAISE NOTICE '2. No client profile - Create a client profile first';
        RAISE NOTICE '3. Check that auth.users table has your user';
END $$;

-- Final verification query
SELECT 
    t.ticket_number,
    t.title,
    t.status,
    t.priority,
    t.created_at,
    cp.id as client_name
FROM tickets t
JOIN client_profiles cp ON cp.id = t.client_id
JOIN auth.users u ON u.id = cp.user_id
WHERE u.email = 'ingenieromike+client@gmail.com' -- CHANGE THIS TO YOUR EMAIL
ORDER BY t.created_at DESC;
