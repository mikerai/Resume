-- Update ticket status check constraint to enforce strict state machine
-- Allowed states: pending, in_progress, revision_requested, completed, approved, cancelled, opened, under_review, rejected, payment_pending, ready_for_payment, paid, closed

DO $$
BEGIN
    -- 1. Drop existing check constraint if it exists
    ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;

    -- 2. Add new check constraint with strict values
    ALTER TABLE tickets
    ADD CONSTRAINT tickets_status_check 
    CHECK (status IN (
        'pending', 
        'opened', 
        'in_progress', 
        'completed', 
        'revision_requested', 
        'under_review', 
        'approved', 
        'rejected', 
        'ready_for_payment', 
        'payment_pending', 
        'paid', 
        'closed', 
        'cancelled'
    ));

    RAISE NOTICE '✅ Ticket status constraint updated successfully.';
END $$;
