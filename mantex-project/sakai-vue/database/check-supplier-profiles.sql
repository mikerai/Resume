-- Verificar si existe supplier_profiles
SELECT 
    'supplier_profiles' as source,
    sp.id,
    sp.user_id,
    sp.company_name
FROM supplier_profiles sp
WHERE sp.user_id = '63a60b07-5057-4ebb-a319-36bb9a989d01';

-- Ver tickets con supplier_profiles
SELECT 
    t.id,
    t.ticket_number,
    t.supplier_id,
    t.status
FROM tickets t
WHERE t.supplier_id IN (
    SELECT id FROM supplier_profiles WHERE user_id = '63a60b07-5057-4ebb-a319-36bb9a989d01'
)
LIMIT 10;
