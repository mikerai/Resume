// src/composables/useGoogleIntegration.js
// 🎯 COMPOSABLE MAESTRO - ORQUESTA TODAS LAS GOOGLE APIS

import { ref, computed, onMounted, watch } from 'vue';
import { useGoogleMaps } from './useGoogleMaps.js';
import { useGoogleCalendar } from './useGoogleCalendar.js';
import { useGeolocation } from './useGeolocation.js';
import { useLocationTracking } from './useLocationTracking.js';
import { useFirebase } from './useFirebase.js';
import { useAuth } from './useAuth.js';

export function useGoogleIntegration() {
    // Estados reactivos principales
    const isFullyInitialized = ref(false);
    const initializationProgress = ref(0);
    const activeFeatures = ref([]);
    const error = ref(null);

    // Composables especializados
    const maps = useGoogleMaps();
    const calendar = useGoogleCalendar();
    const geolocation = useGeolocation();
    const tracking = useLocationTracking();
    const firebase = useFirebase();
    const { user, profile } = useAuth();

    // Estados de servicios
    const servicesStatus = ref({
        maps: false,
        calendar: false,
        geolocation: false,
        tracking: false,
        firebase: false
    });

    // Computadas
    const isSupplier = computed(() => profile.value?.role === 'supplier');
    const isClient = computed(() => profile.value?.role === 'client');
    const isAdmin = computed(() => profile.value?.role === 'admin');

    const canUseTracking = computed(() =>
        isSupplier.value && servicesStatus.value.geolocation && servicesStatus.value.firebase
    );

    const canScheduleAppointments = computed(() =>
        servicesStatus.value.calendar && (isSupplier.value || isClient.value)
    );

    const canViewMaps = computed(() =>
        servicesStatus.value.maps && servicesStatus.value.firebase
    );

    /**
     * Inicializa toda la integración de Google APIs de forma coordinada
     */
    const initializeGoogleIntegration = async () => {
        try {
            console.log('🚀 Iniciando integración completa de Google APIs...');
            error.value = null;
            initializationProgress.value = 0;

            const services = [];

            // 1. Firebase primero (base para todo)
            services.push(
                initializeFirebaseService().then(() => {
                    servicesStatus.value.firebase = true;
                    initializationProgress.value += 20;
                })
            );

            // 2. Google Maps (esencial para tracking)
            services.push(
                initializeMapsService().then(() => {
                    servicesStatus.value.maps = true;
                    initializationProgress.value += 20;
                })
            );

            // 3. Geolocalización (necesaria para tracking)
            services.push(
                initializeGeolocationService().then(() => {
                    servicesStatus.value.geolocation = true;
                    initializationProgress.value += 20;
                })
            );

            // 4. Google Calendar (para scheduling)
            services.push(
                initializeCalendarService().then(() => {
                    servicesStatus.value.calendar = true;
                    initializationProgress.value += 20;
                })
            );

            // 5. Tracking (solo para suppliers)
            if (isSupplier.value) {
                services.push(
                    initializeTrackingService().then(() => {
                        servicesStatus.value.tracking = true;
                        initializationProgress.value += 20;
                    })
                );
            } else {
                initializationProgress.value += 20;
            }

            // Esperar a que todos los servicios se inicialicen
            await Promise.allSettled(services);

            // Configurar integraciones específicas por rol
            await setupRoleBasedIntegrations();

            isFullyInitialized.value = true;
            initializationProgress.value = 100;

            console.log('✅ Integración completa de Google APIs exitosa');
            logIntegrationStatus();

            return true;

        } catch (error) {
            console.error('💥 Error en integración completa:', error);
            error.value = error.message;
            return false;
        }
    };

    /**
     * Inicializa Firebase como base
     */
    const initializeFirebaseService = async () => {
        try {
            console.log('🔥 Inicializando Firebase...');
            const success = await firebase.initializeFirebase();

            if (success) {
                activeFeatures.value.push('firebase');
                console.log('✅ Firebase listo');
            }

            return success;
        } catch (error) {
            console.error('❌ Error Firebase:', error);
            return false;
        }
    };

    /**
     * Inicializa Google Maps
     */
    const initializeMapsService = async () => {
        try {
            console.log('🗺️ Inicializando Google Maps...');
            await maps.loadGoogleMapsScript();

            activeFeatures.value.push('maps');
            console.log('✅ Google Maps listo');
            return true;

        } catch (error) {
            console.error('❌ Error Google Maps:', error);
            return false;
        }
    };

    /**
     * Inicializa servicio de geolocalización
     */
    const initializeGeolocationService = async () => {
        try {
            console.log('📍 Inicializando Geolocalización...');

            if (geolocation.isSupported.value) {
                // Solicitar permisos de ubicación
                await geolocation.getCurrentPosition();
                activeFeatures.value.push('geolocation');
                console.log('✅ Geolocalización lista');
                return true;
            } else {
                console.warn('⚠️ Geolocalización no soportada');
                return false;
            }

        } catch (error) {
            console.warn('⚠️ Permisos de geolocalización denegados');
            return false;
        }
    };

    /**
     * Inicializa Google Calendar
     */
    const initializeCalendarService = async () => {
        try {
            console.log('📅 Inicializando Google Calendar...');
            const success = await calendar.initializeGoogleCalendar();

            if (success) {
                activeFeatures.value.push('calendar');
                console.log('✅ Google Calendar listo');
            }

            return success;

        } catch (error) {
            console.error('❌ Error Google Calendar:', error);
            return false;
        }
    };

    /**
     * Inicializa tracking para suppliers
     */
    const initializeTrackingService = async () => {
        try {
            if (!isSupplier.value) {
                console.log('ℹ️ Tracking no necesario - no es supplier');
                return true;
            }

            console.log('🎯 Inicializando Tracking...');
            await tracking.initializeFirebase();

            activeFeatures.value.push('tracking');
            console.log('✅ Tracking listo para supplier');
            return true;

        } catch (error) {
            console.error('❌ Error Tracking:', error);
            return false;
        }
    };

    /**
     * Configura integraciones específicas según el rol del usuario
     */
    const setupRoleBasedIntegrations = async () => {
        try {
            console.log(`👤 Configurando integraciones para rol: ${profile.value?.role}`);

            if (isSupplier.value) {
                await setupSupplierIntegrations();
            } else if (isClient.value) {
                await setupClientIntegrations();
            } else if (isAdmin.value) {
                await setupAdminIntegrations();
            }

            console.log('✅ Integraciones por rol configuradas');

        } catch (error) {
            console.error('❌ Error configurando integraciones por rol:', error);
        }
    };

    /**
     * Configuraciones específicas para SUPPLIERS
     */
    const setupSupplierIntegrations = async () => {
        console.log('🔧 Configurando funcionalidades de supplier...');

        // Auto-iniciar tracking si tiene permisos
        if (canUseTracking.value) {
            console.log('🎯 Auto-tracking disponible para supplier');
            // No iniciar automáticamente, esperar a que el supplier lo active
        }

        // Configurar sincronización de calendario
        if (servicesStatus.value.calendar) {
            // Suscribirse a cambios de disponibilidad
            setupCalendarSync();
        }

        // Configurar notificaciones de trabajos
        if (servicesStatus.value.firebase && user.value) {
            firebase.subscribeToRealTimeUpdates(
                `jobs/assigned/${user.value.id}`,
                handleNewJobAssignment
            );
        }
    };

    /**
     * Configuraciones específicas para CLIENTS
     */
    const setupClientIntegrations = async () => {
        console.log('👥 Configurando funcionalidades de client...');

        // Suscribirse a ubicaciones de suppliers para sus trabajos
        if (servicesStatus.value.firebase && user.value) {
            firebase.subscribeToRealTimeUpdates(
                `jobs/client/${user.value.id}`,
                handleJobStatusUpdates
            );
        }

        // Configurar notificaciones de updates de trabajos
        if (servicesStatus.value.firebase && user.value) {
            firebase.subscribeToRealTimeUpdates(
                `notifications/${user.value.id}`,
                handleClientNotifications
            );
        }
    };

    /**
     * Configuraciones específicas para ADMINS
     */
    const setupAdminIntegrations = async () => {
        console.log('👑 Configurando funcionalidades de admin...');

        // Suscribirse a todas las ubicaciones de suppliers
        if (servicesStatus.value.firebase) {
            firebase.subscribeToRealTimeUpdates(
                'locations',
                handleAllSupplierLocations
            );
        }

        // Suscribirse a métricas del sistema
        if (servicesStatus.value.firebase) {
            firebase.subscribeToRealTimeUpdates(
                'system/metrics',
                handleSystemMetrics
            );
        }
    };

    /**
     * Inicia tracking para suppliers
     */
    const startSupplierTracking = async () => {
        if (!canUseTracking.value) {
            throw new Error('Tracking no disponible para este usuario');
        }

        try {
            console.log('🎯 Iniciando tracking de supplier...');

            const success = await tracking.startSupplierTracking();

            if (success) {
                // Notificar a Firebase que el supplier está activo
                await firebase.sendRealTimeUpdate(
                    `suppliers/active/${user.value.id}`,
                    {
                        username: profile.value?.username || user.value.email.split('@')[0],
                        status: 'tracking_active',
                        startedAt: Date.now()
                    }
                );

                console.log('✅ Tracking de supplier iniciado');
            }

            return success;

        } catch (error) {
            console.error('❌ Error iniciando tracking:', error);
            throw error;
        }
    };

    /**
     * Detiene tracking para suppliers
     */
    const stopSupplierTracking = async () => {
        try {
            console.log('🛑 Deteniendo tracking de supplier...');

            const success = await tracking.stopSupplierTracking();

            if (success && user.value) {
                // Notificar a Firebase que el supplier está offline
                await firebase.sendRealTimeUpdate(
                    `suppliers/active/${user.value.id}`,
                    {
                        status: 'offline',
                        stoppedAt: Date.now()
                    }
                );

                console.log('✅ Tracking de supplier detenido');
            }

            return success;

        } catch (error) {
            console.error('❌ Error deteniendo tracking:', error);
            throw error;
        }
    };

    /**
     * Obtiene todos los suppliers activos con sus ubicaciones
     */
    const getActiveSuppliersWithLocations = async () => {
        if (!servicesStatus.value.firebase) {
            throw new Error('Firebase no inicializado');
        }

        try {
            console.log('📡 Obteniendo suppliers activos...');

            const suppliersData = await firebase.getDataOnce('locations');
            const activeSuppliers = [];

            if (suppliersData) {
                Object.entries(suppliersData).forEach(([supplierId, data]) => {
                    // Considerar activo si se actualizó en los últimos 5 minutos
                    const timeDiff = Date.now() - data.timestamp;
                    if (data.status === 'active' && timeDiff < 300000) { // 5 minutos
                        activeSuppliers.push({
                            id: supplierId,
                            ...data
                        });
                    }
                });
            }

            console.log(`✅ ${activeSuppliers.length} suppliers activos encontrados`);
            return activeSuppliers;

        } catch (error) {
            console.error('❌ Error obteniendo suppliers:', error);
            return [];
        }
    };

    /**
     * Crea una cita sincronizada entre Calendar y Firebase
     */
    const createAppointment = async (appointmentData) => {
        if (!canScheduleAppointments.value) {
            throw new Error('No se pueden crear citas para este usuario');
        }

        try {
            console.log('📅 Creando cita integrada...', appointmentData);

            // 1. Crear evento en Google Calendar
            const calendarEvent = await calendar.createEvent({
                title: `Mantex: ${appointmentData.title}`,
                description: appointmentData.description,
                startDateTime: appointmentData.startDateTime,
                endDateTime: appointmentData.endDateTime,
                location: appointmentData.location,
                attendees: appointmentData.attendees || []
            });

            // 2. Guardar en Firebase para sync tiempo real
            const firebaseData = {
                calendarEventId: calendarEvent.id,
                title: appointmentData.title,
                description: appointmentData.description,
                startDateTime: appointmentData.startDateTime,
                endDateTime: appointmentData.endDateTime,
                location: appointmentData.location,
                clientId: appointmentData.clientId,
                supplierId: appointmentData.supplierId,
                status: 'scheduled',
                createdAt: Date.now(),
                createdBy: user.value.id
            };

            await firebase.sendRealTimeUpdate(
                `appointments/${calendarEvent.id}`,
                firebaseData
            );

            // 3. Notificar a ambas partes
            if (appointmentData.clientId && appointmentData.supplierId) {
                const notifications = [
                    {
                        userId: appointmentData.clientId,
                        title: 'Nueva cita agendada',
                        body: `Cita para: ${appointmentData.title}`,
                        data: { appointmentId: calendarEvent.id, type: 'appointment' }
                    },
                    {
                        userId: appointmentData.supplierId,
                        title: 'Nueva cita asignada',
                        body: `Trabajo asignado: ${appointmentData.title}`,
                        data: { appointmentId: calendarEvent.id, type: 'appointment' }
                    }
                ];

                await Promise.all(
                    notifications.map(notification =>
                        firebase.sendPushNotification(notification.userId, notification)
                    )
                );
            }

            console.log('✅ Cita integrada creada exitosamente');

            return {
                calendarEvent,
                firebaseData,
                id: calendarEvent.id
            };

        } catch (error) {
            console.error('❌ Error creando cita integrada:', error);
            throw error;
        }
    };

    /**
     * Handlers para eventos en tiempo real
     */
    const handleNewJobAssignment = (jobData) => {
        console.log('🔔 Nuevo trabajo asignado:', jobData);

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Nuevo trabajo asignado', {
                body: jobData.title || 'Se te ha asignado un nuevo trabajo',
                icon: '/favicon.ico'
            });
        }
    };

    const handleJobStatusUpdates = (jobUpdates) => {
        console.log('📱 Actualizaciones de trabajos:', jobUpdates);
        // Aquí se actualizaría la UI con los cambios de estado
    };

    const handleClientNotifications = (notifications) => {
        console.log('🔔 Notificaciones de cliente:', notifications);
        // Mostrar notificaciones en la UI
    };

    const handleAllSupplierLocations = (locations) => {
        console.log('🗺️ Ubicaciones de suppliers:', locations);
        // Actualizar dashboard de admin con ubicaciones
    };

    const handleSystemMetrics = (metrics) => {
        console.log('📊 Métricas del sistema:', metrics);
        // Actualizar dashboard de admin con métricas
    };

    const setupCalendarSync = () => {
        console.log('🔄 Configurando sincronización de calendario');
        // Configurar sincronización bidireccional con Google Calendar
    };

    /**
     * Obtiene el estado completo de la integración
     */
    const getIntegrationStatus = () => {
        return {
            isFullyInitialized: isFullyInitialized.value,
            progress: initializationProgress.value,
            services: { ...servicesStatus.value },
            activeFeatures: [...activeFeatures.value],
            userRole: profile.value?.role,
            canUseTracking: canUseTracking.value,
            canScheduleAppointments: canScheduleAppointments.value,
            canViewMaps: canViewMaps.value,
            error: error.value
        };
    };

    const logIntegrationStatus = () => {
        const status = getIntegrationStatus();
        console.log('📊 Estado de integración Google APIs:', status);
    };

    // Watchers para cambios de usuario/rol
    watch(() => profile.value?.role, (newRole, oldRole) => {
        if (newRole !== oldRole && isFullyInitialized.value) {
            console.log(`🔄 Rol cambiado: ${oldRole} → ${newRole}, reconfigurando...`);
            setupRoleBasedIntegrations();
        }
    });

    // Inicialización automática cuando el usuario está autenticado
    watch(() => user.value, (newUser) => {
        if (newUser && !isFullyInitialized.value) {
            console.log('👤 Usuario autenticado, iniciando integración...');
            initializeGoogleIntegration();
        }
    });

    return {
        // Estado principal
        isFullyInitialized,
        initializationProgress,
        activeFeatures,
        error,
        servicesStatus,

        // Capacidades por rol
        canUseTracking,
        canScheduleAppointments,
        canViewMaps,

        // Inicialización
        initializeGoogleIntegration,

        // Tracking (Suppliers)
        startSupplierTracking,
        stopSupplierTracking,

        // Ubicaciones (Clients/Admins)
        getActiveSuppliersWithLocations,

        // Citas (Suppliers/Clients)
        createAppointment,

        // Composables individuales (acceso directo)
        maps,
        calendar,
        geolocation,
        tracking,
        firebase,

        // Utilidades
        getIntegrationStatus,
        logIntegrationStatus
    };
}