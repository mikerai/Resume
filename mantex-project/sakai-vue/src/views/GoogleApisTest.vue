<template>
    <div class="google-apis-test">
        <div class="test-header">
            <h1>
                <i class="pi pi-google" />
                Google APIs Testing
            </h1>
            <p>Prueba completa de todas las integraciones de Google APIs</p>
        </div>

        <!-- Estado de inicialización -->
        <div class="integration-status">
            <h3>Estado de Integración</h3>
            <div class="status-grid">
                <div
                    v-for="(status, service) in servicesStatus"
                    :key="service"
                    class="status-card"
                    :class="{ active: status }"
                >
                    <div class="status-icon">
                        <i :class="getServiceIcon(service)" />
                    </div>
                    <div class="status-info">
                        <h4>{{ getServiceName(service) }}</h4>
                        <Badge
                            :value="status ? 'Conectado' : 'Desconectado'"
                            :severity="status ? 'success' : 'danger'"
                        />
                    </div>
                </div>
            </div>

            <!-- Progress bar -->
            <div class="initialization-progress">
                <ProgressBar
                    :value="initializationProgress"
                    :showValue="true"
                />
                <p>Progreso de inicialización: {{ initializationProgress }}%</p>
            </div>
        </div>

        <!-- Error display -->
        <Message
            v-if="integrationError"
            severity="error"
            :closable="false"
            class="integration-error"
        >
            <strong>Error de integración:</strong> {{ integrationError }}
        </Message>

        <!-- Test sections -->
        <TabView v-if="isFullyInitialized" class="test-tabs">
            <!-- Maps Testing -->
            <TabPanel header="🗺️ Maps">
                <div class="test-section">
                    <h3>Google Maps API</h3>

                    <!-- Mapa en tiempo real -->
                    <RealTimeMap
                        :showInfo="true"
                        :autoCenter="true"
                        @supplierSelected="handleSupplierSelected"
                        @trackingStarted="handleTrackingStarted"
                        @trackingStopped="handleTrackingStopped"
                    />

                    <!-- Controles de testing -->
                    <div class="test-controls">
                        <h4>Controles de Testing</h4>
                        <div class="control-group">
                            <Button
                                @click="testGetCurrentLocation"
                                :loading="testingLocation"
                                icon="pi pi-map-marker"
                                label="Test Geolocalización"
                            />

                            <Button
                                @click="testSearchPlaces"
                                :loading="testingPlaces"
                                icon="pi pi-search"
                                label="Test Búsqueda Lugares"
                            />

                            <Button
                                @click="testCalculateRoute"
                                :loading="testingRoute"
                                icon="pi pi-directions"
                                label="Test Calcular Ruta"
                            />
                        </div>

                        <!-- Resultados de testing -->
                        <div v-if="testResults.maps" class="test-results">
                            <h5>Resultados:</h5>
                            <pre>{{ JSON.stringify(testResults.maps, null, 2) }}</pre>
                        </div>
                    </div>
                </div>
            </TabPanel>

            <!-- Calendar Testing -->
            <TabPanel header="📅 Calendar">
                <div class="test-section">
                    <h3>Google Calendar API</h3>

                    <!-- Estado de autorización -->
                    <div class="auth-status">
                        <h4>Estado de Autorización</h4>
                        <div class="auth-info">
                            <Badge
                                :value="isCalendarAuthorized ? 'Autorizado' : 'No Autorizado'"
                                :severity="isCalendarAuthorized ? 'success' : 'warning'"
                            />
                            <Button
                                v-if="!isCalendarAuthorized"
                                @click="authorizeCalendar"
                                :loading="authorizingCalendar"
                                icon="pi pi-google"
                                label="Autorizar Google Calendar"
                                class="p-button-outlined"
                            />
                            <Button
                                v-else
                                @click="signOutCalendar"
                                icon="pi pi-sign-out"
                                label="Cerrar Sesión"
                                class="p-button-outlined p-button-secondary"
                            />
                        </div>
                    </div>

                    <!-- Controles de calendar testing -->
                    <div v-if="isCalendarAuthorized" class="test-controls">
                        <h4>Testing de Calendar</h4>
                        <div class="control-group">
                            <Button
                                @click="testLoadCalendars"
                                :loading="testingCalendars"
                                icon="pi pi-calendar"
                                label="Cargar Calendarios"
                            />

                            <Button
                                @click="testGetEvents"
                                :loading="testingEvents"
                                icon="pi pi-list"
                                label="Obtener Eventos"
                            />

                            <Button
                                @click="testCreateEvent"
                                :loading="testingCreateEvent"
                                icon="pi pi-plus"
                                label="Crear Evento Test"
                            />

                            <Button
                                @click="testCheckAvailability"
                                :loading="testingAvailability"
                                icon="pi pi-clock"
                                label="Verificar Disponibilidad"
                            />
                        </div>

                        <!-- Resultados de calendar testing -->
                        <div v-if="testResults.calendar" class="test-results">
                            <h5>Resultados:</h5>
                            <pre>{{ JSON.stringify(testResults.calendar, null, 2) }}</pre>
                        </div>
                    </div>
                </div>
            </TabPanel>

            <!-- Firebase Testing -->
            <TabPanel header="🔥 Firebase">
                <div class="test-section">
                    <h3>Firebase Realtime Database & FCM</h3>

                    <!-- Estado de conexión -->
                    <div class="firebase-status">
                        <h4>Estado de Firebase</h4>
                        <Badge
                            :value="isFirebaseInitialized ? 'Conectado' : 'Desconectado'"
                            :severity="isFirebaseInitialized ? 'success' : 'danger'"
                        />
                    </div>

                    <!-- Controles de firebase testing -->
                    <div v-if="isFirebaseInitialized" class="test-controls">
                        <h4>Testing de Firebase</h4>
                        <div class="control-group">
                            <Button
                                @click="testFirebaseSendData"
                                :loading="testingFirebaseSend"
                                icon="pi pi-send"
                                label="Enviar Datos Test"
                            />

                            <Button
                                @click="testFirebaseRetrieveData"
                                :loading="testingFirebaseRetrieve"
                                icon="pi pi-download"
                                label="Obtener Datos Test"
                            />

                            <Button
                                @click="testPushNotification"
                                :loading="testingNotification"
                                icon="pi pi-bell"
                                label="Test Notificación"
                            />
                        </div>

                        <!-- Real-time data display -->
                        <div class="realtime-data">
                            <h5>Datos en Tiempo Real:</h5>
                            <div class="data-display">
                                <pre>{{ JSON.stringify(realtimeData, null, 2) }}</pre>
                            </div>
                        </div>

                        <!-- Resultados de firebase testing -->
                        <div v-if="testResults.firebase" class="test-results">
                            <h5>Resultados de Testing:</h5>
                            <pre>{{ JSON.stringify(testResults.firebase, null, 2) }}</pre>
                        </div>
                    </div>
                </div>
            </TabPanel>

            <!-- Integration Testing -->
            <TabPanel header="🎯 Integración">
                <div class="test-section">
                    <h3>Testing de Integración Completa</h3>
                    <p>Pruebas que combinan múltiples APIs</p>

                    <div class="integration-tests">
                        <div class="test-controls">
                            <h4>Scenarios de Testing</h4>
                            <div class="control-group">
                                <Button
                                    @click="testSupplierWorkflow"
                                    :loading="testingSupplierFlow"
                                    icon="pi pi-user"
                                    label="Test Flujo Supplier"
                                />

                                <Button
                                    @click="testClientWorkflow"
                                    :loading="testingClientFlow"
                                    icon="pi pi-users"
                                    label="Test Flujo Client"
                                />

                                <Button
                                    @click="testAppointmentCreation"
                                    :loading="testingAppointment"
                                    icon="pi pi-calendar-plus"
                                    label="Test Crear Cita Integrada"
                                />
                            </div>

                            <!-- Resultados de integration testing -->
                            <div v-if="testResults.integration" class="test-results">
                                <h5>Resultados de Integración:</h5>
                                <pre>{{ JSON.stringify(testResults.integration, null, 2) }}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            </TabPanel>
        </TabView>

        <!-- Loading state -->
        <div v-else class="loading-state">
            <ProgressSpinner size="large" />
            <h3>Inicializando Google APIs...</h3>
            <p>{{ loadingMessage }}</p>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useGoogleIntegration } from '@/composables/useGoogleIntegration.js';
