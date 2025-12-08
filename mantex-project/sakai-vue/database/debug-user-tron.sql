-- Verificar en qué tabla está el usuario tron@test.com
SELECT 
    'auth.users' as source,
    id,
    email
FROM auth.users 
WHERE email = 'tron@test.com';

-- Ver si está en suppliers
SELECT 
    'suppliers' as source,
    s.id,
    s.user_id,
    s.company_name,
    s.email
FROM suppliers s
WHERE s.user_id = '63a60b07-5057-4ebb-a319-36bb9a989d01';

-- Ver si está en clients  
SELECT 
    'clients' as source,
    c.id,
    c.user_id,
    c.company_name,
    c.email
FROM clients c
WHERE c.user_id = '63a60b07-5057-4ebb-a319-36bb9a989d01';

-- Ver si está en supplier_team_members
SELECT 
    'supplier_team_members' as source,
    stm.id,
    stm.user_id,
    stm.supplier_id,
    stm.role,
    stm.status
FROM supplier_team_members stm
WHERE stm.user_id = '63a60b07-5057-4ebb-a319-36bb9a989d01';
