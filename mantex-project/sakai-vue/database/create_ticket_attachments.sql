-- =============================================
-- TICKET ATTACHMENTS TABLE
-- =============================================
-- Purpose: Store photos and documents linked to tickets with branch/asset context
-- Links tickets to their evidence files with full context tracking

-- Drop existing table if needed (for clean recreation)
DROP TABLE IF EXISTS ticket_attachments CASCADE;

-- Create ticket_attachments table
CREATE TABLE ticket_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES client_branches(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES client_assets(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- File information
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('photo', 'document', 'video')),
    file_name TEXT,
    file_size INTEGER, -- in bytes
    mime_type TEXT,
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX idx_ticket_attachments_branch_id ON ticket_attachments(branch_id);
CREATE INDEX idx_ticket_attachments_asset_id ON ticket_attachments(asset_id);
CREATE INDEX idx_ticket_attachments_uploaded_by ON ticket_attachments(uploaded_by);
CREATE INDEX idx_ticket_attachments_created_at ON ticket_attachments(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE ticket_attachments IS 'Photos, documents, and videos linked to tickets with branch/asset context';
COMMENT ON COLUMN ticket_attachments.file_url IS 'S3 URL or path to the file';
COMMENT ON COLUMN ticket_attachments.file_type IS 'Type of attachment: photo, document, or video';
COMMENT ON COLUMN ticket_attachments.branch_id IS 'Optional link to branch where photo was taken';
COMMENT ON COLUMN ticket_attachments.asset_id IS 'Optional link to asset shown in photo/document';

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view attachments for tickets they have access to
CREATE POLICY "Users can view ticket attachments"
ON ticket_attachments
FOR SELECT
USING (
    -- Clients can see attachments for their tickets
    ticket_id IN (
        SELECT t.id 
        FROM tickets t
        JOIN clients c ON t.client_id = c.id
        WHERE c.user_id = auth.uid()
    )
    OR
    -- Suppliers can see attachments for tickets assigned to them
    ticket_id IN (
        SELECT t.id 
        FROM tickets t
        JOIN supplier_profiles sp ON t.supplier_id = sp.id
        WHERE sp.user_id = auth.uid()
    )
    OR
    -- Admins can see all attachments
    auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
    )
);

-- Policy: Clients can upload attachments to their tickets
CREATE POLICY "Clients can upload ticket attachments"
ON ticket_attachments
FOR INSERT
WITH CHECK (
    uploaded_by = auth.uid()
    AND
    ticket_id IN (
        SELECT t.id 
        FROM tickets t
        JOIN clients c ON t.client_id = c.id
        WHERE c.user_id = auth.uid()
    )
);

-- Policy: Suppliers can upload attachments to their assigned tickets
CREATE POLICY "Suppliers can upload ticket attachments"
ON ticket_attachments
FOR INSERT
WITH CHECK (
    uploaded_by = auth.uid()
    AND
    ticket_id IN (
        SELECT t.id 
        FROM tickets t
        JOIN supplier_profiles sp ON t.supplier_id = sp.id
        WHERE sp.user_id = auth.uid()
    )
);

-- Policy: Users can update their own attachments
CREATE POLICY "Users can update own attachments"
ON ticket_attachments
FOR UPDATE
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

-- Policy: Users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
ON ticket_attachments
FOR DELETE
USING (uploaded_by = auth.uid());

-- Policy: Admins can manage all attachments
CREATE POLICY "Admins can manage all attachments"
ON ticket_attachments
FOR ALL
USING (
    auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
    )
);

-- =============================================
-- TRIGGER: Update updated_at timestamp
-- =============================================

CREATE OR REPLACE FUNCTION update_ticket_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_ticket_attachments_timestamp
    BEFORE UPDATE ON ticket_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_attachments_updated_at();

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

SELECT 'ticket_attachments table created successfully with RLS policies!' as status;
