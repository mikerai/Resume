-- =============================================
-- CLIENT BRANCHES - DATABASE SCHEMA
-- =============================================

-- Table: client_branches
-- Purpose: Store client company branches with standardized addresses
-- Each branch must have a contact person assigned

CREATE TABLE IF NOT EXISTS client_branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_headquarters BOOLEAN DEFAULT false,
    contact_person_id UUID REFERENCES contact_persons(id) ON DELETE SET NULL,
    
    -- Standardized Address Fields
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    apt TEXT,
    neighborhood TEXT NOT NULL,
    municipality_city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    
    -- Optional Media (S3 keys)
    picture TEXT,
    additional_pictures JSONB DEFAULT '[]',
    layout TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_postal_code CHECK (postal_code ~ '^\d{5}$'),
    CONSTRAINT fk_contact_person FOREIGN KEY (contact_person_id) REFERENCES contact_persons(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_branches_client_id ON client_branches(client_id);
CREATE INDEX IF NOT EXISTS idx_client_branches_contact_person_id ON client_branches(contact_person_id);
CREATE INDEX IF NOT EXISTS idx_client_branches_is_headquarters ON client_branches(is_headquarters);

-- Comments
COMMENT ON TABLE client_branches IS 'Client company branches with standardized address structure';
COMMENT ON COLUMN client_branches.is_headquarters IS 'Only one branch per client should be marked as headquarters';
COMMENT ON COLUMN client_branches.picture IS 'S3 key for facade photo';
COMMENT ON COLUMN client_branches.additional_pictures IS 'Array of S3 keys for additional photos';
COMMENT ON COLUMN client_branches.layout IS 'S3 key for layout diagram (PDF or image)';

-- =============================================
-- TRIGGER: Ensure only one headquarters per client
-- =============================================

CREATE OR REPLACE FUNCTION ensure_single_headquarters()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a branch as headquarters
    IF NEW.is_headquarters = true THEN
        -- Set all other branches of this client to false
        UPDATE client_branches
        SET is_headquarters = false
        WHERE client_id = NEW.client_id 
        AND id != NEW.id
        AND is_headquarters = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ensure_single_headquarters
    BEFORE INSERT OR UPDATE ON client_branches
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_headquarters();

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT '✅ client_branches table created successfully with headquarters trigger!' as status;
