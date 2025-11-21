<template>
    <div class="event-form">
        <form @submit.prevent="handleSubmit">
            <div class="grid grid-cols-1 gap-4">
                <!-- Event Title -->
                <div class="field">
                    <label for="title" class="font-semibold block mb-2">Título *</label>
                    <InputText
                        id="title"
                        v-model="form.title"
                        placeholder="Ej: Reparación de aire acondicionado"
                        class="w-full"
                        :class="{ 'p-invalid': errors.title }"
                        required
                    />
                    <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
                </div>

                <!-- Event Type -->
                <div class="field">
                    <label for="type" class="font-semibold block mb-2">Tipo de Servicio *</label>
                    <Dropdown
                        id="type"
                        v-model="form.type"
                        :options="eventTypes"
                        option-label="label"
                        option-value="value"
                        placeholder="Seleccione el tipo"
                        class="w-full"
                        :class="{ 'p-invalid': errors.type }"
                    >
                        <template #option="slotProps">
                            <div class="flex items-center">
                                <i :class="slotProps.option.icon" class="mr-2"></i>
                                <span>{{ slotProps.option.label }}</span>
                            </div>
                        </template>
                    </Dropdown>
                    <small v-if="errors.type" class="p-error">{{ errors.type }}</small>
                </div>

                <!-- Date and Time -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label for="start_date" class="font-semibold block mb-2">Fecha de Inicio *</label>
                        <Calendar
                            id="start_date"
                            v-model="form.start_date"
                            show-icon
                            date-format="dd/mm/yy"
                            :min-date="new Date()"
                            class="w-full"
                            :class="{ 'p-invalid': errors.start_date }"
                            required
                        />
                        <small v-if="errors.start_date" class="p-error">{{ errors.start_date }}</small>
                    </div>

                    <div class="field">
                        <label for="start_time" class="font-semibold block mb-2">Hora de Inicio *</label>
                        <Calendar
                            id="start_time"
                            v-model="form.start_time"
                            time-only
                            show-icon
                            hour-format="24"
                            class="w-full"
                            :class="{ 'p-invalid': errors.start_time }"
                            required
                        />
                        <small v-if="errors.start_time" class="p-error">{{ errors.start_time }}</small>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label for="end_date" class="font-semibold block mb-2">Fecha de Fin *</label>
                        <Calendar
                            id="end_date"
                            v-model="form.end_date"
                            show-icon
                            date-format="dd/mm/yy"
                            :min-date="form.start_date || new Date()"
                            class="w-full"
                            :class="{ 'p-invalid': errors.end_date }"
                            required
                        />
                        <small v-if="errors.end_date" class="p-error">{{ errors.end_date }}</small>
                    </div>

                    <div class="field">
                        <label for="end_time" class="font-semibold block mb-2">Hora de Fin *</label>
                        <Calendar
                            id="end_time"
                            v-model="form.end_time"
                            time-only
                            show-icon
                            hour-format="24"
                            class="w-full"
                            :class="{ 'p-invalid': errors.end_time }"
                            required
                        />
                        <small v-if="errors.end_time" class="p-error">{{ errors.end_time }}</small>
                    </div>
                </div>

                <!-- Client Selection (for admin and suppliers) -->
                <div v-if="userRole !== 'client'" class="field">
                    <label for="client" class="font-semibold block mb-2">Cliente *</label>
                    <Dropdown
                        id="client"
                        v-model="form.client_id"
                        :options="availableClients"
                        option-label="name"
                        option-value="id"
                        placeholder="Seleccione un cliente"
                        class="w-full"
                        :class="{ 'p-invalid': errors.client_id }"
                        filter
                    >
                        <template #option="slotProps">
                            <div class="flex items-center">
                                <Avatar
                                    :label="slotProps.option.name.charAt(0)"
                                    size="small"
                                    class="mr-2"
                                    :style="{ backgroundColor: slotProps.option.color || '#64748b' }"
                                />
                                <div>
                                    <div class="font-semibold">{{ slotProps.option.name }}</div>
                                    <div class="text-sm text-muted-color">{{ slotProps.option.email }}</div>
                                </div>
                            </div>
                        </template>
                    </Dropdown>
                    <small v-if="errors.client_id" class="p-error">{{ errors.client_id }}</small>
                </div>

                <!-- Supplier Selection (for admin and clients) -->
                <div v-if="userRole !== 'supplier'" class="field">
                    <label for="supplier" class="font-semibold block mb-2">Técnico/Proveedor *</label>
                    <Dropdown
                        id="supplier"
                        v-model="form.supplier_id"
                        :options="availableSuppliers"
                        option-label="name"
                        option-value="id"
                        placeholder="Seleccione un técnico"
                        class="w-full"
                        :class="{ 'p-invalid': errors.supplier_id }"
                        filter
                    >
                        <template #option="slotProps">
                            <div class="flex items-center">
                                <Avatar
                                    :label="slotProps.option.name.charAt(0)"
                                    size="small"
                                    class="mr-2"
                                    :style="{ backgroundColor: slotProps.option.color || '#10b981' }"
                                />
                                <div>
                                    <div class="font-semibold">{{ slotProps.option.name }}</div>
                                    <div class="text-sm text-muted-color">
                                        {{ slotProps.option.specialty }} - {{ slotProps.option.location }}
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Dropdown>
                    <small v-if="errors.supplier_id" class="p-error">{{ errors.supplier_id }}</small>
                </div>

                <!-- Location -->
                <div class="field">
                    <label for="location" class="font-semibold block mb-2">Ubicación</label>
                    <div class="p-inputgroup">
                        <InputText
                            id="location"
                            v-model="form.location"
                            placeholder="Ej: Calle Principal 123, Col. Centro"
                            class="w-full"
                        />
                        <Button
                            icon="pi pi-map-marker"
                            severity="secondary"
                            @click="selectLocationOnMap"
                            v-tooltip="'Seleccionar en mapa'"
                        />
                    </div>
                </div>

                <!-- Priority -->
                <div class="field">
                    <label for="priority" class="font-semibold block mb-2">Prioridad</label>
                    <SelectButton
                        v-model="form.priority"
                        :options="priorityOptions"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                    >
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <i :class="slotProps.option.icon" :style="{ color: slotProps.option.color }"></i>
                                <span>{{ slotProps.option.label }}</span>
                            </div>
                        </template>
                    </SelectButton>
                </div>

                <!-- Description -->
                <div class="field">
                    <label for="description" class="font-semibold block mb-2">Descripción</label>
                    <Textarea
                        id="description"
                        v-model="form.description"
                        rows="4"
                        placeholder="Describe los detalles del servicio..."
                        class="w-full"
                    />
                </div>

                <!-- Google Calendar Integration -->
                <div class="field">
                    <div class="flex items-center">
                        <Checkbox
                            id="sync_google"
                            v-model="form.sync_with_google"
                            :binary="true"
                        />
                        <label for="sync_google" class="ml-2 font-semibold">
                            Sincronizar con Google Calendar
                        </label>
                    </div>
                    <small class="text-muted-color">
                        La cita se agregará automáticamente a tu calendario de Google
                    </small>
                </div>

                <!-- Notifications -->
                <div class="field">
                    <label class="font-semibold block mb-2">Recordatorios</label>
                    <div class="flex flex-wrap gap-3">
                        <div class="flex items-center">
                            <Checkbox
                                id="notify_15min"
                                v-model="form.notifications"
                                value="15min"
                            />
                            <label for="notify_15min" class="ml-2">15 minutos antes</label>
                        </div>
                        <div class="flex items-center">
                            <Checkbox
                                id="notify_1hour"
                                v-model="form.notifications"
                                value="1hour"
                            />
                            <label for="notify_1hour" class="ml-2">1 hora antes</label>
                        </div>
                        <div class="flex items-center">
                            <Checkbox
                                id="notify_1day"
                                v-model="form.notifications"
                                value="1day"
                            />
                            <label for="notify_1day" class="ml-2">1 día antes</label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button
                    type="button"
                    label="Cancelar"
                    icon="pi pi-times"
                    outlined
                    @click="$emit('cancel')"
                />
                <Button
                    type="submit"
                    label="Guardar Cita"
                    icon="pi pi-check"
                    :loading="saving"
                />
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import SelectButton from 'primevue/selectbutton';
import Checkbox from 'primevue/checkbox';

