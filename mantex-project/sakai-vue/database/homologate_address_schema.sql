-- =============================================
-- MANTEX - HOMOLOGACIÓN DE ESQUEMA DE DIRECCIONES
-- =============================================
-- Migración para estandarizar campos de dirección y agregar coordenadas
-- Fecha: 2025-11-26
-- Autor: Antigravity AI

-- =============================================
-- FASE 1: AGREGAR COLUMNAS FALTANTES
-- =============================================

-- 1. SUPPLIER_PROFILES: Migrar de legal_address a campos separados
ALTER TABLE supplier_profiles
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS number TEXT,
  ADD COLUMN IF NOT EXISTS apt TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS municipality_city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- 2. CLIENT_BRANCHES: Agregar coordenadas
ALTER TABLE client_branches
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- 3. CLIENTS: Agregar coordenadas y campos faltantes
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Renombrar address → street en clients
ALTER TABLE clients RENAME COLUMN address TO street;

-- Agregar campos faltantes en clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS number TEXT,
  ADD COLUMN IF NOT EXISTS apt TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Renombrar city → municipality_city en clients
ALTER TABLE clients RENAME COLUMN city TO municipality_city;

-- 4. SUPPLIERS: Homologar campos
-- Renombrar address → street
ALTER TABLE suppliers RENAME COLUMN address TO street;

-- Agregar campos faltantes
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS number TEXT,
  ADD COLUMN IF NOT EXISTS apt TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Renombrar city → municipality_city
ALTER TABLE suppliers RENAME COLUMN city TO municipality_city;

-- =============================================
-- FASE 2: COLUMNAS GENERADAS (FULL_ADDRESS)
-- =============================================

-- Función helper para construir dirección completa
CREATE OR REPLACE FUNCTION build_full_address(
  p_street TEXT,
  p_number TEXT,
  p_apt TEXT,
  p_neighborhood TEXT,
  p_municipality_city TEXT,
  p_state TEXT,
  p_postal_code TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN TRIM(CONCAT_WS(', ',
    NULLIF(p_street, ''),
    NULLIF(p_number, ''),
    CASE WHEN p_apt IS NOT NULL AND p_apt != '' THEN 'Int. ' || p_apt END,
    NULLIF(p_neighborhood, ''),
    NULLIF(p_municipality_city, ''),
    NULLIF(p_state, ''),
    CASE WHEN p_postal_code IS NOT NULL AND p_postal_code != '' THEN 'CP ' || p_postal_code END
  ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Agregar columnas generadas full_address
ALTER TABLE supplier_profiles
  ADD COLUMN IF NOT EXISTS full_address TEXT
  GENERATED ALWAYS AS (
    build_full_address(street, number, apt, neighborhood, municipality_city, state, postal_code)
  ) STORED;

ALTER TABLE client_branches
  ADD COLUMN IF NOT EXISTS full_address TEXT
  GENERATED ALWAYS AS (
    build_full_address(street, number, apt, neighborhood, municipality_city, state, postal_code)
  ) STORED;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS full_address TEXT
  GENERATED ALWAYS AS (
    build_full_address(street, number, apt, neighborhood, municipality_city, state, postal_code)
  ) STORED;

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS full_address TEXT
  GENERATED ALWAYS AS (
    build_full_address(street, number, apt, neighborhood, municipality_city, state, postal_code)
  ) STORED;

-- =============================================
-- FASE 3: COLUMNA GENERADA (FULL_NAME) EN PROFILES
-- =============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT
  GENERATED ALWAYS AS (
    TRIM(CONCAT_WS(' ',
      NULLIF(first_name, ''),
      NULLIF(last_name, ''),
      NULLIF(second_last_name, '')
    ))
  ) STORED;

-- =============================================
-- FASE 4: MIGRACIÓN DE DATOS EXISTENTES
-- =============================================

-- Migrar supplier_profiles.legal_address a campos separados
-- NOTA: Esto es un parsing simple, puede necesitar ajustes manuales
UPDATE supplier_profiles
SET 
  street = SPLIT_PART(legal_address, ',', 1),
  municipality_city = TRIM(SPLIT_PART(legal_address, ',', 2)),
  state = TRIM(SPLIT_PART(legal_address, ',', 3))
WHERE legal_address IS NOT NULL
  AND legal_address != ''
  AND street IS NULL;

-- =============================================
-- FASE 5: ÍNDICES PARA COORDENADAS
-- =============================================

CREATE INDEX IF NOT EXISTS idx_supplier_profiles_coordinates 
  ON supplier_profiles(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_branches_coordinates 
  ON client_branches(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_coordinates 
  ON clients(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_suppliers_coordinates 
  ON suppliers(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- =============================================
-- FASE 6: COMENTARIOS DE DOCUMENTACIÓN
-- =============================================

COMMENT ON COLUMN supplier_profiles.full_address IS 'Dirección completa generada automáticamente desde campos separados';
COMMENT ON COLUMN supplier_profiles.latitude IS 'Latitud para Google Maps (auto-generada via geocoding)';
COMMENT ON COLUMN supplier_profiles.longitude IS 'Longitud para Google Maps (auto-generada via geocoding)';

COMMENT ON COLUMN client_branches.full_address IS 'Dirección completa generada automáticamente desde campos separados';
COMMENT ON COLUMN client_branches.latitude IS 'Latitud para Google Maps (auto-generada via geocoding)';
COMMENT ON COLUMN client_branches.longitude IS 'Longitud para Google Maps (auto-generada via geocoding)';

COMMENT ON COLUMN clients.full_address IS 'Dirección completa generada automáticamente desde campos separados';
COMMENT ON COLUMN clients.latitude IS 'Latitud para Google Maps (auto-generada via geocoding)';
COMMENT ON COLUMN clients.longitude IS 'Longitud para Google Maps (auto-generada via geocoding)';

COMMENT ON COLUMN suppliers.full_address IS 'Dirección completa generada automáticamente desde campos separados';
COMMENT ON COLUMN suppliers.latitude IS 'Latitud para Google Maps (auto-generada via geocoding)';
COMMENT ON COLUMN suppliers.longitude IS 'Longitud para Google Maps (auto-generada via geocoding)';

COMMENT ON COLUMN profiles.full_name IS 'Nombre completo generado automáticamente desde first_name, last_name, second_last_name';

-- =============================================
-- VERIFICACIÓN
-- =============================================

SELECT '✅ Migración de homologación de esquema completada exitosamente!' as status;

-- Verificar columnas agregadas
SELECT 
  'supplier_profiles' as tabla,
  COUNT(*) FILTER (WHERE latitude IS NOT NULL) as con_coordenadas,
  COUNT(*) as total
FROM supplier_profiles
UNION ALL
SELECT 
  'client_branches',
  COUNT(*) FILTER (WHERE latitude IS NOT NULL),
  COUNT(*)
FROM client_branches
UNION ALL
SELECT 
  'clients',
  COUNT(*) FILTER (WHERE latitude IS NOT NULL),
  COUNT(*)
FROM clients
UNION ALL
SELECT 
  'suppliers',
  COUNT(*) FILTER (WHERE latitude IS NOT NULL),
  COUNT(*)
FROM suppliers;
