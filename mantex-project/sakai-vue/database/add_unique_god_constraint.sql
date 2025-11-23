-- ============================================
-- CONSTRAINT: Único sub_role 'god' en profiles
-- ============================================
-- Esto garantiza que solo UN usuario puede tener sub_role = 'god'
-- en toda la tabla profiles (tu cuenta de GOD MODE)

ALTER TABLE profiles
ADD CONSTRAINT unique_god_subrole 
UNIQUE (sub_role) 
WHERE sub_role = 'god';

-- Verificar que la constraint se aplicó correctamente
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
AND constraint_name = 'unique_god_subrole';
