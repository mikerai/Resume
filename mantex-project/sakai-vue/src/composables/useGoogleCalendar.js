// src/composables/useGoogleCalendar.js

import { ref, computed, onMounted } from 'vue';
import { useAuth } from './useAuth.js';

export function useGoogleCalendar() {
    // Estados reactivos
    const isGapiLoaded = ref(false);
    const isAuthorized = ref(false);
    const calendars = ref([]);
    const events = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    // Configuración OAuth
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Reutilizamos la misma key
    const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
    const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';

    // Composables
    const { user, profile } = useAuth();

    // Computadas
    const canManageCalendar = computed(() =>
        profile.value?.role === 'supplier' || profile.value?.role === 'admin'
    );

    const userCalendarId = computed(() =>
        user.value ? `mantex_${profile.value?.role}_${user.value.id}@mantex.mx` : null
    );

    /**
     * Inicializa Google Calendar API
     */
    const initializeGoogleCalendar = async () => {
        try {
            console.log('📅 Inicializando Google Calendar API...');

            // Cargar Google API Script
            await loadGoogleAPIScript();

            // Inicializar GAPI
            await window.gapi.load('client:auth2', initializeGapiClient);

            console.log('✅ Google Calendar API inicializado');
            return true;

        } catch (error) {
            console.error('💥 Error inicializando Calendar API:', error);
            error.value = error.message;
            return false;
        }
    };

    /**
     * Carga el script de Google API
     */
    const loadGoogleAPIScript = () => {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    /**
     * Inicializa el cliente GAPI
     */
    const initializeGapiClient = async () => {
        try {
            await window.gapi.client.init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                discoveryDocs: [DISCOVERY_DOC],
                scope: SCOPES
            });

            isGapiLoaded.value = true;

            // Verificar si el usuario ya está autorizado
            const authInstance = window.gapi.auth2.getAuthInstance();
            isAuthorized.value = authInstance.isSignedIn.get();

            // Listener para cambios de autorización
            authInstance.isSignedIn.listen(updateSigninStatus);

            console.log('✅ Cliente GAPI inicializado');

        } catch (error) {
            console.error('❌ Error inicializando cliente GAPI:', error);
            throw error;
        }
    };

    /**
     * Actualiza el estado de autorización
     */
    const updateSigninStatus = (isSignedIn) => {
        isAuthorized.value = isSignedIn;

        if (isSignedIn) {
            console.log('✅ Usuario autorizado en Google Calendar');
            loadUserCalendars();
        } else {
            console.log('❌ Usuario no autorizado');
            calendars.value = [];
            events.value = [];
        }
    };

    /**
     * Autoriza al usuario con Google Calendar
     */
    const authorizeUser = async () => {
        if (!isGapiLoaded.value) {
            throw new Error('Google API no está cargada');
        }

        try {
            isLoading.value = true;
            const authInstance = window.gapi.auth2.getAuthInstance();

            if (!authInstance.isSignedIn.get()) {
                await authInstance.signIn();
            }

            isAuthorized.value = true;
            console.log('✅ Usuario autorizado exitosamente');
            return true;

        } catch (error) {
            console.error('❌ Error autorizando usuario:', error);
            error.value = `Error de autorización: ${error.message}`;
            return false;
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Desautoriza al usuario
     */
    const signOut = async () => {
        try {
            const authInstance = window.gapi.auth2.getAuthInstance();
            await authInstance.signOut();

            isAuthorized.value = false;
            calendars.value = [];
            events.value = [];

            console.log('👋 Usuario desautorizado');
            return true;

        } catch (error) {
            console.error('❌ Error cerrando sesión:', error);
            return false;
        }
    };

    /**
     * Carga los calendarios del usuario
     */
    const loadUserCalendars = async () => {
        if (!isAuthorized.value) {
            console.warn('⚠️ Usuario no autorizado');
            return [];
        }

        try {
            isLoading.value = true;
            console.log('📋 Cargando calendarios del usuario...');

            const response = await window.gapi.client.calendar.calendarList.list();
            const userCalendars = response.result.items || [];

            calendars.value = userCalendars.map(calendar => ({
                id: calendar.id,
                name: calendar.summary,
                description: calendar.description || '',
                primary: calendar.primary || false,
                accessRole: calendar.accessRole,
                backgroundColor: calendar.backgroundColor,
                foregroundColor: calendar.foregroundColor
            }));

            console.log(`✅ ${calendars.value.length} calendarios cargados`);
            return calendars.value;

        } catch (error) {
            console.error('❌ Error cargando calendarios:', error);
            error.value = `Error cargando calendarios: ${error.message}`;
            return [];
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Obtiene eventos de un rango de fechas
     * @param {string} calendarId - ID del calendario (default: primary)
     * @param {Date} timeMin - Fecha mínima
     * @param {Date} timeMax - Fecha máxima
     */
    const getEvents = async (calendarId = 'primary', timeMin = new Date(), timeMax = null) => {
        if (!isAuthorized.value) {
            throw new Error('Usuario no autorizado');
        }

        try {
            isLoading.value = true;
            console.log('📅 Obteniendo eventos...', { calendarId, timeMin, timeMax });

            // Si no se especifica timeMax, usar 1 mes adelante
            if (!timeMax) {
                timeMax = new Date();
                timeMax.setMonth(timeMax.getMonth() + 1);
            }

            const response = await window.gapi.client.calendar.events.list({
                calendarId: calendarId,
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                showDeleted: false,
                singleEvents: true,
                maxResults: 250,
                orderBy: 'startTime'
            });

            const calendarEvents = response.result.items || [];

            events.value = calendarEvents.map(event => ({
                id: event.id,
                title: event.summary || 'Sin título',
                description: event.description || '',
                startDateTime: event.start.dateTime || event.start.date,
                endDateTime: event.end.dateTime || event.end.date,
                location: event.location || '',
                attendees: event.attendees || [],
                creator: event.creator,
                status: event.status,
                htmlLink: event.htmlLink,
                allDay: !event.start.dateTime, // Si no tiene hora, es todo el día
                recurrence: event.recurrence || null
            }));

            console.log(`✅ ${events.value.length} eventos obtenidos`);
            return events.value;

        } catch (error) {
            console.error('❌ Error obteniendo eventos:', error);
            error.value = `Error obteniendo eventos: ${error.message}`;
            return [];
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Crea un nuevo evento en el calendario
     * @param {Object} eventData - Datos del evento
     */
    const createEvent = async (eventData) => {
        if (!isAuthorized.value) {
            throw new Error('Usuario no autorizado');
        }

        try {
            isLoading.value = true;
            console.log('➕ Creando evento:', eventData);

            const event = {
                summary: eventData.title || eventData.summary,
                description: eventData.description || '',
                location: eventData.location || '',
                start: {
                    dateTime: eventData.startDateTime,
                    timeZone: eventData.timeZone || 'America/Mexico_City'
                },
                end: {
                    dateTime: eventData.endDateTime,
                    timeZone: eventData.timeZone || 'America/Mexico_City'
                },
                attendees: eventData.attendees || [],
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 }, // 1 día antes
                        { method: 'popup', minutes: 60 }       // 1 hora antes
                    ]
                }
            };

            // Si es un evento de todo el día
            if (eventData.allDay) {
                event.start = { date: eventData.startDate };
                event.end = { date: eventData.endDate };
            }

            const response = await window.gapi.client.calendar.events.insert({
                calendarId: eventData.calendarId || 'primary',
                resource: event
            });

            const createdEvent = {
                id: response.result.id,
                title: response.result.summary,
                description: response.result.description,
                startDateTime: response.result.start.dateTime || response.result.start.date,
                endDateTime: response.result.end.dateTime || response.result.end.date,
                location: response.result.location,
                htmlLink: response.result.htmlLink,
                status: response.result.status
            };

            // Actualizar eventos locales
            events.value.push(createdEvent);

            console.log('✅ Evento creado exitosamente:', createdEvent);
            return createdEvent;

        } catch (error) {
            console.error('❌ Error creando evento:', error);
            error.value = `Error creando evento: ${error.message}`;
            throw error;
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Actualiza un evento existente
     * @param {string} eventId - ID del evento
     * @param {Object} eventData - Datos actualizados
     * @param {string} calendarId - ID del calendario
     */
    const updateEvent = async (eventId, eventData, calendarId = 'primary') => {
        if (!isAuthorized.value) {
            throw new Error('Usuario no autorizado');
        }

        try {
            isLoading.value = true;
            console.log('📝 Actualizando evento:', eventId, eventData);

            const event = {
                summary: eventData.title || eventData.summary,
                description: eventData.description || '',
                location: eventData.location || '',
                start: {
                    dateTime: eventData.startDateTime,
                    timeZone: eventData.timeZone || 'America/Mexico_City'
                },
                end: {
                    dateTime: eventData.endDateTime,
                    timeZone: eventData.timeZone || 'America/Mexico_City'
                },
                attendees: eventData.attendees || []
            };

            const response = await window.gapi.client.calendar.events.update({
                calendarId: calendarId,
                eventId: eventId,
                resource: event
            });

            const updatedEvent = {
                id: response.result.id,
                title: response.result.summary,
                description: response.result.description,
                startDateTime: response.result.start.dateTime || response.result.start.date,
                endDateTime: response.result.end.dateTime || response.result.end.date,
                location: response.result.location,
                htmlLink: response.result.htmlLink,
                status: response.result.status
            };

            // Actualizar en eventos locales
            const eventIndex = events.value.findIndex(e => e.id === eventId);
            if (eventIndex !== -1) {
                events.value[eventIndex] = updatedEvent;
            }

            console.log('✅ Evento actualizado exitosamente');
            return updatedEvent;

        } catch (error) {
            console.error('❌ Error actualizando evento:', error);
            error.value = `Error actualizando evento: ${error.message}`;
            throw error;
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Elimina un evento
     * @param {string} eventId - ID del evento
     * @param {string} calendarId - ID del calendario
     */
    const deleteEvent = async (eventId, calendarId = 'primary') => {
        if (!isAuthorized.value) {
            throw new Error('Usuario no autorizado');
        }

        try {
            isLoading.value = true;
            console.log('🗑️ Eliminando evento:', eventId);

            await window.gapi.client.calendar.events.delete({
                calendarId: calendarId,
                eventId: eventId
            });

            // Remover de eventos locales
            events.value = events.value.filter(event => event.id !== eventId);

            console.log('✅ Evento eliminado exitosamente');
            return true;

        } catch (error) {
            console.error('❌ Error eliminando evento:', error);
            error.value = `Error eliminando evento: ${error.message}`;
            throw error;
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Verifica disponibilidad en un rango de tiempo
     * @param {Date} startTime - Tiempo de inicio
     * @param {Date} endTime - Tiempo de fin
     * @param {string} calendarId - ID del calendario
     */
    const checkAvailability = async (startTime, endTime, calendarId = 'primary') => {
        try {
            const response = await window.gapi.client.calendar.freebusy.query({
                resource: {
                    timeMin: startTime.toISOString(),
                    timeMax: endTime.toISOString(),
                    items: [{ id: calendarId }]
                }
            });

            const busy = response.result.calendars[calendarId]?.busy || [];
            const isAvailable = busy.length === 0;

            console.log('🕐 Disponibilidad verificada:', { isAvailable, busy });

            return {
                isAvailable,
                busyTimes: busy,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            };

        } catch (error) {
            console.error('❌ Error verificando disponibilidad:', error);
            throw error;
        }
    };

    /**
     * Obtiene slots disponibles para un día específico
     * @param {Date} date - Fecha a verificar
     * @param {number} duration - Duración en minutos
     * @param {Object} workingHours - Horario de trabajo
     */
    const getAvailableSlots = async (date, duration = 60, workingHours = { start: 9, end: 17 }) => {
        try {
            const dayStart = new Date(date);
            dayStart.setHours(workingHours.start, 0, 0, 0);

            const dayEnd = new Date(date);
            dayEnd.setHours(workingHours.end, 0, 0, 0);

            // Obtener eventos del día
            const dayEvents = await getEvents('primary', dayStart, dayEnd);

            const availableSlots = [];
            const slotDuration = duration * 60 * 1000; // Convertir a milisegundos

            // Generar slots cada hora
            for (let time = dayStart.getTime(); time < dayEnd.getTime(); time += slotDuration) {
                const slotStart = new Date(time);
                const slotEnd = new Date(time + slotDuration);

                // Verificar si el slot está disponible
                const isSlotAvailable = !dayEvents.some(event => {
                    const eventStart = new Date(event.startDateTime);
                    const eventEnd = new Date(event.endDateTime);

                    return (slotStart < eventEnd && slotEnd > eventStart);
                });

                if (isSlotAvailable) {
                    availableSlots.push({
                        startTime: slotStart,
                        endTime: slotEnd,
                        formatted: `${slotStart.toLocaleTimeString()} - ${slotEnd.toLocaleTimeString()}`
                    });
                }
            }

            console.log(`✅ ${availableSlots.length} slots disponibles encontrados`);
            return availableSlots;

        } catch (error) {
            console.error('❌ Error obteniendo slots:', error);
            return [];
        }
    };

    // Inicialización automática (opcional, no bloquea la app)
    onMounted(async () => {
        if (CLIENT_ID && API_KEY) {
            try {
                await initializeGoogleCalendar();
            } catch (err) {
                // Silently fail - Calendar is optional
                console.warn('Google Calendar no disponible:', err.message);
            }
        } else {
            console.warn('Credenciales de Google Calendar no configuradas');
        }
    });

    return {
        // Estado
        isGapiLoaded,
        isAuthorized,
        calendars,
        events,
        isLoading,
        error,
        canManageCalendar,

        // Autenticación
        authorizeUser,
        signOut,

        // Calendarios
        loadUserCalendars,

        // Eventos
        getEvents,
        createEvent,
        updateEvent,
        deleteEvent,

        // Disponibilidad
        checkAvailability,
        getAvailableSlots,

        // Inicialización
        initializeGoogleCalendar
    };
}