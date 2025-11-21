<template>
  <div class="p-4">
    <FileUpload
      mode="basic"
      name="file"
      :chooseLabel="label"
      accept="image/*"
      :auto="true"
      @select="onFileSelected"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getPresign, registerAsset } from '@/api/assets.js';

const props = defineProps({
  label: { type: String, default: 'Subir archivo' },
  jobId: { type: String, required: false } // algunos flujos lo necesitan
});

const emit = defineEmits(['uploaded']);

const uploading = ref(false);

const onFileSelected = async (event) => {
  const file = event.files?.[0];
  if (!file) return;

  try {
    uploading.value = true;

    // 1. Obtener presigned URL
    const { url, key } = await getPresign({
      filename: file.name,
      contentType: file.type
    });

    // 2. Subir archivo directo a S3
    await fetch(url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });

    // 3. Registrar metadata /assets
    await registerAsset({
      key,
      filename: file.name,
      contentType: file.type,
      jobId: props.jobId || null
    });

    // 4. Notificar al padre
    emit('uploaded', { key });
  } catch (err) {
    console.error('File upload error:', err);
  } finally {
    uploading.value = false;
  }
};
</script>

<style scoped>
/* No estilos adicionales fuera del blueprint */
</style>