const props = defineProps({
    event: {
        type: Object,
        default: () => ({})
    },
    availableSuppliers: {
        type: Array,
        default: () => []
    },
    availableClients: {
        type: Array,
        default: () => []
    },
    userRole: {
        type: String,
        required: true
    }
});

const emit = defineEmits(['save', 'cancel']);

// Form data
const form = ref({
    title: '',
    description: '',
    type: 'maintenance',
    start_date: new Date(),
    start_time: new Date(),
    end_date: new Date(),
    end_time: new Date(),
    client_id: null,
    supplier_id: null,
    location: '',
    priority: 'media',
    sync_with_google: true,
    notifications: ['1hour']
});

const errors = ref({});
const saving = ref(false);

// Options
const eventTypes = ref([
    {
        value: 'maintenance',
        label: 'Mantenimiento',
        icon: 'pi pi-wrench'
    },
    {
        value: 'installation',
        label: 'Instalación',
        icon: 'pi pi-cog'
    },
    {
        value: 'repair',
        label: 'Reparación',
        icon: 'pi pi-hammer'
    },
    {
        value: 'inspection',
        label: 'Inspección',
        icon: 'pi pi-search'
    },
    {
        value: 'consultation',
        label: 'Consultoría',
        icon: 'pi pi-user'
    }
]);

