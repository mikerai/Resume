// src/composables/usePushNotifications.js
// Firebase Cloud Messaging (FCM) push notifications for iOS and Android

import { ref, computed } from 'vue';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/lib/supabaseClient';
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
            console.log('📱 Push notifications only available on native platforms');
            return { success: false, error: 'Not a native platform' };
        }

        try {
            console.log('🔔 Initializing push notifications...');

            // Request permission
            const permResult = await PushNotifications.requestPermissions();
            permissionStatus.value = permResult.receive;

            if (permResult.receive === 'granted') {
                console.log('✅ Push notification permission granted');

                // Register with FCM
                await PushNotifications.register();

                return { success: true };
            } else {
                console.warn('⚠️ Push notification permission denied');
                return { success: false, error: 'Permission denied' };
            }
        } catch (error) {
            console.error('❌ Error initializing push notifications:', error);
            return { success: false, error: error.message };
        }
    };

    /**
     * Register device token with backend
     * @param {string} token - FCM device token
     */
    const registerToken = async (token) => {
        if (!user.value) {
            console.warn('⚠️ Cannot register token: user not logged in');
            return { success: false, error: 'User not logged in' };
        }

        try {
            console.log('📝 Registering device token with backend...');

            const { data, error } = await supabase
                .from('notification_subscriptions')
                .upsert({
                    user_id: user.value.id,
                    device_token: token,
                    device_type: Capacitor.getPlatform(), // 'ios' or 'android'
                    notification_types: ['ticket_updates', 'chat_messages', 'assignments'],
                    is_active: true,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,device_token'
                });

            if (error) throw error;

            deviceToken.value = token;
            isRegistered.value = true;

            console.log('✅ Device token registered successfully');
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error registering device token:', error);
            return { success: false, error: error.message };
        }
    };

    /**
     * Unregister device token (on logout)
     */
    const unregisterToken = async () => {
        if (!deviceToken.value) {
            console.log('ℹ️ No device token to unregister');
            return { success: true };
        }

        try {
            console.log('🗑️ Unregistering device token...');

            const { error } = await supabase
                .from('notification_subscriptions')
                .update({ is_active: false })
                .eq('device_token', deviceToken.value);

            if (error) throw error;

            isRegistered.value = false;
            deviceToken.value = null;

            console.log('✅ Device token unregistered');
            return { success: true };
        } catch (error) {
            console.error('❌ Error unregistering device token:', error);
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
            console.log('🎯 Push registration success, token:', token.value);
            await registerToken(token.value);
        });

        // Registration error
        PushNotifications.addListener('registrationError', (error) => {
            console.error('❌ Push registration error:', error);
        });

        // Notification received (app in foreground)
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('📬 Push notification received:', notification);
            lastNotification.value = {
                ...notification,
                receivedAt: new Date().toISOString()
            };

            // You can show a local notification or update UI here
        });

        // Notification tapped (app in background/closed)
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('👆 Push notification action performed:', notification);
            lastNotification.value = {
                ...notification.notification,
                actionId: notification.actionId,
                receivedAt: new Date().toISOString()
            };

            // Handle navigation based on notification data
            handleNotificationTap(notification);
        });

        console.log('✅ Push notification listeners setup complete');
    };

    /**
     * Handle notification tap - navigate to relevant screen
     * @param {Object} notification - Notification object
     */
    const handleNotificationTap = (notification) => {
        const data = notification.notification?.data;

        if (!data) return;

        // Navigate based on notification type
        switch (data.type) {
            case 'ticket_update':
                // Navigate to ticket detail
                if (data.ticket_id) {
                    // router.push(`/tickets/${data.ticket_id}`);
                    console.log('📍 Navigate to ticket:', data.ticket_id);
                }
                break;

            case 'chat_message':
                // Navigate to chat
                if (data.ticket_id) {
                    // router.push(`/tickets/${data.ticket_id}/chat`);
                    console.log('💬 Navigate to chat:', data.ticket_id);
                }
                break;

            case 'assignment':
                // Navigate to jobs list
                // router.push('/jobs');
                console.log('📋 Navigate to jobs');
                break;

            default:
                console.log('ℹ️ Unknown notification type:', data.type);
        }
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
            console.error('❌ Error checking permissions:', error);
            return { receive: 'denied' };
        }
    };

    /**
     * Get delivered notifications (iOS only)
     */
    const getDeliveredNotifications = async () => {
        if (!Capacitor.isNativePlatform()) {
            return [];
        }

        try {
            const result = await PushNotifications.getDeliveredNotifications();
            return result.notifications || [];
        } catch (error) {
            console.error('❌ Error getting delivered notifications:', error);
            return [];
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
            console.log('✅ All delivered notifications removed');
        } catch (error) {
            console.error('❌ Error removing notifications:', error);
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
        getDeliveredNotifications,
        removeAllDeliveredNotifications
    };
}
