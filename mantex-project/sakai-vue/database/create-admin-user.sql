-- ================================================
-- MANTEX - CREAR USUARIO ADMIN INICIAL
-- ================================================

-- NOTA: Este script debe ejecutarse DESPUÉS de crear al usuario en Supabase Auth
-- El UUID debe reemplazarse con el ID real del usuario creado en auth.users

-- ==============================================
-- PASO 1: INSERTAR PERFIL DE ADMIN
-- ==============================================

-- Insertar perfil admin (reemplazar UUID con el real del usuario creado)
-- Primero verificar qué columnas tiene la tabla profiles
INSERT INTO profiles (id, username, role, onboarding_complete)
VALUES (
    '00000000-0000-0000-0000-000000000001', -- ⚠️ REEMPLAZAR CON UUID REAL
    'admin',
    'admin',
    true
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    onboarding_complete = true;

-- ==============================================
-- PASO 2: INSERTAR ADMIN EN TABLA ADMINS (SI EXISTE)
-- ==============================================

-- Crear tabla admins si no existe
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL,
    username TEXT NOT NULL,
    full_name TEXT,
    email TEXT,
    department TEXT DEFAULT 'operations',
    permissions JSONB DEFAULT '{"approve_suppliers": true, "manage_tickets": true, "view_analytics": true, "manage_users": true}',
    is_super_admin BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar admin en tabla específica
INSERT INTO admins (user_id, username, full_name, email, department, is_super_admin, permissions)
VALUES (
    '00000000-0000-0000-0000-000000000001', -- ⚠️ REEMPLAZAR CON UUID REAL
    'admin',
    'Administrador Principal',
    'admin@mantex.com', -- ⚠️ REEMPLAZAR CON EMAIL REAL
    'operations',
    true,
    '{
        "approve_suppliers": true,
        "reject_suppliers": true,
        "manage_tickets": true,
        "assign_tickets": true,
        "view_analytics": true,
        "manage_users": true,
        "manage_payments": true,
        "system_settings": true
    }'::jsonb
) ON CONFLICT (user_id) DO UPDATE SET
    is_super_admin = true,
    permissions = '{
        "approve_suppliers": true,
        "reject_suppliers": true,
        "manage_tickets": true,
        "assign_tickets": true,
        "view_analytics": true,
        "manage_users": true,
        "manage_payments": true,
        "system_settings": true
    }'::jsonb,
    updated_at = NOW();

-- ==============================================
-- PASO 3: RLS POLICIES PARA TABLA ADMINS
-- ==============================================

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view admin profiles" ON admins;
DROP POLICY IF EXISTS "Super admins can manage admin profiles" ON admins;

-- Admins can view all admin profiles
CREATE POLICY "Admins can view admin profiles" ON admins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Super admins can manage admin profiles
CREATE POLICY "Super admins can manage admin profiles" ON admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid() AND is_super_admin = true
        )
    );

-- ==============================================
-- PASO 4: ÍNDICES PARA PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status);
CREATE INDEX IF NOT EXISTS idx_admins_department ON admins(department);

-- ==============================================
-- PASO 5: TRIGGERS PARA AUTO-UPDATE
-- ==============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;

-- Trigger para admins
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- PASO 6: FUNCIONES DE UTILIDAD PARA ADMIN
-- ==============================================

-- Función para verificar permisos de admin
CREATE OR REPLACE FUNCTION has_admin_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT permissions INTO user_permissions
    FROM admins
    WHERE user_id = user_uuid AND status = 'active';

    IF user_permissions IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN COALESCE((user_permissions ->> permission_name)::BOOLEAN, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para aprobar supplier
CREATE OR REPLACE FUNCTION approve_supplier(supplier_profile_id UUID, admin_user_id UUID, notes TEXT DEFAULT '')
RETURNS BOOLEAN AS $$
DECLARE
    supplier_data supplier_profiles%ROWTYPE;
    has_permission BOOLEAN;
BEGIN
    -- Verificar permisos
    SELECT has_admin_permission(admin_user_id, 'approve_suppliers') INTO has_permission;

    IF NOT has_permission THEN
        RAISE EXCEPTION 'No tiene permisos para aprobar suppliers';
    END IF;

    -- Aprobar supplier
    UPDATE supplier_profiles SET
        status = 'approved',
        approved_at = NOW(),
        admin_notes = COALESCE(admin_notes || ' | ', '') || notes,
        updated_at = NOW()
    WHERE id = supplier_profile_id
    RETURNING * INTO supplier_data;

    IF FOUND THEN
        -- Crear entrada en tabla suppliers principal (si no existe)
        INSERT INTO suppliers (
            user_id, company_name, contact_person, phone, email,
            rfc, status, approved_at, created_at
        )
        SELECT
            user_id, company_name, contact_person, phone_number, email,
            rfc, 'approved', NOW(), NOW()
        FROM supplier_profiles
        WHERE id = supplier_profile_id
        ON CONFLICT (user_id) DO UPDATE SET
            status = 'approved',
            approved_at = NOW(),
            updated_at = NOW();

        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para rechazar supplier
CREATE OR REPLACE FUNCTION reject_supplier(supplier_profile_id UUID, admin_user_id UUID, rejection_reason TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN;
BEGIN
    -- Verificar permisos
    SELECT has_admin_permission(admin_user_id, 'reject_suppliers') INTO has_permission;

    IF NOT has_permission THEN
        RAISE EXCEPTION 'No tiene permisos para rechazar suppliers';
    END IF;

    -- Rechazar supplier
    UPDATE supplier_profiles SET
        status = 'rejected',
        rejected_at = NOW(),
        rejection_reason = rejection_reason,
        updated_at = NOW()
    WHERE id = supplier_profile_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ==============================================

COMMENT ON TABLE admins IS 'Tabla de administradores del sistema con permisos granulares';
COMMENT ON COLUMN admins.permissions IS 'Permisos en formato JSON para control granular de acceso';
COMMENT ON FUNCTION approve_supplier IS 'Función para aprobar suppliers con verificación de permisos';
COMMENT ON FUNCTION reject_supplier IS 'Función para rechazar suppliers con verificación de permisos';

-- ==============================================
-- INSTRUCCIONES DE USO
-- ==============================================

/*
INSTRUCCIONES PARA CREAR USUARIO ADMIN:

1. Crear usuario en Supabase Auth Dashboard:
   - Email: admin@mantex.com (o el que prefieras)
   - Password: (generar una segura)
   - Copiar el UUID generado

2. Reemplazar en este script:
   - UUID: '00000000-0000-0000-0000-000000000001'
   - Email: 'admin@mantex.com'

3. Ejecutar este script completo en SQL Editor de Supabase

4. El admin podrá:
   - ✅ Aprobar/rechazar suppliers
   - ✅ Ver todos los perfiles de supplier
   - ✅ Gestionar tickets
   - ✅ Acceder a analíticas
   - ✅ Gestionar usuarios

Ejemplo de uso de funciones:
- SELECT approve_supplier('supplier-uuid', 'admin-uuid', 'Supplier aprobado correctamente');
- SELECT reject_supplier('supplier-uuid', 'admin-uuid', 'Documentación incompleta');
*/