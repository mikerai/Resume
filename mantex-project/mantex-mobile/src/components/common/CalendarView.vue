<template>
  <div class="calendar-container">
    <!-- Header con controles -->
    <div class="calendar-header">
      <ion-button
        fill="clear"
        @click="previousMonth"
        :disabled="isLoading"
      >
        <ion-icon :icon="chevronBack"></ion-icon>
      </ion-button>

      <h2 class="month-year">{{ formatMonthYear }}</h2>

      <ion-button
        fill="clear"
        @click="nextMonth"
        :disabled="isLoading"
      >
        <ion-icon :icon="chevronForward"></ion-icon>
      </ion-button>
    </div>

    <!-- Días de la semana -->
    <div class="weekdays">
      <div
        v-for="day in weekDays"
        :key="day"
        class="weekday"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendario -->
    <div class="calendar-grid" v-if="!isLoading">
      <div
        v-for="day in calendarDays"
        :key="`${day.date}-${day.isCurrentMonth}`"
        class="calendar-day"
        :class="{
          'is-today': day.isToday,
          'is-current-month': day.isCurrentMonth,
          'has-events': day.hasEvents,
          'is-selected': isSelectedDay(day)
        }"
        @click="selectDay(day)"
      >
        <span class="day-number">{{ day.dayNumber }}</span>
        <div v-if="day.events && day.events.length > 0" class="day-events">
          <div
            v-for="event in day.events.slice(0, 3)"
            :key="event.id"
            class="event-dot"
            :style="{ backgroundColor: getEventColor(event) }"
          ></div>
          <span v-if="day.events.length > 3" class="more-events">
            +{{ day.events.length - 3 }}
          </span>
        </div>
      </div>
    </div>

    <!-- Loading estado -->
    <div v-else class="loading-container">
      <ion-spinner name="crescent"></ion-spinner>
      <p>Cargando eventos...</p>
    </div>

    <!-- Lista de eventos del día seleccionado -->
    <div v-if="selectedDay && selectedDay.events && selectedDay.events.length > 0" class="selected-day-events">
      <h3>Eventos - {{ formatSelectedDate }}</h3>

      <ion-list>
        <ion-item
          v-for="event in selectedDay.events"
          :key="event.id"
          class="event-item"
          @click="openEvent(event)"
        >
          <div class="event-content">
            <div class="event-time">
              {{ formatEventTime(event) }}
            </div>
            <div class="event-title">{{ event.title }}</div>
            <div v-if="event.location" class="event-location">
              <ion-icon :icon="locationOutline"></ion-icon>
              {{ event.location }}
            </div>
          </div>
          <ion-badge
            v-if="event.type"
            :color="getEventBadgeColor(event.type)"
            slot="end"
          >
            {{ event.type }}
          </ion-badge>
        </ion-item>
      </ion-list>
    </div>

    <!-- Sin eventos para el día -->
    <div v-else-if="selectedDay" class="no-events">
      <ion-icon :icon="calendarOutline"></ion-icon>
      <p>No hay eventos para {{ formatSelectedDate }}</p>
    </div>

    <!-- Botón para agregar evento -->
    <ion-fab vertical="bottom" horizontal="end" v-if="canCreateEvents">
      <ion-fab-button @click="openCreateEventModal" color="primary">
        <ion-icon :icon="add"></ion-icon>
      </ion-fab-button>
    </ion-fab>

    <!-- Modal para crear/editar eventos -->
    <ion-modal :is-open="showEventModal" @did-dismiss="closeEventModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ editingEvent ? 'Editar Evento' : 'Nuevo Evento' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeEventModal">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <div class="event-form">
          <ion-item>
            <ion-label position="stacked">Título</ion-label>
            <ion-input
              v-model="eventForm.title"
              placeholder="Título del evento"
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Fecha</ion-label>
            <ion-datetime
              v-model="eventForm.date"
              display-format="DD/MM/YYYY"
              picker-format="DD MM YYYY"
            ></ion-datetime>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Hora de inicio</ion-label>
            <ion-datetime
              v-model="eventForm.startTime"
              display-format="HH:mm"
              picker-format="HH mm"
            ></ion-datetime>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Hora de fin</ion-label>
            <ion-datetime
              v-model="eventForm.endTime"
              display-format="HH:mm"
              picker-format="HH mm"
            ></ion-datetime>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Ubicación</ion-label>
            <ion-input
              v-model="eventForm.location"
              placeholder="Ubicación del evento"
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Descripción</ion-label>
            <ion-textarea
              v-model="eventForm.description"
              placeholder="Descripción del evento"
              rows="3"
            ></ion-textarea>
          </ion-item>

          <ion-item>
            <ion-label>Todo el día</ion-label>
            <ion-checkbox
              v-model="eventForm.allDay"
              slot="end"
            ></ion-checkbox>
          </ion-item>

          <div class="form-buttons">
            <ion-button
              expand="block"
              @click="saveEvent"
              :disabled="!eventForm.title || isLoading"
              color="primary"
            >
              {{ editingEvent ? 'Actualizar' : 'Crear' }} Evento
            </ion-button>

            <ion-button
              v-if="editingEvent"
              expand="block"
              fill="outline"
              color="danger"
              @click="deleteEventConfirm"
            >
              Eliminar Evento
            </ion-button>
          </div>
        </div>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonList,
  IonItem,
  IonBadge,
  IonFab,
  IonFabButton,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonLabel,
  IonInput,
  IonTextarea,
  IonDatetime,
  IonCheckbox,
  alertController,
  toastController
} from '@ionic/vue';
import {
  chevronBack,
  chevronForward,
  calendarOutline,
  locationOutline,
  add
} from 'ionicons/icons';
import { useGoogleCalendar } from '@/composables/useGoogleCalendar.js';