import { useAuth } from '@/composables/useAuth.js';
import { useToast } from 'primevue/usetoast';
import RealTimeMap from '@/components/maps/RealTimeMap.vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Button from 'primevue/button';
import Badge from 'primevue/badge';
import ProgressBar from 'primevue/progressbar';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message';

// Composables
const googleIntegration = useGoogleIntegration();
const { user, profile } = useAuth();
const toast = useToast();

// Estados reactivos
const testResults = ref({
    maps: null,
    calendar: null,
    firebase: null,
    integration: null
});

const realtimeData = ref({});
const loadingMessage = ref('Cargando...');

// Testing states
const testingLocation = ref(false);
const testingPlaces = ref(false);
const testingRoute = ref(false);
const authorizingCalendar = ref(false);
const testingCalendars = ref(false);
const testingEvents = ref(false);
const testingCreateEvent = ref(false);
const testingAvailability = ref(false);
const testingFirebaseSend = ref(false);
const testingFirebaseRetrieve = ref(false);
const testingNotification = ref(false);
const testingSupplierFlow = ref(false);
const testingClientFlow = ref(false);
const testingAppointment = ref(false);

// Computed properties
const isFullyInitialized = computed(() => googleIntegration.isFullyInitialized.value);
const initializationProgress = computed(() => googleIntegration.initializationProgress.value);
const servicesStatus = computed(() => googleIntegration.servicesStatus.value);
const integrationError = computed(() => googleIntegration.error.value);

