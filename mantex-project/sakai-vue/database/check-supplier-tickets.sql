-- Ver los tickets del supplier tron
SELECT 
    id,
    ticket_number,
    supplier_id,
    status,
    title
FROM tickets
WHERE supplier_id = 'b12cbd0a-472e-49d9-b0b4-0ba7bc3b2a99'
ORDER BY created_at DESC
LIMIT 10;

-- Verificar si la política está funcionando
-- Simular el check de la política para este usuario
SELECT 
    t.id as ticket_id,
    t.ticket_number,
    EXISTS (
        SELECT 1 FROM suppliers s 
        WHERE s.id = t.supplier_id 
        AND s.user_id = '63a60b07-5057-4ebb-a319-36bb9a989d01'
    ) as should_have_access
FROM tickets t
WHERE t.supplier_id = 'b12cbd0a-472e-49d9-b0b4-0ba7bc3b2a99'
LIMIT 5;
