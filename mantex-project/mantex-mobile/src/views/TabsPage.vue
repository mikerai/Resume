<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom" class="mantex-tab-bar">
        <ion-tab-button tab="tab1" href="/tabs/tab1">
          <ion-icon aria-hidden="true" :icon="speedometerOutline" />
          <ion-label>Dashboard</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/tabs/tab2">
          <ion-icon aria-hidden="true" :icon="constructOutline" />
          <ion-label>Trabajos</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" href="/tabs/tab3">
          <ion-icon aria-hidden="true" :icon="personOutline" />
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { speedometerOutline, constructOutline, personOutline } from 'ionicons/icons';
</script>

<style scoped>
.mantex-tab-bar {
  --background: var(--ion-color-light);
  --border: 1px solid var(--ion-color-medium);
  border-top: 1px solid var(--ion-color-medium);
}

.mantex-tab-bar ion-tab-button {
  --color-selected: var(--ion-color-primary);
  --ripple-color: var(--ion-color-primary-tint);
}

.mantex-tab-bar ion-tab-button ion-icon {
  font-size: 1.5rem;
}

.mantex-tab-bar ion-tab-button ion-label {
  font-size: 0.75rem;
  font-weight: 500;
}
</style>
