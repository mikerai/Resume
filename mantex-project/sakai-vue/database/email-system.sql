-- ==============================================
-- SISTEMA DE SIMULACIÓN DE EMAILS (QUEUE)
-- ==============================================

-- 1. TABLA email_queue
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    
    related_table TEXT, -- e.g. 'supplier_team_members'
    related_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage emails" ON email_queue
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 2. TRIGGER PARA INVITACIONES
CREATE OR REPLACE FUNCTION queue_supplier_invite_email()
RETURNS TRIGGER AS $$
DECLARE
    supplier_name TEXT;
    invite_link TEXT;
BEGIN
    -- Obtener nombre de la empresa
    SELECT company_name INTO supplier_name FROM supplier_profiles WHERE id = NEW.supplier_id;
    
    -- Link de invitación (apunta a la app o landing)
    invite_link := 'https://mantex.mx/signup?invite=' || NEW.id || '&email=' || NEW.email;

    -- Insertar en cola
    INSERT INTO email_queue (to_email, subject, body_html, related_table, related_id)
    VALUES (
        NEW.email,
        'Has sido invitado a unirte a ' || COALESCE(supplier_name, 'Mantex'),
        '<p>Hola ' || NEW.first_name || ',</p>' ||
        '<p>' || COALESCE(supplier_name, 'Una empresa') || ' te ha invitado a unirte a su equipo de técnicos en Mantex.</p>' ||
        '<p>Por favor regístrate aquí: <a href="' || invite_link || '">Aceptar Invitación</a></p>',
        'supplier_team_members',
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger definition
DROP TRIGGER IF EXISTS trg_queue_team_invite ON supplier_team_members;

CREATE TRIGGER trg_queue_team_invite
    AFTER INSERT ON supplier_team_members
    FOR EACH ROW
    WHEN (NEW.status = 'invited')
    EXECUTE FUNCTION queue_supplier_invite_email();
