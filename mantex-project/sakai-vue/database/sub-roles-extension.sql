-- ==============================================
-- EXTENSIÓN PARA SUB-ROLES Y PERMISOS
-- ==============================================

-- Tabla para definir los sub-roles disponibles por dominio
CREATE TABLE IF NOT EXISTS sub_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain VARCHAR(20) NOT NULL, -- 'admin', 'client', 'supplier'
    sub_role VARCHAR(50) NOT NULL, -- e.g. 'god', 'manager', 'user', 'viewer', etc.
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB, -- Permisos específicos del sub-role
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(domain, sub_role)
);

-- Tabla para asignar sub-roles a usuarios
CREATE TABLE IF NOT EXISTS user_sub_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    domain VARCHAR(20) NOT NULL, -- Debe coincidir con el role principal del user
    sub_role VARCHAR(50) NOT NULL,
    assigned_by UUID REFERENCES auth.users(id), -- Quien asignó el sub-role
    organization_id UUID, -- Para futuro uso si hay organizaciones
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (domain, sub_role) REFERENCES sub_roles(domain, sub_role)
);

-- Tabla para organizaciones/empresas (para manejo jerárquico)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(20) NOT NULL, -- 'client' o 'supplier' principalmente
    owner_id UUID REFERENCES auth.users(id),
    settings JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actualizar tabla profiles para incluir sub-roles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sub_role VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id);

-- ==============================================
-- DATOS INICIALES DE SUB-ROLES
-- ==============================================

-- Sub-roles para ADMIN
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions) VALUES
('admin', 'god', 'Super Administrator', 'Control absoluto del sistema', '{"all": true, "override": true}'),
('admin', 'manager', 'Admin Manager', 'Gestión general del sistema', '{"users": "all", "settings": "read_write", "reports": "all"}'),
('admin', 'operator', 'System Operator', 'Operaciones básicas del sistema', '{"users": "read", "settings": "read", "reports": "read"}'),
('admin', 'support', 'Support Agent', 'Soporte técnico y atención', '{"users": "read", "tickets": "all", "reports": "read"}');

-- Sub-roles para CLIENT
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions) VALUES
('client', 'owner', 'Client Owner', 'Propietario de la cuenta cliente', '{"organization": "all", "users": "all", "purchases": "all"}'),
('client', 'manager', 'Client Manager', 'Gerente de cliente', '{"users": "manage", "purchases": "read_write", "reports": "read"}'),
('client', 'buyer', 'Buyer', 'Comprador autorizado', '{"purchases": "create", "suppliers": "read", "orders": "manage"}'),
('client', 'viewer', 'Viewer', 'Solo lectura', '{"purchases": "read", "reports": "read", "suppliers": "read"}');

-- Sub-roles para SUPPLIER
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions) VALUES
('supplier', 'owner', 'Supplier Owner', 'Propietario de la cuenta proveedor', '{"organization": "all", "users": "all", "sales": "all", "assets": "all"}'),
('supplier', 'manager', 'Supplier Manager', 'Gerente de proveedor', '{"users": "manage", "sales": "read_write", "assets": "manage"}'),
('supplier', 'salesperson', 'Sales Representative', 'Vendedor', '{"sales": "create", "assets": "read", "clients": "read"}'),
('supplier', 'operator', 'Operations', 'Operaciones y logística', '{"assets": "read_write", "orders": "manage", "inventory": "manage"}'),
('supplier', 'viewer', 'Viewer', 'Solo lectura', '{"sales": "read", "assets": "read", "reports": "read"}');

-- ==============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_sub_roles_domain ON sub_roles(domain);
CREATE INDEX IF NOT EXISTS idx_user_sub_roles_user_id ON user_sub_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sub_roles_domain ON user_sub_roles(domain, sub_role);
CREATE INDEX IF NOT EXISTS idx_user_sub_roles_active ON user_sub_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_sub_role ON profiles(sub_role);
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);

