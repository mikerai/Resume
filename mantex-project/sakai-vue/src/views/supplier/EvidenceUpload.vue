<template>
  <div class="p-4">

    <Card>
      <template #title>Subir evidencia</template>

      <template #content>
        <p class="text-sm mb-4 text-gray-600">
          Sube evidencia del trabajo seleccionado.  
          El flujo permitido por el blueprint es:
          1) presign → 2) upload S3 → 3) registrar metadata → 4) actualizar job.
        </p>

        <FileUploader
          label="Subir evidencia"
          :jobId="jobId"
          @uploaded="onUploaded"
        />
      </template>
    </Card>

    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import Card from 'primevue/card';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

import FileUploader from '@/components/common/FileUploader.vue';
import { updateJob, getJob } from '@/api/jobs.js';

const toast = useToast();
const route = useRoute();

const jobId = route.params.id;
const job = ref(null);

onMounted(async () => {
  job.value = await getJob(jobId);
});

const onUploaded = async ({ key }) => {
  const attachments = job.value.attachments || [];
  attachments.push({ key });

  await updateJob(jobId, { attachments });

  toast.add({
    severity: 'success',
    summary: 'Evidencia cargada',
    detail: `Archivo subido correctamente`,
    life: 2500
  });
};
</script>

<style scoped>
</style>