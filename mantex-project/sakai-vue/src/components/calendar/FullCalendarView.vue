<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Calendar Header Card -->
        <div class="col-span-12">
            <div class="card mb-0">
                <Toolbar>
                    <template #start>
                        <Button icon="pi pi-chevron-left" text @click="previousMonth" />
                        <div class="font-semibold text-xl mx-4">
                            {{ currentDate.toLocaleDateString('es-MX', {
                                month: 'long',
                                year: 'numeric'
                            }).toUpperCase() }}
                        </div>
                        <Button icon="pi pi-chevron-right" text @click="nextMonth" />
                    </template>

                    <template #center>
                        <div class="flex gap-2">
                            <Button
                                :outlined="currentView !== 'month'"
                                :text="currentView === 'month'"
                                label="Mes"
                                size="small"
                                @click="setView('month')"
                            />
                            <Button
                                :outlined="currentView !== 'week'"
                                :text="currentView === 'week'"
                                label="Semana"
                                size="small"
                                @click="setView('week')"
                            />
                            <Button
                                :outlined="currentView !== 'day'"
                                :text="currentView === 'day'"
                                label="Día"
                                size="small"
                                @click="setView('day')"
                            />
                        </div>
                    </template>

                    <template #end>
                        <Button
                            v-if="canCreateEvents"
                            icon="pi pi-plus"
                            label="Nueva Cita"
                            class="mr-2"
                            @click="showNewEventDialog = true"
                        />
                        <Button
                            icon="pi pi-sync"
                            label="Sincronizar"
                            outlined
                            :loading="syncingCalendar"
                            @click="syncWithGoogleCalendar"
                        />
                    </template>
                </Toolbar>
            </div>
        </div>

        <!-- Calendar Content -->
        <div class="col-span-12">
            <div class="card mb-0">
                <!-- Month View -->
                <template v-if="currentView === 'month'">
                    <div class="calendar-month-grid">
                        <!-- Weekday Headers -->
                        <div class="grid grid-cols-7 bg-surface-100 border-b">
                            <div
                                v-for="day in weekdays"
                                :key="day"
                                class="p-3 text-center font-medium text-muted-color"
                            >
                                {{ day }}
                            </div>
                        </div>

                        <!-- Calendar Days -->
                        <div class="min-h-[500px]">
                            <div
                                v-for="week in monthWeeks"
                                :key="`week-${week[0]?.date}`"
                                class="grid grid-cols-7 border-b"
                            >
                                <div
                                    v-for="day in week"
                                    :key="day.date"
                                    class="min-h-[100px] p-2 border-r cursor-pointer hover:bg-surface-50 transition-colors"
                                    :class="{
                                        'text-muted-color bg-surface-50': !day.isCurrentMonth,
                                        'bg-primary-50 border-primary': day.isToday,
                                        'bg-primary-100 border-2 border-primary': day.isSelected,
                                        'border-l-4 border-l-primary': day.events.length > 0
                                    }"
                                    @click="selectDay(day)"
                                >
                                    <div class="font-medium text-sm mb-2">{{ day.dayNumber }}</div>

                                    <!-- Events for this day -->
                                    <div class="space-y-1">
                                        <div
                                            v-for="event in day.events.slice(0, 2)"
                                            :key="event.id"
                                            class="text-xs p-1 rounded cursor-pointer"
                                            :class="{
                                                'bg-blue-100 text-blue-800': event.type === 'maintenance',
                                                'bg-green-100 text-green-800': event.type === 'installation',
                                                'bg-orange-100 text-orange-800': event.type === 'appointment'
                                            }"
                                            @click.stop="openEventDetails(event)"
                                        >
                                            <div class="font-medium truncate">{{ event.title }}</div>
                                            <div class="text-xs opacity-75">
                                                {{ formatEventTime(event.start_time) }}
                                            </div>
                                        </div>

                                        <div
                                            v-if="day.events.length > 2"
                                            class="text-xs text-primary font-medium cursor-pointer"
                                            @click.stop="showMoreEvents(day)"
                                        >
                                            +{{ day.events.length - 2 }} más
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- Week View -->
                <template v-if="currentView === 'week'">
                    <div class="calendar-week-view">
                        <!-- Week Header -->
                        <div class="grid grid-cols-8 border-b bg-surface-100">
                            <div class="p-3 border-r"></div>
                            <div
                                v-for="day in currentWeekDays"
                                :key="day.date"
                                class="p-3 text-center border-r"
                                :class="{ 'bg-primary-50': day.isToday }"
                            >
                                <div class="font-medium text-muted-color text-sm">{{ day.dayName }}</div>
                                <div class="font-semibold text-lg">{{ day.dayNumber }}</div>
                            </div>
                        </div>

                        <!-- Week Content -->
                        <div class="grid grid-cols-8 max-h-[600px] overflow-y-auto">
                            <div class="border-r">
                                <div
                                    v-for="hour in dayHours.slice(6, 22)"
                                    :key="hour"
                                    class="h-[60px] p-2 border-b text-xs text-muted-color flex items-center"
                                >
                                    {{ formatHour(hour) }}
                                </div>
                            </div>

                            <div
                                v-for="day in currentWeekDays"
                                :key="day.date"
                                class="border-r relative"
                            >
                                <div
                                    v-for="hour in dayHours.slice(6, 22)"
                                    :key="hour"
                                    class="h-[60px] border-b cursor-pointer hover:bg-surface-50 relative"
                                    @click="createEventAtTime(day, hour)"
                                >
                                    <!-- Events for this hour -->
                                    <div
                                        v-for="event in getEventsForHour(day, hour)"
                                        :key="event.id"
                                        class="absolute left-1 right-1 p-1 rounded text-xs cursor-pointer z-10"
                                        :class="{
                                            'bg-blue-500 text-white': event.type === 'maintenance',
                                            'bg-green-500 text-white': event.type === 'installation',
                                            'bg-orange-500 text-white': event.type === 'appointment'
                                        }"
                                        :style="getEventPosition(event)"
                                        @click.stop="openEventDetails(event)"
                                    >
                                        <div class="font-medium truncate">{{ event.title }}</div>
                                        <div class="text-xs opacity-90">
                                            {{ formatEventTime(event.start_time) }} -
                                            {{ formatEventTime(event.end_time) }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- Day View -->
                <template v-if="currentView === 'day'">
                    <div class="calendar-day-view">
                        <!-- Day Header -->
                        <div class="mb-4 p-3 bg-surface-50 border-b">
                            <h3 class="font-semibold text-xl">
                                {{ selectedDate.toLocaleDateString('es-MX', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) }}
                            </h3>
                        </div>

                        <!-- Day Content -->
                        <div class="grid grid-cols-8 max-h-[600px] overflow-y-auto">
                            <div class="border-r">
                                <div
                                    v-for="hour in dayHours.slice(6, 22)"
                                    :key="hour"
                                    class="h-[60px] p-2 border-b text-xs text-muted-color flex items-center"
                                >
                                    {{ formatHour(hour) }}
                                </div>
                            </div>

                            <div class="col-span-7 relative">
                                <div
                                    v-for="hour in dayHours.slice(6, 22)"
                                    :key="hour"
                                    class="h-[60px] border-b cursor-pointer hover:bg-surface-50 relative"
                                    @click="createEventAtTime(selectedDate, hour)"
                                >
                                    <!-- Events for this hour -->
                                    <div
                                        v-for="event in getEventsForHour({ date: selectedDate }, hour)"
                                        :key="event.id"
                                        class="absolute left-2 right-2 p-3 rounded shadow-sm cursor-pointer z-10"
                                        :class="{
                                            'bg-blue-100 border-l-4 border-blue-500': event.type === 'maintenance',
                                            'bg-green-100 border-l-4 border-green-500': event.type === 'installation',
                                            'bg-orange-100 border-l-4 border-orange-500': event.type === 'appointment'
                                        }"
                                        :style="getEventPosition(event)"
                                        @click.stop="openEventDetails(event)"
                                    >
                                        <div class="font-semibold text-sm mb-1">{{ event.title }}</div>
                                        <div class="text-xs text-muted-color mb-1">
                                            {{ formatEventTime(event.start_time) }} -
                                            {{ formatEventTime(event.end_time) }}
                                        </div>
                                        <div class="text-xs text-muted-color flex items-center gap-1">
                                            <i class="pi pi-user" />
                                            {{ getEventParticipants(event) }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <!-- New Event Dialog -->
        <Dialog
            v-model:visible="showNewEventDialog"
            modal
            header="Nueva Cita"
            class="event-dialog"
            style="width: 600px"
        >
            <EventForm
                :event="newEvent"
                :available-suppliers="availableSuppliers"
                :available-clients="availableClients"
                :user-role="userRole"
                @save="saveNewEvent"
                @cancel="showNewEventDialog = false"
            />
        </Dialog>

        <!-- Event Details Dialog -->
        <Dialog
            v-model:visible="showEventDetails"
            modal
            header="Detalles de la Cita"
            class="event-details-dialog"
            style="width: 700px"
        >
            <EventDetails
                :event="selectedEvent"
                :user-role="userRole"
                :can-edit="canEditEvent(selectedEvent)"
                @edit="editEvent"
                @delete="deleteEvent"
                @reschedule="rescheduleEvent"
                @close="showEventDetails = false"
            />
        </Dialog>

        <!-- Loading Overlay -->
        <div v-if="loadingEvents" class="loading-overlay">
            <ProgressSpinner />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuth } from '@/composables/useAuth.js';
