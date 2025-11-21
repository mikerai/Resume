-- ================================================
-- MANTEX - FIX PROFILES TABLE STRUCTURE
-- ================================================

-- Verificar y añadir columnas faltantes a la tabla profiles si es necesario

-- Añadir created_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='profiles' AND column_name='created_at') THEN
        ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Añadir updated_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='profiles' AND column_name='updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Crear función de trigger si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para profiles si no existe
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentario
COMMENT ON TABLE profiles IS 'Tabla de perfiles de usuarios con timestamps actualizados';