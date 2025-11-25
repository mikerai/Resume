<template>
  <ion-page>
    <ion-content class="login-content" :fullscreen="true">
      <div class="login-container">
        <!-- Logo and Title -->
        <div class="login-header">
          <div class="logo-container">
            <ion-icon :icon="constructOutline" class="logo-icon"></ion-icon>
          </div>
          <h1>Mantex Mobile</h1>
          <p class="subtitle">Técnicos Especializados</p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="login-form">
          <ion-item class="login-input" fill="outline">
            <ion-label position="floating">Email</ion-label>
            <ion-input
              v-model="credentials.email"
              type="email"
              required
              autocomplete="email"
              :disabled="isLoading"
            ></ion-input>
          </ion-item>

          <ion-item class="login-input" fill="outline">
            <ion-label position="floating">Contraseña</ion-label>
            <ion-input
              v-model="credentials.password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              :disabled="isLoading"
            ></ion-input>
            <ion-button
              fill="clear"
              slot="end"
              @click="togglePassword"
              :disabled="isLoading"
            >
              <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline"></ion-icon>
            </ion-button>
          </ion-item>

          <!-- Login Button -->
          <ion-button
            expand="block"
            type="submit"
            class="login-button"
            :disabled="isLoading || !isFormValid"
          >
            <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
            <span v-else>Iniciar Sesión</span>
          </ion-button>
        </form>

        <!-- Quick Login for Development -->
        <div class="quick-login" v-if="isDevelopment">
          <h3>Acceso Rápido (Desarrollo)</h3>
          <div class="quick-buttons">
            <ion-button
              fill="outline"
              size="small"
              @click="quickLogin('admin')"
              :disabled="isLoading"
            >
              Admin
            </ion-button>
            <ion-button
              fill="outline"
              size="small"
              @click="quickLogin('technician')"
              :disabled="isLoading"
            >
              Técnico
            </ion-button>
            <ion-button
              fill="outline"
              size="small"
              @click="quickLogin('flynn')"
              :disabled="isLoading"
            >
              Flynn Mode
            </ion-button>
          </div>
        </div>

        <!-- Version Info -->
        <div class="version-info">
          <p>Versión 1.0.0</p>
          <p>© {{ currentYear }} Mantex</p>
        </div>
      </div>

      <!-- Error Toast -->
      <ion-toast
        :is-open="showError"
        :message="errorMessage"
        duration="4000"
        color="danger"
        @didDismiss="showError = false"
      ></ion-toast>

      <!-- Success Toast -->
      <ion-toast
        :is-open="showSuccess"
        message="¡Sesión iniciada exitosamente!"
        duration="2000"
        color="success"
        @didDismiss="showSuccess = false"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonContent, IonItem, IonLabel, IonInput, IonButton,
  IonIcon, IonSpinner, IonToast
} from '@ionic/vue';
import {
  constructOutline, eyeOutline, eyeOffOutline
} from 'ionicons/icons';
import { useAuth } from '@/composables/useAuth.js';

const router = useRouter();
const { login, isLoading: authLoading, isAuthenticated } = useAuth();

// Reactive data
const credentials = ref({
  email: '',
  password: ''
});

const showPassword = ref(false);
const isLoading = ref(false);
const showError = ref(false);
const showSuccess = ref(false);
const errorMessage = ref('');

// Development mode
const isDevelopment = ref(true); // Always show for demo

// Current year
const currentYear = new Date().getFullYear();

// Computed properties
const isFormValid = computed(() => {
  return credentials.value.email.length > 0 &&
         credentials.value.password.length > 0;
});

// Methods
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const handleLogin = async () => {
  try {
    isLoading.value = true;

    await login(credentials.value.email, credentials.value.password);

    showSuccess.value = true;

    // Wait a bit for profile to load, then redirect based on role
    setTimeout(() => {
      const { profile } = useAuth();
      const userRole = profile.value?.role;
      
      if (userRole === 'client') {
        router.replace('/client/dashboard');
      } else {
        router.replace('/supplier/dashboard');
      }
    }, 1000);

  } catch (error) {
    console.error('Login error:', error);
    errorMessage.value = getErrorMessage(error);
    showError.value = true;
  } finally {
    isLoading.value = false;
  }
};

const getErrorMessage = (error) => {
  if (error.message.includes('Invalid login credentials')) {
    return 'Email o contraseña incorrectos';
  } else if (error.message.includes('Email not confirmed')) {
    return 'Por favor confirma tu email antes de iniciar sesión';
  } else if (error.message.includes('Too many requests')) {
    return 'Demasiados intentos. Intenta de nuevo en unos minutos';
  } else if (error.message.includes('Network')) {
    return 'Error de conexión. Verifica tu internet';
  }
  return 'Error al iniciar sesión. Intenta de nuevo';
};

// Quick login for development/demo
const quickLogin = async (role) => {
  const testAccounts = {
    admin: { email: 'admin@mantex.mx', password: 'admin123' },
    technician: { email: 'tecnico@mantex.mx', password: 'tecnico123' },
    flynn: { email: 'm@511.mx', password: 'flynn123' }
  };

  const account = testAccounts[role];
  if (account) {
    credentials.value.email = account.email;
    credentials.value.password = account.password;
    await handleLogin();
  }
};

// Login page always shows - no auto-redirect
onMounted(() => {
  console.log('🔓 Login page loaded - manual login required');
});
</script>

<style scoped>
.login-content {
  --background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  max-width: 400px;
  margin: 0 auto;
}

.login-header {
  text-align: center;
  margin-bottom: 3rem;
}

.logo-container {
  margin-bottom: 1rem;
}

.logo-icon {
  font-size: 4rem;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 50%;
  backdrop-filter: blur(10px);
}

.login-header h1 {
  color: white;
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
}

.subtitle {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-size: 1rem;
}

.login-form {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 2rem;
}

.login-input {
  margin-bottom: 1rem;
  --background: rgba(255, 255, 255, 0.9);
  --color: #333;
  border-radius: 0.5rem;
}

.login-button {
  --background: rgba(255, 255, 255, 0.2);
  --background-activated: rgba(255, 255, 255, 0.3);
  --color: white;
  margin-top: 1rem;
  height: 48px;
  font-weight: 600;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.quick-login {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.quick-login h3 {
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.quick-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.quick-buttons ion-button {
  --color: rgba(255, 255, 255, 0.8);
  --border-color: rgba(255, 255, 255, 0.3);
}

.version-info {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
}

.version-info p {
  margin: 0.25rem 0;
}

/* Responsive design */
@media (max-width: 480px) {
  .login-container {
    padding: 1rem;
  }

  .login-form {
    padding: 1.5rem;
  }

  .logo-icon {
    font-size: 3rem;
    padding: 0.75rem;
  }

  .login-header h1 {
    font-size: 1.5rem;
  }
}
</style>