import { useGoogleIntegration } from '@/composables/useGoogleIntegration.js';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import Toolbar from 'primevue/toolbar';
import EventForm from './EventForm.vue';
import EventDetails from './EventDetails.vue';

const props = defineProps({
    initialDate: {
        type: Date,
        default: () => new Date()
    },
    userRole: {
        type: String,
        required: true
    }
});

// Composables
const { user, profile } = useAuth();
const googleIntegration = useGoogleIntegration();
const toast = useToast();

// Reactive state
const currentDate = ref(new Date(props.initialDate));
const selectedDate = ref(new Date(props.initialDate));
const currentView = ref('month');
const loadingEvents = ref(false);
const syncingCalendar = ref(false);
const events = ref([]);
const availableSuppliers = ref([]);
const availableClients = ref([]);

// Dialog states
const showNewEventDialog = ref(false);
const showEventDetails = ref(false);
const selectedEvent = ref(null);
const newEvent = ref({
    title: '',
    description: '',
    start_time: new Date(),
    end_time: new Date(),
    type: 'appointment',
    status: 'scheduled',
    client_id: null,
    supplier_id: null,
    location: ''
});

// Constants
const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const dayHours = Array.from({ length: 24 }, (_, i) => i);

// Computed properties
const canCreateEvents = computed(() => {
    return ['admin', 'client'].includes(props.userRole);
});

