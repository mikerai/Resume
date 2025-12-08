-- Add latitude and longitude columns to client_profiles for map support
ALTER TABLE client_profiles
    ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create index for geospatial queries (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_client_profiles_lat_lon ON client_profiles (latitude, longitude);

-- Migrate existing lat/long from clients back up if needed
DO $$
BEGIN
    UPDATE client_profiles cp
    SET 
        latitude = c.latitude,
        longitude = c.longitude
    FROM clients_deprecated_backup c
    WHERE cp.user_id = c.user_id 
    AND cp.latitude IS NULL;
END $$;
