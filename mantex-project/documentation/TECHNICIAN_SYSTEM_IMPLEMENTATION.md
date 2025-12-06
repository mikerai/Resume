# Documentación de Implementación: Sistema de Técnicos y Onboarding

## Resumen
Se ha implementado el módulo completo para la gestión de técnicos por parte de los proveedores ("Suppliers"). Esto permite a las empresas proveedoras invitar técnicos, gestionar sus sucursales, y habilita un flujo de onboarding específico para que los técnicos validen su identidad y domicilio antes de acceder a la plataforma.

## Cambios Realizados

### 1. Base de Datos (Supabase)

*   **Nuevo Sub-rol**: Se definió el sub-rol `technician` bajo el dominio `supplier` en la tabla `sub_roles`.
*   **Nueva Tabla `supplier_branches`**:
    *   Permite a los proveedores registrar múltiples ubicaciones (Oficina Central y Sucursales).
    *   Soporta carga de imágenes (fachada) y layouts.
    *   Incluye lógica (Trigger) para asegurar solo una "Oficina Central" (`is_headquarters`) por proveedor.
*   **Nueva Tabla `supplier_team_members`**:
    *   Vincula usuarios (técnicos) con un perfil de proveedor.
    *   Soporta flujo de invitación por correo electrónico (`email`, `status='invited'`).
    *   Al registrarse el usuario en la app, un Trigger detecta el correo y lo vincula automáticamente al equipo.
*   **Nueva Tabla `technician_verifications`**:
    *   Almacena el estado y documentos del onboarding (INE Frente/Reverso, Selfie, Comprobante Domicilio).
    *   Integra resultados de validación (Nubarium).
*   **Actualización en `tickets`**:
    *   Se añadió la columna `technician_id`.
    *   **RLS (Row Level Security)** actualizado:
        *   **Proveedores**: Ven todos los tickets de su empresa.
        *   **Técnicos**: Solo ven tickets asignados a ELLOS explícitamente O tickets de su empresa que están "sin asignar" (`technician_id IS NULL`) y abiertos.

### 2. Frontend (Sakai Vue)

*   **Portal de Proveedor (`/supplier`)**:
    *   Se agregó la sección **"Mi Empresa"** en el menú lateral.
    *   **Vistas Implementadas**:
        *   `CompanyInfo.vue`: Edición de datos fiscales y generales.
        *   `Headquarters.vue`: Gestión de la oficina central y media.
        *   `Branches.vue`: CRUD de sucursales adicionales.
        *   `Technicians.vue`: CRUD de técnicos (invitar, editar, eliminar).
*   **Portal de Técnico / Onboarding**:
    *   **Validación de Rutas**: El `router` ahora detecta si un técnico no ha completado el onboarding y lo redirige forzosamente a `/onboarding/technician`.
    *   **Vista de Onboarding (`views/technician/Onboarding.vue`)**:
        *   Implementación paso a paso (Wizard).
        *   Integración con `NubariumService` para OCR de INE, Comparación Facial (Selfie vs INE) y extracción de domicilio.
        *   Carga de archivos a S3 (`verifications/ine`, etc.).

### 3. Flujos de Trabajo

#### A. Invitación y Registro de Técnico
1.  El Proveedor entra a "Mi Empresa" > "Técnicos".
2.  Agrega un técnico ingresando Nombre, Apellido y Email.
3.  Se crea un registro en `supplier_team_members` con estatus `invited`.
4.  El Técnico se descarga la app o entra a la web y se registra con ese mismo Email.
5.  El sistema asigna automáticamente el rol `supplier` y sub-rol `technician`, y actualiza su estatus a `active` en el equipo.

#### B. Onboarding
1.  Al iniciar sesión por primera vez, el técnico es redirigido a la pantalla de verificación.
2.  Sube fotos de su INE y una Selfie.
3.  El sistema valida la identidad en tiempo real (score de similitud).
4.  Sube comprobante de domicilio.
5.  Envía la solicitud.
6.  (Pendiente) Admin revisa y aprueba definitivamente.

## Sugerencias y Siguientes Pasos

1.  **Panel de Aprobación de Admin**: Actualmente el status de verificación queda en `submitted`. Se requiere una vista en el panel de Admin para revisar estos documentos y cambiar el estado a `approved`.
2.  **Notificaciones por Correo**: Implementar envío de correos reales con SendGrid/Resend cuando se invita a un técnico.
3.  **App Móvil**: Replicar la vista de lista de tickets usando la lógica de "Asignados + Sin Asignar" que ya se definió en el backend.
4.  **Bloqueo Estricto**: Asegurar que la API de tickets devuelva 0 resultados si el `technician_verifications` no está `approved`, añadiendo esa condición al RLS de tickets (actualmente solo valida membresía de equipo).