const isCalendarAuthorized = computed(() => googleIntegration.calendar.isAuthorized.value);
const isFirebaseInitialized = computed(() => googleIntegration.firebase.isFirebaseInitialized.value);

/**
 * Obtiene el ícono para cada servicio
 */
const getServiceIcon = (service) => {
    const icons = {
        maps: 'pi pi-map',
        calendar: 'pi pi-calendar',
        geolocation: 'pi pi-map-marker',
        tracking: 'pi pi-compass',
        firebase: 'pi pi-cloud'
    };
    return icons[service] || 'pi pi-circle';
};

/**
 * Obtiene el nombre para cada servicio
 */
const getServiceName = (service) => {
    const names = {
        maps: 'Google Maps',
        calendar: 'Google Calendar',
        geolocation: 'Geolocalización',
        tracking: 'Location Tracking',
        firebase: 'Firebase'
    };
    return names[service] || service;
};

// ==============================================
// MAPS TESTING FUNCTIONS
// ==============================================

/**
 * Test geolocalización
 */
const testGetCurrentLocation = async () => {
    testingLocation.value = true;
    try {
        const location = await googleIntegration.geolocation.getCurrentPosition();
        testResults.value.maps = {
            test: 'getCurrentLocation',
            success: true,
            location: location,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'success',
            summary: 'Test Geolocalización',
            detail: `Ubicación obtenida: ${location.coords.lat.toFixed(6)}, ${location.coords.lng.toFixed(6)}`,
            life: 3000
        });

    } catch (error) {
        testResults.value.maps = {
            test: 'getCurrentLocation',
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'error',
            summary: 'Error Test Geolocalización',
            detail: error.message,
            life: 5000
        });
    } finally {
        testingLocation.value = false;
    }
};

/**
 * Test búsqueda de lugares
 */
