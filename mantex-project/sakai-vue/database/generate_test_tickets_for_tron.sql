-- Script to generate 10 test tickets assigned to tron@test.com
-- This script assumes the user 'tron@test.com' exists in auth.users and has a corresponding supplier profile.

DO $$
DECLARE
    v_supplier_user_id UUID;
    v_supplier_profile_id UUID;
    v_client_profile_id UUID;
    v_client_user_id UUID;
    v_ticket_count INTEGER := 10;
    v_i INTEGER;
BEGIN
    -- 1. Find the supplier user ID and profile ID for 'tron@test.com'
    SELECT id INTO v_supplier_user_id FROM auth.users WHERE email = 'tron@test.com';
    
    IF v_supplier_user_id IS NULL THEN
        RAISE NOTICE '❌ User tron@test.com not found in auth.users';
        RETURN;
    END IF;

    SELECT id INTO v_supplier_profile_id FROM supplier_profiles WHERE user_id = v_supplier_user_id;

    IF v_supplier_profile_id IS NULL THEN
        RAISE NOTICE '❌ Supplier profile not found for tron@test.com. Creating one...';
        -- Create a dummy supplier profile if it doesn't exist (optional, but good for testing)
        INSERT INTO supplier_profiles (
            user_id, 
            username,
            company_name, 
            business_type,
            rfc,
            sat_password_encrypted,
            legal_address,
            contact_person, 
            phone_number,
            email,
            status,
            face_similarity_score,
            sat_data
        )
        VALUES (
            v_supplier_user_id, 
            'tron_user',
            'MIGUEL ANGEL RODRIGUEZ ALVAREZ ICAZA', 
            'sole_proprietorship',
            'MUMS760503IV2',
            'encrypted_password',
            'SAN ANGEL 01000, ALVARO OBREGON, CDMX.',
            'MIGUEL ANGEL RODRIGUEZ ALVAREZ ICAZA', 
            '555-000-0000',
            'tron@test.com',
            'approved',
            99.75,
            '{
                "rfc": {
                    "rfc": "MUMS760503IV2",
                    "valido": true,
                    "mensaje": "RFC Valido",
                    "tipoPersona": "F",
                    "claveMensaje": "0",
                    "esPersonaMoral": false,
                    "esPersonaFisica": true,
                    "codigoValidacion": "vr1763789094.2463367",
                    "informacionAdicional": "RFC válido, y susceptible de recibir facturas",
                    "puedeRecibirFacturas": true
                },
                "nombreRazonSocial": {
                    "valido": true,
                    "mensaje": "No se pudo obtener el dato, debe existir un certificado de sello digital",
                    "tieneNombre": true,
                    "claveMensaje": 1,
                    "tieneFIELoCSD": true,
                    "codigoValidacion": "rs1763789068.530151"
                },
                "validacionCompleta": true
            }'::jsonb
        )
        RETURNING id INTO v_supplier_profile_id;
    END IF;

    -- 2. Find a client profile to assign these tickets to (or create a dummy one)
    -- We'll just pick the first available client profile, or create one if none exist.
    SELECT id, user_id INTO v_client_profile_id, v_client_user_id FROM client_profiles LIMIT 1;

    IF v_client_profile_id IS NULL THEN
        RAISE NOTICE '⚠️ No client profiles found. Cannot create tickets without a client.';
        RETURN;
    END IF;

    RAISE NOTICE '✅ Creating % tickets for Supplier: % (ID: %) from Client: %', v_ticket_count, 'tron@test.com', v_supplier_profile_id, v_client_profile_id;

    -- 3. Loop to create tickets
    FOR v_i IN 1..v_ticket_count LOOP
        -- Select address based on index
        DECLARE
            v_address TEXT;
            v_colonia TEXT;
        BEGIN
            CASE (v_i - 1) % 10
                WHEN 0 THEN v_address := 'Av. Presidente Masaryk 360'; v_colonia := 'Polanco, Miguel Hidalgo, 11560';
                WHEN 1 THEN v_address := 'Calle de la Amargura 17'; v_colonia := 'San Ángel, Álvaro Obregón, 01000';
                WHEN 2 THEN v_address := 'Paseo de la Reforma 1250'; v_colonia := 'Lomas de Chapultepec, Miguel Hidalgo, 11000';
                WHEN 3 THEN v_address := 'Calle Darwin 68'; v_colonia := 'Anzures, Miguel Hidalgo, 11590';
                WHEN 4 THEN v_address := 'Calle Gral. Antonio León 45'; v_colonia := 'San Miguel Chapultepec, Miguel Hidalgo, 11850';
                WHEN 5 THEN v_address := 'Calle Campos Elíseos 204'; v_colonia := 'Polanco, Miguel Hidalgo, 11560';
                WHEN 6 THEN v_address := 'Av. Revolución 1500'; v_colonia := 'San Ángel, Álvaro Obregón, 01000';
                WHEN 7 THEN v_address := 'Monte Himalaya 815'; v_colonia := 'Lomas de Chapultepec, Miguel Hidalgo, 11000';
                WHEN 8 THEN v_address := 'Calle Gutenberg 128'; v_colonia := 'Anzures, Miguel Hidalgo, 11590';
                WHEN 9 THEN v_address := 'Av. Parque Lira 90'; v_colonia := 'San Miguel Chapultepec, Miguel Hidalgo, 11850';
            END CASE;

            INSERT INTO tickets (
                title,
                description,
                maintenance_type,
                priority,
                status,
                category,
                location_address,
                location_city,
                location_state,
                client_id,
                supplier_id,
                created_by,
                created_at
            ) VALUES (
                'Mantenimiento en ' || v_colonia || ' - Ticket ' || v_i,
                'Servicio requerido en ' || v_address || ', ' || v_colonia || '. Asignado a Tron para pruebas.',
                CASE WHEN v_i % 2 = 0 THEN 'preventive' ELSE 'corrective' END,
                CASE WHEN v_i % 3 = 0 THEN 'high' WHEN v_i % 3 = 1 THEN 'medium' ELSE 'low' END,
                'pending', -- Start as pending so the supplier can accept/reject
                'general',
                v_address || ', ' || v_colonia,
                'Ciudad de México',
                'CDMX',
                v_client_profile_id,
                v_supplier_profile_id, -- Assign directly to Tron
                v_client_user_id,
                NOW() - (v_i || ' hours')::INTERVAL -- Stagger creation times
            );
        END;
    END LOOP;

    RAISE NOTICE '✅ Successfully created % test tickets for tron@test.com', v_ticket_count;

END $$;
