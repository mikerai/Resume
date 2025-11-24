import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mantex.technicians',
  appName: 'Mantex',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Geolocation: {
      permissions: ['location']
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    // iOS specific configuration
    ios: {
      // Push notifications configuration
      // APNs certificate should be configured in Apple Developer Portal
      // and Firebase Console for production
    },
    // Android specific configuration  
    android: {
      // FCM configuration
      // google-services.json should be placed in android/app/
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
      backgroundColor: '#4A8C8C'
    },
    GoogleAuth: {
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
      serverClientId: '296798262114-cdbjd0iq3d0l48k63d94aeetghrcg4qm.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
