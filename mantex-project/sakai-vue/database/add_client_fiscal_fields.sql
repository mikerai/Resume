-- =============================================
-- ADD FISCAL AND ADDRESS FIELDS TO CLIENTS
-- =============================================

-- Add fiscal information fields
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS legal_name TEXT,
ADD COLUMN IF NOT EXISTS fiscal_regime TEXT;

-- Add headquarters address fields (for backward compatibility)
-- Note: New implementations should use client_branches with is_headquarters=true
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS hq_street TEXT,
ADD COLUMN IF NOT EXISTS hq_number TEXT,
ADD COLUMN IF NOT EXISTS hq_apt TEXT,
ADD COLUMN IF NOT EXISTS hq_neighborhood TEXT,
ADD COLUMN IF NOT EXISTS hq_municipality_city TEXT,
ADD COLUMN IF NOT EXISTS hq_state TEXT,
ADD COLUMN IF NOT EXISTS hq_postal_code TEXT,
ADD COLUMN IF NOT EXISTS hq_picture TEXT,
ADD COLUMN IF NOT EXISTS hq_additional_pictures JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS hq_layout TEXT;

-- Add constraint for postal code format
ALTER TABLE clients
ADD CONSTRAINT IF NOT EXISTS chk_hq_postal_code 
CHECK (hq_postal_code IS NULL OR hq_postal_code ~ '^\d{5}$');

-- Comments
COMMENT ON COLUMN clients.tax_id IS 'RFC - Tax identification number';
COMMENT ON COLUMN clients.legal_name IS 'Legal/registered company name (may differ from commercial name)';
COMMENT ON COLUMN clients.fiscal_regime IS 'Tax regime classification';
COMMENT ON COLUMN clients.hq_street IS 'Headquarters street address';
COMMENT ON COLUMN clients.hq_picture IS 'S3 key for headquarters facade photo';
COMMENT ON COLUMN clients.hq_additional_pictures IS 'Array of S3 keys for additional HQ photos';
COMMENT ON COLUMN clients.hq_layout IS 'S3 key for headquarters layout diagram';

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT '✅ clients table updated with fiscal and address fields!' as status;
