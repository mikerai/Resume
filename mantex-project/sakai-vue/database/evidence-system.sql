-- ==============================================
-- MANTEX - SISTEMA DE EVIDENCIAS PARA PROVEEDORES
-- ==============================================

-- Crear tabla para evidencias de tickets
CREATE TABLE IF NOT EXISTS ticket_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL,
    evidence_type VARCHAR(20) NOT NULL CHECK (evidence_type IN ('before', 'progress', 'after', 'document')),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('image', 'document')),
    file_size INTEGER NOT NULL,
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID,
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),

    -- Índices para búsqueda rápida
    CONSTRAINT fk_ticket_evidence_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_ticket_evidence_ticket_id ON ticket_evidence(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_evidence_type ON ticket_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_ticket_evidence_uploaded_by ON ticket_evidence(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_ticket_evidence_uploaded_at ON ticket_evidence(uploaded_at);

-- Actualizar tabla de tickets para incluir campos de evidencia
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS evidence_photos JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS evidence_documents JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS evidence_status VARCHAR(20) DEFAULT 'pending' CHECK (evidence_status IN ('pending', 'partial', 'complete', 'approved'));

-- Función para actualizar el estado de evidencias automáticamente
CREATE OR REPLACE FUNCTION update_ticket_evidence_status()
RETURNS TRIGGER AS $$
DECLARE
    before_count INTEGER;
    after_count INTEGER;
    doc_count INTEGER;
    new_status VARCHAR(20);
BEGIN
    -- Contar evidencias por tipo para este ticket
    SELECT
        COUNT(*) FILTER (WHERE evidence_type = 'before'),
        COUNT(*) FILTER (WHERE evidence_type = 'after'),
        COUNT(*) FILTER (WHERE evidence_type = 'document')
    INTO before_count, after_count, doc_count
    FROM ticket_evidence
    WHERE ticket_id = COALESCE(NEW.ticket_id, OLD.ticket_id);

    -- Determinar nuevo estado
    IF before_count = 0 AND after_count = 0 AND doc_count = 0 THEN
        new_status := 'pending';
    ELSIF before_count > 0 AND after_count > 0 THEN
        new_status := 'complete';
    ELSE
        new_status := 'partial';
    END IF;

    -- Actualizar el ticket
    UPDATE tickets
    SET evidence_status = new_status
    WHERE id = COALESCE(NEW.ticket_id, OLD.ticket_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar estado automáticamente
DROP TRIGGER IF EXISTS update_evidence_status_trigger ON ticket_evidence;
CREATE TRIGGER update_evidence_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON ticket_evidence
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_evidence_status();

-- Insertar algunos datos de ejemplo
INSERT INTO ticket_evidence (ticket_id, evidence_type, file_name, file_type, file_size, url, storage_path, uploaded_by, description)
SELECT
    t.id,
    'before',
    'initial_state_' || t.ticket_number || '_1.jpg',
    'image',
    1024000,
    'https://example.com/evidence/before_' || t.id || '_1.jpg',
    t.id::text || '/before/initial_state_1.jpg',
    t.supplier_id,
    'Estado inicial del área de trabajo'
FROM tickets t
WHERE t.status IN ('in_progress', 'completed')
LIMIT 3
ON CONFLICT DO NOTHING;

INSERT INTO ticket_evidence (ticket_id, evidence_type, file_name, file_type, file_size, url, storage_path, uploaded_by, description)
SELECT
    t.id,
    'after',
    'final_state_' || t.ticket_number || '_1.jpg',
    'image',
    1124000,
    'https://example.com/evidence/after_' || t.id || '_1.jpg',
    t.id::text || '/after/final_state_1.jpg',
    t.supplier_id,
    'Estado final después del trabajo completado'
FROM tickets t
WHERE t.status IN ('completed')
LIMIT 2
ON CONFLICT DO NOTHING;

-- Comentarios en las tablas
COMMENT ON TABLE ticket_evidence IS 'Evidencias fotográficas y documentales subidas por proveedores';
COMMENT ON COLUMN ticket_evidence.evidence_type IS 'Tipo de evidencia: before=inicial, progress=proceso, after=final, document=documento';
COMMENT ON COLUMN ticket_evidence.file_type IS 'Tipo de archivo: image=imagen, document=documento';

-- Crear política RLS básica (opcional)
/*
ALTER TABLE ticket_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view evidence for their tickets" ON ticket_evidence
    FOR SELECT USING (
        ticket_id IN (
            SELECT id FROM tickets
            WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
            OR supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Suppliers can manage evidence for their tickets" ON ticket_evidence
    FOR ALL USING (
        ticket_id IN (
            SELECT id FROM tickets
            WHERE supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid())
        )
    );
*/

-- Verificar creación exitosa
SELECT
    'EVIDENCE SYSTEM CREATED!' as status,
    COUNT(*) as sample_evidence_count
FROM ticket_evidence;

SELECT 'EVIDENCE TABLES READY! 📸' as result;