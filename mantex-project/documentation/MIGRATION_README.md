# Migraciones de Base de Datos - Homologación de Esquema

## Orden de Ejecución

### 1. Homologación de Campos de Dirección
**Archivo:** `homologate_address_schema.sql`

**Qué hace:**
- Agrega `latitude` y `longitude` a todas las tablas con direcciones
- Renombra `address` → `street` y `city` → `municipality_city` en `clients` y `suppliers`
- Agrega campos faltantes (`number`, `apt`, `neighborhood`) a `clients` y `suppliers`
- Migra datos de `supplier_profiles.legal_address` a campos separados
- Crea columnas generadas `full_address` en todas las tablas
- Crea columna generada `full_name` en `profiles`

**Ejecutar:**
```bash
psql "$DATABASE_URL" -f homologate_address_schema.sql
```

### 2. Geocoding Automático
**Archivo:** `auto_geocoding.sql`

**Qué hace:**
- Instala extensión `http` para llamadas a Google Maps API
- Crea función `geocode_address()` que obtiene lat/lng desde dirección
- Crea triggers automáticos en INSERT/UPDATE de direcciones
- Aplica a: `supplier_profiles`, `client_branches`, `clients`, `suppliers`
- Incluye función `manual_geocode_table()` para backfill de datos existentes

**Ejecutar:**
```bash
psql "$DATABASE_URL" -f auto_geocoding.sql
```

## Post-Migración

### Geocodificar Registros Existentes

Después de ejecutar ambas migraciones, geocodificar registros que ya existen:

```sql
-- Geocodificar sucursales
SELECT * FROM manual_geocode_table('client_branches');

-- Geocodificar proveedores
SELECT * FROM manual_geocode_table('supplier_profiles');

-- Geocodificar clientes
SELECT * FROM manual_geocode_table('clients');

-- Geocodificar suppliers
SELECT * FROM manual_geocode_table('suppliers');
```

## Verificación

```sql
-- Ver cuántos registros tienen coordenadas
SELECT 
  'supplier_profiles' as tabla,
  COUNT(*) FILTER (WHERE latitude IS NOT NULL) as con_coordenadas,
  COUNT(*) as total
FROM supplier_profiles
UNION ALL
SELECT 'client_branches', COUNT(*) FILTER (WHERE latitude IS NOT NULL), COUNT(*) FROM client_branches
UNION ALL
SELECT 'clients', COUNT(*) FILTER (WHERE latitude IS NOT NULL), COUNT(*) FROM clients
UNION ALL
SELECT 'suppliers', COUNT(*) FILTER (WHERE latitude IS NOT NULL), COUNT(*) FROM suppliers;
```

## Rollback (Si es necesario)

```sql
-- Eliminar triggers
DROP TRIGGER IF EXISTS auto_geocode_supplier_profiles ON supplier_profiles;
DROP TRIGGER IF EXISTS auto_geocode_client_branches ON client_branches;
DROP TRIGGER IF EXISTS auto_geocode_clients ON clients;
DROP TRIGGER IF EXISTS auto_geocode_suppliers ON suppliers;

-- Eliminar funciones
DROP FUNCTION IF EXISTS geocode_address();
DROP FUNCTION IF EXISTS manual_geocode_table(TEXT, INTEGER);
DROP FUNCTION IF EXISTS urlencode(TEXT);
DROP FUNCTION IF EXISTS build_full_address(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Eliminar columnas (CUIDADO: Esto borra datos)
ALTER TABLE supplier_profiles DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude, DROP COLUMN IF EXISTS full_address;
ALTER TABLE client_branches DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude, DROP COLUMN IF EXISTS full_address;
ALTER TABLE clients DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude, DROP COLUMN IF EXISTS full_address;
ALTER TABLE suppliers DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude, DROP COLUMN IF EXISTS full_address;
ALTER TABLE profiles DROP COLUMN IF EXISTS full_name;
```

## Notas Importantes

1. **API Key de Google Maps:** La función de geocoding usa la API key configurada. Asegúrate de que tenga cuota suficiente.

2. **Límites de Rate:** Google Maps tiene límites de requests por segundo. El geocoding manual puede tardar si hay muchos registros.

3. **Errores de Geocoding:** Si el geocoding falla para una dirección, la operación continúa (solo se registra un warning). Las coordenadas quedan en NULL.

4. **Extensión HTTP:** Requiere la extensión `http` de PostgreSQL. Si no está disponible, considera usar `pg_net` o una función externa.

5. **Triggers Automáticos:** Los triggers solo geocodifican si las coordenadas son NULL. Para re-geocodificar, establece `latitude = NULL, longitude = NULL` manualmente.