const testSearchPlaces = async () => {
    testingPlaces.value = true;
    try {
        const places = await googleIntegration.maps.searchPlaces('restaurante', null);
        testResults.value.maps = {
            test: 'searchPlaces',
            success: true,
            places: places.slice(0, 5), // Solo los primeros 5
            total: places.length,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'success',
            summary: 'Test Búsqueda Lugares',
            detail: `${places.length} lugares encontrados`,
            life: 3000
        });

    } catch (error) {
        testResults.value.maps = {
            test: 'searchPlaces',
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'error',
            summary: 'Error Test Búsqueda',
            detail: error.message,
            life: 5000
        });
    } finally {
        testingPlaces.value = false;
    }
};

/**
 * Test cálculo de ruta
 */
const testCalculateRoute = async () => {
    testingRoute.value = true;
    try {
        // Usar ubicaciones de ejemplo (Ciudad de México)
        const origin = { lat: 19.4326, lng: -99.1332 }; // Centro CDMX
        const destination = { lat: 19.4285, lng: -99.1277 }; // Cerca del Zócalo

        const route = await googleIntegration.maps.calculateRoute(origin, destination);
        testResults.value.maps = {
            test: 'calculateRoute',
            success: true,
            route: route,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'success',
            summary: 'Test Calcular Ruta',
            detail: `Ruta: ${route.distance}, ${route.duration}`,
            life: 3000
        });

    } catch (error) {
        testResults.value.maps = {
            test: 'calculateRoute',
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'error',
            summary: 'Error Test Ruta',
            detail: error.message,
            life: 5000
        });
    } finally {
        testingRoute.value = false;
    }
};

// ==============================================
// CALENDAR TESTING FUNCTIONS
// ==============================================

/**
 * Autorizar Google Calendar
 */
const authorizeCalendar = async () => {
    authorizingCalendar.value = true;
    try {
        const success = await googleIntegration.calendar.authorizeUser();
        if (success) {
            toast.add({
                severity: 'success',
                summary: 'Autorización Exitosa',
                detail: 'Google Calendar autorizado correctamente',
                life: 3000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error de Autorización',
            detail: error.message,
            life: 5000
        });
    } finally {
        authorizingCalendar.value = false;
    }
};

/**
 * Cerrar sesión de Google Calendar
 */
const signOutCalendar = async () => {
    try {
        await googleIntegration.calendar.signOut();
        toast.add({
            severity: 'info',
            summary: 'Sesión Cerrada',
            detail: 'Se cerró la sesión de Google Calendar',
            life: 3000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message,
            life: 5000
        });
    }
};

/**
 * Test cargar calendarios
 */
const testLoadCalendars = async () => {
    testingCalendars.value = true;
    try {
        const calendars = await googleIntegration.calendar.loadUserCalendars();
        testResults.value.calendar = {
            test: 'loadCalendars',
            success: true,
            calendars: calendars,
            total: calendars.length,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'success',
            summary: 'Calendarios Cargados',
            detail: `${calendars.length} calendarios encontrados`,
            life: 3000
        });

    } catch (error) {
        testResults.value.calendar = {
            test: 'loadCalendars',
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'error',
            summary: 'Error Cargando Calendarios',
            detail: error.message,
            life: 5000
        });
    } finally {
        testingCalendars.value = false;
    }
};

/**
 * Test obtener eventos
 */
const testGetEvents = async () => {
    testingEvents.value = true;
    try {
        const events = await googleIntegration.calendar.getEvents();
        testResults.value.calendar = {
            test: 'getEvents',
            success: true,
            events: events.slice(0, 10), // Solo los primeros 10
            total: events.length,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'success',
            summary: 'Eventos Obtenidos',
            detail: `${events.length} eventos encontrados`,
            life: 3000
        });

    } catch (error) {
        testResults.value.calendar = {
            test: 'getEvents',
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'error',
            summary: 'Error Obteniendo Eventos',
            detail: error.message,
            life: 5000
        });
    } finally {
        testingEvents.value = false;
    }
};

