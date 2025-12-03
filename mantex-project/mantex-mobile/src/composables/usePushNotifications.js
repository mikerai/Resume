// src/composables/usePushNotifications.js
// Firebase Cloud Messaging (FCM) push notifications for iOS and Android

import { ref, computed } from 'vue';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { ref as dbRef, set, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebaseConfig';
import { useAuth } from './useAuth';

const isRegistered = ref(false);
const deviceToken = ref(null);
const lastNotification = ref(null);
const permissionStatus = ref('prompt'); // 'prompt', 'granted', 'denied'

export function usePushNotifications() {
    const { user } = useAuth();

    /**
     * Initialize push notifications
     * Call this on app startup after user login
     */
    const initialize = async () => {
        if (!Capacitor.isNativePlatform()) {
            console.log('Push notifications only available on native platforms');
            return { success: false, error: 'Not a native platform' };
        }

        try {
            console.log('Initializing push notifications...');

            // Request permission
            const permResult = await PushNotifications.requestPermissions();
            permissionStatus.value = permResult.receive;

            if (permResult.receive === 'granted') {
                console.log('Push notification permission granted');

                // Register with FCM
                await PushNotifications.register();

                return { success: true };
            } else {
                console.warn('Push notification permission denied');
                return { success: false, error: 'Permission denied' };
            }
        } catch (error) {
            console.error('Error initializing push notifications:', error);
            return { success: false, error: error.message };
        }
    };

    /**
     * Register device token with Firebase Realtime Database
     * @param {string} token - FCM device token
     */
    const registerToken = async (token) => {
        if (!user.value) {
            console.warn('Cannot register token: user not logged in');
            return { success: false, error: 'User not logged in' };
        }

        try {
            console.log('Registering device token with Firebase...');

            const userId = user.value.id;
            // Path: fcm_tokens/{userId}/{deviceId}
            // We use the token itself as the key or a device ID if available. 
            // For simplicity and uniqueness, we can use the token as the key or just store it under the user.
            // Let's store it as: fcm_tokens/{userId} = { token: "...", platform: "...", updatedAt: ... }
            // If we want multiple devices per user, we should use push() or a unique device ID.
            // Since we don't have a stable device ID easily, we'll use the token as the key to allow multiple devices.

            // Sanitize token for use as a key if needed, but usually we store it as a value.
            // Structure: fcm_tokens/{userId}/{sanitizedToken}

            // Actually, let's just use a simple list for now or map by device type if needed.
            // A common pattern is: users/{userId}/fcmTokens/{token} = true (or metadata)

            const tokenRef = dbRef(database, `users/${userId}/fcmTokens/${token}`);

            await set(tokenRef, {
                token: token,
                platform: Capacitor.getPlatform(),
                updatedAt: serverTimestamp(),
                isActive: true
            });

            deviceToken.value = token;
            isRegistered.value = true;

            console.log('Device token registered successfully');
            return { success: true };
        } catch (error) {
            console.error('Error registering device token:', error);
            return { success: false, error: error.message };
        }
    };

    /**
     * Unregister device token (on logout)
     */
    const unregisterToken = async () => {
        if (!deviceToken.value || !user.value) {
            console.log('No device token to unregister or user not logged in');
            return { success: true };
        }

        try {
            console.log('Unregistering device token...');

            const userId = user.value.id;
            const token = deviceToken.value;
            const tokenRef = dbRef(database, `users/${userId}/fcmTokens/${token}`);

            // We can remove it or set isActive to false
            await set(tokenRef, null); // Remove it

            isRegistered.value = false;
            deviceToken.value = null;

            console.log('Device token unregistered');
            return { success: true };
        } catch (error) {
            console.error('Error unregistering device token:', error);
            return { success: false, error: error.message };
        }
    };

    /**
     * Setup notification listeners
     */
    const setupListeners = () => {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        // Registration success
        PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success, token:', token.value);
            await registerToken(token.value);
        });

        // Registration error
        PushNotifications.addListener('registrationError', (error) => {
            console.error('Push registration error:', error);
        });

        // Notification received (app in foreground)
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push notification received:', notification);
            lastNotification.value = {
                ...notification,
                receivedAt: new Date().toISOString()
            };
        });

        // Notification tapped (app in background/closed)
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push notification action performed:', notification);
            lastNotification.value = {
                ...notification.notification,
                actionId: notification.actionId,
                receivedAt: new Date().toISOString()
            };

            handleNotificationTap(notification);
        });

        console.log('Push notification listeners setup complete');
    };

    /**
     * Handle notification tap - navigate to relevant screen
     * @param {Object} notification - Notification object
     */
    const handleNotificationTap = (notification) => {
        const data = notification.notification?.data;

        if (!data) return;

        // Navigate based on notification type
        // Note: Actual navigation should be handled by the component using this composable
        // or by a global router instance if available.
        console.log('Notification data:', data);
    };

    /**
     * Check current permission status
     */
    const checkPermissions = async () => {
        if (!Capacitor.isNativePlatform()) {
            return { receive: 'denied' };
        }

        try {
            const result = await PushNotifications.checkPermissions();
            permissionStatus.value = result.receive;
            return result;
        } catch (error) {
            console.error('Error checking permissions:', error);
            return { receive: 'denied' };
        }
    };

    /**
     * Remove all delivered notifications
     */
    const removeAllDeliveredNotifications = async () => {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        try {
            await PushNotifications.removeAllDeliveredNotifications();
            console.log('All delivered notifications removed');
        } catch (error) {
            console.error('Error removing notifications:', error);
        }
    };

    // Computed
    const hasPermission = computed(() => permissionStatus.value === 'granted');
    const isPlatformSupported = computed(() => Capacitor.isNativePlatform());

    return {
        // State
        isRegistered,
        deviceToken,
        lastNotification,
        permissionStatus,
        hasPermission,
        isPlatformSupported,

        // Methods
        initialize,
        registerToken,
        unregisterToken,
        setupListeners,
        checkPermissions,
        removeAllDeliveredNotifications
    };
}
