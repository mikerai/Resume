<template>
  <div class="p-4">
    <Galleria
      v-if="items.length"
      :value="items"
      :responsiveOptions="responsiveOptions"
      :numVisible="5"
      :circular="true"
      containerStyle="max-width: 800px"
      :showThumbnails="true"
      :showIndicators="false"
      :showItemNavigators="true"
    >
      <template #item="slotProps">
        <img
          :src="slotProps.item.url"
          class="w-full h-auto"
          style="object-fit: contain;"
        />
      </template>

      <template #thumbnail="slotProps">
        <img
          :src="slotProps.item.url"
          class="w-20 h-20 object-cover"
        />
      </template>
    </Galleria>

    <div v-else class="text-center text-sm text-gray-500">
      No hay imágenes disponibles
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Galleria from 'primevue/galleria';

const props = defineProps({
  items: {
    type: Array,
    default: () => [] // [{ url: "", key: "" }]
  }
});

const responsiveOptions = ref([
  { breakpoint: '1024px', numVisible: 5 },
  { breakpoint: '768px', numVisible: 3 },
  { breakpoint: '560px', numVisible: 1 }
]);
</script>

<style scoped>
/* No estilos adicionales fuera del estándar */
</style>