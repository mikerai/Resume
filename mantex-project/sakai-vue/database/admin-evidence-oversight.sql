-- ==============================================
-- MANTEX - SISTEMA DE SUPERVISIÓN ADMINISTRATIVA DE EVIDENCIAS
-- ==============================================

-- Tabla para registro de mediaciones de disputas
CREATE TABLE IF NOT EXISTS dispute_mediations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID REFERENCES ticket_evidence(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,

    -- Detalles de la resolución
    resolution_type VARCHAR(50) NOT NULL CHECK (resolution_type IN (
        'approve-evidence', 'uphold-rejection', 'partial-resolution', 'escalate'
    )),
    summary TEXT NOT NULL,
    details TEXT NOT NULL,

    -- Evaluación del administrador
    evaluation JSONB DEFAULT '{}',

    -- Acciones de seguimiento
    actions JSONB DEFAULT '{}',
    deadline TIMESTAMPTZ,

    -- Metadatos de mediación
    mediated_by UUID,
    mediated_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'resolved' CHECK (status IN ('draft', 'resolved', 'escalated')),

    -- Seguimiento
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date TIMESTAMPTZ,
    follow_up_completed BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar campos adicionales a ticket_evidence para administración
ALTER TABLE ticket_evidence
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_reviewed_by UUID,
ADD COLUMN IF NOT EXISTS admin_resolution VARCHAR(50),
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_by UUID,
ADD COLUMN IF NOT EXISTS dispute_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT false;

-- Tabla para almacenar borradores de mediación
CREATE TABLE IF NOT EXISTS mediation_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID REFERENCES ticket_evidence(id) ON DELETE CASCADE,
    draft_data JSONB NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para historial de acciones administrativas
CREATE TABLE IF NOT EXISTS admin_evidence_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID REFERENCES ticket_evidence(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    performed_by UUID,
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para precedentes y referencias
CREATE TABLE IF NOT EXISTS evidence_precedents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    tags JSONB DEFAULT '[]',
    resolution_pattern TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_dispute_mediations_evidence_id ON dispute_mediations(evidence_id);
CREATE INDEX IF NOT EXISTS idx_dispute_mediations_ticket_id ON dispute_mediations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_dispute_mediations_mediated_by ON dispute_mediations(mediated_by);
CREATE INDEX IF NOT EXISTS idx_dispute_mediations_resolution_type ON dispute_mediations(resolution_type);
CREATE INDEX IF NOT EXISTS idx_dispute_mediations_status ON dispute_mediations(status);

CREATE INDEX IF NOT EXISTS idx_ticket_evidence_admin_reviewed ON ticket_evidence(admin_reviewed_at);
CREATE INDEX IF NOT EXISTS idx_ticket_evidence_admin_resolution ON ticket_evidence(admin_resolution);
CREATE INDEX IF NOT EXISTS idx_ticket_evidence_dispute_count ON ticket_evidence(dispute_count);
CREATE INDEX IF NOT EXISTS idx_ticket_evidence_escalated ON ticket_evidence(escalated);

CREATE INDEX IF NOT EXISTS idx_admin_evidence_actions_evidence_id ON admin_evidence_actions(evidence_id);
CREATE INDEX IF NOT EXISTS idx_admin_evidence_actions_type ON admin_evidence_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_evidence_actions_performed_by ON admin_evidence_actions(performed_by);

-- Función para registrar acciones administrativas automáticamente
CREATE OR REPLACE FUNCTION log_admin_evidence_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar si cambió algo relevante para admin
    IF (TG_OP = 'UPDATE' AND (
        OLD.admin_notes IS DISTINCT FROM NEW.admin_notes OR
        OLD.admin_resolution IS DISTINCT FROM NEW.admin_resolution OR
        OLD.approval_status IS DISTINCT FROM NEW.approval_status OR
        OLD.escalated IS DISTINCT FROM NEW.escalated
    )) OR TG_OP = 'INSERT' THEN

        INSERT INTO admin_evidence_actions (
            evidence_id,
            action_type,
            description,
            old_values,
            new_values,
            performed_by
        ) VALUES (
            NEW.id,
            CASE
                WHEN TG_OP = 'INSERT' THEN 'evidence_created'
                WHEN OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN 'status_changed'
                WHEN OLD.admin_resolution IS DISTINCT FROM NEW.admin_resolution THEN 'resolution_applied'
                WHEN OLD.admin_notes IS DISTINCT FROM NEW.admin_notes THEN 'admin_notes_updated'
                WHEN OLD.escalated IS DISTINCT FROM NEW.escalated THEN 'escalation_changed'
                ELSE 'evidence_updated'
            END,
            CASE
                WHEN TG_OP = 'INSERT' THEN 'Nueva evidencia creada'
                WHEN OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
                    'Estado cambiado de ' || COALESCE(OLD.approval_status, 'null') || ' a ' || NEW.approval_status
                ELSE 'Evidencia actualizada por administrador'
            END,
            CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD.*) ELSE NULL END,
            row_to_json(NEW.*),
            NEW.admin_reviewed_by
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para logging automático
DROP TRIGGER IF EXISTS log_admin_evidence_action_trigger ON ticket_evidence;
CREATE TRIGGER log_admin_evidence_action_trigger
    AFTER INSERT OR UPDATE ON ticket_evidence
    FOR EACH ROW
    EXECUTE FUNCTION log_admin_evidence_action();

-- Función para incrementar contador de disputas
CREATE OR REPLACE FUNCTION increment_dispute_counter()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ticket_evidence
    SET dispute_count = dispute_count + 1
    WHERE id = NEW.evidence_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para contar disputas
DROP TRIGGER IF EXISTS increment_dispute_counter_trigger ON dispute_mediations;
CREATE TRIGGER increment_dispute_counter_trigger
    AFTER INSERT ON dispute_mediations
    FOR EACH ROW
    EXECUTE FUNCTION increment_dispute_counter();

-- Función para generar estadísticas de evidencias
CREATE OR REPLACE FUNCTION get_evidence_statistics(
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    total_evidence BIGINT,
    approved_evidence BIGINT,
    rejected_evidence BIGINT,
    pending_evidence BIGINT,
    disputed_evidence BIGINT,
    escalated_evidence BIGINT,
    avg_resolution_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_evidence,
        COUNT(*) FILTER (WHERE te.approval_status = 'approved') as approved_evidence,
        COUNT(*) FILTER (WHERE te.approval_status = 'rejected') as rejected_evidence,
        COUNT(*) FILTER (WHERE te.approval_status = 'pending') as pending_evidence,
        COUNT(*) FILTER (WHERE te.dispute_count > 0) as disputed_evidence,
        COUNT(*) FILTER (WHERE te.escalated = true) as escalated_evidence,
        AVG(te.resolved_at - te.uploaded_at) FILTER (WHERE te.resolved_at IS NOT NULL) as avg_resolution_time
    FROM ticket_evidence te
    WHERE (start_date IS NULL OR te.uploaded_at >= start_date)
      AND (end_date IS NULL OR te.uploaded_at <= end_date);
END;
$$ LANGUAGE plpgsql;

-- Insertar algunos precedentes de ejemplo
INSERT INTO evidence_precedents (title, description, category, resolution_pattern, tags) VALUES
(
    'Fotos borrosas de estado inicial',
    'Cuando las fotos del estado inicial están borrosas pero se puede distinguir el problema',
    'quality_issues',
    'Aceptar si el problema es claramente visible, rechazar si impide la evaluación',
    '["photo_quality", "initial_state", "visibility"]'
),
(
    'Documentos en idioma incorrecto',
    'Facturas o documentos técnicos en idioma diferente al especificado',
    'documentation',
    'Solicitar traducción certificada o documento en idioma correcto',
    '["language", "documentation", "translation"]'
),
(
    'Evidencia de proceso insuficiente',
    'Proveedores que solo suben fotos inicial y final sin documentar el proceso',
    'completeness',
    'Solicitar evidencia del proceso de trabajo si es crítico para la evaluación',
    '["process", "completeness", "workflow"]'
)
ON CONFLICT DO NOTHING;

-- Comentarios en las tablas
COMMENT ON TABLE dispute_mediations IS 'Registro de mediaciones administrativas en disputas de evidencias';
COMMENT ON TABLE mediation_drafts IS 'Borradores de mediaciones guardados por administradores';
COMMENT ON TABLE admin_evidence_actions IS 'Historial de acciones administrativas sobre evidencias';
COMMENT ON TABLE evidence_precedents IS 'Base de conocimiento de precedentes para resolución de disputas';

-- Verificar creación exitosa
SELECT 'ADMIN EVIDENCE OVERSIGHT SYSTEM CREATED! 👑' as status;

-- Mostrar estadísticas iniciales
SELECT * FROM get_evidence_statistics();