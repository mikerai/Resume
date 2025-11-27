-- =============================================
-- MANTEX - VALIDACIÓN DE RELACIONES DE TABLAS
-- =============================================
-- Script de diagnóstico para identificar problemas de integridad
-- Fecha: 2025-11-27
-- Autor: Antigravity AI

-- =============================================
-- SECCIÓN 1: VALIDACIÓN DE PROFILES (AUTH)
-- =============================================

-- 1.1 Profiles sin datos básicos
SELECT 
    '⚠️ Profiles sin email' as issue,
    COUNT(*) as count
FROM auth.users
WHERE email IS NULL;

-- 1.2 Verificar metadata de roles
SELECT 
    '⚠️ Users sin role en metadata' as issue,
    COUNT(*) as count
FROM auth.users
WHERE raw_user_meta_data->>'role' IS NULL;

-- 1.3 Verificar onboarding status
SELECT 
    '⚠️ Onboarding incompleto por rol' as issue,
    raw_user_meta_data->>'role' as role,
    COUNT(*) as count
FROM auth.users
WHERE (raw_user_meta_data->>'onboarding_complete')::boolean = false
   OR raw_user_meta_data->>'onboarding_complete' IS NULL
GROUP BY raw_user_meta_data->>'role';

-- =============================================
-- SECCIÓN 2: VALIDACIÓN CLIENTS
-- =============================================

-- 2.1 Clients sin usuario en auth
SELECT 
    '❌ Clients sin usuario auth' as issue,
    COUNT(*) as count,
    array_agg(c.id) as client_ids
FROM clients c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE u.id IS NULL;

-- 2.2 Client_profiles sin clients
SELECT 
    '❌ Client_profiles sin clients' as issue,
    COUNT(*) as count,
    array_agg(cp.id) as client_profile_ids
FROM client_profiles cp
LEFT JOIN clients c ON cp.user_id = c.user_id
WHERE c.id IS NULL;

-- 2.3 Clients sin client_profiles
SELECT 
    '❌ Clients sin client_profiles' as issue,
    COUNT(*) as count,
    array_agg(c.id) as client_ids
FROM clients c
LEFT JOIN client_profiles cp ON c.user_id = cp.user_id
WHERE cp.id IS NULL;

-- =============================================
-- SECCIÓN 3: VALIDACIÓN SUPPLIERS
-- =============================================

-- 3.1 Suppliers sin usuario en auth
SELECT 
    '❌ Suppliers sin usuario auth' as issue,
    COUNT(*) as count,
    array_agg(s.id) as supplier_ids
FROM suppliers s
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE u.id IS NULL;

-- 3.2 Supplier_profiles sin suppliers
SELECT 
    '❌ Supplier_profiles sin suppliers' as issue,
    COUNT(*) as count,
    array_agg(sp.id) as supplier_profile_ids
FROM supplier_profiles sp
LEFT JOIN suppliers s ON sp.user_id = s.user_id
WHERE s.id IS NULL;

-- 3.3 Suppliers sin supplier_profiles
SELECT 
    '❌ Suppliers sin supplier_profiles' as issue,
    COUNT(*) as count,
    array_agg(s.id) as supplier_ids
FROM suppliers s
LEFT JOIN supplier_profiles sp ON s.user_id = sp.user_id
WHERE sp.id IS NULL;

-- =============================================
-- SECCIÓN 4: VALIDACIÓN DE DOCUMENTOS
-- =============================================

-- 4.1 INE verifications pendientes o fallidas
SELECT 
    '⚠️ INE verifications no verificadas' as issue,
    verification_status,
    COUNT(*) as count
FROM ine_verifications
WHERE verification_status != 'verified'
GROUP BY verification_status;

-- 4.2 INE verificadas sin response data
SELECT 
    '⚠️ INE verificadas sin datos' as issue,
    COUNT(*) as count
FROM ine_verifications
WHERE verification_status = 'verified' 
  AND verification_response IS NULL;

-- 4.3 SAT verifications pendientes o fallidas
SELECT 
    '⚠️ SAT verifications no verificadas' as issue,
    verification_status,
    COUNT(*) as count