const canEditEvent = (event) => {
    if (props.userRole === 'admin') return true;
    if (props.userRole === 'client' && event.client_id === user.value?.id) return true;
    if (props.userRole === 'supplier' && event.supplier_id === user.value?.id) return true;
    return false;
};

const monthWeeks = computed(() => {
    const weeks = [];
    const firstDayOfMonth = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 0);

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));

    const currentDateIterator = new Date(startDate);

    while (currentDateIterator <= endDate) {
        const week = [];

        for (let i = 0; i < 7; i++) {
            const dayEvents = getEventsForDate(currentDateIterator);

            week.push({
                date: new Date(currentDateIterator).toISOString().split('T')[0],
                dayNumber: currentDateIterator.getDate(),
                isCurrentMonth: currentDateIterator.getMonth() === currentDate.value.getMonth(),
                isToday: isToday(currentDateIterator),
                isSelected: isSameDay(currentDateIterator, selectedDate.value),
                events: dayEvents
            });

            currentDateIterator.setDate(currentDateIterator.getDate() + 1);
        }

        weeks.push(week);
    }

    return weeks;
});

const currentWeekDays = computed(() => {
    const startOfWeek = new Date(selectedDate.value);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);

        days.push({
            date: day,
            dayName: day.toLocaleDateString('es-MX', { weekday: 'short' }),
            dayNumber: day.getDate(),
            isToday: isToday(day),
            events: getEventsForDate(day)
        });
    }

    return days;
});

// Methods
const previousMonth = () => {
    currentDate.value = new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth() - 1,
        1
    );
    loadEvents();
};

const nextMonth = () => {
    currentDate.value = new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth() + 1,
        1
    );
    loadEvents();
};

const setView = (view) => {
    currentView.value = view;
};

const selectDay = (day) => {
    selectedDate.value = new Date(day.date);
    if (currentView.value !== 'day') {
        currentView.value = 'day';
    }
};

const isToday = (date) => {
    const today = new Date();
    return isSameDay(date, today);
};

const isSameDay = (date1, date2) => {
    return date1.toDateString() === date2.toDateString();
};

const getEventsForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.value.filter(event => {
        const eventDate = new Date(event.start_time).toISOString().split('T')[0];
        return eventDate === dateString;
    });
};

const getEventsForHour = (day, hour) => {
    const dayEvents = getEventsForDate(day.date || day);
    return dayEvents.filter(event => {
        const eventHour = new Date(event.start_time).getHours();
        return eventHour === hour;
    });
};

const formatEventTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

const formatHour = (hour) => {
    const time = new Date();
    time.setHours(hour, 0, 0, 0);
    return time.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

const getEventPosition = (event) => {
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);
    const duration = (endTime - startTime) / (1000 * 60 * 60); // hours
    const startMinutes = startTime.getMinutes();

    return {
        top: `${(startMinutes / 60) * 60}px`,
        height: `${Math.max(duration * 60, 30)}px`
    };
};

const getEventParticipants = (event) => {
    const parts = [];
    if (event.client_name) parts.push(event.client_name);
    if (event.supplier_name) parts.push(event.supplier_name);
    return parts.join(', ');
};

const openEventDetails = (event) => {
    selectedEvent.value = event;
    showEventDetails.value = true;
};

const showMoreEvents = (day) => {
    selectDay(day);
    currentView.value = 'day';
};

