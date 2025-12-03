// src/composables/usePushNotifications.js
// Firebase Cloud Messaging (FCM) push notifications for iOS and Android

import { ref, computed } from 'vue';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Preferences } from '@capacitor/preferences';
import { ref as dbRef, set, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebaseConfig';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabaseClient';

const isRegistered = ref(false);
const deviceToken = ref(null);
const lastNotification = ref(null);
const permissionStatus = ref('prompt'); // 'prompt', 'granted', 'denied'

export function usePushNotifications() {
    const { user } = useAuth();

    /**
     * Initialize push notifications
     * Call this on app startup after user login
     * @param {string} [userId] - Optional user ID to ensure registration works immediately
     */
    const initialize = async (userId = null) => {
        if (!Capacitor.isNativePlatform()) {
            console.log('Push notifications only available on native platforms');
            return { success: false, error: 'Not a native platform' };
        }

        try {
            console.log('Initializing push notifications...');

            // CRITICAL: Setup listeners FIRST, before register()
            setupListeners(userId);

            // Check for stored token first and register it immediately
            // This handles cases where 'registration' event doesn't fire on subsequent launches
            const { value: storedToken } = await Preferences.get({ key: 'fcm_token' });
            if (storedToken) {
                console.log('Found stored FCM token, registering immediately:', storedToken);
                await registerToken(storedToken, userId);
            }

            // Request permission
            const permResult = await PushNotifications.requestPermissions();
            permissionStatus.value = permResult.receive;

            if (permResult.receive === 'granted') {
                console.log('Push notification permission granted');

                // Register with FCM (this triggers 'registration' event if token changes or is fresh)
                await PushNotifications.register();

                // CRITICAL: iOS often doesn't fire 'registration' event on subsequent app launches
                // Force token retrieval by waiting a moment then checking
                console.log('🟠 Waiting for registration event or forcing token check...');

                // Wait 2 seconds for event to fire naturally
                await new Promise(resolve => setTimeout(resolve, 2000));

                // If we still don't have a token after 2s, something's wrong
                // Try to get delivered notifications which might trigger token fetch
                try {
                    const delivered = await PushNotifications.getDeliveredNotifications();
                    console.log('🟠 Delivered notifications check:', delivered);
                } catch (e) {
                    console.log('🟠 Could not check delivered notifications:', e);
                }

                // Check if token was registered
                if (!isRegistered.value && storedToken) {
                    console.log('🟠 Event did not fire, but we have stored token - using it');
                    // Token was already registered during stored token check
                } else if (!isRegistered.value) {
                    console.warn('⚠️ Push notification registered but no token received!');
                    console.warn('⚠️ This may indicate an APNs configuration issue');
                }

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
     * @param {string} [explicitUserId] - Optional user ID
     */
    const registerToken = async (token, explicitUserId = null) => {
        console.log('🔵 registerToken called with token:', token);
        console.log('🔵 explicitUserId:', explicitUserId);

        let userId = explicitUserId || user.value?.id;
        console.log('🔵 userId from state or param:', userId);

        if (!userId) {
            console.log('🔵 User ID not found in state, checking session...');
            const { data } = await supabase.auth.getSession();
            userId = data.session?.user?.id;
            console.log('🔵 userId from session:', userId);
        }

        if (!userId) {
            console.warn('⚠️ Cannot register token: user not logged in');
            return { success: false, error: 'User not logged in' };
        }

        try {
            console.log(`🟢 Registering device token for user ${userId}...`);
            console.log('🟢 Firebase Database URL:', database?.app?.options?.databaseURL);
            console.log('🟢 Database object exists:', !!database);

            if (!database) {
                throw new Error('Firebase database not initialized');
            }

            // Path: users/{userId}/fcmTokens/{token}
            const path = `users/${userId}/fcmTokens/${token}`;
            console.log('🟢 Firebase path:', path);

            const tokenRef = dbRef(database, path);
            console.log('🟢 Token ref created');

            const tokenData = {
                token: token,
                platform: Capacitor.getPlatform(),
                updatedAt: serverTimestamp(),
                isActive: true
            };
            console.log('🟢 Token data to save:', tokenData);

            await set(tokenRef, tokenData);
            console.log('🟢 Firebase set() completed');

            deviceToken.value = token;
            isRegistered.value = true;

            // Persist token locally
            await Preferences.set({
                key: 'fcm_token',
                value: token
            });
            console.log('🟢 Token saved to local preferences');

            console.log('✅ Device token registered successfully in Firebase!');
            return { success: true };
        } catch (error) {
            console.error('❌ Error registering device token:', error);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
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
            await Preferences.remove({ key: 'fcm_token' }); // Remove from local storage

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
    const setupListeners = (userId = null) => {
        if (!Capacitor.isNativePlatform()) {
            console.log('⚪ Skipping listener setup: not a native platform');
            return;
        }
        console.log('🟡 Setting up push notification listeners with userId:', userId);

        // Registration success
        PushNotifications.addListener('registration', async (token) => {
            console.log('🟢 PUSH REGISTRATION EVENT FIRED!');
            console.log('🟢 Token received:', token.value);
            console.log('🟢 Calling registerToken...');

            const result = await registerToken(token.value, userId);
            console.log('🟢 registerToken result:', result);
        });

        // Registration error
        PushNotifications.addListener('registrationError', (error) => {
            console.error('❌ Push registration error event:', error);
        });

        // Receive notification
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('📩 Push notification received:', notification);
            lastNotification.value = notification;
        });

        // Action performed
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('🔔 Push notification action performed:', notification);
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
