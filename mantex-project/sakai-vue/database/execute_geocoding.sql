-- =============================================
-- GEOCODING MASIVO
-- =============================================
-- Este script actualiza las coordenadas (latitude, longitude) 
-- para registros que tienen dirección pero no tienen coordenadas.
-- Requiere que la función geocode_address() esté configurada.
-- Se utiliza la columna generada 'full_address' para mayor precisión.

-- =============================================
-- 1. CLIENTS
-- =============================================
DO $$
DECLARE
    r RECORD;
    coords jsonb;
    updated_count integer := 0;
BEGIN
    FOR r IN 
        SELECT id, full_address 
        FROM clients 
        WHERE (latitude IS NULL OR longitude IS NULL)
          AND full_address IS NOT NULL 
          AND length(full_address) > 10
    LOOP
        -- Geocode usando full_address
        coords := geocode_address(r.full_address);
        
        IF coords->>'lat' IS NOT NULL THEN
            UPDATE clients 
            SET latitude = (coords->>'lat')::decimal,
                longitude = (coords->>'lng')::decimal
            WHERE id = r.id;
            updated_count := updated_count + 1;
        END IF;
        
        -- Pequeña pausa para no saturar API
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE 'Clients actualizados: %', updated_count;
END $$;

-- =============================================
-- 2. SUPPLIER_PROFILES
-- =============================================
DO $$
DECLARE
    r RECORD;
    coords jsonb;
    updated_count integer := 0;
BEGIN
    FOR r IN 
        SELECT id, full_address 
        FROM supplier_profiles 
        WHERE (latitude IS NULL OR longitude IS NULL)
          AND full_address IS NOT NULL 
          AND length(full_address) > 10
    LOOP
        coords := geocode_address(r.full_address);
        
        IF coords->>'lat' IS NOT NULL THEN
            UPDATE supplier_profiles 
            SET latitude = (coords->>'lat')::decimal,
                longitude = (coords->>'lng')::decimal
            WHERE id = r.id;
            updated_count := updated_count + 1;
        END IF;
        
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE 'Supplier Profiles actualizados: %', updated_count;
END $$;

-- =============================================
-- 3. SUPPLIERS
-- =============================================
DO $$
DECLARE
    r RECORD;
    coords jsonb;
    updated_count integer := 0;
BEGIN
    FOR r IN 
        SELECT id, full_address 
        FROM suppliers 
        WHERE (latitude IS NULL OR longitude IS NULL)
          AND full_address IS NOT NULL 
          AND length(full_address) > 10
    LOOP
        coords := geocode_address(r.full_address);
        
        IF coords->>'lat' IS NOT NULL THEN
            UPDATE suppliers 
            SET latitude = (coords->>'lat')::decimal,
                longitude = (coords->>'lng')::decimal
            WHERE id = r.id;
            updated_count := updated_count + 1;
        END IF;
        
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE 'Suppliers actualizados: %', updated_count;
END $$;

-- =============================================
-- 4. CLIENT_BRANCHES
-- =============================================
DO $$
DECLARE
    r RECORD;
    coords jsonb;
    updated_count integer := 0;
BEGIN
    FOR r IN 
        SELECT id, full_address 
        FROM client_branches 
        WHERE (latitude IS NULL OR longitude IS NULL)
          AND full_address IS NOT NULL 
          AND length(full_address) > 10
    LOOP
        coords := geocode_address(r.full_address);
        
        IF coords->>'lat' IS NOT NULL THEN
            UPDATE client_branches 
            SET latitude = (coords->>'lat')::decimal,
                longitude = (coords->>'lng')::decimal
            WHERE id = r.id;
            updated_count := updated_count + 1;
        END IF;
        
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE 'Client Branches actualizados: %', updated_count;
END $$;

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================
SELECT 
  'Clients sin coords' as tabla, count(*) FROM clients WHERE latitude IS NULL
UNION ALL
SELECT 
  'Suppliers sin coords', count(*) FROM suppliers WHERE latitude IS NULL
UNION ALL
SELECT 
  'Supplier Profiles sin coords', count(*) FROM supplier_profiles WHERE latitude IS NULL
UNION ALL
SELECT 
  'Client Branches sin coords', count(*) FROM client_branches WHERE latitude IS NULL;
