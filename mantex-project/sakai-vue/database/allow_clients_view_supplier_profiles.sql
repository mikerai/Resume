-- Allow clients to view supplier profiles
-- This is needed so clients can see supplier information on their tickets

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Clients can view supplier profiles" ON supplier_profiles;

-- Create policy allowing clients to view supplier profiles
CREATE POLICY "Clients can view supplier profiles"
ON supplier_profiles FOR SELECT
USING (
    -- Allow if user is authenticated (clients need to see supplier info on their tickets)
    auth.role() = 'authenticated'
);

-- Ensure RLS is enabled
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;
