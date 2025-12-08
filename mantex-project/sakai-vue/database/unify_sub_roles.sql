-- ==============================================
-- UNIFICACIÓN DE SUB-ROLES Y PERMISOS (FASE 4)
-- ==============================================
-- Standardization of ALL permissions across domains.
-- Permission Keys: 
-- tickets, users, assets, inventory, sales, purchases, organization, reports, payments

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
    "payments": "all"
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
    "payments": "read"
}'::jsonb)
ON CONFLICT (domain, sub_role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- 3. Supplier Technician (Field work only)
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

-- 4. Supplier Salesperson (Sales focus)
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions)
VALUES ('supplier', 'salesperson', 'Sales Representative', 'Vendedor', '{
    "tickets": "read",
    "users": "none",
    "assets": "read",
    "inventory": "read",
    "sales": "create",
    "organization": "none",
    "reports": "read",
    "payments": "none"
}'::jsonb)
ON CONFLICT (domain, sub_role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- 5. Supplier Viewer (Read Only)
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions)
VALUES ('supplier', 'viewer', 'Viewer', 'Solo lectura', '{
    "tickets": "read",
    "users": "read",
    "assets": "read",
    "inventory": "read",
    "sales": "read",
    "organization": "read",
    "reports": "read",
    "payments": "none"
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

-- 8. Client Buyer (Purchasing focus)
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions)
VALUES ('client', 'buyer', 'Buyer', 'Comprador', '{
    "tickets": "create",
    "users": "none",
    "assets": "read",
    "purchases": "create",
    "organization": "none",
    "reports": "read",
    "payments": "none"
}'::jsonb)
ON CONFLICT (domain, sub_role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- 9. Client Viewer (Read Only)
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions)
VALUES ('client', 'viewer', 'Viewer', 'Solo lectura', '{
    "tickets": "read",
    "users": "read",
    "assets": "read",
    "purchases": "read",
    "organization": "read",
    "reports": "read",
    "payments": "none"
}'::jsonb)
ON CONFLICT (domain, sub_role) DO UPDATE SET permissions = EXCLUDED.permissions;


-- ==============================================
-- DOMAIN: ADMIN (Internal Staff)
-- ==============================================

-- 10. Admin Manager (High level ops)
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions)
VALUES ('admin', 'manager', 'Admin Manager', 'Gerente del Sistema', '{
    "tickets": "all",
    "users": "all",
    "settings": "read_write",
    "reports": "all",
    "payments": "all"
}'::jsonb)
ON CONFLICT (domain, sub_role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- 11. Admin Support (Customer Service)
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions)
VALUES ('admin', 'support', 'Support Agent', 'Agente de Soporte', '{
    "tickets": "all",
    "users": "read",
    "settings": "read",
    "reports": "read",
    "payments": "read"
}'::jsonb)
ON CONFLICT (domain, sub_role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- 12. Admin Operator (Data entry / Maintenance)
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions)
VALUES ('admin', 'operator', 'System Operator', 'Operador de Sistema', '{
    "tickets": "read_write",
    "users": "read",
    "settings": "read",
    "reports": "read",
    "payments": "none"
}'::jsonb)
ON CONFLICT (domain, sub_role) DO UPDATE SET permissions = EXCLUDED.permissions;
