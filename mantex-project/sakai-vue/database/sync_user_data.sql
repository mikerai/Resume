-- =====================================================
-- DATA SYNCHRONIZATION SYSTEM (SIMPLIFIED)
-- =====================================================
-- Purpose: Update profiles.full_name when onboarding completes
-- Direction: client_profiles/supplier_profiles → profiles (ONE WAY)
-- =====================================================

-- =====================================================
-- 1. SYNC FUNCTIONS (Simplified - One Direction Only)
-- =====================================================

-- This function will be called manually by onboarding components
-- No automatic triggers to avoid schema conflicts
CREATE OR REPLACE FUNCTION sync_profile_name(p_user_id UUID, p_full_name TEXT)
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET 
        full_name = p_full_name,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. MANUAL SYNC FUNCTION (for existing data)
-- =====================================================

CREATE OR REPLACE FUNCTION sync_all_user_data()
RETURNS TABLE (
    action TEXT,
    affected_rows INTEGER
) AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- This function is intentionally simplified
    -- It will be called manually when needed
    
    RAISE NOTICE 'Manual sync disabled - use onboarding components to update profiles';
    
    -- Return empty result
    RETURN QUERY
    SELECT 'Manual sync disabled'::TEXT, 0::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. QUOTE ESTIMATED COST SYSTEM
-- =====================================================

-- Add estimated_cost column to tickets if it doesn't exist
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2);

-- Function to update ticket estimated cost when quote is approved
CREATE OR REPLACE FUNCTION update_ticket_estimated_cost()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND NEW.total_amount IS NOT NULL THEN
        UPDATE tickets
        SET 
            estimated_cost = NEW.total_amount,
            updated_at = NOW()
        WHERE id = NEW.ticket_id;
        
        RAISE NOTICE 'Updated estimated_cost for ticket % to %', NEW.ticket_id, NEW.total_amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_estimated_cost ON quotes;

-- Create trigger
CREATE TRIGGER trigger_update_estimated_cost
AFTER INSERT OR UPDATE OF status, total_amount ON quotes
FOR EACH ROW
WHEN (NEW.status = 'approved')
EXECUTE FUNCTION update_ticket_estimated_cost();

-- =====================================================
-- 5. EXECUTE INITIAL SYNC
-- =====================================================

-- Run the sync for existing data (will show notice that manual sync is disabled)
SELECT * FROM sync_all_user_data();

-- =====================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION sync_profile_name IS 'Updates profiles.full_name for a specific user - called by onboarding components';
COMMENT ON FUNCTION sync_all_user_data IS 'Simplified sync function - manual sync disabled, use onboarding components';
COMMENT ON FUNCTION update_ticket_estimated_cost IS 'Updates ticket estimated_cost when quote is approved';
