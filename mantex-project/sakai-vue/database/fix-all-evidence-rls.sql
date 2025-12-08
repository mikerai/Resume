-- Fix completo para todas las tablas de evidencias

-- 1. ticket_evidence
ALTER TABLE ticket_evidence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view evidence for their tickets" ON ticket_evidence;
DROP POLICY IF EXISTS "Suppliers and technicians can manage evidence" ON ticket_evidence;

CREATE POLICY "Users can view evidence for their tickets" ON ticket_evidence FOR SELECT USING (
    ticket_id IN (SELECT t.id FROM tickets t WHERE t.client_id IN (SELECT c.id FROM clients c WHERE c.user_id = auth.uid()))
    OR ticket_id IN (SELECT t.id FROM tickets t WHERE t.supplier_id IN (SELECT sp.id FROM supplier_profiles sp WHERE sp.user_id = auth.uid()))
    OR ticket_id IN (SELECT t.id FROM tickets t INNER JOIN supplier_team_members stm ON t.supplier_id = stm.supplier_id WHERE stm.user_id = auth.uid() AND stm.status = 'active')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Suppliers and technicians can manage evidence" ON ticket_evidence FOR ALL USING (
    ticket_id IN (SELECT t.id FROM tickets t WHERE t.supplier_id IN (SELECT sp.id FROM supplier_profiles sp WHERE sp.user_id = auth.uid()))
    OR ticket_id IN (SELECT t.id FROM tickets t INNER JOIN supplier_team_members stm ON t.supplier_id = stm.supplier_id WHERE stm.user_id = auth.uid() AND stm.status = 'active')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. admin_evidence_actions
ALTER TABLE admin_evidence_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow trigger to insert" ON admin_evidence_actions;
DROP POLICY IF EXISTS "Admins can view actions" ON admin_evidence_actions;

CREATE POLICY "Allow trigger to insert" ON admin_evidence_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view actions" ON admin_evidence_actions FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. dispute_mediations
ALTER TABLE dispute_mediations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage mediations" ON dispute_mediations;
CREATE POLICY "Admins can manage mediations" ON dispute_mediations FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. mediation_drafts
ALTER TABLE mediation_drafts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage drafts" ON mediation_drafts;
CREATE POLICY "Admins can manage drafts" ON mediation_drafts FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. evidence_precedents
ALTER TABLE evidence_precedents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage precedents" ON evidence_precedents;
CREATE POLICY "Admins can manage precedents" ON evidence_precedents FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
