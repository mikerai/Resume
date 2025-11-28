# Mantex Mobile - Aplicación Móvil

Aplicación móvil para clientes y proveedores del sistema Mantex.

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Funcionalidades](#funcionalidades)
- [Desarrollo](#desarrollo)
- [Build y Deployment](#build-y-deployment)
- [Troubleshooting](#troubleshooting)

## Descripción General

Aplicación móvil nativa para iOS y Android construida con Ionic Framework y Vue 3. Permite a clientes crear y dar seguimiento a tickets de mantenimiento, y a proveedores gestionar sus trabajos asignados.

### Características Principales

**Para Clientes:**
- Crear solicitudes de mantenimiento con fotos
- Ver estado de tickets en tiempo real
- Recibir y aprobar cotizaciones
- Chat en tiempo real con proveedores
- Notificaciones push

**Para Proveedores:**
- Ver trabajos asignados
- Crear y enviar cotizaciones
- Actualizar estado de trabajos
- Chat con clientes
- Navegación GPS a ubicaciones

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Framework | Vue 3 (Composition API) |
| UI Framework | Ionic 7 |
| Native Runtime | Capacitor 5 |
| Build Tool | Vite 4 |
| Database | Supabase (PostgreSQL) |
| Real-time | Firebase Realtime Database |
| Authentication | Supabase Auth |
| Storage | AWS S3 (via Lambda) |
| Push Notifications | Firebase Cloud Messaging |
| Maps | Google Maps API |

## Instalación

### Requisitos Previos

- Node.js 18+
- npm o yarn
- Xcode 14+ (para iOS)
- Android Studio (para Android)
- CocoaPods (para iOS)

### Pasos de Instalación

```bash
# Clonar repositorio
cd mantex-project/mantex-mobile

# Instalar dependencias
npm install

# Sincronizar plataformas
npx cap sync
```

## Configuración

### Variables de Entorno

Crear archivo `.env` en la raíz de `mantex-mobile/`:

```env
# Supabase
VITE_SUPABASE_URL=https://kdohbawwpcjyiyjgjzow.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=mantex-production-1cd9d.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://mantex-production-1cd9d-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=mantex-production-1cd9d
VITE_FIREBASE_STORAGE_BUCKET=mantex-production-1cd9d.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=296798262114
VITE_FIREBASE_APP_ID=your_firebase_app_id

# AWS Lambda
VITE_LAMBDA_S3_UPLOAD_URL=https://your-api-gateway-url/dev/s3/upload
VITE_LAMBDA_S3_DELETE_URL=https://your-api-gateway-url/dev/s3/delete

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Configuración de iOS

1. Abrir `ios/App/App.xcworkspace` en Xcode
2. Configurar Team y Signing Certificate
3. Configurar Bundle Identifier: `com.mantex.mobile`
4. Agregar permisos en `Info.plist`:
   - Camera Usage
   - Photo Library Usage
   - Location When In Use

### Configuración de Android

1. Abrir `android/` en Android Studio
2. Configurar signing key
3. Actualizar `AndroidManifest.xml` con permisos:
   - CAMERA
   - READ_EXTERNAL_STORAGE
   - ACCESS_FINE_LOCATION

## Estructura del Proyecto

```
mantex-mobile/
├── src/
│   ├── views/
│   │   ├── client/              # Vistas de cliente
│   │   │   ├── Dashboard.vue    # Dashboard principal
│   │   │   ├── Tickets.vue      # Lista de tickets
│   │   │   └── CreateTicket.vue # Crear nuevo ticket
│   │   ├── technician/          # Vistas de proveedor
│   │   │   ├── Tab1.vue         # Trabajos activos
│   │   │   └── Tab2.vue         # Perfil y configuración
│   │   └── shared/              # Vistas compartidas
│   │       ├── TicketDetail.vue # Detalle de ticket
│   │       └── Login.vue        # Autenticación
│   ├── components/              # Componentes reutilizables
│   │   ├── quotes/
│   │   │   └── QuoteForm.vue    # Formulario de cotización
│   │   ├── ticket/
│   │   │   └── TicketCard.vue   # Tarjeta de ticket
│   │   └── common/
│   │       └── ImageUpload.vue  # Subida de imágenes
│   ├── composables/             # Lógica reutilizable
│   │   ├── useAuth.js           # Autenticación
│   │   ├── useFirebaseJobs.js   # Trabajos en Firebase
│   │   ├── useFirebaseChat.js   # Chat en tiempo real
│   │   ├── useClientTickets.js  # Tickets de cliente
│   │   └── usePermissions.js    # Permisos por rol
│   ├── router/
│   │   └── index.js             # Configuración de rutas
│   ├── assets/
│   │   └── styles/
│   │       └── mantex-standards.scss  # Sistema de diseño
│   └── lib/
│       ├── supabaseClient.js    # Cliente de Supabase
│       └── firebaseConfig.js    # Configuración de Firebase
├── ios/                         # Proyecto nativo iOS
├── android/                     # Proyecto nativo Android
├── capacitor.config.ts          # Configuración de Capacitor
└── package.json
```

## Funcionalidades

### Sistema de Autenticación

**Implementación**: `composables/useAuth.js`

```javascript
import { useAuth } from '@/composables/useAuth';

const { user, profile, signIn, signOut, isAuthenticated } = useAuth();

// Login
await signIn(email, password);

// Logout
await signOut();

// Verificar autenticación
if (isAuthenticated.value) {
  // Usuario autenticado
}
```

### Gestión de Tickets (Cliente)

**Crear Ticket**:
```javascript
import { useClientTickets } from '@/composables/useClientTickets';

const { createTicket, uploadTicketImages } = useClientTickets();

// Crear ticket
const ticket = await createTicket({
  title: 'Fuga de agua',
  description: 'Fuga en baño principal',
  priority: 'high',
  branch_id: branchId
});

// Subir imágenes
await uploadTicketImages(ticket.id, imageFiles);
```

### Trabajos (Proveedor)

**Ver Trabajos Asignados**:
```javascript
import { useFirebaseJobs } from '@/composables/useFirebaseJobs';

const { jobs, listenToTechnicianJobs, updateJobStatus } = useFirebaseJobs();

// Escuchar trabajos en tiempo real
listenToTechnicianJobs(technicianId);

// Actualizar estado
await updateJobStatus(jobId, 'in_progress');
```

### Chat en Tiempo Real

**Implementación**:
```javascript
import { useFirebaseChat } from '@/composables/useFirebaseChat';

const { messages, sendMessage, markAsRead } = useFirebaseChat(ticketId);

// Enviar mensaje
await sendMessage('Mensaje de prueba');

// Marcar como leído
await markAsRead(messageId);
```

### Cotizaciones

**Crear Cotización**:
```vue
<QuoteForm 
  :ticket-id="ticketId"
  @quote-created="handleQuoteCreated"
/>
```

### Notificaciones Push

**Configuración**:
```javascript
import { PushNotifications } from '@capacitor/push-notifications';

// Registrar para notificaciones
await PushNotifications.requestPermissions();
await PushNotifications.register();

// Escuchar notificaciones
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  console.log('Push received:', notification);
});
```

## Desarrollo

### Ejecutar en Navegador

```bash
npm run dev
```

Acceder en `http://localhost:5173`

### Ejecutar en iOS

```bash
# Build
npm run build

# Sincronizar
npx cap sync ios

# Abrir en Xcode
npx cap open ios
```

Luego ejecutar desde Xcode (Cmd+R)

### Ejecutar en Android

```bash
# Build
npm run build

# Sincronizar
npx cap sync android

# Abrir en Android Studio
npx cap open android
```

Luego ejecutar desde Android Studio

### Live Reload en Dispositivo

```bash
# Iniciar servidor de desarrollo
npm run dev

# En otro terminal, sincronizar con IP local
npx cap run ios --livereload --external
npx cap run android --livereload --external
```

## Build y Deployment

### iOS (App Store)

1. **Preparar Build**
   ```bash
   npm run build
   npx cap sync ios
   npx cap open ios
   ```

2. **Configurar en Xcode**
   - Seleccionar Team
   - Incrementar Version y Build Number
   - Configurar Signing & Capabilities

3. **Crear Archive**
   - Product > Archive
   - Window > Organizer > Upload to App Store

4. **App Store Connect**
   - Crear nueva versión
   - Agregar screenshots
   - Submit for review

### Android (Play Store)

1. **Preparar Build**
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

2. **Generar Signed Bundle**
   - Build > Generate Signed Bundle/APK
   - Seleccionar release variant
   - Firmar con keystore

3. **Subir a Play Console**
   - Crear release
   - Subir AAB
   - Submit for review

## Troubleshooting

### Firebase No Inicializado

**Error**: "Firebase not initialized"

**Solución**:
```javascript
// Asegurar que useFirebaseJobs se importa antes que useFirebaseChat
import { useFirebaseJobs } from '@/composables/useFirebaseJobs';
import { useFirebaseChat } from '@/composables/useFirebaseChat';
```

### Problemas de Capacitor Sync

```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install

# Sincronizar plataformas
npx cap sync ios
npx cap sync android

# Si iOS falla
cd ios/App
pod install
cd ../..
```

### Permisos de Cámara No Funcionan

**iOS**: Verificar `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Necesitamos acceso a la cámara para tomar fotos de evidencia</string>
```

**Android**: Verificar `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

### Push Notifications No Llegan

1. Verificar configuración en Firebase Console
2. Verificar permisos en dispositivo
3. Verificar token FCM se guarda en base de datos
4. Verificar logs en Firebase Cloud Messaging

## Sistema de Diseño

Ver `src/assets/styles/mantex-standards.scss` para:
- Paleta de colores "Deep Ocean Neon"
- Tipografía
- Componentes reutilizables
- Efectos visuales (glassmorphism, neon glow)

## Testing

### Unit Tests

```bash
npm run test:unit
```

### E2E Tests

```bash
npm run test:e2e
```

## Recursos Adicionales

- [Documentación de Ionic](https://ionicframework.com/docs)
- [Documentación de Capacitor](https://capacitorjs.com/docs)
- [Guía de Vue 3](https://vuejs.org/guide/)
- [Manual de Usuario](file:///Users/mikerai/Documents/GitHub/Resume/mantex-project/USER_MANUAL.md)

---

**Última actualización**: 2025-11-27
**Versión**: 1.0.0
