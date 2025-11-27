-- =============================================
-- MIGRACIÓN: COLUMNAS DE COMPROBANTE DE DOMICILIO
-- =============================================
-- Aplana la estructura de datos para la validación de comprobante de domicilio
-- en la tabla supplier_profiles, en lugar de usar un JSON anidado.

ALTER TABLE supplier_profiles
    ADD COLUMN IF NOT EXISTS proof_of_address_type TEXT,
    ADD COLUMN IF NOT EXISTS proof_of_address_name TEXT, -- Nombre del titular en el recibo
    ADD COLUMN IF NOT EXISTS proof_of_address_street TEXT,
    ADD COLUMN IF NOT EXISTS proof_of_address_neighborhood TEXT, -- Colonia
    ADD COLUMN IF NOT EXISTS proof_of_address_municipality TEXT,
    ADD COLUMN IF NOT EXISTS proof_of_address_city TEXT,
    ADD COLUMN IF NOT EXISTS proof_of_address_state TEXT,
    ADD COLUMN IF NOT EXISTS proof_of_address_postal_code TEXT,
    ADD COLUMN IF NOT EXISTS proof_of_address_validated BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS proof_of_address_validation_code TEXT, -- Código de respuesta de Nubarium
    ADD COLUMN IF NOT EXISTS proof_of_address_validated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS proof_of_address_raw_data JSONB; -- Respuesta cruda de la API

-- Comentarios para documentación
COMMENT ON COLUMN supplier_profiles.proof_of_address_type IS 'Tipo de comprobante (CFE, TELMEX, IZZI, etc.)';
COMMENT ON COLUMN supplier_profiles.proof_of_address_validated IS 'Indica si la validación con Nubarium fue exitosa (TRUE)';
COMMENT ON COLUMN supplier_profiles.proof_of_address_raw_data IS 'JSON completo de la respuesta de Nubarium para auditoría';

-- Verificación
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'supplier_profiles' 
  AND column_name LIKE 'proof_of_address_%';
