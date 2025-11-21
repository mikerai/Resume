// src/composables/useGoogleCalendar.js

import { ref, computed } from 'vue';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { useAuth } from './useAuth.js';

export function useGoogleCalendar() {
    // Estados reactivos
    const isAuthorized = ref(false);
    const accessToken = ref(null);
    const calendars = ref([]);
    const events = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    // Configuración
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
    const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

    // Verificar si las API keys están disponibles
    const hasCredentials = computed(() => !!(CLIENT_ID && API_KEY));

    // Composables
    const { user, profile } = useAuth();

    // Computadas
    const canManageCalendar = computed(() =>
        profile.value?.role === 'supplier' || profile.value?.role === 'admin'
    );

    /**
     * Inicializa Google Auth plugin
     */
    const initializeGoogleCalendar = async () => {
        try {
            console.log('📅 Inicializando Google Auth plugin...');

            // Inicializar el plugin
            await GoogleAuth.initialize({
                clientId: CLIENT_ID,
                scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
                grantOfflineAccess: true
            });

            console.log('✅ Google Auth plugin inicializado');
            return true;

        } catch (error) {
            console.error('💥 Error inicializando Google Auth:', error);
            error.value = error.message;
            return false;
        }
    };

    /**
     * Autoriza al usuario con Google Calendar
     */
    const authorizeUser = async () => {
        try {
            isLoading.value = true;
            console.log('🔐 Iniciando autorización de Google...');

            // 1. Verificar credenciales
            if (!hasCredentials.value) {
                const errorMsg = 'Credenciales de Google no configuradas';
                console.error('❌', errorMsg);
                error.value = errorMsg;
                return false;
            }

            // 2. Inicializar si no está inicializado
            await initializeGoogleCalendar();

            // 3. Solicitar autorización
            const result = await GoogleAuth.signIn();

            if (result && result.authentication) {
                accessToken.value = result.authentication.accessToken;
                isAuthorized.value = true;
                console.log('✅ Usuario autorizado exitosamente');
                console.log('👤 Usuario:', result.email);

                // Cargar calendarios
                await loadUserCalendars();

                return true;
            } else {
                throw new Error('No se recibió token de acceso');
            }

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            console.error('❌ Error autorizando usuario:', errorMsg);
            console.error('❌ Error completo:', error);
            error.value = `Error de autorización: ${errorMsg}`;
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
            await GoogleAuth.signOut();

            accessToken.value = null;
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
     * Hace una llamada a la API de Google Calendar
     */
    const callCalendarAPI = async (endpoint, options = {}) => {
        if (!accessToken.value) {
            throw new Error('No hay token de acceso. Por favor autoriza primero.');
        }

        const url = `${CALENDAR_API_BASE}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${accessToken.value}`,
            'Content-Type': 'application/json',
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        return await response.json();
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

            const data = await callCalendarAPI('/users/me/calendarList');
            const userCalendars = data.items || [];

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

            const params = new URLSearchParams({
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                showDeleted: 'false',
                singleEvents: 'true',
                maxResults: '250',
                orderBy: 'startTime'
            });

            const data = await callCalendarAPI(`/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
            const calendarEvents = data.items || [];

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
                allDay: !event.start.dateTime,
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
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 60 }
                    ]
                }
            };

            // Si es un evento de todo el día
            if (eventData.allDay) {
                event.start = { date: eventData.startDate };
                event.end = { date: eventData.endDate };
            }

            const calendarId = eventData.calendarId || 'primary';
            const data = await callCalendarAPI(`/calendars/${encodeURIComponent(calendarId)}/events`, {
                method: 'POST',
                body: JSON.stringify(event)
            });

            const createdEvent = {
                id: data.id,
                title: data.summary,
                description: data.description,
                startDateTime: data.start.dateTime || data.start.date,
                endDateTime: data.end.dateTime || data.end.date,
                location: data.location,
                htmlLink: data.htmlLink,
                status: data.status
            };

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

            const data = await callCalendarAPI(
                `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(event)
                }
            );

            const updatedEvent = {
                id: data.id,
                title: data.summary,
                description: data.description,
                startDateTime: data.start.dateTime || data.start.date,
                endDateTime: data.end.dateTime || data.end.date,
                location: data.location,
                htmlLink: data.htmlLink,
                status: data.status
            };

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
     */
    const deleteEvent = async (eventId, calendarId = 'primary') => {
        if (!isAuthorized.value) {
            throw new Error('Usuario no autorizado');
        }

        try {
            isLoading.value = true;
            console.log('🗑️ Eliminando evento:', eventId);

            await callCalendarAPI(
                `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
                { method: 'DELETE' }
            );

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
     * Sincroniza trabajos al calendario (función helper para Tab3Page)
     */
    const syncJobsToCalendar = async (jobs = []) => {
        if (!isAuthorized.value) {
            throw new Error('Usuario no autorizado');
        }

        try {
            isLoading.value = true;
            console.log(`🔄 Sincronizando ${jobs.length} trabajos al calendario...`);

            const results = [];
            for (const job of jobs) {
                try {
                    const eventData = {
                        title: job.title || job.description,
                        description: `Cliente: ${job.client_name || 'N/A'}\nDirección: ${job.address || 'N/A'}`,
                        location: job.address,
                        startDateTime: new Date(job.scheduled_date + 'T' + (job.scheduled_time || '09:00')).toISOString(),
                        endDateTime: new Date(new Date(job.scheduled_date + 'T' + (job.scheduled_time || '09:00')).getTime() + 2 * 60 * 60 * 1000).toISOString()
                    };

                    const created = await createEvent(eventData);
                    results.push({ job: job.id, event: created.id, success: true });
                    console.log(`✅ Trabajo ${job.id} sincronizado`);
                } catch (err) {
                    results.push({ job: job.id, success: false, error: err.message });
                    console.error(`❌ Error sincronizando trabajo ${job.id}:`, err);
                }
            }

            console.log(`✅ Sincronización completa: ${results.filter(r => r.success).length}/${jobs.length} exitosos`);
            return results;

        } catch (error) {
            console.error('❌ Error en sincronización:', error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Crea un evento de trabajo (alias para compatibilidad)
     */
    const createJobEvent = createEvent;

    return {
        // Estado
        isAuthorized,
        calendars,
        events,
        isLoading,
        error,
        canManageCalendar,
        hasCredentials,

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

        // Helpers
        syncJobsToCalendar,
        createJobEvent,

        // Inicialización
        initializeGoogleCalendar
    };
}
