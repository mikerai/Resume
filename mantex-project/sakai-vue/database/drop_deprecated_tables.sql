-- ==============================================
-- FINAL CLEANUP: REMOVE OBSOLETE TABLES
-- ==============================================

-- 1. Drop the temporary backup tables if they exist
-- These were renamed from the original tables during migration
DROP TABLE IF EXISTS clients_deprecated_backup;
DROP TABLE IF EXISTS suppliers_deprecated_backup;

-- 2. Ensure no standard 'clients' or 'suppliers' tables exist
-- (They should have been renamed, but just in case)
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS suppliers;

-- 3. Verify clean state
DO $$
BEGIN
    RAISE NOTICE 'Cleanup complete. Only client_profiles and supplier_profiles should remain.';
END $$;
