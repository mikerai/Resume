import { ref } from 'vue';
import { useNotifications } from './useNotifications.js';

export function useNotificationTester() {
  const { sendNotification } = useNotifications();
  const testResults = ref([]);
  const isTestingPush = ref(false);

  // Simular notificaciones de trabajo
  const testJobNotifications = async () => {
    isTestingPush.value = true;
    testResults.value = [];

    const testScenarios = [
      {
        title: 'Nuevo Trabajo Asignado',
        body: 'Se te ha asignado: Mantenimiento Aire Acondicionado',
        data: { type: 'job_assigned', jobId: '123' },
        delay: 1000
      },
      {
        title: 'Recordatorio de Trabajo',
        body: 'Tienes un trabajo mañana a las 10:00 AM',
        data: { type: 'job_reminder', jobId: '123' },
        delay: 3000
      },
      {
        title: 'Trabajo Actualizado',
        body: 'La ubicación del trabajo ha cambiado',
        data: { type: 'job_updated', jobId: '123' },
        delay: 5000
      },
      {
        title: 'Mensaje del Cliente',
        body: 'El cliente ha enviado un mensaje sobre el trabajo',
        data: { type: 'client_message', jobId: '123' },
        delay: 7000
      }
    ];

    console.log('🧪 Iniciando pruebas de notificaciones...');

    for (const scenario of testScenarios) {
      setTimeout(async () => {
        try {
          console.log(`📱 Enviando: ${scenario.title}`);

          // En web mostrará notification nativa del navegador
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(scenario.title, {
              body: scenario.body,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: scenario.data.type,
              data: scenario.data,
              requireInteraction: true
            });
          }

          // También simulamos la respuesta de Firebase
          const result = await simulateFirebaseResponse(scenario);

          testResults.value.push({
            ...scenario,
            timestamp: new Date().toLocaleTimeString(),
            success: result.success,
            platform: 'web'
          });

          console.log(`✅ Notificación enviada: ${scenario.title}`);

        } catch (error) {
          console.error(`❌ Error enviando notificación:`, error);
          testResults.value.push({
            ...scenario,
            timestamp: new Date().toLocaleTimeString(),
            success: false,
            error: error.message,
            platform: 'web'
          });
        }
      }, scenario.delay);
    }

    // Finalizar pruebas después del último escenario
    setTimeout(() => {
      isTestingPush.value = false;
      console.log('🎯 Pruebas de notificaciones completadas');
      showTestSummary();
    }, 9000);
  };

  // Simular respuesta de Firebase
  const simulateFirebaseResponse = async (notification) => {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      success: true,
      messageId: `msg_${Math.random().toString(36).substr(2, 9)}`,
      platform: 'web',
      deliveredAt: new Date().toISOString()
    };
  };

  // Probar notificaciones web del navegador
  const testBrowserNotifications = async () => {
    try {
      console.log('🌐 Probando notificaciones del navegador...');

      // Pedir permisos si no los tenemos
      if ('Notification' in window) {
        let permission = Notification.permission;

        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }

        if (permission === 'granted') {
          // Notificación de prueba simple
          const notification = new Notification('✅ Mantex Mobile', {
            body: 'Las notificaciones del navegador están funcionando correctamente',
            icon: '/favicon.ico',
            tag: 'test-notification'
          });

          notification.onclick = () => {
            console.log('👆 Notificación clickeada');
            notification.close();
          };

          console.log('✅ Notificación del navegador enviada');
          return { success: true, type: 'browser' };
        } else {
          throw new Error('Permisos de notificación denegados');
        }
      } else {
        throw new Error('Notificaciones no soportadas en este navegador');
      }
    } catch (error) {
      console.error('❌ Error con notificaciones del navegador:', error);
      return { success: false, error: error.message, type: 'browser' };
    }
  };

  // Probar Service Worker y FCM
  const testServiceWorkerFCM = async () => {
    try {
      console.log('⚙️ Probando Service Worker y FCM...');

      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        console.log('✅ Service Worker está activo:', registration);

        // Simular mensaje FCM
        if (registration.active) {
          registration.active.postMessage({
            type: 'TEST_FCM',
            payload: {
              notification: {
                title: '🔥 FCM Test',
                body: 'Service Worker está recibiendo mensajes correctamente',
                icon: '/favicon.ico'
              },
              data: {
                test: true,
                timestamp: Date.now()
              }
            }
          });

          console.log('✅ Mensaje de prueba enviado al Service Worker');
          return { success: true, type: 'service-worker' };
        }
      } else {
        throw new Error('Service Workers no soportados');
      }
    } catch (error) {
      console.error('❌ Error con Service Worker/FCM:', error);
      return { success: false, error: error.message, type: 'service-worker' };
    }
  };

  // Mostrar resumen de pruebas
  const showTestSummary = () => {
    const successful = testResults.value.filter(r => r.success).length;
    const total = testResults.value.length;

    console.log(`
    📊 RESUMEN DE PRUEBAS DE NOTIFICACIONES
    ======================================
    ✅ Exitosas: ${successful}/${total}
    ❌ Fallidas: ${total - successful}/${total}

    Detalles:`);

    testResults.value.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${index + 1}. ${result.title} (${result.timestamp})`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });
  };

  // Verificar estado de permisos
  const checkNotificationStatus = () => {
    const status = {
      browserSupport: 'Notification' in window,
      permission: 'Notification' in window ? Notification.permission : 'not-supported',
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    };

    console.log('📱 Estado de Notificaciones:', status);
    return status;
  };

  // Simular notificación de job específico
  const simulateJobNotification = async (jobData) => {
    try {
      const notification = {
        title: `Trabajo: ${jobData.title}`,
        body: `Cliente: ${jobData.client_name}\nUbicación: ${jobData.location}`,
        data: {
          type: 'job_notification',
          jobId: jobData.id,
          action: 'view_details'
        }
      };

      if ('Notification' in window && Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.title, {
          body: notification.body,
          icon: '/favicon.ico',
          tag: `job-${jobData.id}`,
          data: notification.data,
          actions: [
            { action: 'view', title: 'Ver Detalles' },
            { action: 'dismiss', title: 'Descartar' }
          ]
        });

        browserNotification.onclick = () => {
          console.log('🔗 Navegando a detalles del trabajo:', jobData.id);
          // Aquí navegarías a la página del trabajo
          browserNotification.close();
        };
      }

      console.log('✅ Notificación de trabajo simulada:', jobData.title);
      return { success: true, jobId: jobData.id };

    } catch (error) {
      console.error('❌ Error simulando notificación de trabajo:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    // Estado
    testResults,
    isTestingPush,

    // Métodos de prueba
    testJobNotifications,
    testBrowserNotifications,
    testServiceWorkerFCM,
    simulateJobNotification,
    checkNotificationStatus,

    // Utilidades
    showTestSummary
  };
}