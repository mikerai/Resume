<template>
  <div class="relative inline-block">
    <div class="relative w-32 h-32">
      <img 
        :src="displayUrl || defaultAvatar" 
        alt="Avatar" 
        class="w-full h-full rounded-full object-cover border-2 border-primary"
      />
      
      <div class="absolute bottom-0 right-0">
        <FileUpload 
          mode="basic" 
          name="avatar" 
          accept="image/*" 
          :maxFileSize="1000000" 
          @select="onFileSelect" 
          :auto="true"
          chooseLabel=""
          chooseIcon="pi pi-camera"
          class="p-button-rounded p-button-sm"
          :disabled="loading"
        />
      </div>

      <div v-if="loading" class="absolute inset-0 flex align-items-center justify-content-center bg-black-alpha-50 border-circle rounded-full">
        <i class="pi pi-spin pi-spinner text-white text-2xl"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import FileUpload from 'primevue/fileupload';
import { useS3Upload } from '@/composables/useS3Upload';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
  currentAvatarUrl: {
    type: String,
    default: null
  },
  username: {
    type: String,
    required: true
  },
  bucket: {
    type: String,
    default: 'avatars'
  }
});

const emit = defineEmits(['upload-success', 'upload-error']);

const toast = useToast();
const { uploadFileToS3 } = useS3Upload();
const loading = ref(false);

const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

const displayUrl = computed(() => props.currentAvatarUrl);

const onFileSelect = async (event) => {
  const file = event.files[0];
  if (!file) return;

  loading.value = true;
  try {
    const { s3_key } = await uploadFileToS3(file, props.username, props.bucket);
    emit('upload-success', s3_key);
  } catch (error) {
    console.error('Error uploading avatar:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir la imagen', life: 3000 });
    emit('upload-error', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.bg-black-alpha-50 {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
