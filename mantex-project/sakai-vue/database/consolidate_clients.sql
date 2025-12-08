-- ==============================================
-- MIGRACIÓN DE CLIENTS (VERSIÓN BLINDADA v3)
-- ==============================================
-- Soluciona errores de NOT NULL constraints y columnas faltantes
-- Campos requeridos en client_profiles:
-- user_id, username, company_name, business_type, legal_address, contact_person, phone_number, email, industry

-- Asegurar idempotencia (crear tabla base si no existe)
CREATE TABLE IF NOT EXISTS client_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL,
    username TEXT, -- Add this locally for the create definition
    company_name TEXT NOT NULL,
    business_type TEXT DEFAULT 'sme',
    rfc TEXT,
    legal_address TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    position TEXT,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    website_url TEXT,
    industry TEXT DEFAULT 'Other',
    company_size TEXT DEFAULT 'small',
    number_of_locations INTEGER DEFAULT 1,
    annual_maintenance_budget DECIMAL(12,2),
    service_locations JSONB DEFAULT '[]',
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columnas si no existen (idempotencia)
DO $$
BEGIN
    ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS username TEXT;
    ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
    ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'sme';
    ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS rfc TEXT;
    ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS legal_address TEXT;
    ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS contact_person TEXT;
    ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
    ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT 'Other';
    ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'Column already exists in client_profiles.';
END $$;

-- Migración
INSERT INTO client_profiles (
    user_id,
    username, -- NOT NULL
    company_name, -- NOT NULL
    business_type, -- NOT NULL (Default: 'sme')
    rfc,
    legal_address, -- NOT NULL
    contact_person, -- NOT NULL
    phone_number, -- NOT NULL
    email, -- NOT NULL
    industry, -- NOT NULL (Default: 'Other')
    status
)
SELECT 
    c.user_id,
    -- Generar username
    COALESCE(
        SPLIT_PART(c.email, '@', 1), 
        'client_' || SUBSTRING(c.user_id::text, 1, 8)
    ) as username,
    
    -- Company (NOT NULL)
    COALESCE(c.company_name, 'Empresa Sin Nombre'),
    
    -- Business Type (NOT NULL)
    'sme',
    
    c.rfc,
    
    -- Legal Address (NOT NULL) - Fallback si address no existe o es NULL
    COALESCE(NULL, 'Dirección Pendiente'),
    
    -- Contact Check (NOT NULL)
    COALESCE(c.contact_person, 'Contacto Pendiente'),
    
    -- Phone (NOT NULL)
    COALESCE(c.phone, '0000000000'),
    
    -- Email (NOT NULL)
    COALESCE(c.email, 'migrated_' || c.user_id || '@placeholder.com'),
    
    -- Industry (NOT NULL)
    'Other',
    
    -- Status
    COALESCE(c.status, 'active')
FROM clients c
WHERE c.user_id IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM client_profiles cp WHERE cp.user_id = c.user_id
);

-- ==============================================
-- ACTUALIZACIÓN DE CONSTRAINT DE FKS
-- ==============================================

-- 1. Eliminar Constraints Antiguos
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_client_id_fkey;
ALTER TABLE client_branches DROP CONSTRAINT IF EXISTS client_branches_client_id_fkey;
ALTER TABLE client_assets DROP CONSTRAINT IF EXISTS client_assets_client_id_fkey;

-- 2. Migrar claves foráneas y actualizar IDs
-- Tabla: tickets
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT t.id AS ticket_id, cp.id AS new_client_id
        FROM tickets t
        JOIN clients c ON t.client_id = c.id
        JOIN client_profiles cp ON c.user_id = cp.user_id
    LOOP
        UPDATE tickets
        SET client_id = r.new_client_id
        WHERE id = r.ticket_id;
    END LOOP;
END $$;

-- Tabla: client_branches
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT cb.id AS branch_id, cp.id AS new_client_id
        FROM client_branches cb
        JOIN clients c ON cb.client_id = c.id
        JOIN client_profiles cp ON c.user_id = cp.user_id
    LOOP
        UPDATE client_branches
        SET client_id = r.new_client_id
        WHERE id = r.branch_id;
    END LOOP;
END $$;

-- Tabla: client_assets
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT ca.id AS asset_id, cp.id AS new_client_id
        FROM client_assets ca
        JOIN clients c ON ca.client_id = c.id
        JOIN client_profiles cp ON c.user_id = cp.user_id
    LOOP
        UPDATE client_assets
        SET client_id = r.new_client_id
        WHERE id = r.asset_id;
    END LOOP;
END $$;

-- 3. Agregar Nuevas Constraints
ALTER TABLE tickets ADD CONSTRAINT tickets_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES client_profiles(id) ON DELETE CASCADE;

ALTER TABLE client_branches ADD CONSTRAINT client_branches_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES client_profiles(id) ON DELETE CASCADE;

ALTER TABLE client_assets ADD CONSTRAINT client_assets_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES client_profiles(id) ON DELETE CASCADE;

-- 4. Renombrar tabla antigua
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
        ALTER TABLE clients RENAME TO clients_deprecated_backup;
    END IF;
END $$;

-- 5. Actualizar Políticas RLS
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own client profile" ON client_profiles;
CREATE POLICY "Users can view their own client profile" ON client_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all client profiles" ON client_profiles;
CREATE POLICY "Admins can view all client profiles" ON client_profiles
    FOR SELECT USING (
        EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' )
    );
