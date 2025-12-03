<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import { useDeviceData } from '@/composables/useDeviceData';
import { usePushNotifications } from '@/composables/usePushNotifications';
import { useGeolocation } from '@/composables/useGeolocation';

const { collectAndUploadDeviceData } = useDeviceData();
const { initialize } = usePushNotifications();
const { requestLocationPermission } = useGeolocation();

onMounted(() => {
  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      console.log('User signed in, initializing services...');
      await collectAndUploadDeviceData(session.user.id);
      
      // Initialize push notifications after login
      const result = await initialize(session.user.id);
      if (result.success) {
        console.log('Push notifications initialized successfully');
      } else {
        console.warn('Push notifications initialization failed:', result.error);
      }
      
      // Request location permissions
      await requestLocationPermission();
    }
  });

  // Check initial session
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
      console.log('Session restored, initializing services...');
      await collectAndUploadDeviceData(session.user.id);
      
      // Initialize push notifications for existing session
      const result = await initialize(session.user.id);
      if (result.success) {
        console.log('Push notifications initialized successfully');
      } else {
        console.warn('Push notifications initialization failed:', result.error);
      }
      
      // Request location permissions
      await requestLocationPermission();
    }
  });
});
</script>
