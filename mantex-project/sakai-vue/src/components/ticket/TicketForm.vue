<template>
  <div class="flex flex-column gap-3">

    <div>
      <label class="block mb-2 text-sm">Título</label>
      <InputText
        v-model="model.title"
        class="w-full"
      />
    </div>

    <div>
      <label class="block mb-2 text-sm">Descripción</label>
      <Textarea
        v-model="model.description"
        rows="4"
        class="w-full"
        autoResize
      />
    </div>

    <div>
      <label class="block mb-2 text-sm">Prioridad</label>
      <Dropdown
        v-model="model.priority"
        :options="priorities"
        optionLabel="label"
        optionValue="value"
        placeholder="Selecciona prioridad"
        class="w-full"
      />
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';

import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';

/*
  El formulario usa v-model externo.
  Esto sigue la línea del blueprint:
  <TicketForm v-model="form" />
*/
const model = defineModel({
  type: Object,
  required: true
});

/* Opciones permitidas (blueprint no indica restricciones adicionales) */
const priorities = ref([
  { label: 'Baja', value: 'low' },
  { label: 'Media', value: 'medium' },
  { label: 'Alta', value: 'high' }
]);
</script>

<style scoped>
</style>