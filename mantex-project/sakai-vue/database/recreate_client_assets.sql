-- =============================================
-- RECREATE CLIENT ASSETS TABLE
-- =============================================

-- Drop existing table if it exists (and dependent objects)
DROP TABLE IF EXISTS client_assets CASCADE;

-- Create new client_assets table
CREATE TABLE client_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Asset Details
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'operational', -- operational, maintenance, out_of_order, retired
    
    -- Location Linking
    location_type TEXT NOT NULL CHECK (location_type IN ('HEADQUARTERS', 'BRANCH')),
    branch_id UUID REFERENCES client_branches(id) ON DELETE SET NULL,
    
    -- Media & Documents (S3 Keys)
    photos JSONB DEFAULT '[]',
    documents JSONB DEFAULT '[]',
    
    -- Metadata
    last_maintenance TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_branch_id CHECK (
        (location_type = 'BRANCH' AND branch_id IS NOT NULL) OR 
        (location_type = 'HEADQUARTERS')
    )
);

-- Indexes
CREATE INDEX idx_client_assets_client_id ON client_assets(client_id);
CREATE INDEX idx_client_assets_branch_id ON client_assets(branch_id);

-- Comments
COMMENT ON TABLE client_assets IS 'Inventory of client assets/equipment linked to specific locations';
COMMENT ON COLUMN client_assets.location_type IS 'HEADQUARTERS or BRANCH';
COMMENT ON COLUMN client_assets.photos IS 'Array of S3 keys for asset photos';
COMMENT ON COLUMN client_assets.documents IS 'Array of S3 keys for manuals/documents';

-- RLS Policies (Enable RLS)
ALTER TABLE client_assets ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own assets
CREATE POLICY "Clients can view own assets" ON client_assets
    FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM clients WHERE id = client_assets.client_id));

-- Policy: Clients can insert their own assets
CREATE POLICY "Clients can insert own assets" ON client_assets
    FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT user_id FROM clients WHERE id = client_assets.client_id));

-- Policy: Clients can update their own assets
CREATE POLICY "Clients can update own assets" ON client_assets
    FOR UPDATE
    USING (auth.uid() IN (SELECT user_id FROM clients WHERE id = client_assets.client_id));

-- Policy: Clients can delete their own assets
CREATE POLICY "Clients can delete own assets" ON client_assets
    FOR DELETE
    USING (auth.uid() IN (SELECT user_id FROM clients WHERE id = client_assets.client_id));

SELECT '✅ client_assets table recreated successfully!' as status;
