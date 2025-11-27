-- =============================================
-- DIAGNÓSTICO DE GEOCODING
-- =============================================
-- Ejecuta este script para probar la función de geocoding con una dirección de prueba

DO $$
DECLARE
    test_address TEXT := 'Av. Reforma 222, Ciudad de México, CDMX, México';
    api_key TEXT := 'AIzaSyBGz387mS954FeNqQWiK3eCWJgatm1W0-0'; -- La key que está en la función
    api_url TEXT;
    api_response JSONB;
    lat DECIMAL(10, 8);
    lng DECIMAL(11, 8);
BEGIN
    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE 'Iniciando prueba de geocoding para: %', test_address;
    
    -- 1. Verificar extensión HTTP
    RAISE NOTICE 'Verificando extensión http...';
    BEGIN
        PERFORM 1 FROM pg_extension WHERE extname = 'http';
        RAISE NOTICE '✅ Extensión http instalada.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error verificando extensión: %', SQLERRM;
    END;

    -- 2. Construir URL (simulando lo que hace la función)
    api_url := 'https://maps.googleapis.com/maps/api/geocode/json?address=' || 
               replace(test_address, ' ', '+') || 
               '&key=' || api_key;
               
    RAISE NOTICE 'URL de API: %', api_url;

    -- 3. Hacer request
    BEGIN
        SELECT content::jsonb INTO api_response
        FROM http_get(api_url);
        
        RAISE NOTICE 'Respuesta de API (Status): %', api_response->>'status';
        
        IF api_response->>'status' = 'OK' THEN
            lat := (api_response->'results'->0->'geometry'->'location'->>'lat')::DECIMAL(10, 8);
            lng := (api_response->'results'->0->'geometry'->'location'->>'lng')::DECIMAL(11, 8);
            RAISE NOTICE '✅ ÉXITO! Coordenadas obtenidas: Lat %, Lng %', lat, lng;
        ELSE
            RAISE NOTICE '❌ FALLÓ. Mensaje de error: %', api_response->>'error_message';
            RAISE NOTICE 'Posibles causas: API Key inválida, cuota excedida, facturación no habilitada.';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error fatal al llamar a la API: %', SQLERRM;
        RAISE NOTICE 'Hint: Verifica que la extensión http pueda hacer llamadas externas (net permissions).';
    END;
    
    RAISE NOTICE '---------------------------------------------------';
END $$;
