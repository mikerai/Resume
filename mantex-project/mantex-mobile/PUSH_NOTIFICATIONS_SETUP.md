# 🔔 Push Notifications Setup Profesional - Mantex Mobile

## Arquitectura Completa

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mantex API    │───▶│   Firebase FCM  │───▶│   User Device   │
│   (Backend)     │    │   (Messaging)   │    │  iOS/Android    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        ▼                        │
         │               ┌─────────────────┐               │
         └──────────────▶│  APNs (Apple)   │◀──────────────┘
                         │  GCM (Google)   │
                         └─────────────────┘
```

## 1. Firebase Setup

### Crear Proyecto Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crear nuevo proyecto: "Mantex Mobile"
3. Habilitar Cloud Messaging
4. Descargar configuración:
   - `GoogleService-Info.plist` (iOS)
   - `google-services.json` (Android)

### Configurar APNs Key
1. Apple Developer Account → Certificates, IDs & Profiles
2. Keys → Create New Key
3. Enable "Apple Push Notifications service (APNs)"
4. Download `.p8` key file
5. En Firebase Console → Project Settings → Cloud Messaging
6. Upload APNs Authentication Key

## 2. Capacitor Configuration

### capacitor.config.ts
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mantex.mobile',
  appName: 'Mantex Mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert'],
      deliveryMetricsExportToBigQuery: true
    }
  }
};

export default config;
```

## 3. Dependencies Installation

```bash
# Core dependencies
npm install @capacitor/push-notifications
npm install firebase

# Para iOS
npm install @capacitor/ios
npx cap add ios

# Para Android
npm install @capacitor/android
npx cap add android

# CocoaPods (iOS)
cd ios/App && pod install
```

## 4. Service Worker (PWA Support)

### public/sw.js
```javascript
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "mantex-mobile.firebaseapp.com",
  projectId: "mantex-mobile",
  storageBucket: "mantex-mobile.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background Message received:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: payload.data?.type || 'mantex-notification',
    data: payload.data,
    actions: [
      {
        action: 'view',
        title: 'Ver Detalles'
      },
      {
        action: 'dismiss',
        title: 'Cerrar'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
```

## 5. Push Notifications Composable

### src/composables/usePushNotifications.js
```javascript
import { ref, onMounted } from 'vue';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export function usePushNotifications() {
  const isInitialized = ref(false);
  const deviceToken = ref(null);
  const notifications = ref([]);

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const messaging = Capacitor.isNativePlatform() ? null : getMessaging(app);

  const initializePushNotifications = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Native platform (iOS/Android)
        await initializeNativePush();
      } else {
        // Web platform
        await initializeWebPush();
      }

      isInitialized.value = true;
      console.log('✅ Push notifications initialized');
    } catch (error) {
      console.error('❌ Push notification initialization failed:', error);
    }
  };

  const initializeNativePush = async () => {
    // Request permission
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      throw new Error('Push notification permission denied');
    }

    // Register for push notifications
    await PushNotifications.register();

    // Listeners
    PushNotifications.addListener('registration', (token) => {
      console.log('📱 Native token received:', token.value);
      deviceToken.value = token.value;
      sendTokenToServer(token.value, 'native');
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ Native registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📨 Notification received:', notification);
      notifications.value.push({
        ...notification,
        timestamp: new Date(),
        platform: 'native'
      });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('👆 Notification action performed:', notification);
      handleNotificationAction(notification);
    });
  };

  const initializeWebPush = async () => {
    if (!messaging) return;

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });

      console.log('🌐 Web FCM token:', token);
      deviceToken.value = token;
      sendTokenToServer(token, 'web');

      // Handle foreground messages
      onMessage(messaging, (payload) => {
        console.log('📨 Foreground message received:', payload);

        notifications.value.push({
          ...payload.notification,
          data: payload.data,
          timestamp: new Date(),
          platform: 'web'
        });

        // Show notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: payload.notification.icon || '/icons/icon-192x192.png',
            tag: payload.data?.type || 'mantex-notification',
            data: payload.data
          });
        }
      });

    } catch (error) {
      console.error('❌ Web push initialization failed:', error);
    }
  };

  const sendTokenToServer = async (token, platform) => {
    try {
      // Send token to your backend
      const response = await fetch('/api/push-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          token,
          platform,
          userId: getCurrentUserId(),
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        console.log('✅ Token sent to server successfully');
      }
    } catch (error) {
      console.error('❌ Failed to send token to server:', error);
    }
  };

  const handleNotificationAction = (notification) => {
    const { actionId, notification: notificationData } = notification;

    switch (actionId) {
      case 'view':
        // Navigate to relevant screen
        if (notificationData.data?.jobId) {
          navigateToJob(notificationData.data.jobId);
        }
        break;
      case 'dismiss':
        // Just dismiss
        break;
      default:
        // Default action (tap)
        if (notificationData.data?.jobId) {
          navigateToJob(notificationData.data.jobId);
        }
    }
  };

  const sendTestNotification = async () => {
    if (!deviceToken.value) {
      console.error('❌ No device token available');
      return;
    }

    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          token: deviceToken.value,
          notification: {
            title: '🔧 Nuevo Trabajo Asignado',
            body: 'Se te ha asignado: Mantenimiento Aire Acondicionado',
            icon: '/icons/icon-192x192.png'
          },
          data: {
            type: 'job_assigned',
            jobId: '12345',
            action: 'view_job'
          }
        })
      });

      if (response.ok) {
        console.log('✅ Test notification sent');
      }
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
    }
  };

  const getCurrentUserId = () => {
    // Get current user ID from auth system
    return localStorage.getItem('user_id') || 'anonymous';
  };

  const navigateToJob = (jobId) => {
    // Navigate to job details
    console.log('🔗 Navigate to job:', jobId);
    // Implementation depends on your routing system
  };

  onMounted(() => {
    initializePushNotifications();
  });

  return {
    isInitialized,
    deviceToken,
    notifications,
    initializePushNotifications,
    sendTestNotification
  };
}
```

