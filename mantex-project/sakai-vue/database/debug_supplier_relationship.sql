-- Quick diagnostic query to check supplier_profiles and tickets relationship

-- 1. Check if the supplier_id exists in supplier_profiles
SELECT 'Checking if supplier_id exists in supplier_profiles:' as step;
SELECT id, user_id, company_name, contact_person 
FROM supplier_profiles 
WHERE id = '86cbd6d7-899b-474a-87ea-cb9b0944c2c0';

-- 2. Check if it exists in suppliers (old table)
SELECT 'Checking if supplier_id exists in suppliers (old table):' as step;
SELECT id, user_id, company_name, contact_person, status
FROM suppliers 
WHERE id = '86cbd6d7-899b-474a-87ea-cb9b0944c2c0';

-- 3. Show all supplier_profiles
SELECT 'All supplier_profiles:' as step;
SELECT id, user_id, company_name, contact_person, status
FROM supplier_profiles
ORDER BY created_at DESC;

-- 4. Show the problematic ticket
SELECT 'The problematic ticket:' as step;
SELECT id, ticket_number, title, supplier_id, status
FROM tickets
WHERE supplier_id = '86cbd6d7-899b-474a-87ea-cb9b0944c2c0';
