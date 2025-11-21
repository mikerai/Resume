-- ==============================================
-- MANTEX SCHEMA COMPLETO - PASO A PASO
-- ==============================================

-- LIMPIAR TABLAS EXISTENTES PARA EMPEZAR LIMPIO
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS ticket_status_history;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS suppliers;

-- PASO 1: Crear tabla suppliers completa
CREATE TABLE suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    rfc TEXT,
    ciec_validated BOOLEAN DEFAULT false,
    ine_front_url TEXT,
    ine_back_url TEXT,
    selfie_url TEXT,
    face_similarity_score DECIMAL(5,2),
    status TEXT DEFAULT 'pending',
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
CREATE TABLE clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    rfc TEXT,
    ciec_validated BOOLEAN DEFAULT false,
    ine_front_url TEXT,
    selfie_url TEXT,
    status TEXT DEFAULT 'active',
    auto_assign_preventive BOOLEAN DEFAULT true,
    preferred_suppliers UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 3: Crear tabla tickets (SIN foreign key constraints por simplicidad)
CREATE TABLE tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number TEXT UNIQUE,
    client_id UUID,
    supplier_id UUID,
    assigned_by UUID,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    category TEXT NOT NULL,
    maintenance_type TEXT NOT NULL,
    location_address TEXT NOT NULL,
    location_city TEXT,
    location_state TEXT,
    status TEXT DEFAULT 'pending',
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

-- PASO 4: Tablas auxiliares
CREATE TABLE ticket_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID,
    change_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID,
    sender_id UUID,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    ticket_id UUID,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 5: Función para generar ticket numbers
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

-- PASO 6: Trigger para auto-generar ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number_trigger
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();

-- PASO 7: Crear índices
CREATE INDEX idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_tickets_client_id ON tickets(client_id);
CREATE INDEX idx_tickets_supplier_id ON tickets(supplier_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);

-- PASO 8: Insertar datos de ejemplo
INSERT INTO suppliers (company_name, contact_person, phone, email, status, specialties) VALUES
('ElectroService SA', 'Juan Pérez', '555-1001', 'contacto@electroservice.com', 'approved', '["electricidad", "iluminacion"]'),
('PlomeroMax', 'María García', '555-1002', 'info@plomeromax.com', 'approved', '["plomeria", "climatizacion"]'),
('ManteniExpert', 'Carlos López', '555-1003', 'ventas@manteniexpert.com', 'pending', '["mantenimiento_general", "pintura"]'),
('TechFix Pro', 'Ana Rodríguez', '555-1004', 'admin@techfixpro.com', 'rejected', '["electronica", "computadoras"]');

INSERT INTO clients (company_name, contact_person, phone, email) VALUES
('Oficinas Centro SA', 'Ana Martínez', '555-2001', 'administracion@oficinascentro.com'),
('Hotel Plaza', 'Roberto Silva', '555-2002', 'mantenimiento@hotelplaza.com'),
('Restaurantes Unidos', 'Laura Fernández', '555-2003', 'operaciones@restaurantesunidos.com'),
('Centro Comercial Norte', 'Diego Herrera', '555-2004', 'facilidades@centronorte.com');

-- Insertar algunos tickets de ejemplo
INSERT INTO tickets (client_id, supplier_id, title, description, priority, category, maintenance_type, location_address, location_city, location_state, status, estimated_cost) VALUES
((SELECT id FROM clients WHERE company_name = 'Oficinas Centro SA'), (SELECT id FROM suppliers WHERE company_name = 'ElectroService SA'), 'Reparación Sistema Eléctrico', 'Se requiere revisión completa del sistema eléctrico del piso 3', 'high', 'electricidad', 'corrective', 'Av. Reforma 123, Piso 3', 'Ciudad de México', 'CDMX', 'in_progress', 15000.00),
((SELECT id FROM clients WHERE company_name = 'Hotel Plaza'), (SELECT id FROM suppliers WHERE company_name = 'PlomeroMax'), 'Mantenimiento Preventivo Plomería', 'Mantenimiento mensual de todas las instalaciones hidráulicas', 'medium', 'plomeria', 'preventive', 'Calle Juárez 456', 'Guadalajara', 'Jalisco', 'completed', 8500.00),
((SELECT id FROM clients WHERE company_name = 'Restaurantes Unidos'), NULL, 'Solicitud de Pintura', 'Se necesita pintar el área de comedor principal', 'low', 'pintura', 'corrective', 'Zona Rosa, Local 12', 'Ciudad de México', 'CDMX', 'pending', 5500.00);

-- PASO 9: Verificar que todo funciona
SELECT 'SUPPLIERS' as tabla, COUNT(*) as registros FROM suppliers
UNION ALL
SELECT 'CLIENTS' as tabla, COUNT(*) as registros FROM clients
UNION ALL
SELECT 'TICKETS' as tabla, COUNT(*) as registros FROM tickets;

-- Mostrar algunos datos
SELECT 'EJEMPLO DE TICKETS CON RELACIONES:' as info;
SELECT
    t.ticket_number,
    c.company_name as cliente,
    s.company_name as proveedor,
    t.title,
    t.status,
    t.estimated_cost
FROM tickets t
LEFT JOIN clients c ON t.client_id = c.id
LEFT JOIN suppliers s ON t.supplier_id = s.id;

SELECT '🌌 MANTEX SYSTEM READY! 🚀' as status;