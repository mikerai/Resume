-- ================================================
-- MANTEX - TABLA CLIENT_PROFILES PARA ONBOARDING
-- ================================================

-- Eliminar tabla existente si existe
DROP TABLE IF EXISTS client_profiles;

-- ==============================================
-- TABLA CLIENT_PROFILES
-- ==============================================
-- Esta tabla almacena los datos del onboarding de clientes
-- Se conecta con la tabla principal 'clients' una vez completado

CREATE TABLE client_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL, -- Referencia a auth.users.id
    username TEXT NOT NULL,

    -- Step 1: Datos de la Empresa
    company_name TEXT NOT NULL,
    business_type TEXT NOT NULL, -- 'corporation', 'sme', 'startup', 'individual'
    rfc TEXT,
    legal_address TEXT NOT NULL,

    -- Step 2: Información de Contacto
    contact_person TEXT NOT NULL,
    position TEXT, -- Cargo en la empresa
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    website_url TEXT,

    -- Step 3: Información del Negocio
    industry TEXT NOT NULL, -- Sector/industria
    company_size TEXT, -- 'small', 'medium', 'large', 'enterprise'
    number_of_locations INTEGER DEFAULT 1,
    annual_maintenance_budget DECIMAL(12,2),

    -- Step 4: Preferencias de Servicio
    service_locations JSONB DEFAULT '[]', -- Array de ubicaciones para servicio
    preferred_maintenance_schedule TEXT, -- 'monthly', 'quarterly', 'biannual', 'annual'
    emergency_contact_person TEXT,
    emergency_phone TEXT,
    special_requirements TEXT,

    -- Step 5: Información Fiscal (Opcional)
    billing_address TEXT,
    billing_contact TEXT,
    billing_email TEXT,
    payment_terms INTEGER DEFAULT 30, -- Días de crédito

    -- Step 6: Documentación (URLs de Supabase Storage)
    company_logo_url TEXT,
    id_document_url TEXT, -- INE/Pasaporte del contacto
    company_registration_url TEXT, -- Acta constitutiva
    tax_certificate_url TEXT, -- Cédula fiscal

    -- Datos de Validación y Status
    documents_validated BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'active', 'suspended'

    -- Preferencias del Sistema
    auto_assign_preventive BOOLEAN DEFAULT true,
    preferred_suppliers UUID[] DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}',

    -- Metadatos
    submitted_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- INDEXES PARA PERFORMANCE
-- ==============================================

CREATE INDEX idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX idx_client_profiles_status ON client_profiles(status);
CREATE INDEX idx_client_profiles_company_name ON client_profiles(company_name);
CREATE INDEX idx_client_profiles_created_at ON client_profiles(created_at);

-- ==============================================
-- RLS (Row Level Security) POLICIES
-- ==============================================

-- Enable RLS
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

-- Client Profiles Policies
CREATE POLICY "Users can view their own client profile" ON client_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own client profile" ON client_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own client profile" ON client_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all client profiles
CREATE POLICY "Admins can view all client profiles" ON client_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ==============================================
-- TRIGGER PARA AUTO-UPDATE DE TIMESTAMP
-- ==============================================

-- Función para actualizar updated_at (si no existe ya)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para client_profiles
CREATE TRIGGER update_client_profiles_updated_at
    BEFORE UPDATE ON client_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ==============================================

COMMENT ON TABLE client_profiles IS 'Datos de onboarding y perfil completo de clientes';
COMMENT ON COLUMN client_profiles.service_locations IS 'Array JSON de ubicaciones donde requieren servicio';
COMMENT ON COLUMN client_profiles.notification_preferences IS 'Preferencias de notificación en formato JSON';