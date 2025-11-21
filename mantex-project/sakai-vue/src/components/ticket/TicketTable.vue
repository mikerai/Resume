<template>
  <StandardDataTable
    :title="tableTitle"
    :subtitle="tableSubtitle"
    :data="tickets"
    :loading="loading"
    :search-fields="searchFields"
    :stats="ticketStats"
    @row-click="onRowClick"
  >
    <Column field="id" header="ID" sortable>
      <template #body="slotProps">
        <div class="font-medium text-primary">{{ slotProps.data.id }}</div>
      </template>
    </Column>

    <Column field="title" header="Título" sortable>
      <template #body="slotProps">
        <div>
          <div class="font-medium">{{ slotProps.data.title }}</div>
          <div class="text-sm text-muted-color mt-1" v-if="slotProps.data.description">
            {{ truncateText(slotProps.data.description, 60) }}
          </div>
        </div>
      </template>
    </Column>

    <Column field="priority" header="Prioridad" sortable>
      <template #body="slotProps">
        <Tag
          :value="getPriorityLabel(slotProps.data.priority)"
          :severity="getPrioritySeverity(slotProps.data.priority)"
        />
      </template>
    </Column>

    <Column field="status" header="Estado" sortable>
      <template #body="slotProps">
        <Tag
          :value="getStatusLabel(slotProps.data.status)"
          :severity="getStatusSeverity(slotProps.data.status)"
        />
      </template>
    </Column>

    <Column field="createdAt" header="Fecha" sortable>
      <template #body="slotProps">
        <div class="text-sm">
          {{ formatDate(slotProps.data.createdAt) }}
        </div>
      </template>
    </Column>

    <Column header="Acciones" :exportable="false" style="min-width: 8rem">
      <template #body="slotProps">
        <div class="flex gap-2">
          <Button
            icon="pi pi-eye"
            severity="info"
            text
            rounded
            size="small"
            @click.stop="viewTicket(slotProps.data)"
            v-tooltip.top="'Ver detalles'"
          />
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            rounded
            size="small"
            @click.stop="editTicket(slotProps.data)"
            v-tooltip.top="'Editar'"
          />
        </div>
      </template>
    </Column>
  </StandardDataTable>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import StandardDataTable from '@/components/common/StandardDataTable.vue';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { getJobs } from '@/api/jobs.js';

const props = defineProps({
  clientId: { type: String, required: false },
  supplierId: { type: String, required: false },
  admin: { type: Boolean, default: false }
});

const tickets = ref([]);
const loading = ref(false);
const router = useRouter();

// Table configuration
const tableTitle = computed(() => {
  if (props.admin) return 'Gestión de Tickets'
  if (props.clientId) return 'Mis Solicitudes'
  if (props.supplierId) return 'Trabajos Asignados'
  return 'Tickets'
})

const tableSubtitle = computed(() => {
  if (props.admin) return 'Administración completa del sistema de tickets'
  if (props.clientId) return 'Seguimiento de tus solicitudes de mantenimiento'
  if (props.supplierId) return 'Trabajos que tienes asignados'
  return null
})

const searchFields = ['title', 'description', 'id', 'status', 'priority']

// Stats computation
const ticketStats = computed(() => {
  const stats = []
  const totalTickets = tickets.value.length

  if (totalTickets === 0) return stats

  const pending = tickets.value.filter(t => t.status === 'pending').length
  const inProgress = tickets.value.filter(t => t.status === 'in_progress').length
  const completed = tickets.value.filter(t => t.status === 'completed').length
  const urgent = tickets.value.filter(t => t.priority === 'high' || t.priority === 'urgent').length

  stats.push({
    label: 'Total',
    value: totalTickets,
    icon: 'pi pi-list',
    iconBg: 'bg-blue-100 dark:bg-blue-400/10',
    iconColor: 'text-blue-500',
    detail: `${Math.round((totalTickets / (totalTickets || 1)) * 100)}%`,
    detailColor: 'text-blue-600'
  })

  stats.push({
    label: 'Pendientes',
    value: pending,
    icon: 'pi pi-clock',
    iconBg: 'bg-orange-100 dark:bg-orange-400/10',
    iconColor: 'text-orange-500',
    detail: `${Math.round((pending / (totalTickets || 1)) * 100)}%`
  })

  stats.push({
    label: 'En Progreso',
    value: inProgress,
    icon: 'pi pi-spin pi-cog',
    iconBg: 'bg-cyan-100 dark:bg-cyan-400/10',
    iconColor: 'text-cyan-500',
    detail: `${Math.round((inProgress / (totalTickets || 1)) * 100)}%`
  })

  stats.push({
    label: 'Completados',
    value: completed,
    icon: 'pi pi-check-circle',
    iconBg: 'bg-green-100 dark:bg-green-400/10',
    iconColor: 'text-green-500',
    detail: `${Math.round((completed / (totalTickets || 1)) * 100)}%`
  })

  return stats
})

// Utility functions
const truncateText = (text, limit) => {
  if (!text) return ''
  return text.length > limit ? text.substring(0, limit) + '...' : text
}

const getPriorityLabel = (priority) => {
  const labels = {
    low: 'Baja',
    normal: 'Normal',
    high: 'Alta',
    urgent: 'Urgente'
  }
  return labels[priority] || priority
}

const getPrioritySeverity = (priority) => {
  const severities = {
    low: 'success',
    normal: 'info',
    high: 'warn',
    urgent: 'danger'
  }
  return severities[priority] || 'info'
}

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    completed: 'Completado',
    cancelled: 'Cancelado'
  }
  return labels[status] || status
}

const getStatusSeverity = (status) => {
  const severities = {
    pending: 'warn',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'danger'
  }
  return severities[status] || 'info'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/* REGLAS DEL BLUEPRINT:
   - Admin lista todos los jobs
   - Client lista sus jobs
   - Supplier lista sus jobs asignados
*/
const loadTickets = async () => {
  loading.value = true
  try {
    let query = {};

    if (props.clientId) query.clientId = props.clientId;
    if (props.supplierId) query.supplierId = props.supplierId;

    const data = await getJobs(query);
    tickets.value = data;
  } catch (error) {
    console.error('Error loading tickets:', error)
  } finally {
    loading.value = false
  }
};

onMounted(loadTickets);
watch(() => [props.clientId, props.supplierId], loadTickets);

// Event handlers
const onRowClick = (e) => {
  viewTicket(e.data)
}

const viewTicket = (ticket) => {
  const id = ticket.id;

  /* Ruta obligatoria por blueprint:
     /admin/tickets/:id
     /client/tickets/:id
     /supplier/tickets/:id
  */

  if (props.admin) {
    router.push(`/admin/tickets/${id}`);
    return;
  }

  if (props.clientId) {
    router.push(`/client/tickets/${id}`);
    return;
  }

  if (props.supplierId) {
    router.push(`/supplier/tickets/${id}`);
    return;
  }
}

const editTicket = (ticket) => {
  // Emit event to parent or handle edit logic
  console.log('Edit ticket:', ticket.id)
}
</script>

<style scoped>
</style>