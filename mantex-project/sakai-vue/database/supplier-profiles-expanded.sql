-- ================================================
-- MANTEX - TABLA SUPPLIER_PROFILES EXPANDIDA
-- ================================================

-- Eliminar tabla existente para recrearla expandida
DROP TABLE IF EXISTS supplier_profiles;

-- ==============================================
-- TABLA SUPPLIER_PROFILES EXPANDIDA
-- ==============================================
-- Esta tabla almacena los datos completos del onboarding de proveedores

CREATE TABLE supplier_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL, -- Referencia a auth.users.id
    username TEXT NOT NULL,

    -- Step 1: Datos de la Empresa & SAT
    company_name TEXT NOT NULL,
    business_type TEXT NOT NULL, -- 'sole_proprietorship', 'corporation', 'partnership', 'llc'
    rfc TEXT NOT NULL,
    sat_password_encrypted TEXT NOT NULL, -- 🔑 CAMPO CRÍTICO PARA EXTRACCIÓN DE FACTURAS
    legal_address TEXT NOT NULL,
    tax_regime TEXT, -- Régimen fiscal (ej: 'General', 'Simplificado de Confianza', etc.)

    -- Step 2: Información de Contacto Principal
    contact_person TEXT NOT NULL,
    position TEXT, -- Cargo del contacto (Gerente, Director, etc.)
    phone_number TEXT NOT NULL,
    mobile_number TEXT,
    email TEXT NOT NULL,
    website_url TEXT,

    -- Step 3: Información Operativa Detallada
    service_areas TEXT[] DEFAULT '{}', -- Array de ciudades/estados donde operan
    service_radius_km INTEGER DEFAULT 50, -- Radio de servicio en kilómetros
    specialties TEXT[] DEFAULT '{}', -- Array de especialidades técnicas
    categories TEXT[] DEFAULT '{}', -- Categorías de servicios (HVAC, Electrical, Plumbing, etc.)
    years_experience INTEGER DEFAULT 0,
    company_founding_year INTEGER,
    team_size INTEGER DEFAULT 1,
    technicians_count INTEGER DEFAULT 1,
    administrative_staff INTEGER DEFAULT 0,

    -- Step 4: Capacidades y Certificaciones
    certifications TEXT[] DEFAULT '{}', -- Certificaciones técnicas
    licenses TEXT[] DEFAULT '{}', -- Licencias gubernamentales
    insurance_policies TEXT[] DEFAULT '{}', -- Pólizas de seguro
    max_concurrent_jobs INTEGER DEFAULT 5,
    emergency_service_available BOOLEAN DEFAULT false,
    weekend_service_available BOOLEAN DEFAULT false,
    holiday_service_available BOOLEAN DEFAULT false,

    -- Step 5: Información Fiscal y Bancaria
    bank_name TEXT,
    account_holder_name TEXT,
    account_number_encrypted TEXT, -- Cifrado básico
    clabe_encrypted TEXT, -- CLABE interbancaria cifrada
    swift_code TEXT, -- Para transferencias internacionales si aplica

    -- Step 6: Horarios y Disponibilidad
    working_hours JSONB DEFAULT '{"monday": "8:00-17:00", "tuesday": "8:00-17:00", "wednesday": "8:00-17:00", "thursday": "8:00-17:00", "friday": "8:00-17:00", "saturday": "closed", "sunday": "closed"}',
    emergency_hours JSONB DEFAULT '{}',
    response_time_standard TEXT DEFAULT '24_hours', -- '2_hours', '24_hours', '48_hours'

    -- Step 7: Información Comercial
    business_description TEXT,
    value_proposition TEXT, -- Propuesta de valor única
    minimum_job_value DECIMAL(10,2), -- Valor mínimo de trabajo que aceptan
    preferred_payment_terms INTEGER DEFAULT 15, -- Días para pago preferido
    discount_bulk_jobs DECIMAL(5,2), -- Descuento para trabajos en volumen
    references_clients TEXT[], -- Referencias de clientes anteriores

    -- Step 8: Documentación (URLs de Supabase Storage)
    company_logo_url TEXT,
    ine_front_url TEXT,
    ine_back_url TEXT,
    selfie_url TEXT,
    rfc_certificate_url TEXT,
    bank_statement_url TEXT,
    insurance_policy_url TEXT,
    business_license_url TEXT,
    certifications_urls TEXT[] DEFAULT '{}',
    portfolio_images TEXT[] DEFAULT '{}', -- Imágenes de trabajos anteriores

    -- Step 9: Datos de Validación Biométrica y Fiscal
    face_similarity_score DECIMAL(5,2), -- Para validación biométrica INE vs Selfie
    ciec_validated BOOLEAN DEFAULT false,
    documents_validated BOOLEAN DEFAULT false,
    background_check_passed BOOLEAN DEFAULT false,
    references_validated BOOLEAN DEFAULT false,

    -- Step 10: Datos Calculados/Externos del SAT
    sat_data JSONB DEFAULT '{}', -- Datos extraídos del SAT (ingresos, facturas, etc.)
    sat_income_last_year DECIMAL(12,2), -- Ingresos reportados último año
    sat_active_since DATE, -- Fecha desde que está activo en SAT
    credit_score DECIMAL(5,2), -- Puntuación crediticia externa

    -- Información de Status y Aprobación
    status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'under_review', 'additional_info_required', 'approved', 'rejected', 'suspended'
    approval_score DECIMAL(5,2), -- Puntuación interna de aprobación (0-100)
    risk_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'

    -- Preferencias del Sistema
    auto_accept_small_jobs BOOLEAN DEFAULT false, -- Auto-aceptar trabajos pequeños
    preferred_job_types TEXT[] DEFAULT '{}', -- Tipos de trabajo preferidos
    blacklisted_clients UUID[] DEFAULT '{}', -- Clientes que no quiere atender
    notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true, "call_emergencies": false}',

    -- Metadatos de Proceso
    draft_saved_at TIMESTAMPTZ, -- Última vez que se guardó como borrador
    submitted_at TIMESTAMPTZ, -- Cuando se envió para revisión
    reviewed_at TIMESTAMPTZ, -- Cuando se revisó
    additional_info_requested_at TIMESTAMPTZ, -- Si se pidió info adicional
    approved_at TIMESTAMPTZ, -- Cuando se aprobó
    rejected_at TIMESTAMPTZ, -- Cuando se rechazó
    suspended_at TIMESTAMPTZ, -- Cuando se suspendió

    -- Notas y Comentarios
    rejection_reason TEXT,
    admin_notes TEXT, -- Notas internas del admin
    additional_info_requested TEXT, -- Qué información adicional se solicitó
    supplier_notes TEXT, -- Notas del proveedor

    -- Timestamps estándar
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- INDEXES PARA PERFORMANCE
-- ==============================================

