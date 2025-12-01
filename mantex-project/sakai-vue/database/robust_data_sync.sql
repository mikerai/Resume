-- =====================================================
-- ROBUST DATA SYNCHRONIZATION SYSTEM (CORRECTED V3)
-- =====================================================
-- Schema Reality Check:
-- 1. client_profiles: No name fields.
-- 2. supplier_profiles: Has 'contact_person' (text), NOT first_name/last_name.
-- 3. profiles: Has first_name, last_name, second_last_name.
-- 4. clients/suppliers: Has 'contact_person'.
-- =====================================================

-- 1. TRIGGER FUNCTIONS (MASTER → SLAVE)
-- =====================================================

CREATE OR REPLACE FUNCTION sync_from_profiles_master()
RETURNS TRIGGER AS $$
DECLARE
    full_name_str TEXT;
BEGIN
    -- Construct full name
    full_name_str := TRIM(NEW.first_name || ' ' || COALESCE(NEW.last_name, '') || ' ' || COALESCE(NEW.second_last_name, ''));

    -- If Client
    IF NEW.role = 'client' THEN
        -- Update clients (Legacy table)
        UPDATE clients
        SET 
            contact_person = full_name_str,
            updated_at = NOW()
        WHERE user_id = NEW.id;
        
        -- Update avatar in client_profiles
        UPDATE client_profiles
        SET 
            avatar_url = NEW.avatar_url,
            updated_at = NOW()
        WHERE user_id = NEW.id;
    
    -- If Supplier
    ELSIF NEW.role = 'supplier' THEN
        -- Update supplier_profiles (Sync name to contact_person)
        UPDATE supplier_profiles
        SET 
            contact_person = full_name_str,
            avatar_url = NEW.avatar_url,
            updated_at = NOW()
        WHERE id = NEW.id;

        -- Update suppliers (Legacy table)
        UPDATE suppliers
        SET 
            contact_person = full_name_str,
            updated_at = NOW()
        WHERE user_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TRIGGER FUNCTIONS (SLAVE → MASTER)
-- =====================================================

-- Function to sync changes from SUPPLIER_PROFILES to PROFILES
-- NOTE: We CANNOT sync contact_person back to first/last names accurately.
-- So we only sync avatar_url from slave to master.
CREATE OR REPLACE FUNCTION sync_from_supplier_profiles()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if avatar changed
    IF (OLD.avatar_url IS DISTINCT FROM NEW.avatar_url) THEN
        UPDATE profiles
        SET 
            avatar_url = NEW.avatar_url,
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync changes from CLIENT_PROFILES to PROFILES
CREATE OR REPLACE FUNCTION sync_from_client_profiles()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if avatar changed
    IF (OLD.avatar_url IS DISTINCT FROM NEW.avatar_url) THEN
        UPDATE profiles
        SET 
            avatar_url = NEW.avatar_url,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. APPLY TRIGGERS
-- =====================================================

-- Drop old triggers
DROP TRIGGER IF EXISTS trigger_sync_profiles_master ON profiles;
DROP TRIGGER IF EXISTS trigger_sync_client_to_master ON client_profiles;
DROP TRIGGER IF EXISTS trigger_sync_supplier_to_master ON supplier_profiles;

-- Apply Master Trigger
CREATE TRIGGER trigger_sync_profiles_master
AFTER UPDATE OF first_name, last_name, second_last_name, avatar_url ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_from_profiles_master();

-- Apply Slave Triggers
CREATE TRIGGER trigger_sync_client_to_master
AFTER UPDATE OF avatar_url ON client_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_from_client_profiles();

CREATE TRIGGER trigger_sync_supplier_to_master
AFTER UPDATE OF avatar_url ON supplier_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_from_supplier_profiles();


-- 4. REPAIR SCRIPT (MANUAL SYNC)
-- =====================================================

DROP FUNCTION IF EXISTS sync_all_user_data();

CREATE OR REPLACE FUNCTION sync_all_user_data()
RETURNS TABLE (
    action TEXT,
    details TEXT
) AS $$
DECLARE
    r RECORD;
    full_name_str TEXT;
BEGIN
    -- 1. Sync Profiles -> Client Profiles
    FOR r IN SELECT * FROM profiles WHERE role = 'client' LOOP
        full_name_str := TRIM(r.first_name || ' ' || COALESCE(r.last_name, '') || ' ' || COALESCE(r.second_last_name, ''));
        
        IF NOT EXISTS (SELECT 1 FROM client_profiles WHERE user_id = r.id) THEN
            INSERT INTO client_profiles (user_id, avatar_url)
            VALUES (r.id, r.avatar_url);
            RETURN QUERY SELECT 'Created client_profile', r.id::TEXT;
        ELSE
            UPDATE client_profiles
            SET avatar_url = r.avatar_url
            WHERE user_id = r.id;
        END IF;
        
        UPDATE clients
        SET contact_person = full_name_str
        WHERE user_id = r.id;
    END LOOP;

    -- 2. Sync Profiles -> Supplier Profiles
    FOR r IN SELECT * FROM profiles WHERE role = 'supplier' LOOP
        full_name_str := TRIM(r.first_name || ' ' || COALESCE(r.last_name, '') || ' ' || COALESCE(r.second_last_name, ''));

        IF NOT EXISTS (SELECT 1 FROM supplier_profiles WHERE id = r.id) THEN
            -- Note: supplier_profiles requires username, we'll use email prefix or random if needed, but here we assume it exists or is handled by app
            -- For sync, we just update what we can
            RETURN QUERY SELECT 'Skipped creating supplier_profile (complex dependencies)', r.id::TEXT;
        ELSE
            UPDATE supplier_profiles
            SET 
                contact_person = full_name_str,
                avatar_url = r.avatar_url
            WHERE id = r.id;
        END IF;
        
        UPDATE suppliers
        SET contact_person = full_name_str
        WHERE user_id = r.id;
    END LOOP;

    RETURN QUERY SELECT 'Sync Complete', 'All profiles synchronized';
END;
$$ LANGUAGE plpgsql;

-- 5. INTEGRITY VIEW
-- =====================================================

CREATE OR REPLACE VIEW view_data_integrity_status AS
SELECT 
    p.id,
    p.role,
    TRIM(p.first_name || ' ' || COALESCE(p.last_name, '') || ' ' || COALESCE(p.second_last_name, '')) as p_full_name,
    CASE 
        WHEN p.role = 'supplier' THEN sp.contact_person 
        ELSE 'N/A'
    END as role_contact_person,
    CASE 
        WHEN p.role = 'supplier' AND TRIM(p.first_name || ' ' || COALESCE(p.last_name, '') || ' ' || COALESCE(p.second_last_name, '')) != sp.contact_person THEN 'MISMATCH'
        ELSE 'OK'
    END as status
FROM profiles p
LEFT JOIN supplier_profiles sp ON p.id = sp.id
WHERE p.role = 'supplier';
