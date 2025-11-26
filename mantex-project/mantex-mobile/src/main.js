import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js';

import { IonicVue } from '@ionic/vue';

// PrimeVue
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import 'primeicons/primeicons.css';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

// Mantex SCSS Theme System - LAST to override everything
import './global.scss';

const app = createApp(App)
  .use(IonicVue, {
    mode: 'ios'
  })
  .use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        prefix: 'p',
        darkModeSelector: '.dark-theme',
        cssLayer: false
      }
    }
  })
  .use(router);

router.isReady().then(async () => {
  app.mount('#app');

  // Initialize splash screen and other capacitor plugins
  try {
    const { Capacitor } = await import('@capacitor/core');

    if (Capacitor.isNativePlatform()) {
      const { SplashScreen } = await import('@capacitor/splash-screen');

      // Hide splash screen after 2 seconds
      setTimeout(async () => {
        await SplashScreen.hide();
      }, 2000);

      console.log('📱 Splash screen configured');
    }
  } catch (error) {
    console.error('Error configuring splash screen:', error);
  }

  // Initialize push notifications after app is mounted
  try {
    const { useNotifications } = await import('./composables/useNotifications.js');
    const { initializeNotifications } = useNotifications();

    // Only initialize notifications (permission setup), not subscribe yet
    // Subscription will happen after user authentication in Tab pages
    await initializeNotifications();

    console.log('🔔 Push notifications initialized');
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
});
