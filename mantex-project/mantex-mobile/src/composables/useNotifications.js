// src/composables/useNotifications.js
// DEPRECATED: Use usePushNotifications.js instead
import { usePushNotifications } from './usePushNotifications';

export function useNotifications() {
    return usePushNotifications();
}