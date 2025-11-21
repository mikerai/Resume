-- ==============================================
-- MANTEX - CAMPOS ADICIONALES PARA REVISIÓN DE EVIDENCIAS
-- ==============================================

-- Agregar campos de aprobación a la tabla de evidencias
ALTER TABLE ticket_evidence
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS client_comments TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Agregar campos adicionales para el ticket
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS client_notes TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revision_requested_at TIMESTAMPTZ;

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_ticket_evidence_approval_status ON ticket_evidence(approval_status);
CREATE INDEX IF NOT EXISTS idx_ticket_evidence_approved_by ON ticket_evidence(approved_by);
CREATE INDEX IF NOT EXISTS idx_ticket_evidence_reviewed_by ON ticket_evidence(reviewed_by);

-- Función para actualizar automáticamente el estado general de evidencias del ticket
CREATE OR REPLACE FUNCTION update_ticket_evidence_approval_status()
RETURNS TRIGGER AS $$
DECLARE
    ticket_uuid UUID;
    total_evidence INTEGER;
    approved_evidence INTEGER;
    rejected_evidence INTEGER;
    new_evidence_status VARCHAR(20);
BEGIN
    -- Obtener el ticket_id
    ticket_uuid := COALESCE(NEW.ticket_id, OLD.ticket_id);

    -- Contar evidencias por estado de aprobación
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE approval_status = 'approved'),
        COUNT(*) FILTER (WHERE approval_status = 'rejected')
    INTO total_evidence, approved_evidence, rejected_evidence
    FROM ticket_evidence
    WHERE ticket_id = ticket_uuid;

    -- Determinar nuevo estado de evidencias
    IF total_evidence = 0 THEN
        new_evidence_status := 'pending';
    ELSIF rejected_evidence > 0 THEN
        new_evidence_status := 'rejected';
    ELSIF approved_evidence = total_evidence THEN
        new_evidence_status := 'approved';
    ELSE
        new_evidence_status := 'partial';
    END IF;

    -- Actualizar el ticket
    UPDATE tickets
    SET evidence_status = new_evidence_status
    WHERE id = ticket_uuid;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar estado automáticamente
DROP TRIGGER IF EXISTS update_evidence_approval_status_trigger ON ticket_evidence;
CREATE TRIGGER update_evidence_approval_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON ticket_evidence
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_evidence_approval_status();

-- Actualizar estados de evidencia existentes
UPDATE ticket_evidence
SET approval_status = 'pending'
WHERE approval_status IS NULL;

-- Comentarios en las nuevas columnas
COMMENT ON COLUMN ticket_evidence.approval_status IS 'Estado de aprobación de la evidencia por parte del cliente';
COMMENT ON COLUMN ticket_evidence.client_comments IS 'Comentarios del cliente sobre la evidencia';
COMMENT ON COLUMN ticket_evidence.approved_by IS 'ID del usuario cliente que aprobó la evidencia';
COMMENT ON COLUMN ticket_evidence.reviewed_by IS 'ID del usuario cliente que revisó la evidencia';

-- Verificar actualización
SELECT 'EVIDENCE REVIEW FIELDS ADDED! 📋' as status;

-- Mostrar conteo de evidencias por estado
SELECT
    approval_status,
    COUNT(*) as count
FROM ticket_evidence
GROUP BY approval_status;