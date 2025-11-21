-- ==============================================
-- SISTEMA DE SUPPLIERS Y TICKETS PARA MANTEX
-- ==============================================

-- Extensión necesaria para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de suppliers (proveedores de mantenimiento)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(10),

    -- Campos específicos del onboarding
    rfc VARCHAR(13),
    ciec_validated BOOLEAN DEFAULT false,
    ine_front_url TEXT,
    ine_back_url TEXT,
    selfie_url TEXT,
    face_similarity_score DECIMAL(5,2),

    -- Estados del supplier
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,

    -- Especialidades y capacidades
    specialties JSONB DEFAULT '[]', -- ['electricidad', 'plomeria', 'aire_acondicionado']
    service_radius_km INTEGER DEFAULT 50,
    max_concurrent_jobs INTEGER DEFAULT 5,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_jobs INTEGER DEFAULT 0,

    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes (empresas que solicitan mantenimiento)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(10),

    -- Campos específicos del onboarding
    rfc VARCHAR(13),
    ciec_validated BOOLEAN DEFAULT false,
    ine_front_url TEXT,
    selfie_url TEXT,

    -- Estado del cliente
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),

    -- Configuraciones
    auto_assign_preventive BOOLEAN DEFAULT true,
    preferred_suppliers UUID[] DEFAULT '{}',

    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de tickets (solicitudes de mantenimiento)
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL, -- Generado automáticamente: MNT-2024-001

    -- Relaciones
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES auth.users(id), -- Admin que asignó

    -- Información básica
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category VARCHAR(50) NOT NULL, -- 'electricidad', 'plomeria', 'aire_acondicionado', etc.

    -- Tipo de mantenimiento
    maintenance_type VARCHAR(20) NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective')),

    -- Ubicación
    location_address TEXT NOT NULL,
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_coordinates POINT, -- PostGIS para ubicación exacta

    -- Estado del ticket
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'revision_requested', 'completed',
        'approved', 'cancelled', 'opened', 'under_review', 'rejected',
        'payment_pending', 'ready_for_payment', 'paid', 'closed'
    )),

    -- Precios y pagos
    estimated_cost DECIMAL(10,2),
    final_cost DECIMAL(10,2),
    supplier_quote DECIMAL(10,2),

    -- Fechas importantes
    scheduled_date TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    payment_due_date TIMESTAMP WITH TIME ZONE, -- 48h después de approved_at
    paid_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,

    -- Archivos adjuntos
    attachments JSONB DEFAULT '[]', -- URLs de archivos subidos por el cliente
    evidence_photos JSONB DEFAULT '[]', -- URLs de fotos de evidencia del supplier
    checklist_url TEXT, -- URL del checklist subido por el supplier

    -- Notas y comentarios
    client_notes TEXT,
    supplier_notes TEXT,
    admin_notes TEXT,
    rejection_reason TEXT,
    revision_comments TEXT,

    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para el historial de cambios de estado de tickets
CREATE TABLE IF NOT EXISTS ticket_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    type VARCHAR(50) NOT NULL, -- 'ticket_assigned', 'status_changed', 'payment_ready', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- Referencia al ticket si aplica
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,

    -- Estado de la notificación
    read_at TIMESTAMP WITH TIME ZONE,

    -- Metadatos adicionales
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ==============================================

-- Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_specialties ON suppliers USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_suppliers_city_state ON suppliers(city, state);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_city_state ON clients(city, state);

-- Tickets
CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_supplier_id ON tickets(supplier_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_maintenance_type ON tickets(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_scheduled_date ON tickets(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_ticket ON notifications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- Ticket Status History
CREATE INDEX IF NOT EXISTS idx_ticket_status_history_ticket ON ticket_status_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_status_history_created ON ticket_status_history(created_at);

-- ==============================================
-- POLÍTICAS RLS (Row Level Security)
-- ==============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para suppliers
CREATE POLICY "Suppliers can view own data" ON suppliers FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can manage suppliers" ON suppliers FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Políticas para clients
CREATE POLICY "Clients can view own data" ON clients FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can manage clients" ON clients FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Políticas para tickets
CREATE POLICY "Users can view relevant tickets" ON tickets FOR SELECT USING (
    -- Cliente puede ver sus propios tickets
    EXISTS (
        SELECT 1 FROM clients c
        WHERE c.id = tickets.client_id
        AND c.user_id = auth.uid()
    ) OR
    -- Supplier puede ver tickets asignados a él
    EXISTS (
        SELECT 1 FROM suppliers s
        WHERE s.id = tickets.supplier_id
        AND s.user_id = auth.uid()
    ) OR
    -- Admin puede ver todos
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Clients can create tickets" ON tickets FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM clients c
        WHERE c.id = client_id
        AND c.user_id = auth.uid()
    )
);

CREATE POLICY "Authorized users can update tickets" ON tickets FOR UPDATE USING (
    -- Cliente puede actualizar sus propios tickets (limitado)
    EXISTS (
        SELECT 1 FROM clients c
        WHERE c.id = tickets.client_id
        AND c.user_id = auth.uid()
    ) OR
    -- Supplier puede actualizar tickets asignados
    EXISTS (
        SELECT 1 FROM suppliers s
        WHERE s.id = tickets.supplier_id
        AND s.user_id = auth.uid()
    ) OR
    -- Admin puede actualizar todos
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- ==============================================
-- FUNCIONES ÚTILES
-- ==============================================

-- Función para generar número de ticket automático
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
    sequence_num INTEGER;
    ticket_num TEXT;
BEGIN
    -- Obtener el siguiente número en la secuencia para este año
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(ticket_number, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM tickets
    WHERE ticket_number LIKE 'MNT-' || current_year || '-%';

    -- Formatear el número con ceros a la izquierda
    ticket_num := 'MNT-' || current_year || '-' || LPAD(sequence_num::TEXT, 3, '0');

    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar el timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para generar ticket_number automáticamente
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number_trigger BEFORE INSERT ON tickets
    FOR EACH ROW EXECUTE FUNCTION set_ticket_number();

-- Trigger para crear historial de cambios de estado
CREATE OR REPLACE FUNCTION log_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar si el status cambió
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO ticket_status_history (
            ticket_id,
            previous_status,
            new_status,
            changed_by
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_ticket_status_change_trigger AFTER UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION log_ticket_status_change();

-- ==============================================
-- DATOS DE EJEMPLO PARA TESTING
-- ==============================================

-- Comentarios para documentación
COMMENT ON TABLE suppliers IS 'Proveedores de servicios de mantenimiento';
COMMENT ON TABLE clients IS 'Empresas clientes que solicitan servicios';
COMMENT ON TABLE tickets IS 'Solicitudes de mantenimiento y su seguimiento';
COMMENT ON TABLE ticket_status_history IS 'Historial de cambios de estado de tickets';
COMMENT ON TABLE notifications IS 'Sistema de notificaciones para usuarios';

COMMENT ON FUNCTION generate_ticket_number() IS 'Genera números de ticket únicos formato MNT-YYYY-NNN';
COMMENT ON FUNCTION update_updated_at_column() IS 'Actualiza automáticamente el campo updated_at';