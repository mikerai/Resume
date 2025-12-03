import { ref } from 'vue';
import { useNotifications } from './useNotifications.js';

export function useNotificationTester() {
  const { sendNotification } = useNotifications();
  const testResults = ref([]);
  const isTestingPush = ref(false);

  // Simulate job notifications
  const testJobNotifications = async () => {
    isTestingPush.value = true;
    testResults.value = [];

    const testScenarios = [
      {
        title: 'New Job Assigned',
        body: 'You have been assigned: AC Maintenance',
        data: { type: 'job_assigned', jobId: '123' },
        delay: 1000
      },
      {
        title: 'Job Reminder',
        body: 'You have a job tomorrow at 10:00 AM',
        data: { type: 'job_reminder', jobId: '123' },
        delay: 3000
      },
      {
        title: 'Job Updated',
        body: 'Job location has changed',
        data: { type: 'job_updated', jobId: '123' },
        delay: 5000
      },
      {
        title: 'Client Message',
        body: 'Client sent a message regarding the job',
        data: { type: 'client_message', jobId: '123' },
        delay: 7000
      }
    ];

    console.log('Starting notification tests...');

    for (const scenario of testScenarios) {
      setTimeout(async () => {
        try {
          console.log(`Sending: ${scenario.title}`);

          // Show native browser notification if available
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

          // Simulate Firebase response
          const result = await simulateFirebaseResponse(scenario);

          testResults.value.push({
            ...scenario,
            timestamp: new Date().toLocaleTimeString(),
            success: result.success,
            platform: 'web'
          });

          console.log(`Notification sent: ${scenario.title}`);

        } catch (error) {
          console.error(`Error sending notification:`, error);
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

    // Finish tests
    setTimeout(() => {
      isTestingPush.value = false;
      console.log('Notification tests completed');
      showTestSummary();
    }, 9000);
  };

  // Simulate Firebase response
  const simulateFirebaseResponse = async (notification) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      success: true,
      messageId: `msg_${Math.random().toString(36).substr(2, 9)}`,
      platform: 'web',
      deliveredAt: new Date().toISOString()
    };
  };

  // Test browser notifications
  const testBrowserNotifications = async () => {
    try {
      console.log('Testing browser notifications...');

      // Request permissions if needed
      if ('Notification' in window) {
        let permission = Notification.permission;

        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }

        if (permission === 'granted') {
          // Simple test notification
          const notification = new Notification('Mantex Mobile', {
            body: 'Browser notifications are working correctly',
            icon: '/favicon.ico',
            tag: 'test-notification'
          });

          notification.onclick = () => {
            console.log('Notification clicked');
            notification.close();
          };

          console.log('Browser notification sent');
          return { success: true, type: 'browser' };
        } else {
          throw new Error('Notification permissions denied');
        }
      } else {
        throw new Error('Notifications not supported in this browser');
      }
    } catch (error) {
      console.error('Error with browser notifications:', error);
      return { success: false, error: error.message, type: 'browser' };
    }
  };

  // Test Service Worker and FCM
  const testServiceWorkerFCM = async () => {
    try {
      console.log('Testing Service Worker and FCM...');

      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        console.log('Service Worker is active:', registration);

        // Simulate FCM message
        if (registration.active) {
          registration.active.postMessage({
            type: 'TEST_FCM',
            payload: {
              notification: {
                title: 'FCM Test',
                body: 'Service Worker is receiving messages correctly',
                icon: '/favicon.ico'
              },
              data: {
                test: true,
                timestamp: Date.now()
              }
            }
          });

          console.log('Test message sent to Service Worker');
          return { success: true, type: 'service-worker' };
        }
      } else {
        throw new Error('Service Workers not supported');
      }
    } catch (error) {
      console.error('Error with Service Worker/FCM:', error);
      return { success: false, error: error.message, type: 'service-worker' };
    }
  };

  // Show test summary
  const showTestSummary = () => {
    const successful = testResults.value.filter(r => r.success).length;
    const total = testResults.value.length;

    console.log(`
    NOTIFICATION TEST SUMMARY
    ======================================
    Successful: ${successful}/${total}
    Failed: ${total - successful}/${total}

    Details:`);

    testResults.value.forEach((result, index) => {
      const status = result.success ? 'OK' : 'FAIL';
      console.log(`${status} ${index + 1}. ${result.title} (${result.timestamp})`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });
  };

  // Check notification status
  const checkNotificationStatus = () => {
    const status = {
      browserSupport: 'Notification' in window,
      permission: 'Notification' in window ? Notification.permission : 'not-supported',
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    };

    console.log('Notification Status:', status);
    return status;
  };

  // Simulate specific job notification
  const simulateJobNotification = async (jobData) => {
    try {
      const notification = {
        title: `Job: ${jobData.title}`,
        body: `Client: ${jobData.client_name}\nLocation: ${jobData.location}`,
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
            { action: 'view', title: 'View Details' },
            { action: 'dismiss', title: 'Dismiss' }
          ]
        });

        browserNotification.onclick = () => {
          console.log('Navigating to job details:', jobData.id);
          // Here you would navigate to the job page
          browserNotification.close();
        };
      }

      console.log('Job notification simulated:', jobData.title);
      return { success: true, jobId: jobData.id };

    } catch (error) {
      console.error('Error simulating job notification:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    // State
    testResults,
    isTestingPush,

    // Test methods
    testJobNotifications,
    testBrowserNotifications,
    testServiceWorkerFCM,
    simulateJobNotification,
    checkNotificationStatus,

    // Utilities
    showTestSummary
  };
}