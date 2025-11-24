-- Create ticket_chat_metadata table
-- This table mirrors Firebase chat data in Supabase for easier querying and notifications
-- Firebase Realtime Database path: chats/ticket_{ticket_id}/

-- Create the table
CREATE TABLE IF NOT EXISTS ticket_chat_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    firebase_chat_path TEXT NOT NULL,
    last_message_text TEXT,
    last_message_sender_id UUID REFERENCES auth.users(id),
    last_message_sender_name TEXT,
    last_message_timestamp TIMESTAMPTZ,
    unread_count_client INTEGER DEFAULT 0,
    unread_count_technician INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one chat per ticket
    CONSTRAINT unique_ticket_chat UNIQUE(ticket_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_chat_ticket_id 
ON ticket_chat_metadata(ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_chat_last_message 
ON ticket_chat_metadata(last_message_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_chat_unread_client 
ON ticket_chat_metadata(unread_count_client) 
WHERE unread_count_client > 0;

CREATE INDEX IF NOT EXISTS idx_ticket_chat_unread_tech 
ON ticket_chat_metadata(unread_count_technician) 
WHERE unread_count_technician > 0;

-- Add comments
COMMENT ON TABLE ticket_chat_metadata IS 
'Metadata for Firebase chat sessions, synced from Firebase Realtime Database';

COMMENT ON COLUMN ticket_chat_metadata.firebase_chat_path IS 
'Firebase path: chats/ticket_{ticket_id}';

COMMENT ON COLUMN ticket_chat_metadata.unread_count_client IS 
'Number of unread messages for the client';

COMMENT ON COLUMN ticket_chat_metadata.unread_count_technician IS 
'Number of unread messages for the technician';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_chat_metadata_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_ticket_chat_metadata_timestamp ON ticket_chat_metadata;
CREATE TRIGGER trigger_update_ticket_chat_metadata_timestamp
    BEFORE UPDATE ON ticket_chat_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_chat_metadata_timestamp();

-- Row Level Security (RLS) policies
ALTER TABLE ticket_chat_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view chat metadata for their own tickets
CREATE POLICY "Users can view their ticket chat metadata"
ON ticket_chat_metadata
FOR SELECT
USING (
    -- Client can see their own tickets
    EXISTS (
        SELECT 1 FROM tickets
        WHERE tickets.id = ticket_chat_metadata.ticket_id
        AND tickets.client_id = auth.uid()
    )
    OR
    -- Supplier/technician can see assigned tickets
    EXISTS (
        SELECT 1 FROM tickets
        WHERE tickets.id = ticket_chat_metadata.ticket_id
        AND tickets.supplier_id IN (
            SELECT id FROM suppliers WHERE user_id = auth.uid()
        )
    )
    OR
    -- Admins can see all
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Policy: System can insert/update chat metadata
CREATE POLICY "System can manage chat metadata"
ON ticket_chat_metadata
FOR ALL
USING (true)
WITH CHECK (true);

-- Verification
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'ticket_chat_metadata'
    ) THEN
        RAISE NOTICE '✅ ticket_chat_metadata table created successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to create ticket_chat_metadata table';
    END IF;
END $$;