export default {
  name: 'CalendarView',
  components: {
    IonButton,
    IonIcon,
    IonSpinner,
    IonList,
    IonItem,
    IonBadge,
    IonFab,
    IonFabButton,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonLabel,
    IonInput,
    IonTextarea,
    IonDatetime,
    IonCheckbox
  },
  props: {
    enableGoogleSync: {
      type: Boolean,
      default: false
    },
    jobEvents: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { emit }) {
    // Composables
    const {
      isAuthorized,
      events,
      isLoading,
      error,
      getEvents,
      createEvent,
      updateEvent,
      deleteEvent,
      authorizeUser
    } = useGoogleCalendar();

    // Estado reactivo
    const currentDate = ref(new Date());
    const selectedDay = ref(null);
    const showEventModal = ref(false);
    const editingEvent = ref(null);

    // Form del evento
    const eventForm = ref({
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      description: '',
      allDay: false
    });

    // Días de la semana
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Computadas
    const formatMonthYear = computed(() => {
      return currentDate.value.toLocaleDateString('es-MX', {
        month: 'long',
        year: 'numeric'
      });
    });

    const formatSelectedDate = computed(() => {
      if (!selectedDay.value) return '';
      return selectedDay.value.date.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    });

    const canCreateEvents = computed(() => {
      return props.enableGoogleSync && isAuthorized.value;
    });

    // Generar días del calendario
    const calendarDays = computed(() => {
      const year = currentDate.value.getFullYear();
      const month = currentDate.value.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);

      // Ajustar al domingo anterior si es necesario
      startDate.setDate(startDate.getDate() - startDate.getDay());

      const days = [];
      const today = new Date();

      for (let i = 0; i < 42; i++) { // 6 semanas
        const currentDay = new Date(startDate);
        currentDay.setDate(startDate.getDate() + i);

        const dayEvents = getAllEventsForDay(currentDay);

        days.push({
          date: new Date(currentDay),
          dayNumber: currentDay.getDate(),
          isCurrentMonth: currentDay.getMonth() === month,
          isToday: isSameDay(currentDay, today),
          hasEvents: dayEvents.length > 0,
          events: dayEvents
        });
      }

      return days;
    });

    // Métodos
    const getAllEventsForDay = (date) => {
      const dayEvents = [];

      // Eventos de Google Calendar
      if (events.value) {
        const googleEvents = events.value.filter(event => {
          const eventDate = new Date(event.startDateTime);
          return isSameDay(eventDate, date);
        }).map(event => ({
          ...event,
          type: 'google',
          source: 'Google Calendar'
        }));
        dayEvents.push(...googleEvents);
      }

      // Eventos de trabajos Mantex
      if (props.jobEvents) {
        const jobEvents = props.jobEvents.filter(job => {
          const jobDate = new Date(job.scheduled_date);
          return isSameDay(jobDate, date);
        }).map(job => ({
          id: `job-${job.id}`,
          title: `Trabajo: ${job.title}`,
          startDateTime: job.scheduled_date,
          endDateTime: job.scheduled_date,
          location: job.location,
          description: job.description,
          type: 'mantex',
          source: 'Mantex Job',
          jobData: job
        }));
        dayEvents.push(...jobEvents);
      }

      return dayEvents.sort((a, b) =>
        new Date(a.startDateTime) - new Date(b.startDateTime)
      );
    };

    const isSameDay = (date1, date2) => {
      return date1.getDate() === date2.getDate() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getFullYear() === date2.getFullYear();
    };

    const isSelectedDay = (day) => {
      return selectedDay.value && isSameDay(day.date, selectedDay.value.date);
    };

    const selectDay = (day) => {
      selectedDay.value = day;
      emit('day-selected', day);
    };

    const previousMonth = () => {
      const newDate = new Date(currentDate.value);
      newDate.setMonth(newDate.getMonth() - 1);
      currentDate.value = newDate;
      loadEventsForMonth();
    };

    const nextMonth = () => {
      const newDate = new Date(currentDate.value);
      newDate.setMonth(newDate.getMonth() + 1);
      currentDate.value = newDate;
      loadEventsForMonth();
    };

    const loadEventsForMonth = async () => {
      if (!props.enableGoogleSync || !isAuthorized.value) return;

      const year = currentDate.value.getFullYear();
      const month = currentDate.value.getMonth();

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      try {
        await getEvents('primary', startDate, endDate);
      } catch (err) {
        console.error('Error loading calendar events:', err);
      }
    };

    const getEventColor = (event) => {
      switch (event.type) {
        case 'google': return '#4285F4';
        case 'mantex': return '#4A8C8C';
        default: return '#666';
      }
    };

    const getEventBadgeColor = (type) => {
      switch (type) {
        case 'google': return 'primary';
        case 'mantex': return 'secondary';
        default: return 'medium';
      }
    };

    const formatEventTime = (event) => {
      if (event.allDay) return 'Todo el día';

      const start = new Date(event.startDateTime);
      const end = new Date(event.endDateTime);

      return `${start.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      })} - ${end.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    };

    const openEvent = (event) => {
      if (event.type === 'google') {
        editingEvent.value = event;

        // Llenar form con datos del evento
        eventForm.value = {
          title: event.title,
          date: event.startDateTime.split('T')[0],
          startTime: event.startDateTime,
          endTime: event.endDateTime,
          location: event.location || '',
          description: event.description || '',
          allDay: event.allDay || false
        };

        showEventModal.value = true;
      } else if (event.type === 'mantex') {
        emit('job-selected', event.jobData);
      }
    };

    const openCreateEventModal = () => {
      editingEvent.value = null;
      eventForm.value = {
        title: '',
        date: selectedDay.value ? selectedDay.value.date.toISOString().split('T')[0] : '',
        startTime: '',
        endTime: '',
        location: '',
        description: '',
        allDay: false
      };
      showEventModal.value = true;
    };

    const closeEventModal = () => {
      showEventModal.value = false;
      editingEvent.value = null;
    };

    const saveEvent = async () => {
      try {
        const eventData = {
          title: eventForm.value.title,
          description: eventForm.value.description,
          location: eventForm.value.location,
          startDateTime: eventForm.value.allDay
            ? eventForm.value.date
            : `${eventForm.value.date}T${eventForm.value.startTime}`,
          endDateTime: eventForm.value.allDay
            ? eventForm.value.date
            : `${eventForm.value.date}T${eventForm.value.endTime}`,
          allDay: eventForm.value.allDay
        };

        if (editingEvent.value) {
          await updateEvent(editingEvent.value.id, eventData);
          await presentToast('Evento actualizado exitosamente');
        } else {
          await createEvent(eventData);
          await presentToast('Evento creado exitosamente');
        }

        closeEventModal();
        await loadEventsForMonth();

      } catch (err) {
        console.error('Error saving event:', err);
        await presentToast('Error al guardar evento', 'danger');
      }
    };

    const deleteEventConfirm = async () => {
      const alert = await alertController.create({
        header: 'Confirmar eliminación',
        message: '¿Estás seguro de que quieres eliminar este evento?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Eliminar',
            role: 'destructive',
            handler: async () => {
              try {
                await deleteEvent(editingEvent.value.id);
                await presentToast('Evento eliminado exitosamente');
                closeEventModal();
                await loadEventsForMonth();
              } catch (err) {
                console.error('Error deleting event:', err);
                await presentToast('Error al eliminar evento', 'danger');
              }
            }
          }
        ]
      });

      await alert.present();
    };

    const presentToast = async (message, color = 'success') => {
      const toast = await toastController.create({
        message,
        duration: 2000,
        color,
        position: 'bottom'
      });
      await toast.present();
    };

    // Watchers
    watch(currentDate, () => {
      loadEventsForMonth();
    });

    // Lifecycle
    onMounted(async () => {
      console.log('📅 Calendar component mounted with Google Calendar integration');

      if (props.enableGoogleSync && !isAuthorized.value) {
        try {
          await authorizeUser();
        } catch (err) {
          console.log('Google Calendar authorization will be done manually');
        }
      }

      await loadEventsForMonth();
    });

    return {
      // Icons
      chevronBack,
      chevronForward,
      calendarOutline,
      locationOutline,
      add,

      // Estado
      currentDate,
      selectedDay,
      showEventModal,
      editingEvent,
      eventForm,
      weekDays,
      isLoading,
      error,

      // Computadas
      formatMonthYear,
      formatSelectedDate,
      canCreateEvents,
      calendarDays,

      // Métodos
      previousMonth,
      nextMonth,
      selectDay,
      isSelectedDay,
      getEventColor,
      getEventBadgeColor,
      formatEventTime,
      openEvent,
      openCreateEventModal,
      closeEventModal,
      saveEvent,
      deleteEventConfirm
    };
  }
};
</script>

<style scoped>
.calendar-container {
  padding: 16px;
  max-width: 100%;
  margin: 0 auto;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.month-year {
  font-family: 'Petrona', serif;
  font-size: 1.5rem;
  margin: 0;
  text-transform: capitalize;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 8px 4px;
  color: var(--ion-color-medium);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 20px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 4px 2px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--surface);
  border: 1px solid transparent;
}

.calendar-day:hover {
  background: var(--ion-color-light);
  transform: scale(1.02);
}

.calendar-day.is-selected {
  background: var(--ion-color-primary);
  color: white;
  border-color: var(--ion-color-primary-shade);
}

.calendar-day.is-today {
  border-color: var(--ion-color-secondary);
  border-width: 2px;
}

.calendar-day.is-today.is-selected {
  border-color: var(--ion-color-primary-tint);
}

.calendar-day:not(.is-current-month) {
  opacity: 0.3;
  pointer-events: none;
}

.day-number {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 2px;
}

.day-events {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
  align-items: center;
}

.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ion-color-primary);
}

.more-events {
  font-size: 0.7rem;
  color: var(--ion-color-medium);
  margin-left: 2px;
}

.loading-container {
  text-align: center;
  padding: 40px 20px;
}

.loading-container p {
  margin-top: 16px;
  color: var(--ion-color-medium);
}

.selected-day-events {
  margin-top: 24px;
}

.selected-day-events h3 {
  font-family: 'Petrona', serif;
  margin: 0 0 16px 0;
  color: var(--ion-color-primary);
}

.event-item {
  --padding-start: 16px;
  --padding-end: 16px;
  margin-bottom: 8px;
  border-radius: 8px;
}

.event-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.event-time {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.event-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.event-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.no-events {
  text-align: center;
  padding: 40px 20px;
  color: var(--ion-color-medium);
}

.no-events ion-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.event-form {
  padding: 20px;
}

.form-buttons {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 480px) {
  .calendar-container {
    padding: 12px;
  }

  .month-year {
    font-size: 1.3rem;
  }

  .calendar-day {
    padding: 2px 1px;
  }

  .day-number {
    font-size: 0.8rem;
  }

  .event-dot {
    width: 4px;
    height: 4px;
  }
}
</style>