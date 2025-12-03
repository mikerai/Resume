-- =====================================================
-- DYNAMIC SUPPLIER VERIFICATION SCHEMA
-- =====================================================

-- 1. QR TOKENS TABLE
-- Stores temporary tokens for technician validation
CREATE TABLE IF NOT EXISTS qr_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL, -- Optional: Link to specific service
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_qr_tokens_token ON qr_tokens(token);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_user_id ON qr_tokens(user_id);

-- RLS Policies
ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to allow re-run
DROP POLICY IF EXISTS "Users can view their own tokens" ON qr_tokens;
DROP POLICY IF EXISTS "Users can create their own tokens" ON qr_tokens;

-- Technicians can see their own tokens
CREATE POLICY "Users can view their own tokens" 
ON qr_tokens FOR SELECT 
USING (auth.uid() = user_id);

-- Technicians can create their own tokens (via RPC usually, but good to have)
CREATE POLICY "Users can create their own tokens" 
ON qr_tokens FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 2. RPC FUNCTIONS
-- =====================================================

-- GENERATE QR TOKEN
-- Call this from the Mobile App
CREATE OR REPLACE FUNCTION generate_qr_token(p_ticket_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (to insert into qr_tokens)
AS $$
DECLARE
    v_user_id UUID;
    v_token TEXT;
    v_expires_at TIMESTAMPTZ;
    v_role TEXT;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify user is a supplier (technician)
    SELECT role INTO v_role FROM profiles WHERE id = v_user_id;
    IF v_role != 'supplier' THEN
        RAISE EXCEPTION 'Only suppliers can generate QR tokens';
    END IF;

    -- Generate a simple UUID as token (sufficiently random for this use case)
    v_token := gen_random_uuid()::text;
    
    -- Set expiration (e.g., 24 hours from now)
    v_expires_at := NOW() + INTERVAL '24 hours';

    -- Insert token
    INSERT INTO qr_tokens (token, user_id, ticket_id, expires_at)
    VALUES (v_token, v_user_id, p_ticket_id, v_expires_at);

    -- Return result
    RETURN jsonb_build_object(
        'token', v_token,
        'expires_at', v_expires_at
    );
END;
$$;

-- VALIDATE QR TOKEN
-- Call this from the Web Portal (Client)
CREATE OR REPLACE FUNCTION validate_qr_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS to read tokens
AS $$
DECLARE
    v_record RECORD;
    v_provider RECORD;
    v_tickets JSONB;
BEGIN
    -- Find token
    SELECT * INTO v_record 
    FROM qr_tokens 
    WHERE token = p_token;

    -- Check if exists
    IF v_record IS NULL THEN
        RETURN jsonb_build_object('valid', false, 'message', 'Token not found');
    END IF;

    -- Check expiration
    IF v_record.expires_at < NOW() THEN
        RETURN jsonb_build_object('valid', false, 'message', 'Token expired');
    END IF;

    -- Get Provider Details (Public Info Only)
    SELECT 
        p.id, 
        p.username, 
        p.first_name, 
        p.last_name, 
        p.avatar_url,
        sp.company_name,
        sp.phone_number
    INTO v_provider
    FROM profiles p
    LEFT JOIN supplier_profiles sp ON p.id = sp.user_id
    WHERE p.id = v_record.user_id;

    -- Get Active Tickets for this Provider LINKED TO THIS CLIENT
    -- Only show tickets where the authenticated user is the client
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', t.id,
            'ticket_number', t.ticket_number,
            'title', t.title,
            'status', t.status
        )
    )
    INTO v_tickets
    FROM tickets t
    WHERE t.supplier_id = v_record.user_id
    AND t.client_id = auth.uid() -- CRITICAL: Only tickets for this client
    AND t.status IN ('assigned', 'in_progress');

    RETURN jsonb_build_object(
        'valid', true,
        'provider', jsonb_build_object(
            'id', v_provider.id,
            'full_name', v_provider.first_name || ' ' || v_provider.last_name,
            'company_name', v_provider.company_name,
            'photo_url', v_provider.avatar_url,
            'public_id', v_provider.username
        ),
        'tickets', COALESCE(v_tickets, '[]'::jsonb) -- Return list of tickets
    );
END;
$$;

-- SEARCH PROVIDER (SECURE)
-- Call this from Web Portal for manual search (Authenticated Clients Only)
CREATE OR REPLACE FUNCTION search_provider_secure(p_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_providers JSONB;
BEGIN
    -- Ensure caller is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'full_name', COALESCE(p.first_name || ' ' || p.last_name, p.username, 'Sin nombre'),
            'company_name', COALESCE(sp.company_name, 'Sin empresa'),
            'photo_url', p.avatar_url,
            'public_id', p.username,
            'email', au.email
        )
    )
    INTO v_providers
    FROM profiles p
    LEFT JOIN supplier_profiles sp ON p.id = sp.id
    LEFT JOIN auth.users au ON p.id = au.id
    WHERE p.role = 'supplier'
    AND (
        p.username ILIKE '%' || p_query || '%' OR
        (p.first_name || ' ' || p.last_name) ILIKE '%' || p_query || '%' OR
        au.email ILIKE '%' || p_query || '%'
    )
    LIMIT 5;

    IF v_providers IS NULL THEN
        RETURN jsonb_build_object('found', false, 'providers', '[]');
    ELSE
        RETURN jsonb_build_object('found', true, 'providers', v_providers);
    END IF;
END;
$$;
