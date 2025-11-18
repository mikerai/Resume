// src/composables/useIOSNotifications.js
import { ref } from 'vue';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export function useIOSNotifications() {
  const hasPermission = ref(false);
  const deviceToken = ref(null);
  const isRegistered = ref(false);
  const notifications = ref([]);

  /**
   * Inicializar push notifications para iOS
   */
  const initializePushNotifications = async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log('⚠️ Push notifications only work on native platforms');
      return false;
    }

    try {
      console.log('📱 Initializing iOS push notifications...');

      // 1. Verificar permisos actuales
      let permStatus = await PushNotifications.checkPermissions();
      console.log('📋 Current permissions:', permStatus);

      // 2. Pedir permisos si no los tenemos
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('❌ Push notification permissions denied');
        return false;
      }

      hasPermission.value = true;
      console.log('✅ Push notification permissions granted');

      // 3. Registrar para push notifications
      await PushNotifications.register();

      // 4. Listeners
      setupListeners();

      return true;

    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      return false;
    }
  };

  /**
   * Configurar listeners para push notifications
   */
  const setupListeners = () => {
    // Token recibido
    PushNotifications.addListener('registration', (token) => {
      console.log('📱 Push registration token:', token.value);
      deviceToken.value = token.value;
      isRegistered.value = true;
    });

    // Error en registro
    PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ Push registration error:', error);
    });

    // Notificación recibida (app en primer plano)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📨 Push notification received (foreground):', notification);
      notifications.value.unshift({
        ...notification,
        timestamp: new Date(),
        received: true
      });

      // Mostrar notificación local en iOS
      showLocalNotification(notification);
    });

    // Notificación tocada
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('👆 Push notification tapped:', notification);

      const data = notification.notification;
      notifications.value.unshift({
        ...data,
        timestamp: new Date(),
        tapped: true
      });

      // Manejar acción según el tipo
      handleNotificationAction(data);
    });
  };

  /**
   * Mostrar notificación local
   */
  const showLocalNotification = async (notification) => {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title,
            body: notification.body,
            id: Date.now(),
            sound: 'default',
            attachments: notification.data?.imageUrl ? [{ id: 'image', url: notification.data.imageUrl }] : undefined,
            extra: notification.data
          }
        ]
      });
    } catch (error) {
      console.log('Local notifications not available:', error);
    }
  };

  /**
   * Manejar acciones de notificación
   */
  const handleNotificationAction = (notification) => {
    const data = notification.data || {};

    switch (data.type) {
      case 'job_assigned':
        console.log('🔧 Navigate to job:', data.jobId);
        // TODO: Navigate to job details
        break;
      case 'job_reminder':
        console.log('⏰ Navigate to schedule:', data.jobId);
        // TODO: Navigate to calendar
        break;
      case 'client_message':
        console.log('💬 Navigate to messages:', data.chatId);
        // TODO: Navigate to chat
        break;
      default:
        console.log('📱 Default notification action');
    }
  };

  /**
   * Enviar notificación de prueba local
   */
  const sendTestNotification = async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log('⚠️ Test notifications only work on native platforms');
      return;
    }

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      // Pedir permisos para notificaciones locales
      const permissions = await LocalNotifications.requestPermissions();
      if (permissions.display !== 'granted') {
        console.log('❌ Local notifications permission denied');
        return;
      }

      // Enviar notificación inmediata
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '🔧 Mantex Mobile',
            body: 'Notificación de prueba - ¡Las push notifications funcionan!',
            id: Date.now(),
            sound: 'default'
          }
        ]
      });

      console.log('✅ Test notification sent');

      // Enviar otra en 3 segundos
      setTimeout(async () => {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: '🚀 Nuevo Trabajo',
              body: 'Se te ha asignado: Mantenimiento de aire acondicionado',
              id: Date.now(),
              sound: 'default',
              extra: {
                type: 'job_assigned',
                jobId: '123'
              }
            }
          ]
        });
        console.log('✅ Second test notification sent');
      }, 3000);

    } catch (error) {
      console.error('❌ Error sending test notification:', error);
    }
  };

  /**
   * Obtener estado de permisos
   */
  const getPermissionStatus = async () => {
    try {
      const status = await PushNotifications.checkPermissions();
      hasPermission.value = status.receive === 'granted';
      return status;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return null;
    }
  };

  return {
    // Estado
    hasPermission,
    deviceToken,
    isRegistered,
    notifications,

    // Métodos
    initializePushNotifications,
    sendTestNotification,
    getPermissionStatus
  };
}