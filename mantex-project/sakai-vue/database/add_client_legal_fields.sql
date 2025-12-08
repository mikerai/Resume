-- Add missing columns to support CompanyInfo.vue requirements
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS legal_name TEXT;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS fiscal_regime TEXT;
