# Documentación: Problema de RLS en ticket_evidence

## Problema
El usuario no podía subir evidencias a `ticket_evidence` debido a políticas RLS incorrectas.

## Causa Raíz
Existe duplicación de tablas en la base de datos:
- `clients` y `client_profiles` (ambas con `user_id`)
- `suppliers` y `supplier_profiles` (ambas con `user_id`)

**Foreign Keys en `tickets`:**
- `tickets.client_id` → `clients.id`
- `tickets.supplier_id` → `supplier_profiles.id`

Las políticas RLS estaban usando la tabla incorrecta (`suppliers` en lugar de `supplier_profiles`).

## Solución Aplicada
Se corrigió `fix-evidence-rls.sql` para usar las tablas correctas según las FK reales:

```sql
-- Para proveedores
ticket_id IN (
    SELECT t.id FROM tickets t
    WHERE t.supplier_id IN (
        SELECT sp.id FROM supplier_profiles sp WHERE sp.user_id = auth.uid()
    )
)

-- Para clientes
ticket_id IN (
    SELECT t.id FROM tickets t
    WHERE t.client_id IN (
        SELECT c.id FROM clients c WHERE c.user_id = auth.uid()
    )
)
```

## Problema Pendiente
**CRÍTICO**: Existe inconsistencia en la estructura de datos. Se necesita:

1. **Sincronizar datos** entre tablas duplicadas:
   - `clients` ↔ `client_profiles`
   - `suppliers` ↔ `supplier_profiles`
   - Ambas con `profiles`

2. **Decidir tabla canónica**: Elegir si usar `*_profiles` o las tablas base y migrar todas las FK.

3. **Eliminar duplicación**: Una vez sincronizado, deprecar una de las dos tablas.

## Archivos Afectados
- `/sakai-vue/database/fix-evidence-rls.sql` - Políticas RLS corregidas
- `/sakai-vue/database/evidence-system.sql` - Archivo original con políticas comentadas

## Próximos Pasos
1. Ejecutar `fix-evidence-rls.sql` en Supabase (HECHO)
2. Crear script de sincronización de datos entre tablas duplicadas (PENDIENTE)
3. Actualizar todas las políticas RLS del sistema para usar tablas correctas (PENDIENTE)
