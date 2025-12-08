-- POLÍTICA RLS CORRECTA PARA ticket_evidence
-- Basada en la estructura real: tickets.supplier_id → supplier_profiles.id

ALTER TABLE ticket_evidence ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Users can view evidence for their tickets" ON ticket_evidence;
DROP POLICY IF EXISTS "Suppliers can manage evidence for their tickets" ON ticket_evidence;
DROP POLICY IF EXISTS "Suppliers and technicians can manage evidence" ON ticket_evidence;
DROP POLICY IF EXISTS "Technicians can manage evidence" ON ticket_evidence;

-- Política de SELECT
CREATE POLICY "Users can view evidence for their tickets" ON ticket_evidence
    FOR SELECT USING (
        -- Clientes pueden ver evidencias (tickets.client_id → clients.id)
        ticket_id IN (
            SELECT t.id FROM tickets t
            WHERE t.client_id IN (
                SELECT c.id FROM clients c WHERE c.user_id = auth.uid()
            )
        )
        OR
        -- Proveedores pueden ver evidencias (tickets.supplier_id → supplier_profiles.id)
        ticket_id IN (
            SELECT t.id FROM tickets t
            WHERE t.supplier_id IN (
                SELECT sp.id FROM supplier_profiles sp WHERE sp.user_id = auth.uid()
            )
        )
        OR
        -- Técnicos pueden ver evidencias
        ticket_id IN (
            SELECT t.id FROM tickets t
            INNER JOIN supplier_team_members stm ON t.supplier_id = stm.supplier_id
            WHERE stm.user_id = auth.uid() AND stm.status = 'active'
        )
        OR
        -- Admins
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Política de INSERT/UPDATE/DELETE
CREATE POLICY "Suppliers and technicians can manage evidence" ON ticket_evidence
    FOR ALL USING (
        -- Proveedores (tickets.supplier_id → supplier_profiles.id)
        ticket_id IN (
            SELECT t.id FROM tickets t
            WHERE t.supplier_id IN (
                SELECT sp.id FROM supplier_profiles sp WHERE sp.user_id = auth.uid()
            )
        )
        OR
        -- Técnicos
        ticket_id IN (
            SELECT t.id FROM tickets t
            INNER JOIN supplier_team_members stm ON t.supplier_id = stm.supplier_id
            WHERE stm.user_id = auth.uid() AND stm.status = 'active'
        )
        OR
        -- Admins
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
