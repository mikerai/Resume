<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom" class="mantex-tab-bar">
        <ion-tab-button tab="dashboard" href="/supplier/dashboard">
          <ion-icon aria-hidden="true" :icon="homeOutline" />
          <ion-label>Inicio</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="jobs" href="/supplier/jobs">
          <ion-icon aria-hidden="true" :icon="briefcaseOutline" />
          <ion-label>Trabajos</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="calendar" href="/supplier/calendar">
          <ion-icon aria-hidden="true" :icon="calendarOutline" />
          <ion-label>Calendario</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="messages" href="/supplier/messages">
          <ion-icon aria-hidden="true" :icon="chatbubbleOutline" />
          <ion-label>Mensajes</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="account" href="/supplier/account">
          <ion-icon aria-hidden="true" :icon="personOutline" />
          <ion-label>Cuenta</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { homeOutline, briefcaseOutline, calendarOutline, chatbubbleOutline, personOutline } from 'ionicons/icons';
</script>

<style scoped>
.mantex-tab-bar {
  --background: #ffffff;
  --border: 1px solid #e5e7eb;
  border-top: 1px solid #e5e7eb;
  padding-bottom: env(safe-area-inset-bottom);
  height: calc(3.5rem + env(safe-area-inset-bottom));
}

.mantex-tab-bar ion-tab-button {
  --color: #6b7280;
  --color-selected: #2563eb;
  --ripple-color: #2563eb20;
}

.mantex-tab-bar ion-tab-button ion-icon {
  font-size: 1.5rem;
  margin-bottom: 2px;
}

.mantex-tab-bar ion-tab-button ion-label {
  font-size: 0.7rem;
  font-weight: 500;
}
</style>