/**
 * Test crear evento
 */
const testCreateEvent = async () => {
    testingCreateEvent.value = true;
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);

        const endTime = new Date(tomorrow);
        endTime.setHours(11, 0, 0, 0);

        const event = await googleIntegration.calendar.createEvent({
            title: 'Test Mantex - Evento de Prueba',
            description: 'Evento creado desde el sistema de testing de Mantex',
            startDateTime: tomorrow.toISOString(),
            endDateTime: endTime.toISOString(),
            location: 'Ciudad de México'
        });

        testResults.value.calendar = {
            test: 'createEvent',
            success: true,
            event: event,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'success',
            summary: 'Evento Creado',
            detail: 'Evento de prueba creado exitosamente',
            life: 3000
        });

    } catch (error) {
        testResults.value.calendar = {
            test: 'createEvent',
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'error',
            summary: 'Error Creando Evento',
            detail: error.message,
            life: 5000
        });
    } finally {
        testingCreateEvent.value = false;
    }
};

/**
 * Test verificar disponibilidad
 */
const testCheckAvailability = async () => {
    testingAvailability.value = true;
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(14, 0, 0, 0);

        const endTime = new Date(tomorrow);
        endTime.setHours(15, 0, 0, 0);

        const availability = await googleIntegration.calendar.checkAvailability(tomorrow, endTime);
        testResults.value.calendar = {
            test: 'checkAvailability',
            success: true,
            availability: availability,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'success',
            summary: 'Disponibilidad Verificada',
            detail: availability.isAvailable ? 'Horario disponible' : 'Horario ocupado',
            life: 3000
        });

    } catch (error) {
        testResults.value.calendar = {
            test: 'checkAvailability',
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'error',
            summary: 'Error Verificando Disponibilidad',
            detail: error.message,
            life: 5000
        });
    } finally {
        testingAvailability.value = false;
    }
};

// ==============================================
// FIREBASE TESTING FUNCTIONS
// ==============================================

/**
 * Test enviar datos a Firebase
 */
const testFirebaseSendData = async () => {
    testingFirebaseSend.value = true;
    try {
        const testData = {
            userId: user.value?.id || 'test-user',
            message: 'Test data from Mantex testing',
            timestamp: Date.now(),
            location: { lat: 19.4326, lng: -99.1332 }
        };

        await googleIntegration.firebase.sendRealTimeUpdate('test/data', testData);
        testResults.value.firebase = {
            test: 'sendRealTimeUpdate',
            success: true,
            data: testData,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'success',
            summary: 'Datos Enviados',
            detail: 'Datos enviados a Firebase exitosamente',
            life: 3000
        });

    } catch (error) {
        testResults.value.firebase = {
            test: 'sendRealTimeUpdate',
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'error',
            summary: 'Error Enviando Datos',
            detail: error.message,
            life: 5000
        });
    } finally {
        testingFirebaseSend.value = false;
    }
};

/**
 * Test obtener datos de Firebase
 */
const testFirebaseRetrieveData = async () => {
    testingFirebaseRetrieve.value = true;
    try {
        const data = await googleIntegration.firebase.getDataOnce('test/data');
        testResults.value.firebase = {
            test: 'getDataOnce',
            success: true,
            data: data,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'success',
            summary: 'Datos Obtenidos',
            detail: 'Datos obtenidos de Firebase exitosamente',
            life: 3000
        });

    } catch (error) {
        testResults.value.firebase = {
            test: 'getDataOnce',
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'error',
            summary: 'Error Obteniendo Datos',
            detail: error.message,
            life: 5000
        });
    } finally {
        testingFirebaseRetrieve.value = false;
    }
};

/**
 * Test notificación push
 */
