<template>
  <div class="p-4">

    <Card>
      <template #title>
        Detalle del ticket
      </template>

      <template #content>

        <div v-if="loading" class="text-sm text-gray-500">
          Cargando...
        </div>

        <div v-else-if="!ticket">
          <p class="text-sm text-gray-500">Ticket no encontrado.</p>
        </div>

        <div v-else class="flex flex-column gap-4">

          <!-- INFORMACIÓN GENERAL -->
          <div>
            <h3 class="text-lg mb-2">{{ ticket.title }}</h3>
            <p class="text-sm mb-2">{{ ticket.description }}</p>

            <div class="text-xs text-gray-500 mb-1">ID: {{ ticket.id }}</div>
            <div class="text-xs text-gray-500 mb-1">Cliente: {{ ticket.clientId }}</div>
            <div class="text-xs text-gray-500 mb-1">Proveedor: {{ ticket.supplierId || 'No asignado' }}</div>
            <div class="text-xs text-gray-500 mb-1">Creado: {{ ticket.createdAt }}</div>

            <div class="mt-2">
              <Tag :value="ticket.status" />
            </div>
          </div>

          <!-- EVIDENCIAS -->
            <h4 class="font-semibold mb-2">Evidencias</h4>
            <ImageGallery :items="ticket.attachments || []" />
          </div>

          <!-- CHAT -->
          <Panel header="Chat en vivo" toggleable>
            <TicketChat :ticketId="ticket.id" />
          </Panel>

          <!-- FORMULARIO DE EDICIÓN -->
          <Panel header="Editar ticket">
            <div class="flex flex-column gap-3">

              <div>
                <label class="block text-sm mb-2">Título</label>
                <InputText v-model="editForm.title" class="w-full" />
              </div>

              <div>
                <label class="block text-sm mb-2">Descripción</label>
                <Textarea
                  v-model="editForm.description"
                  rows="4"
                  class="w-full"
                  autoResize
                />
              </div>

              <div>
                <label class="block text-sm mb-2">Prioridad</label>
                <Dropdown
                  v-model="editForm.priority"
                  :options="priorities"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-sm mb-2">Estatus</label>
                <Dropdown
                  v-model="editForm.status"
                  :options="statuses"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                />
              </div>

              <div class="flex justify-end">
                <Button
                  label="Guardar cambios"
                  :loading="saving"
                  @click="save"
                />
              </div>

            </div>
          </Panel>

        </div>
      </template>
    </Card>

    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import Card from 'primevue/card';
import Panel from 'primevue/panel';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';

import ImageGallery from '@/components/common/ImageGallery.vue';
import TicketChat from '@/components/ticket/TicketChat.vue';
import { getJob, updateJob } from '@/api/jobs.js';

const route = useRoute();
const toast = useToast();

const id = route.params.id;

const ticket = ref(null);
const loading = ref(true);
const saving = ref(false);

/* Formulario de edición */
const editForm = ref({
  title: '',
  description: '',
  priority: '',
  status: ''
});

/* Opciones válidas según el blueprint */
const priorities = [
  { label: 'Baja', value: 'low' },
  { label: 'Media', value: 'medium' },
  { label: 'Alta', value: 'high' }
];

const statuses = [
  { label: 'Abierto', value: 'open' },
  { label: 'En proceso', value: 'in_progress' },
  { label: 'Completado', value: 'completed' },
  { label: 'Aprobado para pago', value: 'approved_for_payment' }
];

onMounted(async () => {
  const data = await getJob(id);
  ticket.value = data;

  if (data) {
    editForm.value = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status
    };
  }

  loading.value = false;
});

const save = async () => {
  try {
    saving.value = true;

    await updateJob(id, { ...editForm.value });

    toast.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Los cambios fueron aplicados',
      life: 2500
    });

  } catch (err) {
    console.error(err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron guardar los cambios',
      life: 2500
    });
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
</style>