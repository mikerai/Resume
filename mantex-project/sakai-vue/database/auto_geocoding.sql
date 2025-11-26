-- =============================================
-- MANTEX - GEOCODING AUTOMÁTICO CON GOOGLE MAPS
-- =============================================
-- Función y triggers para auto-geocodificar direcciones
-- Fecha: 2025-11-26
-- Autor: Antigravity AI

-- =============================================
-- PREREQUISITOS
-- =============================================
-- 1. Extensión HTTP para llamadas a API externa
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Extensión pg_net para requests asíncronos (alternativa)
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- =============================================
-- FUNCIÓN DE GEOCODING
-- =============================================

CREATE OR REPLACE FUNCTION geocode_address()
RETURNS TRIGGER AS $$
DECLARE
  full_addr TEXT;
  api_key TEXT := 'AIzaSyBGz387mS954FeNqQWiK3eCWJgatm1W0-0'; -- Google Maps API Key
  api_url TEXT;
  api_response JSONB;
  lat DECIMAL(10, 8);
  lng DECIMAL(11, 8);
BEGIN
  -- Solo geocodificar si hay cambios en campos de dirección
  -- y si no hay coordenadas ya establecidas
  IF (TG_OP = 'INSERT' OR 
      OLD.street IS DISTINCT FROM NEW.street OR
      OLD.number IS DISTINCT FROM NEW.number OR
      OLD.municipality_city IS DISTINCT FROM NEW.municipality_city OR
      OLD.state IS DISTINCT FROM NEW.state OR
      OLD.postal_code IS DISTINCT FROM NEW.postal_code)
     AND (NEW.latitude IS NULL OR NEW.longitude IS NULL) THEN
    
    -- Construir dirección completa
    full_addr := TRIM(CONCAT_WS(', ',
      NULLIF(NEW.street, ''),
      NULLIF(NEW.number, ''),
      NULLIF(NEW.neighborhood, ''),
      NULLIF(NEW.municipality_city, ''),
      NULLIF(NEW.state, ''),
      'México' -- País
    ));
    
    -- Solo proceder si tenemos una dirección válida
    IF full_addr IS NOT NULL AND full_addr != '' THEN
      BEGIN
        -- Construir URL de la API de Geocoding
        api_url := 'https://maps.googleapis.com/maps/api/geocode/json?address=' || 
                   urlencode(full_addr) || 
                   '&key=' || api_key;
        
        -- Hacer request a Google Maps API
        SELECT content::jsonb INTO api_response
        FROM http_get(api_url);
        
        -- Extraer coordenadas si la respuesta es exitosa
        IF api_response->>'status' = 'OK' THEN
          lat := (api_response->'results'->0->'geometry'->'location'->>'lat')::DECIMAL(10, 8);
          lng := (api_response->'results'->0->'geometry'->'location'->>'lng')::DECIMAL(11, 8);
          
          -- Asignar coordenadas
          NEW.latitude := lat;
          NEW.longitude := lng;
          
          RAISE NOTICE 'Geocoding exitoso para: % → lat: %, lng: %', full_addr, lat, lng;
        ELSE
          RAISE WARNING 'Geocoding falló para: %. Status: %', full_addr, api_response->>'status';
        END IF;
        
      EXCEPTION WHEN OTHERS THEN
        -- Si falla el geocoding, solo registrar warning pero no fallar la operación
        RAISE WARNING 'Error en geocoding para: %. Error: %', full_addr, SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS PARA AUTO-GEOCODING
-- =============================================

-- 1. SUPPLIER_PROFILES
CREATE TRIGGER auto_geocode_supplier_profiles
  BEFORE INSERT OR UPDATE OF street, number, neighborhood, municipality_city, state, postal_code
  ON supplier_profiles
  FOR EACH ROW
  EXECUTE FUNCTION geocode_address();

-- 2. CLIENT_BRANCHES
CREATE TRIGGER auto_geocode_client_branches
  BEFORE INSERT OR UPDATE OF street, number, neighborhood, municipality_city, state, postal_code
  ON client_branches
  FOR EACH ROW
  EXECUTE FUNCTION geocode_address();

