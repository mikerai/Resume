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

const { collectAndUploadDeviceData } = useDeviceData();

onMounted(() => {
  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      console.log('User signed in, collecting device data...');
      await collectAndUploadDeviceData(session.user.id);
    }
  });

  // Check initial session
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
      console.log('Session restored, collecting device data...');
      await collectAndUploadDeviceData(session.user.id);
    }
  });
});
</script>
