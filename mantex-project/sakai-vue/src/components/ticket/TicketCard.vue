<template>
  <Card class="w-full">
    <template #title>
      <div class="flex justify-between items-center">
        <span>{{ ticket.title }}</span>
        <Tag :value="ticket.status" />
      </div>
    </template>

    <template #subtitle>
      <div class="text-sm text-gray-600">
        Prioridad: {{ ticket.priority }}
      </div>
    </template>

    <template #content>
      <p class="text-sm mb-3">
        {{ ticket.description }}
      </p>

      <div class="text-xs text-gray-500">
        ID: {{ ticket.id }}  
      </div>

      <div class="text-xs text-gray-500">
        Creado: {{ ticket.createdAt }}
      </div>
    </template>
  </Card>
</template>

<script setup>
import Card from 'primevue/card';
import Tag from 'primevue/tag';

const props = defineProps({
  ticket: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
</style>