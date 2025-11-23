-- Update Ticket Status Check Constraint
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;

ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (status IN (
    'pending', 
    'opened', 
    'rejected', 
    'in_progress', 
    'completed', 
    'under_review', 
    'revision_requested', 
    'approved', 
    'ready_for_payment', 
    'paid', 
    'closed', 
    'cancelled'
));

-- Add maintenance_type if not exists (it was in schema but good to ensure)
-- ALTER TABLE tickets ADD COLUMN IF NOT EXISTS maintenance_type TEXT DEFAULT 'corrective';

-- Function to handle status transitions and logging
CREATE OR REPLACE FUNCTION handle_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO ticket_status_history (
            ticket_id, 
            previous_status, 
            new_status, 
            changed_by, 
            change_reason
        ) VALUES (
            NEW.id, 
            OLD.status, 
            NEW.status, 
            auth.uid(), -- Assuming Supabase auth.uid() is available
            'Status transition'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_ticket_status_change ON tickets;
CREATE TRIGGER on_ticket_status_change
    AFTER UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION handle_ticket_status_change();
