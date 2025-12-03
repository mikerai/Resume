// src/composables/useIOSNotifications.js
// DEPRECATED: Use usePushNotifications.js instead
import { usePushNotifications } from './usePushNotifications';

export function useIOSNotifications() {
  return usePushNotifications();
}