const testPushNotification = async () => {
    testingNotification.value = true;
    try {
        if (!user.value) {
            throw new Error('Usuario no autenticado');
        }

        await googleIntegration.firebase.sendPushNotification(user.value.id, {
            title: 'Test Mantex Notification',
            body: 'Esta es una notificación de prueba desde el sistema Mantex',
            icon: '/favicon.ico',
            data: { type: 'test', timestamp: Date.now() }
        });

        testResults.value.firebase = {
            test: 'sendPushNotification',
            success: true,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'success',
            summary: 'Notificación Enviada',
            detail: 'Notificación push enviada exitosamente',
            life: 3000
        });

    } catch (error) {
        testResults.value.firebase = {
            test: 'sendPushNotification',
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'error',
            summary: 'Error Enviando Notificación',
            detail: error.message,
            life: 5000
        });
    } finally {
        testingNotification.value = false;
    }
};

// ==============================================
// INTEGRATION TESTING FUNCTIONS
// ==============================================

/**
 * Test flujo completo de supplier
 */
const testSupplierWorkflow = async () => {
    testingSupplierFlow.value = true;
    try {
        const results = {};

        // 1. Iniciar tracking
        if (googleIntegration.canUseTracking.value) {
            const trackingStarted = await googleIntegration.startSupplierTracking();
            results.tracking = { started: trackingStarted };
        }

        // 2. Obtener ubicación actual
        const location = await googleIntegration.geolocation.getCurrentPosition();
        results.location = location;

        // 3. Simular actualización en Firebase
        if (googleIntegration.firebase.isFirebaseInitialized.value) {
            await googleIntegration.firebase.sendRealTimeUpdate(
                `locations/${user.value?.id || 'test'}`,
                {
                    lat: location.coords.lat,
                    lng: location.coords.lng,
                    timestamp: Date.now(),
                    status: 'active',
                    username: profile.value?.username || 'test-supplier'
                }
            );
            results.firebase = { updated: true };
        }

        testResults.value.integration = {
            test: 'supplierWorkflow',
            success: true,
            results: results,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'success',
            summary: 'Flujo Supplier Completado',
            detail: 'Tracking y sincronización funcionando correctamente',
            life: 3000
        });

    } catch (error) {
        testResults.value.integration = {
            test: 'supplierWorkflow',
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'error',
            summary: 'Error en Flujo Supplier',
            detail: error.message,
            life: 5000
        });
    } finally {
        testingSupplierFlow.value = false;
    }
};

/**
 * Test flujo completo de client
 */
const testClientWorkflow = async () => {
    testingClientFlow.value = true;
    try {
        const results = {};

        // 1. Obtener suppliers activos
        const suppliers = await googleIntegration.getActiveSuppliersWithLocations();
        results.activeSuppliers = suppliers;

        // 2. Test notificaciones
        if (googleIntegration.firebase.isFirebaseInitialized.value) {
            const notifications = await googleIntegration.firebase.getUnreadNotifications();
            results.notifications = notifications;
        }

        testResults.value.integration = {
            test: 'clientWorkflow',
            success: true,
            results: results,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'success',
            summary: 'Flujo Client Completado',
            detail: `${suppliers.length} suppliers encontrados`,
            life: 3000
        });

    } catch (error) {
        testResults.value.integration = {
            test: 'clientWorkflow',
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'error',
            summary: 'Error en Flujo Client',
            detail: error.message,
            life: 5000
        });
    } finally {
        testingClientFlow.value = false;
    }
};

/**
 * Test crear cita integrada (Calendar + Firebase)
 */
