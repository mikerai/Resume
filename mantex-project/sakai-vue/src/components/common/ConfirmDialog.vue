<template>
  <ConfirmDialog />
</template>

<script setup>
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';

const confirm = useConfirm();

const props = defineProps({
  message: { type: String, required: true },
  header: { type: String, default: 'Confirmar' },
  icon: { type: String, default: 'pi pi-exclamation-triangle' },
});

const emit = defineEmits(['accept', 'reject']);

const open = () => {
  confirm.require({
    message: props.message,
    header: props.header,
    icon: props.icon,
    accept: () => emit('accept'),
    reject: () => emit('reject')
  });
};

defineExpose({ open });
</script>

<style scoped>
</style>