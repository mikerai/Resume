-- Update the existing Tron supplier profile with real data

UPDATE supplier_profiles
SET 
    company_name = 'MIGUEL ANGEL RODRIGUEZ ALVAREZ ICAZA',
    contact_person = 'MIGUEL ANGEL RODRIGUEZ ALVAREZ ICAZA',
    status = 'approved',
    updated_at = NOW()
WHERE id = '86cbd6d7-899b-474a-87ea-cb9b0944c2c0';

-- Verify the update
SELECT id, user_id, company_name, contact_person, status
FROM supplier_profiles
WHERE id = '86cbd6d7-899b-474a-87ea-cb9b0944c2c0';
