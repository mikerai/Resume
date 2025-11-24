-- Enable clients to view supplier profiles for selection
-- This policy allows any authenticated user to view basic supplier info
-- We restrict the columns selected in the frontend query, but RLS needs to allow row access

-- 1. Check if policy exists and drop it to recreate
DROP POLICY IF EXISTS "Authenticated users can view supplier profiles" ON supplier_profiles;

-- 2. Create policy allowing read access to all authenticated users
-- This is necessary so clients can populate the "Select Supplier" dropdown
CREATE POLICY "Authenticated users can view supplier profiles" 
ON supplier_profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- 3. Ensure RLS is enabled
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;

RAISE NOTICE '✅ RLS policy updated: Authenticated users can now view supplier_profiles.';