const createEventAtTime = (date, hour) => {
    if (!canCreateEvents.value) return;

    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, 0, 0, 0);

    newEvent.value = {
        title: '',
        description: '',
        start_time: startTime,
        end_time: endTime,
        type: 'appointment',
        status: 'scheduled',
        client_id: props.userRole === 'client' ? user.value.id : null,
        supplier_id: null,
        location: ''
    };

    showNewEventDialog.value = true;
};

const saveNewEvent = async (eventData) => {
    try {
        loadingEvents.value = true;

        // Save to Supabase
        // const savedEvent = await saveEventToDatabase(eventData);

        // Sync with Google Calendar if enabled
        if (googleIntegration.calendar.isAuthenticated.value) {
            await googleIntegration.calendar.createEvent({
                summary: eventData.title,
                description: eventData.description,
                start: {
                    dateTime: eventData.start_time.toISOString(),
                    timeZone: 'America/Mexico_City'
                },
                end: {
                    dateTime: eventData.end_time.toISOString(),
                    timeZone: 'America/Mexico_City'
                },
                location: eventData.location
            });
        }

        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Cita creada correctamente',
            life: 3000
        });

        showNewEventDialog.value = false;
        await loadEvents();

    } catch (error) {
        console.error('Error saving event:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la cita',
            life: 3000
        });
    } finally {
        loadingEvents.value = false;
    }
};

const editEvent = (event) => {
    // Implement edit functionality
    console.log('Editing event:', event);
};

const deleteEvent = async (event) => {
    try {
        loadingEvents.value = true;

        // Delete from database
        // await deleteEventFromDatabase(event.id);

        // Delete from Google Calendar if synced
        if (event.google_calendar_id && googleIntegration.calendar.isAuthenticated.value) {
            await googleIntegration.calendar.deleteEvent(event.google_calendar_id);
        }

        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Cita eliminada correctamente',
            life: 3000
        });

        showEventDetails.value = false;
        await loadEvents();

    } catch (error) {
        console.error('Error deleting event:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar la cita',
            life: 3000
        });
    } finally {
        loadingEvents.value = false;
    }
};

const rescheduleEvent = (event) => {
    // Implement reschedule functionality
    console.log('Rescheduling event:', event);
};

const syncWithGoogleCalendar = async () => {
    try {
        syncingCalendar.value = true;

        if (!googleIntegration.calendar.isAuthenticated.value) {
            await googleIntegration.calendar.authenticate();
        }

        // Sync events bi-directionally
        await googleIntegration.calendar.syncEvents();

        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Calendario sincronizado con Google Calendar',
            life: 3000
        });

        await loadEvents();

    } catch (error) {
        console.error('Error syncing calendar:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo sincronizar con Google Calendar',
            life: 3000
        });
    } finally {
        syncingCalendar.value = false;
    }
};

const loadEvents = async () => {
    try {
        loadingEvents.value = true;

        // Load events from database based on user role and current date range
        const startDate = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1);
        const endDate = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 0);

        // Mock data for now
        events.value = [
            {
                id: '1',
                title: 'Reparación de tubería',
                description: 'Reparación de fuga en cocina',
                start_time: new Date(2025, 10, 20, 10, 0).toISOString(),
                end_time: new Date(2025, 10, 20, 12, 0).toISOString(),
                type: 'maintenance',
                status: 'scheduled',
                client_id: 'client1',
                supplier_id: 'supplier1',
                client_name: 'Juan Pérez',
                supplier_name: 'María García',
                location: 'Av. Principal 123',
                google_calendar_id: null
            },
            {
                id: '2',
                title: 'Instalación eléctrica',
                description: 'Instalación de contactos adicionales',
                start_time: new Date(2025, 10, 22, 14, 0).toISOString(),
                end_time: new Date(2025, 10, 22, 16, 0).toISOString(),
                type: 'installation',
                status: 'confirmed',
                client_id: 'client2',
                supplier_id: 'supplier2',
                client_name: 'Ana López',
                supplier_name: 'Carlos Martínez',
                location: 'Calle Secundaria 456',
                google_calendar_id: 'google_event_123'
            }
        ];

    } catch (error) {
        console.error('Error loading events:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los eventos',
            life: 3000
        });
    } finally {
        loadingEvents.value = false;
    }
};

// Lifecycle
onMounted(() => {
    loadEvents();

    // Load available suppliers and clients for admins
    if (props.userRole === 'admin') {
        // Load from database
        availableSuppliers.value = [];
        availableClients.value = [];
    }
});

// Watchers
watch(() => props.initialDate, (newDate) => {
    currentDate.value = new Date(newDate);
    selectedDate.value = new Date(newDate);
    loadEvents();
});
</script>

<style scoped>
/* Loading Overlay */
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
}
</style>