FROM sat_verifications
WHERE verification_status != 'verified'
GROUP BY verification_status;

-- 4.4 SAT verificadas sin response data
SELECT 
    '⚠️ SAT verificadas sin datos' as issue,
    COUNT(*) as count
FROM sat_verifications
WHERE verification_status = 'verified' 
  AND validation_result IS NULL;

-- 4.5 Documentos sin S3 key
SELECT 
    '⚠️ Documents sin S3 key' as issue,
    document_type,
    COUNT(*) as count
FROM documents
WHERE s3_key IS NULL OR s3_key = ''
GROUP BY document_type;

-- =============================================
-- SECCIÓN 5: VALIDACIÓN DE DIRECCIONES
-- =============================================

-- 5.1 Supplier_profiles sin dirección completa
SELECT 
    '⚠️ Supplier_profiles sin dirección' as issue,
    COUNT(*) as count
FROM supplier_profiles
WHERE 
    street IS NULL OR
    municipality_city IS NULL OR
    state IS NULL;

-- 5.2 Clients sin dirección completa
SELECT 
    '⚠️ Clients sin dirección' as issue,
    COUNT(*) as count
FROM clients
WHERE 
    street IS NULL OR
    municipality_city IS NULL OR
    state IS NULL;

-- 5.3 Registros sin coordenadas (después de geocoding)
SELECT 
    'supplier_profiles sin coordenadas' as tabla,
    COUNT(*) as count
FROM supplier_profiles
WHERE latitude IS NULL OR longitude IS NULL
UNION ALL
SELECT 
    'clients sin coordenadas',
    COUNT(*)
FROM clients
WHERE latitude IS NULL OR longitude IS NULL
UNION ALL
SELECT 
    'client_branches sin coordenadas',
    COUNT(*)
FROM client_branches
WHERE latitude IS NULL OR longitude IS NULL;

-- =============================================
-- SECCIÓN 6: VALIDACIÓN DE TICKETS
-- =============================================

-- 6.1 Tickets sin client_id
SELECT 
    '❌ Tickets sin client' as issue,
    COUNT(*) as count,
    array_agg(id) as ticket_ids
FROM tickets
WHERE client_id IS NULL;

-- 6.2 Tickets con supplier_id inválido
SELECT 
    '❌ Tickets con supplier inválido' as issue,
    COUNT(*) as count
FROM tickets t
LEFT JOIN supplier_profiles sp ON t.supplier_id = sp.id
WHERE t.supplier_id IS NOT NULL AND sp.id IS NULL;

-- 6.3 Tickets con branch_id inválido
SELECT 
    '❌ Tickets con branch inválido' as issue,
    COUNT(*) as count
FROM tickets t
LEFT JOIN client_branches cb ON t.branch_id = cb.id
WHERE t.branch_id IS NOT NULL AND cb.id IS NULL;

-- 6.4 Tickets con asset_id inválido
SELECT 
    '❌ Tickets con asset inválido' as issue,
    COUNT(*) as count
FROM tickets t
LEFT JOIN client_assets ca ON t.asset_id = ca.id
WHERE t.asset_id IS NOT NULL AND ca.id IS NULL;

-- =============================================
-- SECCIÓN 7: RESUMEN GENERAL
-- =============================================

SELECT 
    '📊 RESUMEN GENERAL' as section,
    '' as detail;

SELECT 
    'Profiles totales' as metric,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
    'Clients totales',
    COUNT(*)
FROM clients
UNION ALL
SELECT 
    'Client_profiles totales',
    COUNT(*)
FROM client_profiles
UNION ALL
SELECT 
    'Suppliers totales',
    COUNT(*)
FROM suppliers
UNION ALL
SELECT 
    'Supplier_profiles totales',
    COUNT(*)
FROM supplier_profiles
UNION ALL
SELECT 
    'Tickets totales',
    COUNT(*)
FROM tickets
UNION ALL
SELECT 
    'Documents totales',
    COUNT(*)
FROM documents;

-- =============================================
-- FIN DEL DIAGNÓSTICO
-- =============================================

SELECT '✅ Diagnóstico completado. Revisa los resultados arriba.' as status;
