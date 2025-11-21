<template>
  <FullCalendarView
    :initial-date="currentDate"
    user-role="client"
  />
</template>

<script setup>
import { ref } from 'vue';
import FullCalendarView from '@/components/calendar/FullCalendarView.vue';

const currentDate = ref(new Date());
</script>

<style scoped>
</style>