-- ==============================================
-- POLÍTICAS RLS (Row Level Security)
-- ==============================================

-- Habilitar RLS
ALTER TABLE sub_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sub_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Políticas para sub_roles (lectura pública, escritura solo admin.god)
CREATE POLICY "Anyone can view sub_roles" ON sub_roles FOR SELECT USING (true);
CREATE POLICY "Only admin.god can manage sub_roles" ON sub_roles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.sub_role = 'god'
    )
);

-- Políticas para user_sub_roles
CREATE POLICY "Users can view own sub_roles" ON user_sub_roles FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            (profiles.role = 'admin' AND profiles.sub_role IN ('god', 'manager')) OR
            (profiles.role = domain AND profiles.sub_role IN ('owner', 'manager'))
        )
    )
);

CREATE POLICY "Domain owners/managers can assign sub_roles" ON user_sub_roles FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            (profiles.role = 'admin' AND profiles.sub_role IN ('god', 'manager')) OR
            (profiles.role = domain AND profiles.sub_role IN ('owner', 'manager'))
        )
    )
);

CREATE POLICY "Domain owners/managers can update sub_roles" ON user_sub_roles FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            (profiles.role = 'admin' AND profiles.sub_role IN ('god', 'manager')) OR
            (profiles.role = domain AND profiles.sub_role IN ('owner', 'manager'))
        )
    )
);

-- Políticas para organizations
CREATE POLICY "Users can view organizations they belong to" ON organizations FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.organization_id = organizations.id
    ) OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Domain owners can create organizations" ON organizations FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            (profiles.role = 'admin' AND profiles.sub_role IN ('god', 'manager')) OR
            (profiles.role = domain AND profiles.sub_role = 'owner')
        )
    )
);

CREATE POLICY "Organization owners can manage their organization" ON organizations FOR UPDATE USING (
    auth.uid() = owner_id OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.sub_role IN ('god', 'manager')
    )
);

-- ==============================================
-- FUNCIONES ÚTILES
-- ==============================================

-- Función para verificar permisos
CREATE OR REPLACE FUNCTION check_user_permission(
    target_user_id UUID,
    required_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
    user_role TEXT;
    user_sub_role TEXT;
BEGIN
    -- Obtener role, sub_role y permisos del usuario
    SELECT p.role, p.sub_role, p.permissions
    INTO user_role, user_sub_role, user_permissions
    FROM profiles p
    WHERE p.user_id = target_user_id;

    -- Si es admin.god, tiene todos los permisos
    IF user_role = 'admin' AND user_sub_role = 'god' THEN
        RETURN TRUE;
    END IF;

    -- Verificar permisos específicos en JSONB
    IF user_permissions ? required_permission THEN
        RETURN TRUE;
    END IF;

    -- Verificar permiso "all"
    IF user_permissions ? 'all' AND (user_permissions->>'all')::BOOLEAN THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener sub-roles disponibles por dominio
CREATE OR REPLACE FUNCTION get_available_sub_roles(domain_name TEXT)
RETURNS TABLE(
    sub_role TEXT,
    display_name TEXT,
    description TEXT,
    permissions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT sr.sub_role, sr.display_name, sr.description, sr.permissions
    FROM sub_roles sr
    WHERE sr.domain = domain_name AND sr.is_active = true
    ORDER BY sr.sub_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON TABLE sub_roles IS 'Definición de sub-roles por dominio con sus permisos';
COMMENT ON TABLE user_sub_roles IS 'Asignación de sub-roles a usuarios';
COMMENT ON TABLE organizations IS 'Organizaciones/empresas para manejo jerárquico';
COMMENT ON FUNCTION check_user_permission IS 'Verifica si un usuario tiene un permiso específico';
COMMENT ON FUNCTION get_available_sub_roles IS 'Obtiene sub-roles disponibles para un dominio';