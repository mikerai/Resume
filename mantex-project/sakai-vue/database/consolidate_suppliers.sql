-- ==============================================
-- MIGRACIÓN DE SUPPLIERS (VERSIÓN BLINDADA v3)
-- ==============================================
-- Soluciona errores de NOT NULL constraints
-- Campos requeridos en supplier_profiles:
-- user_id, username, company_name, rfc, sat_password_encrypted, legal_address, contact_person, phone_number, email

INSERT INTO supplier_profiles (
    user_id,
    username,
    company_name,
    rfc,
    sat_password_encrypted, -- CRITICAL NOT NULL
    legal_address,
    contact_person,
    phone_number,
    email,
    -- Campos opcionales que estamos migrando
    status,
    website_url
)
SELECT 
    s.user_id,
    -- Generar username desde email, fallback a 'supplier_' + primeros chars de user_id
    COALESCE(
        SPLIT_PART(s.email, '@', 1), 
        'supplier_' || SUBSTRING(s.user_id::text, 1, 8)
    ) as username,
    
    -- Company Name (NOT NULL)
    COALESCE(s.company_name, 'Empresa Sin Nombre'),
    
    -- RFC (NOT NULL) - Placeholder si no existe
    COALESCE(s.rfc, 'XAXX010101000'), 
    
    -- SAT Password (NOT NULL) - Placeholder para migración
    'MIGRATED_FROM_V1',
    
    -- Legal Address (NOT NULL) - Usar address o placeholder
    COALESCE(NULL, 'Dirección Pendiente'), -- Asumiendo que s.address no existe o es NULL
    
    -- Contact Person (NOT NULL)
    COALESCE(s.contact_person, 'Contacto Pendiente'),
    
    -- Phone (NOT NULL)
    COALESCE(s.phone, '0000000000'),
    
    -- Email (NOT NULL)
    COALESCE(s.email, 'migrated_' || s.user_id || '@placeholder.com'),
    
    -- Status
    COALESCE(s.status, 'draft'),
    
    -- Website (Optional)
    NULL
FROM suppliers s
WHERE s.user_id IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM supplier_profiles sp WHERE sp.user_id = s.user_id
);

-- ==============================================
-- ACTUALIZACIÓN DE CONSTRAINT DE FKS
-- ==============================================

-- 1. Eliminar Constraints Antiguos
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_supplier_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewed_supplier_id_fkey;

-- 2. Migrar claves foráneas de tablas relacionadas y actualizar IDs
-- Tabla: tickets (supplier_id)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT t.id AS ticket_id, sp.id AS new_supplier_id
        FROM tickets t
        JOIN suppliers s ON t.supplier_id = s.id
        JOIN supplier_profiles sp ON s.user_id = sp.user_id
    LOOP
        UPDATE tickets
        SET supplier_id = r.new_supplier_id
        WHERE id = r.ticket_id;
    END LOOP;
END $$;

-- Tabla: reviews (reviewed_supplier_id)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT rev.id AS review_id, sp.id AS new_supplier_id
        FROM reviews rev
        JOIN suppliers s ON rev.reviewed_supplier_id = s.id
        JOIN supplier_profiles sp ON s.user_id = sp.user_id
    LOOP
        UPDATE reviews
        SET reviewed_supplier_id = r.new_supplier_id
        WHERE id = r.review_id;
    END LOOP;
END $$;

-- 3. Agregar Nuevas Constraints apuntando a supplier_profiles
ALTER TABLE tickets ADD CONSTRAINT tickets_supplier_id_fkey 
    FOREIGN KEY (supplier_id) REFERENCES supplier_profiles(id) ON DELETE SET NULL;

ALTER TABLE reviews ADD CONSTRAINT reviews_reviewed_supplier_id_fkey 
    FOREIGN KEY (reviewed_supplier_id) REFERENCES supplier_profiles(id) ON DELETE CASCADE;

-- 4. Renombrar tabla antigua
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'suppliers') THEN
        ALTER TABLE suppliers RENAME TO suppliers_deprecated_backup;
    END IF;
END $$;

-- 5. Actualizar Políticas RLS
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own supplier profile" ON supplier_profiles;
CREATE POLICY "Users can view their own supplier profile" ON supplier_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all supplier profiles" ON supplier_profiles;
CREATE POLICY "Admins can view all supplier profiles" ON supplier_profiles
    FOR SELECT USING (
        EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' )
    );
