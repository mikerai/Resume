-- ==============================================
-- UNIFICACIÓN DE SUB-ROLES Y PERMISOS (FASE 4 - REVISADO)
-- ==============================================
-- ⚠️ ADVERTENCIA: Este script estandariza los permisos.
-- El usuario 'Flynn' tiene hardcoded isFlynn=true en el código, pero
-- aquí aseguramos que el rol 'admin.god' tenga permisos absolutos en BD.

-- ==============================================
-- DOMAIN: ADMIN (Internal Staff)
-- ==============================================

-- 0. ADMIN GOD (Superusuario)
-- Permisos: { "all": true, "override": true }
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions)
VALUES ('admin', 'god', 'Super Administrator', 'Control Total del Sistema', '{
    "all": true,
    "override": true,
    "users": "all",
    "settings": "all",
    "reports": "all",
    "payments": "all",
    "tickets": "all"
}'::jsonb)
ON CONFLICT (domain, sub_role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- 10. Admin Manager (High level ops)
-- Permisos Explícitos para gestión de usuarios
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions)
VALUES ('admin', 'manager', 'Admin Manager', 'Gerente del Sistema', '{
    "tickets": "all",
    "users": "manage",
    "settings": "read_write",
    "reports": "all",
    "payments": "all",
    "onboarding": "manage"
}'::jsonb)
ON CONFLICT (domain, sub_role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- 11. Admin Support (Customer Service)
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions)
VALUES ('admin', 'support', 'Support Agent', 'Agente de Soporte', '{
    "tickets": "all",
    "users": "read",
    "settings": "read",
    "reports": "read",
    "payments": "read",
    "onboarding": "read"
}'::jsonb)
ON CONFLICT (domain, sub_role) DO UPDATE SET permissions = EXCLUDED.permissions;


-- ==============================================
-- DOMAIN: SUPPLIER
-- ==============================================

-- 1. Supplier Owner (Full Access)
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions)
VALUES ('supplier', 'owner', 'Supplier Owner', 'Propietario de la cuenta proveedor', '{
    "tickets": "all",
    "users": "all",
    "assets": "all",
    "inventory": "all",
    "sales": "all",
    "organization": "all",
    "reports": "read",
    "payments": "all",
    "team": "manage"
}'::jsonb)
ON CONFLICT (domain, sub_role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- 2. Supplier Manager (Manage operations, not billing/org structure)
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions)
VALUES ('supplier', 'manager', 'Supplier Manager', 'Gerente de operaciones', '{
    "tickets": "all",
    "users": "manage",
    "assets": "manage",
    "inventory": "manage",
    "sales": "read_write",
    "organization": "read",
    "reports": "read",
    "payments": "read",
    "team": "manage"
}'::jsonb)
ON CONFLICT (domain, sub_role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- 3. Supplier Technician (Field work only)
-- Permissions refined: can check-in, manage own profile, read inventory/assets
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions)
VALUES ('supplier', 'technician', 'Technician', 'Técnico de campo', '{
    "tickets": "assigned_only",
    "users": "none",
    "assets": "read",
    "inventory": "read",
    "sales": "none",
    "organization": "none",
    "reports": "none",
    "check_in": "enabled",
    "profile": "manage_own"
}'::jsonb)
ON CONFLICT (domain, sub_role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- ==============================================
-- DOMAIN: CLIENT
-- ==============================================

-- 6. Client Owner (Full Access)
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions)
VALUES ('client', 'owner', 'Client Owner', 'Propietario de cuenta cliente', '{
    "tickets": "create",
    "users": "all",
    "assets": "all",
    "purchases": "all",
    "organization": "all",
    "reports": "read",
    "payments": "all"
}'::jsonb)
ON CONFLICT (domain, sub_role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- 7. Client Manager (Manage operations)
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions)
VALUES ('client', 'manager', 'Client Manager', 'Gerente cliente', '{
    "tickets": "create",
    "users": "manage",
    "assets": "manage",
    "purchases": "read_write",
    "organization": "read",
    "reports": "read",
    "payments": "read"
}'::jsonb)
ON CONFLICT (domain, sub_role) DO UPDATE SET permissions = EXCLUDED.permissions;
