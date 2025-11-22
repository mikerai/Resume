-- Tablas para Client Onboarding
-- Ejecutar después del schema principal

-- Eliminar tablas si existen (para recrearlas con nueva estructura)
DROP TABLE IF EXISTS client_assets CASCADE;
DROP TABLE IF EXISTS client_profiles CASCADE;

-- Tabla para perfiles de clientes
CREATE TABLE client_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

    -- Contacto
    phone_number VARCHAR(20) NOT NULL,

    -- Dirección
    same_as_ine BOOLEAN DEFAULT FALSE,
    street VARCHAR(255),
    exterior_number VARCHAR(20),
    interior_number VARCHAR(20),
    neighborhood VARCHAR(100), -- colonia
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(10),

    -- Referencias a verificaciones
    ine_verification_id UUID REFERENCES ine_verifications(id),
    sat_verification_id UUID REFERENCES sat_verifications(id),

    -- Metadata
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para activos de clientes (equipos que requieren mantenimiento)
CREATE TABLE client_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_profile_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,

    -- Información del activo
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(100) NOT NULL, -- Tipo del activo (será catálogo después)
    location VARCHAR(255), -- Ubicación dentro de la dirección registrada
    description TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_client_assets_profile_id ON client_assets(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_client_assets_type ON client_assets(asset_type);

-- Row Level Security
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para client_profiles
CREATE POLICY "Users can view own client profile"
    ON client_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client profile"
    ON client_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client profile"
    ON client_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Políticas RLS para client_assets
CREATE POLICY "Users can view own client assets"
    ON client_assets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM client_profiles
            WHERE client_profiles.id = client_assets.client_profile_id
            AND client_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own client assets"
    ON client_assets FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM client_profiles
            WHERE client_profiles.id = client_assets.client_profile_id
            AND client_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own client assets"
    ON client_assets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM client_profiles
            WHERE client_profiles.id = client_assets.client_profile_id
            AND client_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own client assets"
    ON client_assets FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM client_profiles
            WHERE client_profiles.id = client_assets.client_profile_id
            AND client_profiles.user_id = auth.uid()
        )
    );

-- Comentarios
COMMENT ON TABLE client_profiles IS 'Perfiles de clientes con información de contacto y dirección';
COMMENT ON TABLE client_assets IS 'Activos de clientes que requieren mantenimiento';
COMMENT ON COLUMN client_profiles.same_as_ine IS 'Indica si la dirección de la empresa es la misma que la del INE';
COMMENT ON COLUMN client_assets.asset_type IS 'Tipo de activo - será relacionado con catálogo desde panel admin';