## 6. Backend API Requirements

### Endpoints Necesarios:

1. **POST /api/push-tokens** - Guardar device tokens
2. **POST /api/send-notification** - Enviar notificaciones
3. **GET /api/notifications** - Historial de notificaciones
4. **PUT /api/notification-preferences** - Preferencias del usuario

### Ejemplo Server-side (Node.js/Express)
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Send notification
app.post('/api/send-notification', async (req, res) => {
  const { token, notification, data } = req.body;

  try {
    const message = {
      notification,
      data,
      token
    };

    const response = await admin.messaging().send(message);
    res.json({ success: true, messageId: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 7. iOS Configuration

### Info.plist Additions
```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
<key>NSUserNotificationsUsageDescription</key>
<string>Esta app necesita enviar notificaciones sobre trabajos asignados</string>
```

### Xcode Capabilities
1. Signing & Capabilities
2. + Capability → Push Notifications
3. + Capability → Background Modes
4. Check "Remote notifications"

## 8. Testing Strategy

### Niveles de Prueba:
1. **Desarrollo Local** - Service Worker + Web notifications
2. **Staging** - FCM Web con tokens reales
3. **Production** - iOS/Android nativo con APNs/GCM

### Test Commands:
```bash
# Test web notifications
npm run dev
# Navigate to /test-notifications

# Test native notifications
npx cap run ios
# Use device for real testing
```

## 9. Production Checklist

- [ ] Firebase project configured
- [ ] APNs certificates uploaded
- [ ] Service Worker registered
- [ ] Device tokens stored in database
- [ ] Backend API endpoints implemented
- [ ] Push notification content templates
- [ ] User notification preferences
- [ ] Analytics/tracking setup
- [ ] Error handling & fallbacks
- [ ] Rate limiting on server

## 10. Notification Types for Mantex

```javascript
const NOTIFICATION_TYPES = {
  JOB_ASSIGNED: {
    title: '🔧 Nuevo Trabajo Asignado',
    template: 'Se te ha asignado: {jobTitle}',
    action: 'view_job',
    priority: 'high'
  },
  JOB_REMINDER: {
    title: '⏰ Recordatorio de Trabajo',
    template: 'Tienes un trabajo en {timeRemaining}',
    action: 'view_schedule',
    priority: 'normal'
  },
  JOB_UPDATED: {
    title: '📝 Trabajo Actualizado',
    template: 'El trabajo {jobTitle} ha sido modificado',
    action: 'view_job',
    priority: 'normal'
  },
  CLIENT_MESSAGE: {
    title: '💬 Mensaje del Cliente',
    template: '{clientName} te ha enviado un mensaje',
    action: 'view_chat',
    priority: 'high'
  },
  PAYMENT_RECEIVED: {
    title: '💰 Pago Recibido',
    template: 'Has recibido ${amount} por {jobTitle}',
    action: 'view_payments',
    priority: 'normal'
  }
};
```

## Siguientes Pasos

1. **Firebase Setup** - Crear proyecto y configurar APNs
2. **Environment Variables** - Configurar todas las keys
3. **Backend API** - Implementar endpoints de notificaciones
4. **Testing** - Probar cada nivel (web → staging → production)
5. **Analytics** - Tracking de entrega y engagement

¿Por dónde quieres empezar? ¿Firebase setup primero?