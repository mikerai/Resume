-- Agregar política SELECT para supplier_branches
ALTER TABLE supplier_branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Suppliers can view their branches" ON supplier_branches;
DROP POLICY IF EXISTS "Suppliers can manage their branches" ON supplier_branches;

CREATE POLICY "Suppliers can view their branches" ON supplier_branches
FOR SELECT USING (
    supplier_id IN (SELECT id FROM supplier_profiles WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Suppliers can manage their branches" ON supplier_branches
FOR ALL USING (
    supplier_id IN (SELECT id FROM supplier_profiles WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
