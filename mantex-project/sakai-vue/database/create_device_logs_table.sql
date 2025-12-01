-- =====================================================
-- DEVICE LOGS TABLE
-- =====================================================
-- Purpose: Store references to device metadata logs uploaded to S3
-- Security: RLS enabled, only insertable by authenticated users (own data)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_device_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT, -- Device UUID from Capacitor
    s3_key TEXT NOT NULL, -- Path in S3
    s3_url TEXT, -- Signed URL or direct link (be careful with expiration)
    raw_data JSONB, -- Optional: Store small metadata directly here for quick access
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_device_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own logs
CREATE POLICY "Users can insert their own device logs" 
ON user_device_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own logs (optional, mostly for admin/system)
CREATE POLICY "Users can view their own device logs" 
ON user_device_logs FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Service Role (Admins) can view all
-- (Implicitly true for service_role, but explicit for admin users if needed)
