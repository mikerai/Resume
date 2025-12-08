-- Agregar política SELECT faltante para reviews
DROP POLICY IF EXISTS "Users can view relevant reviews" ON reviews;

CREATE POLICY "Users can view relevant reviews" ON reviews 
FOR SELECT USING (
    auth.uid() = reviewer_id 
    OR auth.uid() IN (SELECT user_id FROM supplier_profiles WHERE id = reviewed_supplier_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
