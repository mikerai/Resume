-- =============================================
-- VALIDACIÓN RÁPIDA - CONTEOS GENERALES
-- =============================================
-- Ejecuta este script para ver un resumen rápido del estado de la DB

SELECT 'RESUMEN GENERAL' as seccion, '' as detalle, 0 as count
UNION ALL
SELECT '---', '---', 0
UNION ALL
SELECT 'Auth Users', 'Total usuarios registrados', COUNT(*)::int FROM auth.users
UNION ALL
SELECT 'Clients', 'Total registros', COUNT(*)::int FROM clients
UNION ALL
SELECT 'Client Profiles', 'Total registros', COUNT(*)::int FROM client_profiles
UNION ALL
SELECT 'Suppliers', 'Total registros', COUNT(*)::int FROM suppliers
UNION ALL
SELECT 'Supplier Profiles', 'Total registros', COUNT(*)::int FROM supplier_profiles
UNION ALL
SELECT 'Tickets', 'Total registros', COUNT(*)::int FROM tickets
UNION ALL
SELECT '---', '---', 0
UNION ALL
SELECT 'PROBLEMAS CRÍTICOS', '', 0
UNION ALL
SELECT '---', '---', 0
UNION ALL
SELECT 'Clients huérfanos', 'Sin usuario auth', (SELECT COUNT(*)::int FROM clients c LEFT JOIN auth.users u ON c.user_id = u.id WHERE u.id IS NULL)
UNION ALL
SELECT 'Clients sin profile', 'Sin client_profiles', (SELECT COUNT(*)::int FROM clients c LEFT JOIN client_profiles cp ON c.user_id = cp.user_id WHERE cp.id IS NULL)
UNION ALL
SELECT 'Client profiles huérfanos', 'Sin clients', (SELECT COUNT(*)::int FROM client_profiles cp LEFT JOIN clients c ON cp.user_id = c.user_id WHERE c.id IS NULL)
UNION ALL
SELECT 'Suppliers huérfanos', 'Sin usuario auth', (SELECT COUNT(*)::int FROM suppliers s LEFT JOIN auth.users u ON s.user_id = u.id WHERE u.id IS NULL)
UNION ALL
SELECT 'Suppliers sin profile', 'Sin supplier_profiles', (SELECT COUNT(*)::int FROM suppliers s LEFT JOIN supplier_profiles sp ON s.user_id = sp.user_id WHERE sp.id IS NULL)
UNION ALL
SELECT 'Supplier profiles huérfanos', 'Sin suppliers', (SELECT COUNT(*)::int FROM supplier_profiles sp LEFT JOIN suppliers s ON sp.user_id = s.user_id WHERE s.id IS NULL)
UNION ALL
SELECT '---', '---', 0
UNION ALL
SELECT 'DIRECCIONES', '', 0
UNION ALL
SELECT '---', '---', 0
UNION ALL
SELECT 'Suppliers sin dirección', 'street/city/state NULL', (SELECT COUNT(*)::int FROM supplier_profiles WHERE street IS NULL OR municipality_city IS NULL OR state IS NULL)
UNION ALL
SELECT 'Clients sin dirección', 'street/city/state NULL', (SELECT COUNT(*)::int FROM clients WHERE street IS NULL OR municipality_city IS NULL OR state IS NULL)
UNION ALL
SELECT 'Suppliers sin coordenadas', 'lat/lng NULL', (SELECT COUNT(*)::int FROM supplier_profiles WHERE latitude IS NULL OR longitude IS NULL)
UNION ALL
SELECT 'Clients sin coordenadas', 'lat/lng NULL', (SELECT COUNT(*)::int FROM clients WHERE latitude IS NULL OR longitude IS NULL)
UNION ALL
SELECT '---', '---', 0
UNION ALL
SELECT 'DOCUMENTOS', '', 0
UNION ALL
SELECT '---', '---', 0
UNION ALL
SELECT 'INE no verificadas', 'status != verified', (SELECT COUNT(*)::int FROM ine_verifications WHERE verification_status != 'verified')
UNION ALL
SELECT 'SAT no verificadas', 'status != verified', (SELECT COUNT(*)::int FROM sat_verifications WHERE verification_status != 'verified')
UNION ALL
SELECT 'Documents sin S3 key', 's3_key NULL', (SELECT COUNT(*)::int FROM documents WHERE s3_key IS NULL OR s3_key = '')
ORDER BY seccion, detalle;