const priorityOptions = ref([
    {
        value: 'baja',
        label: 'Baja',
        icon: 'pi pi-circle',
        color: '#22c55e'
    },
    {
        value: 'media',
        label: 'Media',
        icon: 'pi pi-circle-fill',
        color: '#f59e0b'
    },
    {
        value: 'alta',
        label: 'Alta',
        icon: 'pi pi-exclamation-triangle',
        color: '#ef4444'
    }
]);

// Computed
const combinedStartDateTime = computed(() => {
    if (form.value.start_date && form.value.start_time) {
        const date = new Date(form.value.start_date);
        const time = new Date(form.value.start_time);

        date.setHours(time.getHours(), time.getMinutes(), 0, 0);
        return date;
    }
    return null;
});

const combinedEndDateTime = computed(() => {
    if (form.value.end_date && form.value.end_time) {
        const date = new Date(form.value.end_date);
        const time = new Date(form.value.end_time);

        date.setHours(time.getHours(), time.getMinutes(), 0, 0);
        return date;
    }
    return null;
});

// Methods
const validateForm = () => {
    errors.value = {};

    if (!form.value.title?.trim()) {
        errors.value.title = 'El título es requerido';
    }

    if (!form.value.type) {
        errors.value.type = 'El tipo de servicio es requerido';
    }

    if (!form.value.start_date) {
        errors.value.start_date = 'La fecha de inicio es requerida';
    }

    if (!form.value.start_time) {
        errors.value.start_time = 'La hora de inicio es requerida';
    }

    if (!form.value.end_date) {
        errors.value.end_date = 'La fecha de fin es requerida';
    }

    if (!form.value.end_time) {
        errors.value.end_time = 'La hora de fin es requerida';
    }

    if (combinedStartDateTime.value && combinedEndDateTime.value) {
        if (combinedEndDateTime.value <= combinedStartDateTime.value) {
            errors.value.end_time = 'La hora de fin debe ser posterior a la de inicio';
        }
    }

    if (props.userRole !== 'client' && !form.value.client_id) {
        errors.value.client_id = 'El cliente es requerido';
    }

    if (props.userRole !== 'supplier' && !form.value.supplier_id) {
        errors.value.supplier_id = 'El técnico es requerido';
    }

    return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
    if (!validateForm()) {
        return;
    }

    saving.value = true;

    try {
        const eventData = {
            ...form.value,
            start_time: combinedStartDateTime.value.toISOString(),
            end_time: combinedEndDateTime.value.toISOString()
        };

        emit('save', eventData);
    } catch (error) {
        console.error('Error saving event:', error);
    } finally {
        saving.value = false;
    }
};

const selectLocationOnMap = () => {
    // TODO: Open map modal to select location
    console.log('Open map to select location');
};

// Initialize form with event data if editing
watch(() => props.event, (event) => {
    if (event && Object.keys(event).length > 0) {
        const startDate = new Date(event.start_time);
        const endDate = new Date(event.end_time);

        form.value = {
            title: event.title || '',
            description: event.description || '',
            type: event.type || 'maintenance',
            start_date: startDate,
            start_time: startDate,
            end_date: endDate,
            end_time: endDate,
            client_id: event.client_id,
            supplier_id: event.supplier_id,
            location: event.location || '',
            priority: event.priority || 'media',
            sync_with_google: event.sync_with_google !== false,
            notifications: event.notifications || ['1hour']
        };
    }
}, { immediate: true, deep: true });

// Auto-set end time when start time changes (default 1 hour duration)
watch(() => form.value.start_time, (startTime) => {
    if (startTime && !form.value.end_time) {
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 1);
        form.value.end_time = endTime;
    }
});

// Auto-set end date when start date changes
watch(() => form.value.start_date, (startDate) => {
    if (startDate && !form.value.end_date) {
        form.value.end_date = new Date(startDate);
    }
});
</script>

<style scoped>
.event-form {
    max-width: 100%;
}

.field {
    margin-bottom: 1rem;
}

.p-inputgroup .p-button {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

.p-selectbutton .p-button {
    border-radius: 6px;
}

@media (max-width: 768px) {
    .grid-cols-2 {
        grid-template-columns: 1fr;
    }
}
</style>