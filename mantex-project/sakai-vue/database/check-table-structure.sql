-- Ver estructura real de las tablas
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('tickets', 'supplier_profiles', 'clients', 'client_profiles')
AND column_name IN ('id', 'supplier_id', 'client_id', 'user_id')
ORDER BY table_name, ordinal_position;
