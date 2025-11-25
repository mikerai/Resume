-- =============================================
-- CLIENT COMPANY MANAGEMENT - DATABASE SCHEMA
-- =============================================

-- Table: contact_persons
-- Purpose: Store contact persons for client companies
-- Can be assigned to multiple branches

CREATE TABLE IF NOT EXISTS contact_persons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name_paternal TEXT NOT NULL,
    last_name_maternal TEXT,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_persons_client_id ON contact_persons(client_id);
CREATE INDEX IF NOT EXISTS idx_contact_persons_email ON contact_persons(email);

-- Comments
COMMENT ON TABLE contact_persons IS 'Contact persons for client companies - can be assigned to multiple branches';
COMMENT ON COLUMN contact_persons.is_primary IS 'Indicates if this is the primary contact for the company';

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT '✅ contact_persons table created successfully!' as status;
