# Fase 4: Refinamiento de Roles y Homologación de Plataforma

## Objetivos
1.  **Centralización de Permisos:** Implementar un sistema de permisos unificado (Web y Mobile) basado en la tabla `sub_roles` y su columna `permissions` (JSONB), eliminando lógica hardcoded (`v-if="s.sub_role === 'admin'"`).
2.  **Homologación de Datos:** Unificar las consultas a la base de datos entre Web y Mobile para garantizar consistencia (mismas vistas, mismos filtros RLS).
3.  **Refinamiento de Esquema:** Asegurar que todos los roles necesarios (incluyendo `technician`) existan correctamente en la tabla maestra `sub_roles` y tengan los permisos base definidos.

## Análisis de Situación Actual

### Base de Datos (`sub_roles`)
El esquema actual permite gran flexibilidad mediante `permissions JSONB`.
*   **Roles Existentes:** Definidos para Admin, Client y Supplier (Owner, Manager, etc.).
*   **Roles Faltantes:** El rol `technician` se insertó ad-hoc en un script separado. Debe integrarse formalmente en la tabla maestra.

### Lógica de Frontend
*   **Mobile:** Usa `usePermissions.js` con una función `can(action, resource)` que lee del JSONB del perfil. ¡Excelente patrón!
*   **Web:** La lógica de permisos parece estar dispersa o evaluada directamente en los componentes. No se encontró un composable `usePermissions` equivalente.

### Discrepancias Detectadas
*   **Tickets Query:** Mobile usa `useTechnicianTickets` que maneja bien la lógica de asignación. Web usa lógica directa en `Jobs.vue`.
*   **Permisos:** Mobile tiene lógica centralizada. Web no.

## Plan de Ejecución

### Paso 1: Estandarización de Base de Datos
1.  Crear script `unify_sub_roles.sql`:
    *   Insertar/Actualizar el rol `technician` en `sub_roles`.
    *   Definir permisos base para todos los roles (Standard JSON structure).
    *   Ejemplo JSON: `{"tickets": "manage_assigned", "users": "none", "assets": "read"}`.

### Paso 2: Unificación de Lógica de Permisos (Web)
1.  Portar `usePermissions.js` de Mobile a `sakai-vue/src/composables`.
2.  Adaptarlo para que funcione con el store de usuario de Web (Pinia o Composable existente).
3.  Refactorizar componentes clave (`Jobs.vue`, `Dashboard.vue`) para usar `can(...)` en lugar de `isSupplierApproved` o chequeos directos donde aplique lógica de rol.

### Paso 3: Homologación de Queries
1.  Revisar `technician_tickets_view` (si existe) o crear una vista unificada que sirva tanto para el Dashboard Web como Mobile, encapsulando la lógica de "Tickets asignados + Tickets sin asignar de mi empresa".

### Paso 4: Limpieza
1.  Eliminar tablas o columnas obsoletas (ej. referencias a `suppliers` antigua si ya todo migró a `supplier_profiles`).
2.  Documentar la Matriz de Permisos final.

---
**Nota:** Este plan asegura que si mañana cambiamos los permisos de un "Técnico" en la BD, la App y la Web se actualicen automáticamente sin redeploy de código.
