-- ==============================================
-- SISTEMA DE TÉCNICOS Y SUCURSALES DE PROVEEDORES
-- ==============================================

-- 1. CREAR SUB-ROLE 'TECHNICIAN'
INSERT INTO sub_roles (domain, sub_role, display_name, description, permissions)
VALUES (
    'supplier', 
    'technician', 
    'Technician', 
    'Personal operativo en campo', 
    '{"tickets": "assigned_only", "assets": "read", "check_in": "enabled"}'
)
ON CONFLICT (domain, sub_role) DO NOTHING;


-- 2. TABLA DE SUCURSALES DE PROVEEDORES (SUPPLIER BRANCHES)
-- Mirror de client_branches pero para suppliers
CREATE TABLE IF NOT EXISTS supplier_branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES supplier_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_headquarters BOOLEAN DEFAULT false,
    contact_person_name TEXT, -- Suppliers might not have contact_persons table setup same way, simple text for now or link to user
    phone TEXT,
    email TEXT,
    
    -- Standardized Address Fields
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    apt TEXT,
    neighborhood TEXT NOT NULL,
    municipality_city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    full_address TEXT GENERATED ALWAYS AS (
        street || ' ' || number || COALESCE(' ' || apt, '') || ', ' || neighborhood || ', ' || municipality_city || ', ' || state || ', CP ' || postal_code
    ) STORED,
    
    -- Optional Media
    picture TEXT,
    additional_pictures JSONB DEFAULT '[]',
    layout TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS supplier_branches
ALTER TABLE supplier_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers view own branches" ON supplier_branches
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM supplier_profiles WHERE id = supplier_id));

CREATE POLICY "Suppliers manage own branches" ON supplier_branches
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM supplier_profiles WHERE id = supplier_id));

-- Trigger single headquarters for supplier
CREATE OR REPLACE FUNCTION ensure_single_supplier_headquarters()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_headquarters = true THEN
        UPDATE supplier_branches
        SET is_headquarters = false
        WHERE supplier_id = NEW.supplier_id 
        AND id != NEW.id
        AND is_headquarters = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_supplier_hq
    BEFORE INSERT OR UPDATE ON supplier_branches
    FOR EACH ROW EXECUTE FUNCTION ensure_single_supplier_headquarters();


-- 3. TABLA PARA VINCULAR TÉCNICOS A PROVEEDORES
CREATE TABLE IF NOT EXISTS supplier_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES supplier_profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for invites
    email VARCHAR(255), -- For invites
    first_name VARCHAR(100), -- Display info pending signup
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'technician',
    status VARCHAR(20) DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'inactive', 'suspended')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: Either user_id or email must be present
    CONSTRAINT chk_user_or_email CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

-- Index for email lookups
CREATE INDEX idx_supplier_team_email ON supplier_team_members(email);

-- RLS
ALTER TABLE supplier_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Suppliers manage team" ON supplier_team_members
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM supplier_profiles WHERE id = supplier_id));
CREATE POLICY "Technicians view own membership" ON supplier_team_members
    FOR SELECT USING (auth.uid() = user_id OR (email = (SELECT email FROM auth.users WHERE id = auth.uid())));


-- 4. TABLA DE VERIFICACIONES DE TÉCNICOS (ONBOARDING)
CREATE TABLE IF NOT EXISTS technician_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Docs
    ine_front_url TEXT,
    ine_back_url TEXT,
    selfie_url TEXT,
    proof_of_address_url TEXT,
    
    -- Data
    ine_data JSONB DEFAULT '{}',
    address_data JSONB DEFAULT '{}',
    
    -- Validation
    face_match_score DECIMAL(5,2),
    identity_validated BOOLEAN DEFAULT false,
    address_validated BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'correction_needed')),
    rejection_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE technician_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own verification" ON technician_verifications
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins manage verifications" ON technician_verifications
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- 5. ACTUALIZAR TICKETS (technician_id)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'technician_id') THEN
        ALTER TABLE tickets ADD COLUMN technician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        CREATE INDEX idx_tickets_technician_id ON tickets(technician_id);
    END IF;
END $$;


-- 6. TRIGGER PARA ASIGNAR ROL AL REGISTRARSE
-- Si un usuario se registra con un email que está en supplier_team_members, asignar rol y vincular

CREATE OR REPLACE FUNCTION handle_new_technician_user()
RETURNS TRIGGER AS $$
DECLARE
    team_record RECORD;
BEGIN
    -- Buscar invitación pendiente por email
    SELECT * INTO team_record FROM supplier_team_members WHERE email = NEW.email AND user_id IS NULL;
    
    IF team_record IS NOT NULL THEN
        -- Actualizar team member con user_id
        UPDATE supplier_team_members 
        SET user_id = NEW.id, status = 'active'
        WHERE id = team_record.id;
        
        -- Actualizar profile (rol, sub_role, organization_id)
        -- Asumimos organization_id = supplier_id (profile id del dueño) o nulo si no usamos organizations table
        UPDATE profiles
        SET role = 'supplier',
            sub_role = 'technician',
            organization_id = (SELECT organization_id FROM profiles WHERE user_id = (SELECT user_id FROM supplier_profiles WHERE id = team_record.supplier_id))
        WHERE id = NEW.id;
        
        -- Si no hay organization_id en profiles, podríamos intentar setearlo o ignorarlo
        -- Lo importante es role y sub_role
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users is disallowed usually, works via triggers on public.profiles (if inserted automatically)
-- Or manual trigger if you have permissions. 
-- Assuming profiles is inserted via trigger on auth.users.
-- We attach this to profiles insert.

CREATE OR REPLACE TRIGGER on_profile_created_check_team
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION handle_new_technician_user();
    
-- Nota: handle_new_technician_user necesita leer NEW.email. 
-- profiles Típicamente no tiene email, auth.users sí.
-- Ajustar función para buscar email en auth.users usando NEW.id (user_id)
CREATE OR REPLACE FUNCTION handle_new_technician_user()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    team_record RECORD;
BEGIN
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
    
    SELECT * INTO team_record FROM supplier_team_members WHERE email = user_email AND user_id IS NULL;
    
    IF team_record IS NOT NULL THEN
        UPDATE supplier_team_members 
        SET user_id = NEW.id, status = 'active'
        WHERE id = team_record.id;
        
        UPDATE profiles
        SET role = 'supplier', sub_role = 'technician'
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
