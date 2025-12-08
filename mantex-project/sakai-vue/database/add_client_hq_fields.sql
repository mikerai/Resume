-- Add missing HQ columns to client_profiles to support Headquarters.vue requirements
ALTER TABLE client_profiles
    ADD COLUMN IF NOT EXISTS hq_street TEXT,
    ADD COLUMN IF NOT EXISTS hq_number TEXT,
    ADD COLUMN IF NOT EXISTS hq_apt TEXT,
    ADD COLUMN IF NOT EXISTS hq_neighborhood TEXT,
    ADD COLUMN IF NOT EXISTS hq_municipality_city TEXT,
    ADD COLUMN IF NOT EXISTS hq_state TEXT,
    ADD COLUMN IF NOT EXISTS hq_postal_code TEXT,
    ADD COLUMN IF NOT EXISTS hq_picture TEXT,
    ADD COLUMN IF NOT EXISTS hq_additional_pictures TEXT[],
    ADD COLUMN IF NOT EXISTS hq_layout TEXT;
