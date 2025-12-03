#  Google APIs Setup Completo para Mantex

##  Objetivo
Integración completa y funcional de Google APIs para:
- **Maps API**: Geolocalización y tracking tiempo real
- **Calendar API**: Sistema de scheduling completo
- **Firebase**: Real-time updates y notifications

---

## STEP 1: Google Cloud Console Setup

### 1.1 Crear Proyecto en Google Cloud Console

```bash
# Acceder a: https://console.cloud.google.com/
# 1. Crear nuevo proyecto: "Mantex Production"
# 2. Anotar Project ID: mantex-production-XXXXXX
```

### 1.2 Habilitar APIs Requeridas

**APIs a habilitar:**
```bash
# Maps APIs
✅ Maps JavaScript API
✅ Geocoding API
✅ Directions API
✅ Places API
✅ Distance Matrix API

# Calendar API
✅ Google Calendar API

# Firebase APIs (NO Authentication - usamos Supabase Auth)
✅ Firebase Realtime Database API
✅ Firebase Cloud Messaging API
❌ Firebase Authentication API (NO NECESARIA)
```

### 1.3 Crear Credenciales

**API Keys necesarias:**
```env
# Maps API Key (con restricciones de dominio)
VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXX

# Firebase Config
VITE_FIREBASE_API_KEY=AIzaSyYYYYYYYYYYYYYYYYYYYYYY
VITE_FIREBASE_AUTH_DOMAIN=mantex-prod.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://mantex-prod-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=mantex-production-XXXXXX
VITE_FIREBASE_STORAGE_BUCKET=mantex-production-XXXXXX.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop

# OAuth 2.0 for Calendar API
VITE_GOOGLE_OAUTH_CLIENT_ID=123456789012-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

---

## STEP 2: Maps API Implementation

### 2.1 Funcionalidades Completas

**Para Suppliers (Técnicos):**
- ✅ Tracking de ubicación en tiempo real
- ✅ Rutas optimizadas hacia clientes
- ✅ Check-in/Check-out con geofencing
- ✅ Histórico de rutas recorridas

**Para Clients:**
- ✅ Ver ubicación del técnico en tiempo real
- ✅ Tiempo estimado de llegada (ETA)
- ✅ Mapa con todos los suppliers cercanos

**Para Admins:**
- ✅ Dashboard con todos los suppliers en mapa
- ✅ Análisis de rutas y eficiencia
- ✅ Asignación automática por proximidad

### 2.2 Componentes a Crear

```javascript
// Componentes Vue
📁 src/components/maps/
  ├── RealTimeMap.vue           // Mapa principal con tracking
  ├── SupplierTracker.vue       // Tracking individual de supplier
  ├── RouteOptimizer.vue        // Optimización de rutas
  ├── GeofenceChecker.vue       // Check-in/out automático
  └── LocationPicker.vue        // Selector de ubicación

// Composables
📁 src/composables/
  ├── useGoogleMaps.js          // API principal de Maps
  ├── useGeolocation.js         // Geolocalización HTML5 + Google
  ├── useRouting.js             // Rutas y direcciones
  └── useLocationTracking.js    // Tracking tiempo real
```

---

## STEP 3: Calendar API Implementation

### 3.1 Funcionalidades Completas

**Sistema de Scheduling:**
- ✅ Crear/editar/eliminar citas
- ✅ Disponibilidad automática de suppliers
- ✅ Sincronización bi-direccional con Google Calendar
- ✅ Notifications automáticas (email + push)
- ✅ Reagendamiento con conflicto detection

**Para Suppliers:**
- ✅ Calendar view de sus trabajos asignados
- ✅ Marcar disponibilidad/indisponibilidad
- ✅ Sincronizar con calendario personal

**Para Clients:**
- ✅ Agendar servicios con suppliers disponibles
- ✅ Ver calendar de sus servicios programados
- ✅ Recibir recordatorios automáticos

### 3.2 Componentes a Crear

```javascript
📁 src/components/calendar/
  ├── FullCalendarView.vue      // Vista principal de calendario
  ├── AppointmentBooker.vue     // Agendar citas
  ├── AvailabilityManager.vue   // Gestionar disponibilidad
  ├── CalendarSync.vue          // Sincronización Google Calendar
  └── NotificationCenter.vue    // Centro de notificaciones

📁 src/composables/
  ├── useGoogleCalendar.js      // API principal Calendar
  ├── useScheduling.js          // Sistema de agendamiento
  ├── useAvailability.js        // Gestión de disponibilidad
  └── useCalendarSync.js        // Sincronización bi-direccional
```

---

## STEP 4: Firebase Implementation

### 4.1 Real-Time Features

**IMPORTANTE: Firebase SOLO para datos temporales y notifications**
**Authentication: Supabase Auth (ya implementado)**

**Real-time Updates:**
- ✅ Ubicación de suppliers actualizada cada 30 segundos
- ✅ Status de trabajos (iniciado/en progreso/completado)
- ✅ Chat en tiempo real entre client-supplier
- ✅ Notificaciones push instantáneas

**Firebase Structure:**
```json
{
  "locations": {
    "supplier_id": {
      "lat": 19.4326,
      "lng": -99.1332,
      "timestamp": 1640995200000,
      "status": "en_ruta",
      "eta": "15 minutes"
    }
  },
  "jobs": {
    "job_id": {
      "status": "in_progress",
      "supplier_id": "supplier123",
      "client_id": "client456",
      "last_update": 1640995200000
    }
  },
  "notifications": {
    "user_id": {
      "message": "El técnico está en camino",
      "type": "location_update",
      "read": false,
      "timestamp": 1640995200000
    }
  }
}
```

### 4.2 Componentes a Crear

```javascript
📁 src/composables/
  ├── useFirebase.js            // Configuración Firebase
  ├── useRealTimeUpdates.js     // Updates en tiempo real
  ├── usePushNotifications.js   // Notificaciones push
  └── useFirebaseChat.js        // Chat tiempo real
```

---

## 🛠️ STEP 5: Integration & Testing

### 5.1 Environment Setup

```env
# .env.development
VITE_GOOGLE_MAPS_API_KEY=development_key_here
VITE_FIREBASE_PROJECT_ID=mantex-development-XXXXX

# .env.production
VITE_GOOGLE_MAPS_API_KEY=production_key_here
VITE_FIREBASE_PROJECT_ID=mantex-production-XXXXX
```

### 5.2 Testing Strategy

**Unit Tests:**
- ✅ Composables de Google APIs
- ✅ Firebase real-time functions
- ✅ Geolocation accuracy

**Integration Tests:**
- ✅ Maps + Calendar integration
- ✅ Firebase + Supabase sync
- ✅ Real-time updates flow

**E2E Tests:**
- ✅ Complete supplier journey (tracking)
- ✅ Complete client booking flow
- ✅ Admin dashboard functionality

---

## Success Metrics

### KPIs to Track:
- ✅ **Location accuracy**: <10 meters error
- ✅ **Real-time latency**: <5 seconds updates
- ✅ **Calendar sync**: 100% bi-directional
- ✅ **Notification delivery**: >95% success rate

### Performance Benchmarks:
- ✅ **Map load time**: <3 seconds
- ✅ **Location updates**: Every 30 seconds
- ✅ **Calendar API calls**: <500ms response
- ✅ **Firebase writes**: <100ms latency

¡Integración Google APIs completamente funcional y escalable! 