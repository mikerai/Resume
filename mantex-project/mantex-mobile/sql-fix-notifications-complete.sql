-- Drop the existing table to recreate with correct columns
DROP TABLE IF EXISTS public.notification_subscriptions;

-- Create notification_subscriptions table with all required columns
CREATE TABLE IF NOT EXISTS public.notification_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_token TEXT,
    device_type VARCHAR(20) DEFAULT 'ios' CHECK (device_type IN ('ios', 'android', 'web')),
    notification_types TEXT[],
    location_region TEXT,
    location_city TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(technician_id)
);

-- Add RLS (Row Level Security)
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.notification_subscriptions
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = technician_id);

-- Policy: Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON public.notification_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = technician_id);

-- Policy: Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON public.notification_subscriptions
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = technician_id);

-- Policy: Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions" ON public.notification_subscriptions
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = technician_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_user_id ON public.notification_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_technician_id ON public.notification_subscriptions(technician_id);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_device_token ON public.notification_subscriptions(device_token);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_location ON public.notification_subscriptions(location_region, location_city);