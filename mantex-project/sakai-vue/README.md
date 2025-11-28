# Mantex - Sistema de Gestión de Mantenimiento

> **Directriz Principal**: NO USAR EMOJIS en el código ni en la documentación técnica.

Sistema integral de gestión de mantenimiento que conecta clientes con proveedores de servicios, permitiendo la creación, asignación y seguimiento de tickets de mantenimiento.

## Tabla de Contenidos

- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración Inicial](#configuración-inicial)
- [Módulos Principales](#módulos-principales)
- [Base de Datos](#base-de-datos)
- [Integraciones](#integraciones)
- [Flujos de Trabajo](#flujos-de-trabajo)
- [Deployment](#deployment)
- [Mantenimiento](#mantenimiento)

## Arquitectura del Sistema

### Roles de Usuario

1. **Admin**: Gestión completa del sistema
2. **Client**: Empresas que solicitan servicios de mantenimiento
3. **Supplier**: Proveedores de servicios de mantenimiento

### Componentes Principales

```
mantex-project/
├── sakai-vue/          # Aplicación web (Admin, Client, Supplier)
├── mantex-mobile/      # Aplicación móvil (Client, Supplier)
└── lambda/             # Funciones serverless (AWS Lambda)
```

## Stack Tecnológico

### Frontend Web
- **Framework**: Vue 3 (Composition API)
- **UI Library**: PrimeVue
- **Build Tool**: Vite
- **Router**: Vue Router
- **State Management**: Composables (useAuth, useSupabase, etc.)

### Frontend Mobile
- **Framework**: Vue 3 + Ionic Framework
- **Capacitor**: Para funcionalidades nativas

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage + AWS S3
- **Serverless**: AWS Lambda (Node.js)

### Integraciones Externas
- **Nubarium API**: Validación de INE, SAT, biometría
- **Google Maps API**: Geocodificación y mapas
- **Firebase**: Notificaciones push y chat en tiempo real

## Estructura del Proyecto

### Aplicación Web (`sakai-vue/`)

```
sakai-vue/
├── src/
│   ├── api/                    # Módulos de API
│   │   ├── clients.js
│   │   ├── suppliers.js
│   │   ├── tickets.js
│   │   └── quotes.js
│   ├── components/             # Componentes reutilizables
│   │   ├── common/
│   │   ├── maps/
│   │   ├── quotes/
│   │   └── ticket/
│   ├── composables/            # Lógica reutilizable
│   │   ├── useAuth.js
│   │   ├── useSupabase.js
│   │   ├── useGoogleMaps.js
│   │   └── useVerifications.js
│   ├── layout/                 # Layouts por rol
│   │   ├── AppAdminLayout.vue
│   │   ├── AppClientLayout.vue
│   │   └── AppSupplierLayout.vue
│   ├── router/                 # Configuración de rutas
│   ├── utils/                  # Utilidades
│   │   └── status-utils.js    # Traducciones y severities
│   └── views/                  # Vistas por módulo
│       ├── admin/
│       ├── client/
│       ├── supplier/
│       └── onboarding/
├── database/                   # Scripts SQL
│   ├── client-supplier-profiles.sql
│   ├── sync_user_data.sql
│   └── create_quotes_tables.sql
└── lambda/                     # Funciones Lambda
    └── image-processor/
```

### Base de Datos

#### Tablas Principales

**Usuarios y Perfiles**
- `profiles`: Información básica del usuario (full_name, role)
- `client_profiles`: Datos completos del onboarding de clientes
- `supplier_profiles`: Datos completos del onboarding de proveedores
- `clients`: Tabla operativa de clientes
- `suppliers`: Tabla operativa de proveedores

**Tickets y Servicios**
- `tickets`: Solicitudes de mantenimiento
- `quotes`: Cotizaciones de proveedores
- `jobs`: Trabajos asignados y en progreso
- `ticket_assignments`: Asignación de tickets a proveedores

**Validaciones**
- `ine_verifications`: Validaciones de INE con Nubarium
- `sat_verifications`: Validaciones de SAT/RFC
- `documents`: Almacenamiento de URLs de documentos

**Ubicaciones y Activos**
- `client_branches`: Sucursales de clientes
- `client_assets`: Activos de clientes (equipos, instalaciones)

#### Sincronización de Datos

El sistema mantiene datos sincronizados entre tablas mediante:

1. **Componentes de Onboarding**: Actualizan directamente todas las tablas
   - `OnboardingClient.vue` → `profiles`, `client_profiles`, `clients`
   - `OnboardingSupplier.vue` → `profiles`, `supplier_profiles`, `suppliers`

2. **Trigger de Cotizaciones**: Actualiza `estimated_cost` en tickets
   ```sql
   -- Cuando una cotización es aprobada, actualiza el ticket
   CREATE TRIGGER trigger_update_estimated_cost
   AFTER INSERT OR UPDATE OF status, total_amount ON quotes
   FOR EACH ROW
   WHEN (NEW.status = 'approved')
   EXECUTE FUNCTION update_ticket_estimated_cost();
   ```

Ver [database/sync_user_data.sql](file:///Users/mikerai/Documents/GitHub/Resume/mantex-project/sakai-vue/database/sync_user_data.sql) para más detalles.

## Configuración Inicial

### Requisitos Previos

- Node.js 18+
- PostgreSQL (Supabase)
- Cuenta de Google Cloud (Maps API)
- Cuenta de AWS (S3, Lambda)
- Cuenta de Nubarium API

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Nubarium
VITE_NUBARIUM_API_KEY=your_nubarium_key
VITE_NUBARIUM_API_URL=https://api.nubarium.com

# AWS
VITE_AWS_REGION=us-east-1
VITE_AWS_S3_BUCKET=mantex-documents

# Firebase
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/your-org/mantex-project.git
cd mantex-project/sakai-vue

# Instalar dependencias
npm install

# Ejecutar migraciones de base de datos
psql -U postgres -d mantex -f database/client-supplier-profiles.sql
psql -U postgres -d mantex -f database/sync_user_data.sql
psql -U postgres -d mantex -f database/create_quotes_tables.sql

# Iniciar servidor de desarrollo
npm run dev
```

## Módulos Principales

### 1. Onboarding

Proceso de registro y validación para clientes y proveedores.

**Cliente** (`OnboardingClient.vue`):
1. Validación SAT (RFC + CIEC opcional)
2. Validación INE + Selfie
3. Información de empresa y dirección
4. Registro de activos

**Proveedor** (`OnboardingSupplier.vue`):
1. Validación INE + Selfie + Biometría
2. Validación SAT (RFC + CIEC obligatorio)
3. Documentación legal (seguros, certificaciones)
4. Información operativa (especialidades, áreas de servicio)
5. Revisión y envío

**Datos Guardados**:
- `profiles.full_name`: Nombre completo del usuario
- `client_profiles/supplier_profiles`: Todos los datos del onboarding
- `clients/suppliers`: Datos operativos con `full_address` y geocodificación

### 2. Gestión de Tickets

**Flujo de Ticket**:
```
pending → opened → assigned → in_progress → completed
                            ↓
                        cancelled
```

**Prioridades**:
- `low`: Baja (verde)
- `medium`: Media (azul)
- `high`: Alta (naranja)
- `urgent`: Urgente (rojo)

**Componentes Clave**:
- `client/Requests.vue`: Crear y ver tickets (cliente)
- `admin/Tickets.vue`: Gestión completa (admin)
- `supplier/Jobs.vue`: Ver trabajos asignados (proveedor)

### 3. Sistema de Cotizaciones

**Flujo**:
1. Cliente crea ticket
2. Admin asigna a proveedor(es)
3. Proveedor envía cotización
4. Cliente aprueba/rechaza
5. Si aprueba → `tickets.estimated_cost` se actualiza automáticamente

**Componentes**:
- `QuoteForm.vue`: Formulario para crear cotizaciones
- `quotes.js` API: CRUD de cotizaciones

### 4. Dashboard Admin

**Métricas**:
- Total de tickets por estado
- Proveedores pendientes de aprobación
- Mapa de ubicaciones
- Tabla de tickets recientes

**Vistas de Detalle**:
- `admin/SupplierDetail.vue`: Vista completa del proveedor
- `admin/ClientDetail.vue`: Vista completa del cliente
- `admin/TicketDetail.vue`: Detalle de ticket con chat

### 5. Utilidades Compartidas

**`status-utils.js`**: Centraliza traducciones y colores
```javascript
import { 
    translateStatus,      // 'pending' → 'Pendiente'
    getStatusSeverity,    // 'pending' → 'warning'
    translatePriority,    // 'high' → 'Alta'
    getPrioritySeverity,  // 'high' → 'warning'
    formatDate            // ISO → 'dd MMM yyyy'
} from '@/utils/status-utils.js';
```

## Integraciones

### Nubarium API

**Servicios Utilizados**:
1. **Validación de RFC**: Verifica existencia en SAT
2. **Validación de INE**: OCR de datos del INE
3. **Comparación Facial**: Selfie vs foto del INE
4. **Listas Negras**: Verificación en listas restrictivas

**Implementación**:
```javascript
import { useVerifications } from '@/composables/useVerifications';

const { validateINE, validateSAT } = useVerifications();

// Validar INE
const result = await validateINE(ineFrontBase64, ineBackBase64, selfieBase64);
```

### Google Maps API

**Funcionalidades**:
1. **Geocodificación**: Convertir direcciones a coordenadas
2. **Mapas Interactivos**: Mostrar ubicaciones de clientes/proveedores
3. **Cálculo de Distancias**: Para asignación de proveedores

**Componente**:
```vue
<GoogleMapView 
    :markers="markers" 
    :height="'400px'" 
/>
```

### Firebase

**Usos**:
1. **Chat en Tiempo Real**: Comunicación en tickets
2. **Notificaciones Push**: Alertas móviles

## Flujos de Trabajo

### Creación de Ticket (Cliente)

1. Cliente accede a `client/Requests.vue`
2. Completa formulario con:
   - Título y descripción
   - Prioridad
   - Sucursal y activo
   - Imágenes (opcional)
3. Sistema geocodifica la dirección
4. Ticket creado con estado `pending`

### Asignación de Ticket (Admin)

1. Admin ve ticket en `admin/Tickets.vue`
2. Cambia estado a `opened`
3. Asigna proveedor(es) basado en:
   - Especialidad
   - Ubicación
   - Disponibilidad
4. Proveedor recibe notificación

### Cotización y Aprobación

1. Proveedor crea cotización en `QuoteForm.vue`
2. Cliente ve cotización en detalle del ticket
3. Cliente aprueba → trigger actualiza `estimated_cost`
4. Trabajo se muestra en `supplier/Jobs.vue`

## Deployment

### Web Application

**Vercel** (Recomendado):
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Configuración** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Mobile Application

Ver documentación en `mantex-mobile/README.md`

### Lambda Functions

```bash
cd lambda/image-processor
npm install
zip -r function.zip .
aws lambda update-function-code --function-name image-processor --zip-file fileb://function.zip
```

## Mantenimiento

### Scripts de Base de Datos

**Sincronización de Datos**:
```bash
psql -U postgres -d mantex -f database/sync_user_data.sql
```

**Geocodificación Masiva**:
```bash
psql -U postgres -d mantex -f database/execute_geocoding.sql
```

**Limpieza de Registros Huérfanos**:
```bash
psql -U postgres -d mantex -f database/cleanup_orphaned_records.sql
```

### Monitoreo

**Verificar Estado del Sistema**:
```bash
node check-all-status.js
```

**Verificar Proveedores**:
```bash
node check-all-suppliers.js
```

## Documentación Adicional

- [SETUP.md](file:///Users/mikerai/Documents/GitHub/Resume/mantex-project/sakai-vue/SETUP.md) - Configuración detallada
- [DEPLOYMENT.md](file:///Users/mikerai/Documents/GitHub/Resume/mantex-project/sakai-vue/DEPLOYMENT.md) - Guía de deployment
- [GOOGLE_APIS_SETUP.md](file:///Users/mikerai/Documents/GitHub/Resume/mantex-project/sakai-vue/GOOGLE_APIS_SETUP.md) - Configuración de Google APIs
- [STORAGE_STRUCTURE.md](file:///Users/mikerai/Documents/GitHub/Resume/mantex-project/sakai-vue/STORAGE_STRUCTURE.md) - Estructura de almacenamiento
- [USER_MANUAL.md](file:///Users/mikerai/Documents/GitHub/Resume/mantex-project/sakai-vue/USER_MANUAL.md) - Manual del usuario

## Historial de Cambios

Ver [CHANGELOG.md](file:///Users/mikerai/Documents/GitHub/Resume/mantex-project/sakai-vue/CHANGELOG.md)

## Licencia

Ver [LICENSE.md](file:///Users/mikerai/Documents/GitHub/Resume/mantex-project/sakai-vue/LICENSE.md)

---

**Última actualización**: 2025-11-27
**Versión**: 1.0.0
