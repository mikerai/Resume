-- =============================================
-- LIMPIEZA DE REGISTROS HUÉRFANOS
-- =============================================
-- Script para eliminar registros sin usuario en auth.users
-- IMPORTANTE: Ejecutar en orden, revisar antes de ejecutar

-- =============================================
-- PASO 1: IDENTIFICAR REGISTROS A ELIMINAR
-- =============================================

-- Ver clients huérfanos (sin auth.users)
SELECT 
    'CLIENTS A ELIMINAR' as tipo,
    c.id,
    c.user_id,
    c.company_name,
    c.contact_person,
    c.created_at
FROM clients c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE u.id IS NULL
ORDER BY c.created_at DESC;

-- Ver suppliers huérfanos (sin auth.users)
SELECT 
    'SUPPLIERS A ELIMINAR' as tipo,
    s.id,
    s.user_id,
    s.company_name,
    s.contact_person,
    s.created_at
FROM suppliers s
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE u.id IS NULL
ORDER BY s.created_at DESC;

-- Ver supplier_profiles huérfanos (sin auth.users)
SELECT 
    'SUPPLIER_PROFILES A ELIMINAR' as tipo,
    sp.id,
    sp.user_id,
    sp.company_name,
    sp.created_at
FROM supplier_profiles sp
LEFT JOIN auth.users u ON sp.user_id = u.id
WHERE u.id IS NULL
ORDER BY sp.created_at DESC;

-- =============================================
-- PASO 2: ELIMINAR REGISTROS HUÉRFANOS
-- =============================================
-- DESCOMENTA LAS SIGUIENTES LÍNEAS SOLO DESPUÉS DE REVISAR EL PASO 1

/*
-- Eliminar clients huérfanos
DELETE FROM clients 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Eliminar suppliers huérfanos
DELETE FROM suppliers 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Eliminar supplier_profiles huérfanos
DELETE FROM supplier_profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users);
*/

-- =============================================
-- PASO 3: VERIFICAR LIMPIEZA
-- =============================================
-- Ejecutar después de descomentar y ejecutar PASO 2

/*
SELECT 
    'POST-LIMPIEZA' as status,
    'Clients huérfanos' as tabla,
    COUNT(*) as count
FROM clients c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'POST-LIMPIEZA',
    'Suppliers huérfanos',
    COUNT(*)
FROM suppliers s
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'POST-LIMPIEZA',
    'Supplier_profiles huérfanos',
    COUNT(*)
FROM supplier_profiles sp
LEFT JOIN auth.users u ON sp.user_id = u.id
WHERE u.id IS NULL;
*/
