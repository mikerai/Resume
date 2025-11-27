-- =============================================
-- SINCRONIZACIÓN DE TABLAS - CREAR REGISTROS FALTANTES
-- =============================================
-- Script para crear registros faltantes en client_profiles y supplier_profiles

-- =============================================
-- PASO 1: IDENTIFICAR REGISTROS FALTANTES
-- =============================================

-- Clients sin client_profiles
SELECT 
    'CLIENTS SIN CLIENT_PROFILES' as tipo,
    c.id as client_id,
    c.user_id,
    c.company_name,
    c.contact_person,
    u.email,
    u.raw_user_meta_data->>'role' as role_in_auth
FROM clients c
LEFT JOIN client_profiles cp ON c.user_id = cp.user_id
INNER JOIN auth.users u ON c.user_id = u.id
WHERE cp.id IS NULL
ORDER BY c.created_at DESC;

-- Suppliers sin supplier_profiles
SELECT 
    'SUPPLIERS SIN SUPPLIER_PROFILES' as tipo,
    s.id as supplier_id,
    s.user_id,
    s.company_name,
    s.contact_person,
    u.email,
    u.raw_user_meta_data->>'role' as role_in_auth
FROM suppliers s
LEFT JOIN supplier_profiles sp ON s.user_id = sp.user_id
INNER JOIN auth.users u ON s.user_id = u.id
WHERE sp.id IS NULL
ORDER BY s.created_at DESC;

-- =============================================
-- PASO 2: CREAR REGISTROS FALTANTES
-- =============================================
-- DESCOMENTA SOLO DESPUÉS DE REVISAR PASO 1

/*
-- Crear client_profiles faltantes
INSERT INTO client_profiles (user_id, company_name, contact_person, created_at, updated_at)
SELECT 
    c.user_id,
    c.company_name,
    c.contact_person,
    NOW(),
    NOW()
FROM clients c
LEFT JOIN client_profiles cp ON c.user_id = cp.user_id
WHERE cp.id IS NULL
  AND c.user_id IN (SELECT id FROM auth.users);

-- Crear supplier_profiles faltantes
INSERT INTO supplier_profiles (user_id, company_name, contact_person, created_at, updated_at)
SELECT 
    s.user_id,
    s.company_name,
    s.contact_person,
    NOW(),
    NOW()
FROM suppliers s
LEFT JOIN supplier_profiles sp ON s.user_id = sp.user_id
WHERE sp.id IS NULL
  AND s.user_id IN (SELECT id FROM auth.users);
*/

-- =============================================
-- PASO 3: VERIFICAR SINCRONIZACIÓN
-- =============================================

/*
SELECT 
    'POST-SINCRONIZACIÓN' as status,
    'Clients sin client_profiles' as problema,
    COUNT(*) as count
FROM clients c
LEFT JOIN client_profiles cp ON c.user_id = cp.user_id
WHERE cp.id IS NULL
UNION ALL
SELECT 
    'POST-SINCRONIZACIÓN',
    'Suppliers sin supplier_profiles',
    COUNT(*)
FROM suppliers s
LEFT JOIN supplier_profiles sp ON s.user_id = sp.user_id
WHERE sp.id IS NULL;
*/
