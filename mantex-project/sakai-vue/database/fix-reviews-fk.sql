-- Corregir FK de reviews para apuntar a supplier_profiles
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewed_supplier_id_fkey;

ALTER TABLE reviews 
ADD CONSTRAINT reviews_reviewed_supplier_id_fkey 
FOREIGN KEY (reviewed_supplier_id) 
REFERENCES supplier_profiles(id) 
ON DELETE CASCADE;

-- Agregar política RLS para reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant reviews" ON reviews;
DROP POLICY IF EXISTS "Clients can create reviews for their tickets" ON reviews;
DROP POLICY IF EXISTS "Clients can update their own reviews" ON reviews;

CREATE POLICY "Users can view relevant reviews" ON reviews FOR SELECT USING (
    auth.uid() = reviewer_id 
    OR auth.uid() IN (SELECT user_id FROM supplier_profiles WHERE id = reviewed_supplier_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Clients can create reviews for their tickets" ON reviews FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
        SELECT 1 FROM tickets 
        WHERE id = ticket_id 
        AND client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
        AND status IN ('completed', 'closed', 'paid')
    )
);

CREATE POLICY "Clients can update their own reviews" ON reviews FOR UPDATE USING (
    auth.uid() = reviewer_id
) WITH CHECK (
    auth.uid() = reviewer_id
);
