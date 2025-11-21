<template>
    <div class="event-details">
        <div v-if="event" class="grid grid-cols-1 gap-6">
            <!-- Event Header -->
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-2">
                        {{ event.title }}
                    </h2>
                    <div class="flex flex-wrap gap-3 mb-4">
                        <Tag
                            :value="getEventTypeLabel(event.type)"
                            :severity="getEventTypeSeverity(event.type)"
                            :icon="getEventTypeIcon(event.type)"
                        />
                        <Tag
                            :value="getStatusLabel(event.status)"
                            :severity="getStatusSeverity(event.status)"
                        />
                        <Tag
                            :value="getPriorityLabel(event.priority)"
                            :severity="getPrioritySeverity(event.priority)"
                            :icon="getPriorityIcon(event.priority)"
                        />
                    </div>
                </div>

                <div class="flex gap-2">
                    <Button
                        v-if="canEdit"
                        icon="pi pi-pencil"
                        severity="info"
                        outlined
                        v-tooltip="'Editar'"
                        @click="$emit('edit', event)"
                    />
                    <Button
                        v-if="canEdit"
                        icon="pi pi-calendar"
                        severity="warning"
                        outlined
                        v-tooltip="'Reagendar'"
                        @click="$emit('reschedule', event)"
                    />
                    <Button
                        v-if="canEdit"
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        v-tooltip="'Eliminar'"
                        @click="confirmDelete"
                    />
                </div>
            </div>

            <!-- Event Info Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Date and Time Card -->
                <Card class="h-fit">
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-calendar text-primary"></i>
                            <span>Fecha y Hora</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="font-medium">Inicio:</span>
                                <span>{{ formatDateTime(event.start_time) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Fin:</span>
                                <span>{{ formatDateTime(event.end_time) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Duración:</span>
                                <span>{{ getDuration(event.start_time, event.end_time) }}</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Participants Card -->
                <Card class="h-fit">
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-users text-primary"></i>
                            <span>Participantes</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-4">
                            <!-- Client -->
                            <div v-if="event.client_name" class="flex items-center gap-3">
                                <Avatar
                                    :label="event.client_name.charAt(0)"
                                    size="normal"
                                    style="background-color: #3b82f6; color: white"
                                />
                                <div>
                                    <div class="font-semibold">{{ event.client_name }}</div>
                                    <div class="text-sm text-muted-color">Cliente</div>
                                </div>
                            </div>

                            <!-- Supplier -->
                            <div v-if="event.supplier_name" class="flex items-center gap-3">
                                <Avatar
                                    :label="event.supplier_name.charAt(0)"
                                    size="normal"
                                    style="background-color: #10b981; color: white"
                                />
                                <div>
                                    <div class="font-semibold">{{ event.supplier_name }}</div>
                                    <div class="text-sm text-muted-color">Técnico/Proveedor</div>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Location Card -->
            <Card v-if="event.location">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-map-marker text-primary"></i>
                        <span>Ubicación</span>
                    </div>
                </template>
                <template #content>
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <p class="text-surface-700 dark:text-surface-300 m-0">
                                {{ event.location }}
                            </p>
                        </div>
                        <Button
                            icon="pi pi-map"
                            severity="secondary"
                            outlined
                            size="small"
                            v-tooltip="'Ver en mapa'"
                            @click="openLocationInMap"
                        />
                    </div>
                </template>
            </Card>

            <!-- Description Card -->
            <Card v-if="event.description">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-align-left text-primary"></i>
                        <span>Descripción</span>
                    </div>
                </template>
                <template #content>
                    <p class="text-surface-700 dark:text-surface-300 m-0 leading-relaxed">
                        {{ event.description }}
                    </p>
                </template>
            </Card>

            <!-- Google Calendar Integration -->
            <Card v-if="event.google_calendar_id || showGoogleSync">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-google text-primary"></i>
                        <span>Google Calendar</span>
                    </div>
                </template>
                <template #content>
                    <div class="flex justify-between items-center">
                        <div v-if="event.google_calendar_id">
                            <div class="flex items-center gap-2 mb-2">
                                <i class="pi pi-check-circle text-green-500"></i>
                                <span class="font-medium">Sincronizado con Google Calendar</span>
                            </div>
                            <p class="text-sm text-muted-color m-0">
                                Esta cita está sincronizada con tu calendario de Google
                            </p>
                        </div>
                        <div v-else>
                            <div class="flex items-center gap-2 mb-2">
                                <i class="pi pi-exclamation-triangle text-orange-500"></i>
                                <span class="font-medium">No sincronizado</span>
                            </div>
                            <p class="text-sm text-muted-color m-0">
                                Esta cita no está sincronizada con Google Calendar
                            </p>
                        </div>
                        <div class="flex gap-2">
                            <Button
                                v-if="!event.google_calendar_id"
                                label="Sincronizar"
                                icon="pi pi-sync"
                                size="small"
                                @click="syncWithGoogle"
                            />
                            <Button
                                v-if="event.google_calendar_id"
                                label="Ver en Google"
                                icon="pi pi-external-link"
                                severity="secondary"
                                outlined
                                size="small"
                                @click="openInGoogleCalendar"
                            />
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Status Actions -->
            <Card v-if="showStatusActions">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-cog text-primary"></i>
                        <span>Acciones</span>
                    </div>
                </template>
                <template #content>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Button
                            v-if="event.status === 'scheduled' && userRole === 'supplier'"
                            label="Confirmar"
                            icon="pi pi-check"
                            severity="success"
                            @click="updateStatus('confirmed')"
                        />
                        <Button
                            v-if="event.status === 'confirmed' && userRole === 'supplier'"
                            label="Iniciar"
                            icon="pi pi-play"
                            severity="info"
                            @click="updateStatus('in_progress')"
                        />
                        <Button
                            v-if="event.status === 'in_progress' && userRole === 'supplier'"
                            label="Completar"
                            icon="pi pi-check-circle"
                            severity="success"
                            @click="updateStatus('completed')"
                        />
                        <Button
                            v-if="['scheduled', 'confirmed'].includes(event.status)"
                            label="Cancelar"
                            icon="pi pi-times"
                            severity="danger"
                            outlined
                            @click="confirmCancel"
                        />
                    </div>
                </template>
            </Card>

            <!-- Event History -->
            <Card v-if="event.history && event.history.length > 0">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-history text-primary"></i>
                        <span>Historial</span>
                    </div>
                </template>
                <template #content>
                    <Timeline :value="event.history" class="w-full">
                        <template #content="slotProps">
                            <div class="p-3">
                                <div class="font-semibold mb-1">{{ slotProps.item.action }}</div>
                                <div class="text-sm text-muted-color mb-2">{{ slotProps.item.description }}</div>
                                <div class="text-xs text-muted-color">
                                    {{ formatDateTime(slotProps.item.timestamp) }}
                                    <span v-if="slotProps.item.user"> por {{ slotProps.item.user }}</span>
                                </div>
                            </div>
                        </template>
                    </Timeline>
                </template>
            </Card>
        </div>

        <!-- Confirmation Dialogs -->
        <ConfirmDialog />
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import Timeline from 'primevue/timeline';
import ConfirmDialog from 'primevue/confirmdialog';

const props = defineProps({
    event: {
        type: Object,
        required: true
    },
    userRole: {
        type: String,
        required: true
    },
    canEdit: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['edit', 'delete', 'reschedule', 'close', 'status-update']);

const confirm = useConfirm();

// Computed
const showGoogleSync = computed(() => {
    return props.userRole !== 'supplier';
});

const showStatusActions = computed(() => {
    return props.userRole === 'supplier' || props.userRole === 'admin';
});

// Methods
const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
};

const getEventTypeLabel = (type) => {
    const types = {
        maintenance: 'Mantenimiento',
        installation: 'Instalación',
        repair: 'Reparación',
        inspection: 'Inspección',
        consultation: 'Consultoría'
    };
    return types[type] || type;
};

const getEventTypeIcon = (type) => {
    const icons = {
        maintenance: 'pi pi-wrench',
        installation: 'pi pi-cog',
        repair: 'pi pi-hammer',
        inspection: 'pi pi-search',
        consultation: 'pi pi-user'
    };
    return icons[type] || 'pi pi-circle';
};

const getEventTypeSeverity = (type) => {
    const severities = {
        maintenance: 'info',
        installation: 'success',
        repair: 'warning',
        inspection: 'secondary',
        consultation: 'help'
    };
    return severities[type] || 'info';
};

const getStatusLabel = (status) => {
    const statuses = {
        scheduled: 'Programado',
        confirmed: 'Confirmado',
        in_progress: 'En Progreso',
        completed: 'Completado',
        cancelled: 'Cancelado'
    };
    return statuses[status] || status;
};

const getStatusSeverity = (status) => {
    const severities = {
        scheduled: 'warning',
        confirmed: 'info',
        in_progress: 'success',
        completed: 'success',
        cancelled: 'danger'
    };
    return severities[status] || 'info';
};

const getPriorityLabel = (priority) => {
    const priorities = {
        baja: 'Baja',
        media: 'Media',
        alta: 'Alta'
    };
    return priorities[priority] || priority;
};

const getPriorityIcon = (priority) => {
    const icons = {
        baja: 'pi pi-circle',
        media: 'pi pi-circle-fill',
        alta: 'pi pi-exclamation-triangle'
    };
    return icons[priority] || 'pi pi-circle';
};

const getPrioritySeverity = (priority) => {
    const severities = {
        baja: 'success',
        media: 'warning',
        alta: 'danger'
    };
    return severities[priority] || 'info';
};

const confirmDelete = () => {
    confirm.require({
        message: '¿Estás seguro de que deseas eliminar esta cita?',
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Eliminar',
        rejectLabel: 'Cancelar',
        accept: () => {
            emit('delete', props.event);
        }
    });
};

const confirmCancel = () => {
    confirm.require({
        message: '¿Estás seguro de que deseas cancelar esta cita?',
        header: 'Confirmar Cancelación',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-warning',
        acceptLabel: 'Cancelar Cita',
        rejectLabel: 'No',
        accept: () => {
            updateStatus('cancelled');
        }
    });
};

const updateStatus = (newStatus) => {
    emit('status-update', {
        event: props.event,
        status: newStatus
    });
};

const syncWithGoogle = () => {
    console.log('Sync with Google Calendar');
    // TODO: Implement Google Calendar sync
};

const openInGoogleCalendar = () => {
    if (props.event.google_calendar_id) {
        const url = `https://calendar.google.com/calendar/event?eid=${props.event.google_calendar_id}`;
        window.open(url, '_blank');
    }
};

const openLocationInMap = () => {
    if (props.event.location) {
        const query = encodeURIComponent(props.event.location);
        const url = `https://maps.google.com/maps?q=${query}`;
        window.open(url, '_blank');
    }
};
</script>

<style scoped>
.event-details {
    max-width: 100%;
}

@media (max-width: 768px) {
    .grid-cols-2 {
        grid-template-columns: 1fr;
    }

    .grid-cols-3 {
        grid-template-columns: 1fr;
    }
}
</style>