CREATE INDEX idx_supplier_profiles_user_id ON supplier_profiles(user_id);
CREATE INDEX idx_supplier_profiles_status ON supplier_profiles(status);
CREATE INDEX idx_supplier_profiles_rfc ON supplier_profiles(rfc);
CREATE INDEX idx_supplier_profiles_service_areas ON supplier_profiles USING GIN(service_areas);
CREATE INDEX idx_supplier_profiles_specialties ON supplier_profiles USING GIN(specialties);
CREATE INDEX idx_supplier_profiles_created_at ON supplier_profiles(created_at);
CREATE INDEX idx_supplier_profiles_approved_at ON supplier_profiles(approved_at);
CREATE INDEX idx_supplier_profiles_company_name ON supplier_profiles(company_name);

-- ==============================================
-- RLS (Row Level Security) POLICIES
-- ==============================================

-- Enable RLS
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;

-- Supplier Profiles Policies
CREATE POLICY "Users can view their own supplier profile" ON supplier_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own supplier profile" ON supplier_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplier profile" ON supplier_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all supplier profiles
CREATE POLICY "Admins can view all supplier profiles" ON supplier_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update supplier profiles (for approval process)
CREATE POLICY "Admins can update supplier profiles" ON supplier_profiles
    FOR UPDATE USING (
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

-- Trigger para supplier_profiles
CREATE TRIGGER update_supplier_profiles_updated_at
    BEFORE UPDATE ON supplier_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- FUNCIÓN PARA CALCULAR PUNTUACIÓN DE APROBACIÓN
-- ==============================================

CREATE OR REPLACE FUNCTION calculate_supplier_approval_score(profile_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    score DECIMAL(5,2) := 0;
    profile_data supplier_profiles%ROWTYPE;
BEGIN
    SELECT * INTO profile_data FROM supplier_profiles WHERE id = profile_id;

    -- Documentos completos (+25 puntos)
    IF profile_data.ine_front_url IS NOT NULL AND
       profile_data.ine_back_url IS NOT NULL AND
       profile_data.selfie_url IS NOT NULL THEN
        score := score + 25;
    END IF;

    -- Validación facial (+15 puntos si > 0.85)
    IF profile_data.face_similarity_score > 0.85 THEN
        score := score + 15;
    END IF;

    -- CIEC validado (+20 puntos)
    IF profile_data.ciec_validated THEN
        score := score + 20;
    END IF;

    -- Experiencia (+10 puntos si > 2 años)
    IF profile_data.years_experience > 2 THEN
        score := score + 10;
    END IF;

    -- Certificaciones (+15 puntos si tiene alguna)
    IF array_length(profile_data.certifications, 1) > 0 THEN
        score := score + 15;
    END IF;

    -- Seguros (+10 puntos si tiene póliza)
    IF array_length(profile_data.insurance_policies, 1) > 0 THEN
        score := score + 10;
    END IF;

    -- Referencias (+5 puntos si tiene)
    IF array_length(profile_data.references_clients, 1) > 0 THEN
        score := score + 5;
    END IF;

    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ==============================================

COMMENT ON TABLE supplier_profiles IS 'Datos completos de onboarding y perfil de proveedores - versión expandida';
COMMENT ON COLUMN supplier_profiles.sat_password_encrypted IS 'Contraseña del SAT cifrada - CRÍTICO para extracción de facturas e información fiscal';
COMMENT ON COLUMN supplier_profiles.face_similarity_score IS 'Puntuación de similitud facial INE vs Selfie (0.00-1.00) para validación biométrica';
COMMENT ON COLUMN supplier_profiles.approval_score IS 'Puntuación automática de aprobación basada en completitud y validaciones (0-100)';
COMMENT ON COLUMN supplier_profiles.working_hours IS 'Horarios de trabajo en formato JSON por día de la semana';
COMMENT ON COLUMN supplier_profiles.sat_data IS 'Datos extraídos del SAT incluyendo ingresos, facturas emitidas, status fiscal, etc.';