-- 3. CLIENTS
CREATE TRIGGER auto_geocode_clients
  BEFORE INSERT OR UPDATE OF street, number, neighborhood, municipality_city, state, postal_code
  ON clients
  FOR EACH ROW
  EXECUTE FUNCTION geocode_address();

-- 4. SUPPLIERS
CREATE TRIGGER auto_geocode_suppliers
  BEFORE INSERT OR UPDATE OF street, number, neighborhood, municipality_city, state, postal_code
  ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION geocode_address();

-- =============================================
-- FUNCIÓN MANUAL DE GEOCODING (PARA BACKFILL)
-- =============================================

CREATE OR REPLACE FUNCTION manual_geocode_table(
  table_name TEXT,
  limit_rows INTEGER DEFAULT NULL
)
RETURNS TABLE(
  record_id UUID,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  success BOOLEAN
) AS $$
DECLARE
  sql_query TEXT;
BEGIN
  -- Construir query dinámico según la tabla
  sql_query := format('
    UPDATE %I
    SET street = street  -- Trigger the geocoding by touching the street field
    WHERE id IN (
      SELECT id FROM %I
      WHERE latitude IS NULL OR longitude IS NULL
      %s
    )
    RETURNING id, 
              CONCAT_WS('', '', street, '' '', number, '', '', municipality_city, '', '', state) as address,
              latitude,
              longitude,
              (latitude IS NOT NULL) as success
  ', table_name, table_name,
     CASE WHEN limit_rows IS NOT NULL THEN 'LIMIT ' || limit_rows ELSE '' END
  );
  
  RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN HELPER: URL ENCODE
-- =============================================

CREATE OR REPLACE FUNCTION urlencode(input TEXT)
RETURNS TEXT AS $$
DECLARE
  output TEXT := '';
  byte_val INTEGER;
  char_val TEXT;
BEGIN
  FOR i IN 1..length(input) LOOP
    char_val := substring(input FROM i FOR 1);
    
    -- Caracteres seguros que no necesitan encoding
    IF char_val ~ '[A-Za-z0-9\-_.~]' THEN
      output := output || char_val;
    ELSE
      -- Convertir a hex y agregar %
      byte_val := ascii(char_val);
      output := output || '%' || to_hex(byte_val);
    END IF;
  END LOOP;
  
  RETURN output;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =============================================

COMMENT ON FUNCTION geocode_address() IS 'Función trigger que auto-geocodifica direcciones usando Google Maps Geocoding API';
COMMENT ON FUNCTION manual_geocode_table(TEXT, INTEGER) IS 'Función para geocodificar manualmente registros existentes de una tabla';
COMMENT ON FUNCTION urlencode(TEXT) IS 'Codifica texto para uso en URLs (percent-encoding)';

-- =============================================
-- INSTRUCCIONES DE USO
-- =============================================

/*
GEOCODING AUTOMÁTICO:
- Los triggers se ejecutan automáticamente al INSERT o UPDATE de direcciones
- Solo geocodifica si no hay coordenadas previas
- Si falla el geocoding, la operación continúa (solo warning)

GEOCODING MANUAL (BACKFILL):
Para geocodificar registros existentes sin coordenadas, usa la función:
  manual_geocode_table(table_name TEXT, limit_rows INTEGER DEFAULT NULL)

Ejemplos:

-- Geocodificar todas las sucursales sin coordenadas
SELECT * FROM manual_geocode_table('client_branches');

-- Geocodificar solo 10 proveedores (útil para pruebas)
SELECT * FROM manual_geocode_table('supplier_profiles', 10);

-- Geocodificar todos los clientes
SELECT * FROM manual_geocode_table('clients');

-- Geocodificar todos los suppliers
SELECT * FROM manual_geocode_table('suppliers');

NOTA: El geocoding manual puede tardar si hay muchos registros.
Se recomienda hacerlo en lotes pequeños usando el parámetro limit_rows.
*/

SELECT '✅ Función de geocoding automático instalada exitosamente!' as status;
