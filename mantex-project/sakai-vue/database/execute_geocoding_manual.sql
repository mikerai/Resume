-- =============================================
-- GEOCODING MASIVO USANDO manual_geocode_table
-- =============================================
-- Script proporcionado por el usuario para ejecutar geocoding manual
-- Requiere que la función manual_geocode_table() y geocode_address() funcionen correctamente

-- 1. CLIENTS
SELECT * FROM manual_geocode_table('clients');

-- 2. SUPPLIER_PROFILES  
SELECT * FROM manual_geocode_table('supplier_profiles');

-- 3. SUPPLIERS
SELECT * FROM manual_geocode_table('suppliers');

-- 4. CLIENT_BRANCHES
SELECT * FROM manual_geocode_table('client_branches');

/*
-- Si quieres hacerlo en lotes de 50:
SELECT * FROM manual_geocode_table('clients', 50);
SELECT * FROM manual_geocode_table('supplier_profiles', 50);
SELECT * FROM manual_geocode_table('suppliers', 50);
SELECT * FROM manual_geocode_table('client_branches', 50);
*/

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================
SELECT 
  'Clients sin coords' as tabla, count(*) 
FROM clients WHERE latitude IS NULL
UNION ALL
SELECT 
  'Suppliers sin coords', count(*) 
FROM suppliers WHERE latitude IS NULL
UNION ALL
SELECT 
  'Supplier Profiles sin coords', count(*) 
FROM supplier_profiles WHERE latitude IS NULL
UNION ALL
SELECT 
  'Client Branches sin coords', count(*) 
FROM client_branches WHERE latitude IS NULL;
