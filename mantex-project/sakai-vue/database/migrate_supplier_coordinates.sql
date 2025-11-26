-- =============================================
-- MIGRATE COORDINATES FROM SUPPLIERS TO SUPPLIER_PROFILES
-- =============================================
-- This script copies latitude and longitude from the suppliers table
-- to the supplier_profiles table based on user_id matching

-- Update supplier_profiles with coordinates from suppliers table
UPDATE supplier_profiles sp
SET 
    latitude = s.latitude,
    longitude = s.longitude,
    updated_at = NOW()
FROM suppliers s
WHERE sp.user_id = s.user_id
  AND s.latitude IS NOT NULL
  AND s.longitude IS NOT NULL;

-- Show results
SELECT 
    COUNT(*) as total_profiles,
    COUNT(latitude) as profiles_with_lat,
    COUNT(longitude) as profiles_with_lng
FROM supplier_profiles;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT '✅ Coordinates migrated from suppliers to supplier_profiles!' as status;