const testAppointmentCreation = async () => {
    testingAppointment.value = true;
    try {
        if (!isCalendarAuthorized.value) {
            throw new Error('Google Calendar no autorizado');
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(15, 0, 0, 0);

        const endTime = new Date(tomorrow);
        endTime.setHours(16, 0, 0, 0);

        const appointment = await googleIntegration.createAppointment({
            title: 'Servicio Mantex - Testing Integrado',
            description: 'Cita de prueba creada desde el sistema de testing',
            startDateTime: tomorrow.toISOString(),
            endDateTime: endTime.toISOString(),
            location: 'Ciudad de México',
            clientId: user.value?.id || 'test-client',
            supplierId: 'test-supplier',
            attendees: []
        });

        testResults.value.integration = {
            test: 'appointmentCreation',
            success: true,
            appointment: appointment,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'success',
            summary: 'Cita Integrada Creada',
            detail: 'Cita creada en Calendar y sincronizada con Firebase',
            life: 3000
        });

    } catch (error) {
        testResults.value.integration = {
            test: 'appointmentCreation',
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };

        toast.add({
            severity: 'error',
            summary: 'Error Creando Cita',
            detail: error.message,
            life: 5000
        });
    } finally {
        testingAppointment.value = false;
    }
};

// Event handlers
const handleSupplierSelected = (supplier) => {
    console.log('Supplier seleccionado:', supplier);
    toast.add({
        severity: 'info',
        summary: 'Supplier Seleccionado',
        detail: `${supplier.username} - ${supplier.status}`,
        life: 2000
    });
};

const handleTrackingStarted = () => {
    console.log('Tracking iniciado');
};

const handleTrackingStopped = () => {
    console.log('Tracking detenido');
};

// Lifecycle
onMounted(async () => {
    loadingMessage.value = 'Inicializando Google APIs...';

    // Suscribirse a datos en tiempo real para testing
    if (googleIntegration.firebase.isFirebaseInitialized.value) {
        googleIntegration.firebase.subscribeToRealTimeUpdates('test/realtime', (data) => {
            realtimeData.value = data || {};
        });
    }
});
</script>

<style scoped>
.google-apis-test {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.test-header {
    text-align: center;
    margin-bottom: 3rem;
}

.test-header h1 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    font-size: 2.5rem;
    color: #333;
    margin-bottom: 0.5rem;
}

.test-header i {
    color: #4285F4;
}

.integration-status {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.status-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    transition: all 0.3s ease;
}

.status-card.active {
    border-color: #4CAF50;
    background: #f8fff8;
}

.status-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f5f5f5;
}

.status-card.active .status-icon {
    background: #4CAF50;
    color: white;
}

.status-info h4 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
}

.initialization-progress {
    margin-top: 1rem;
}

.initialization-progress p {
    text-align: center;
    margin-top: 0.5rem;
    color: #666;
}

.integration-error {
    margin-bottom: 2rem;
}

.test-tabs {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-section {
    padding: 2rem;
}

.test-section h3 {
    margin-bottom: 1.5rem;
    color: #333;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 0.5rem;
}

.auth-status,
.firebase-status {
    background: #f9f9f9;
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 2rem;
}

.auth-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 0.5rem;
}

.test-controls {
    margin: 2rem 0;
}

.test-controls h4,
.test-controls h5 {
    margin-bottom: 1rem;
    color: #555;
}

.control-group {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.test-results {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    margin-top: 1rem;
}

.test-results pre {
    background: #fff;
    padding: 1rem;
    border-radius: 4px;
    max-height: 300px;
    overflow: auto;
    font-size: 0.8rem;
    white-space: pre-wrap;
}

.realtime-data {
    margin: 1rem 0;
}

.data-display {
    background: #f0f8ff;
    border: 1px solid #b3d9ff;
    border-radius: 4px;
    padding: 1rem;
    max-height: 200px;
    overflow: auto;
}

.data-display pre {
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    font-size: 0.85rem;
}

.integration-tests {
    margin-top: 1rem;
}

.loading-state {
    text-align: center;
    padding: 4rem 2rem;
}

.loading-state h3 {
    margin: 1rem 0;
    color: #666;
}

/* Responsive */
@media (max-width: 768px) {
    .google-apis-test {
        padding: 1rem;
    }

    .test-header h1 {
        font-size: 2rem;
    }

    .status-grid {
        grid-template-columns: 1fr;
    }

    .control-group {
        flex-direction: column;
    }

    .auth-info {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>