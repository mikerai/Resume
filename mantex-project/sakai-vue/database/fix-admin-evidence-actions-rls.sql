-- Fix RLS para admin_evidence_actions
-- Esta tabla se llena automáticamente por un trigger

ALTER TABLE admin_evidence_actions ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Allow trigger to insert" ON admin_evidence_actions;
DROP POLICY IF EXISTS "Admins can view actions" ON admin_evidence_actions;

-- Permitir que el trigger inserte (SECURITY DEFINER en el trigger no es suficiente)
CREATE POLICY "Allow trigger to insert" ON admin_evidence_actions
    FOR INSERT
    WITH CHECK (true);  -- Permitir todos los inserts (vienen del trigger)

-- Solo admins pueden ver el historial
CREATE POLICY "Admins can view actions" ON admin_evidence_actions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
