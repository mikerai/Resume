-- ==============================================
-- MANTEX SYSTEM - VERSIÓN SIMPLE PARA FUNCIONAR YA
-- ==============================================

-- PASO 1: Crear solo la tabla suppliers primero
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(10),
    rfc VARCHAR(13),
    ciec_validated BOOLEAN DEFAULT false,
    ine_front_url TEXT,
    ine_back_url TEXT,
    selfie_url TEXT,
    face_similarity_score DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'pending',
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    rejection_reason TEXT,
    specialties JSONB DEFAULT '[]',
    service_radius_km INTEGER DEFAULT 50,
    max_concurrent_jobs INTEGER DEFAULT 5,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_jobs INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 2: Crear tabla clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(10),
    rfc VARCHAR(13),
    ciec_validated BOOLEAN DEFAULT false,
    ine_front_url TEXT,
    selfie_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    auto_assign_preventive BOOLEAN DEFAULT true,
    preferred_suppliers UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 3: Crear tabla tickets SIN foreign key constraints por ahora
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(20) UNIQUE,
    client_id UUID,
    supplier_id UUID,
    assigned_by UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium',
    category VARCHAR(50) NOT NULL,
    maintenance_type VARCHAR(20) NOT NULL,
    location_address TEXT NOT NULL,
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    status VARCHAR(30) DEFAULT 'pending',
    estimated_cost DECIMAL(10,2),
    final_cost DECIMAL(10,2),
    supplier_quote DECIMAL(10,2),
    scheduled_date TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    payment_due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    attachments JSONB DEFAULT '[]',
    evidence_photos JSONB DEFAULT '[]',
    checklist_url TEXT,
    client_notes TEXT,
    supplier_notes TEXT,
    admin_notes TEXT,
    rejection_reason TEXT,
    revision_comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 4: Crear tablas auxiliares
CREATE TABLE IF NOT EXISTS ticket_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by UUID,
    change_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID,
    sender_id UUID,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    ticket_id UUID,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 5: Función simple para generar ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
    sequence_num INTEGER;
    ticket_num TEXT;
BEGIN
    SELECT COALESCE(MAX(
        CASE
            WHEN ticket_number ~ '^MNT-[0-9]{4}-[0-9]{3}$' THEN
                CAST(SPLIT_PART(ticket_number, '-', 3) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO sequence_num
    FROM tickets
    WHERE ticket_number LIKE 'MNT-' || current_year || '-%';

    ticket_num := 'MNT-' || current_year || '-' || LPAD(sequence_num::TEXT, 3, '0');
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- PASO 6: Trigger para auto-generar ticket number
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS set_ticket_number_trigger ON tickets;
CREATE TRIGGER set_ticket_number_trigger
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();

-- PASO 7: Crear algunos índices básicos
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_supplier_id ON tickets(supplier_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);

-- PASO 8: Insertar datos de ejemplo para testing
INSERT INTO suppliers (company_name, contact_person, phone, email, status, specialties) VALUES
('ElectroService SA', 'Juan Pérez', '555-1001', 'contacto@electroservice.com', 'approved', '["electricidad", "iluminacion"]'),
('PlomeroMax', 'María García', '555-1002', 'info@plomeromax.com', 'approved', '["plomeria", "climatizacion"]'),
('ManteniExpert', 'Carlos López', '555-1003', 'ventas@manteniexpert.com', 'pending', '["mantenimiento_general", "pintura"]')
ON CONFLICT DO NOTHING;

INSERT INTO clients (company_name, contact_person, phone, email) VALUES
('Oficinas Centro SA', 'Ana Martínez', '555-2001', 'administracion@oficinascentro.com'),
('Hotel Plaza', 'Roberto Silva', '555-2002', 'mantenimiento@hotelplaza.com'),
('Restaurantes Unidos', 'Laura Fernández', '555-2003', 'operaciones@restaurantesunidos.com')
ON CONFLICT DO NOTHING;

-- COMENTARIOS
COMMENT ON TABLE suppliers IS 'Proveedores de servicios de mantenimiento';
COMMENT ON TABLE clients IS 'Empresas clientes que solicitan servicios';
COMMENT ON TABLE tickets IS 'Solicitudes de mantenimiento y su seguimiento';

-- ¡LISTO! 🌌
SELECT 'MANTEX SYSTEM CREADO EXITOSAMENTE! 🚀' as status;