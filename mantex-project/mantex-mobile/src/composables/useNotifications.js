// src/composables/useNotifications.js

import { ref, computed } from 'vue';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export function useNotifications() {
    const isSupported = ref(false);
    const isPermissionGranted = ref(false);
    const registrationToken = ref(null);
    const lastNotification = ref(null);
    const notifications = ref([]);

    /**
     * Initialize push notifications
     */
    const initializeNotifications = async () => {
        try {
            console.log('🔔 Initializing push notifications...');

            // Check if push notifications are supported
            if (Capacitor.isNativePlatform()) {
                isSupported.value = true;

                // Request permissions
                const permissionStatus = await PushNotifications.requestPermissions();

                if (permissionStatus.receive === 'granted') {
                    isPermissionGranted.value = true;
                    console.log('✅ Push notification permissions granted');

                    // Register for push notifications
                    await PushNotifications.register();

                    // Set up listeners
                    setupNotificationListeners();

                } else {
                    console.log('❌ Push notification permissions denied');
                    isPermissionGranted.value = false;
                }
            } else {
                console.log('ℹ️ Push notifications not supported on web platform');
                isSupported.value = false;
            }

        } catch (error) {
            console.error('Error initializing push notifications:', error);
        }
    };

    /**
     * Set up notification event listeners
     */
    const setupNotificationListeners = () => {
        // Registration successful
        PushNotifications.addListener('registration', (token) => {
            console.log('📱 Push registration success, token:', token.value);
            registrationToken.value = token.value;

            // TODO: Send token to backend
            sendTokenToBackend(token.value);
        });

        // Registration error
        PushNotifications.addListener('registrationError', (error) => {
            console.error('❌ Push registration error:', error);
        });

        // Notification received while app is in foreground
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('🔔 Push notification received:', notification);

            lastNotification.value = notification;
            notifications.value.unshift({
                ...notification,
                receivedAt: new Date().toISOString(),
                read: false
            });

            // Handle foreground notification
            handleForegroundNotification(notification);
        });

        // Notification tapped (app opened from notification)
        PushNotifications.addListener('pushNotificationActionPerformed', (notificationAction) => {
            console.log('👆 Push notification action performed:', notificationAction);

            const notification = notificationAction.notification;
            lastNotification.value = notification;

            // Handle notification tap
            handleNotificationTap(notification);
        });
    };

    /**
     * Send registration token to backend
     */
    const sendTokenToBackend = async (token) => {
        try {
            console.log('📡 Sending FCM token to Supabase...');

            const { useSupabaseAPI } = await import('./useSupabaseAPI.js');
            const { saveFCMToken } = useSupabaseAPI();

            const { useAuth } = await import('./useAuth.js');
            const { user } = useAuth();

            const userId = user.value?.id || 'demo-user-id';
            const deviceType = Capacitor.getPlatform();

            const result = await saveFCMToken(userId, token, deviceType);

            if (result.success) {
                console.log('✅ FCM token sent successfully to Supabase');
            } else {
                console.error('❌ Failed to send FCM token:', result.error);
            }

        } catch (error) {
            console.error('Error sending FCM token:', error);
        }
    };

    /**
     * Handle notification received in foreground
     */
    const handleForegroundNotification = (notification) => {
        const { title, body, data } = notification;

        // Show local notification or in-app banner
        showInAppNotification({
            title,
            body,
            data,
            action: () => handleNotificationTap(notification)
        });
    };

    /**
     * Handle notification tap/click
     */
    const handleNotificationTap = (notification) => {
        const { data } = notification;

        // Route based on notification type
        if (data?.type === 'new_job') {
            // Navigate to new job
            console.log('🔗 Navigating to new job:', data.jobId);
            // TODO: Use router to navigate

        } else if (data?.type === 'job_update') {
            // Navigate to job details
            console.log('🔗 Navigating to job update:', data.jobId);
            // TODO: Use router to navigate

        } else if (data?.type === 'nearby_jobs') {
            // Navigate to nearby jobs
            console.log('🔗 Showing nearby jobs');
            // TODO: Use router to navigate to map/jobs list

        } else if (data?.type === 'emergency') {
            // Handle emergency notification
            console.log('🚨 Emergency notification received');
            // TODO: Show emergency alert

        } else {
            // Default action - go to notifications page
            console.log('🔗 Opening notifications');
            // TODO: Navigate to notifications list
        }

        // Mark as read
        markNotificationAsRead(notification.id);
    };

    /**
     * Show in-app notification banner
     */
    const showInAppNotification = (notificationData) => {
        console.log('🔔 Showing in-app notification:', notificationData);

        // TODO: Show toast, modal, or banner
        // For now, just log
    };

    /**
     * Mark notification as read
     */
    const markNotificationAsRead = (notificationId) => {
        const notification = notifications.value.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            console.log('✅ Notification marked as read:', notificationId);
        }
    };

    /**
     * Get unread notifications count
     */
    const unreadCount = computed(() => {
        return notifications.value.filter(n => !n.read).length;
    });

    /**
     * Subscribe to job notifications for a technician
     */
    const subscribeToJobNotifications = async (technicianId, location = null) => {
        try {
            // Validate technician ID - must be a valid UUID, not a placeholder
            if (!technicianId || technicianId === 'current-technician-id' || technicianId === 'demo-user-id' || technicianId.includes('-technician-id')) {
                console.log('⚠️ Skipping notification subscription - invalid technician ID:', technicianId);
                return null;
            }

            console.log('📧 Subscribing to job notifications...');

            const { useSupabaseAPI } = await import('./useSupabaseAPI.js');
            const { subscribeToJobNotifications: subscribeAPI } = useSupabaseAPI();

            const locationData = location ? {
                region: location.region || 'unknown',
                city: location.city || 'unknown'
            } : null;

            const result = await subscribeAPI(technicianId, locationData);

            if (result.success) {
                console.log('✅ Subscribed to job notifications successfully');
                return result.data;
            } else {
                console.error('❌ Failed to subscribe to notifications:', result.error);
                return null;
            }

        } catch (error) {
            console.error('Error subscribing to notifications:', error);
            return null;
        }
    };

    /**
     * Send test notification (for development)
     */
    const sendTestNotification = async () => {
        if (!registrationToken.value) {
            console.error('No FCM token available for test notification');
            return;
        }

        try {
            console.log('📧 Sending test notification...');

            const { useSupabaseAPI } = await import('./useSupabaseAPI.js');
            const { sendPushNotification } = useSupabaseAPI();

            const notificationData = {
                token: registrationToken.value,
                title: 'Test Notification',
                body: 'This is a test notification from Mantex Mobile',
                data: {
                    type: 'test',
                    timestamp: new Date().toISOString()
                }
            };

            const result = await sendPushNotification(notificationData);

            if (result.success) {
                console.log('✅ Test notification sent successfully');
            } else {
                console.error('❌ Failed to send test notification:', result.error);
            }

        } catch (error) {
            console.error('Error sending test notification:', error);
        }
    };

    /**
     * Enable/disable notifications
     */
    const toggleNotifications = async (enabled) => {
        try {
            if (enabled && !isPermissionGranted.value) {
                // Request permissions again
                const permissionStatus = await PushNotifications.requestPermissions();
                isPermissionGranted.value = permissionStatus.receive === 'granted';

                if (isPermissionGranted.value) {
                    await PushNotifications.register();
                }
            }

            // TODO: Update user preferences in backend
            console.log(`🔔 Notifications ${enabled ? 'enabled' : 'disabled'}`);

        } catch (error) {
            console.error('Error toggling notifications:', error);
        }
    };

    /**
     * Clear all notifications
     */
    const clearAllNotifications = () => {
        notifications.value = [];
        console.log('🗑️ All notifications cleared');
    };

    /**
     * Remove delivered notifications (iOS only)
     */
    const removeDeliveredNotifications = async () => {
        try {
            if (Capacitor.getPlatform() === 'ios') {
                await PushNotifications.removeAllDeliveredNotifications();
                console.log('🗑️ Delivered notifications removed (iOS)');
            }
        } catch (error) {
            console.error('Error removing delivered notifications:', error);
        }
    };

    return {
        // State
        isSupported,
        isPermissionGranted,
        registrationToken,
        lastNotification,
        notifications,
        unreadCount,

        // Methods
        initializeNotifications,
        subscribeToJobNotifications,
        sendTestNotification,
        toggleNotifications,
        markNotificationAsRead,
        clearAllNotifications,
        removeDeliveredNotifications,
        handleNotificationTap,

        // Utilities
        sendTokenToBackend
    };
}