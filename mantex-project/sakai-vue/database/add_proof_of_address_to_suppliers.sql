-- Add proof of address fields to supplier_profiles table
-- This migration adds support for Nubarium proof of address validation
-- Supports: CFE, TELMEX, TELCEL, MEGACABLE, SKY, IZZI

-- Add proof of address columns
ALTER TABLE supplier_profiles
ADD COLUMN IF NOT EXISTS proof_of_address_type TEXT,
ADD COLUMN IF NOT EXISTS proof_of_address_name TEXT,
ADD COLUMN IF NOT EXISTS proof_of_address_street TEXT,
ADD COLUMN IF NOT EXISTS proof_of_address_colonia TEXT,
ADD COLUMN IF NOT EXISTS proof_of_address_city TEXT,
ADD COLUMN IF NOT EXISTS proof_of_address_cp TEXT,
ADD COLUMN IF NOT EXISTS proof_of_address_validated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS proof_of_address_validation_code TEXT,
ADD COLUMN IF NOT EXISTS proof_of_address_validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS proof_of_address_raw_data JSONB;

-- Create index for validation lookups
CREATE INDEX IF NOT EXISTS idx_supplier_proof_validated 
ON supplier_profiles(proof_of_address_validated);

-- Create index for proof type lookups
CREATE INDEX IF NOT EXISTS idx_supplier_proof_type 
ON supplier_profiles(proof_of_address_type);

-- Update approval score calculation to include proof of address
COMMENT ON COLUMN supplier_profiles.proof_of_address_validated IS 
'Indicates if the proof of address has been validated via Nubarium OCR';

COMMENT ON COLUMN supplier_profiles.proof_of_address_type IS 
'Type of proof document: CFE, TELMEX, TELCEL, MEGACABLE, SKY, IZZI';

COMMENT ON COLUMN supplier_profiles.proof_of_address_raw_data IS 
'Raw JSON response from Nubarium API for audit purposes';

-- Verification: Check that columns were added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'supplier_profiles' 
        AND column_name = 'proof_of_address_type'
    ) THEN
        RAISE NOTICE '✅ Proof of address columns added successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to add proof of address columns';
    END IF;
END $$;
