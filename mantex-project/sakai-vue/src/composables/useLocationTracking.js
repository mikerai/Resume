// src/composables/useLocationTracking.js

import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useGeolocation } from './useGeolocation.js';
import { useAuth } from './useAuth.js';

export function useLocationTracking() {
    // Estados reactivos
    const isTrackingActive = ref(false);
    const trackingInterval = ref(null);
    const lastKnownLocation = ref(null);
    const trackingHistory = ref([]);
    const activeSuppliers = ref(new Map());
    const trackingError = ref(null);

    // Composables
    const { startTracking, stopTracking, currentPosition, isSupported } = useGeolocation();
    const { user, profile } = useAuth();

    // Configuración
    const TRACKING_INTERVAL = 30000; // 30 segundos
    const MAX_HISTORY_POINTS = 50; // Últimas 50 ubicaciones
    const SIGNIFICANT_MOVE_THRESHOLD = 10; // 10 metros

    // Firebase Database Reference (se inicializa cuando esté disponible)
    let firebaseDb = null;

    // Computadas
    const isSupplier = computed(() => profile.value?.role === 'supplier');
    const canTrack = computed(() => isSupported.value && isSupplier.value);

    /**
     * Inicializa Firebase para tracking tiempo real
     * (Se configura cuando Firebase esté disponible)
     */
    const initializeFirebase = () => {
        // Placeholder para cuando Firebase esté configurado
        if (typeof window !== 'undefined' && window.firebase) {
            firebaseDb = window.firebase.database();
            console.log('🔥 Firebase inicializado para tracking');
        } else {
            console.warn('⚠️ Firebase no disponible - usando modo local');
        }
    };

    /**
     * Inicia el tracking de ubicación para suppliers
     */
    const startSupplierTracking = async () => {
        if (!canTrack.value) {
            trackingError.value = 'No autorizado para tracking o geolocation no soportado';
            console.error('❌ Cannot start tracking:', trackingError.value);
            return false;
        }

        if (isTrackingActive.value) {
            console.warn('⚠️ Tracking ya está activo');
            return false;
        }

        try {
            console.log('🎯 Iniciando tracking para supplier:', user.value.id);

            // Obtener ubicación inicial
            const initialLocation = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                });
            });

            const locationData = {
                lat: initialLocation.coords.latitude,
                lng: initialLocation.coords.longitude,
                accuracy: initialLocation.coords.accuracy,
                timestamp: Date.now(),
                supplierId: user.value.id,
                username: profile.value?.username || user.value.email.split('@')[0],
                status: 'active'
            };

            lastKnownLocation.value = locationData;
            isTrackingActive.value = true;
            trackingError.value = null;

            // Enviar ubicación inicial
            await updateLocationInFirebase(locationData);

            // Iniciar tracking continuo con geolocation
            const trackingSuccess = startTracking(
                handleLocationUpdate,
                {
                    enableHighAccuracy: true,
                    timeout: 30000,
                    maximumAge: 30000
                }
            );

            if (trackingSuccess) {
                // Backup: interval para asegurar updates regulares
                trackingInterval.value = setInterval(async () => {
                    if (currentPosition.value && isTrackingActive.value) {
                        await sendLocationUpdate(currentPosition.value);
                    }
                }, TRACKING_INTERVAL);

                console.log('✅ Supplier tracking iniciado exitosamente');
                return true;
            } else {
                throw new Error('Failed to start geolocation tracking');
            }

        } catch (error) {
            console.error('💥 Error iniciando tracking:', error);
            trackingError.value = error.message;
            isTrackingActive.value = false;
            return false;
        }
    };

    /**
     * Detiene el tracking de ubicación
     */
    const stopSupplierTracking = async () => {
        if (!isTrackingActive.value) {
            console.warn('⚠️ Tracking no está activo');
            return false;
        }

        try {
            console.log('🛑 Deteniendo tracking para supplier:', user.value.id);

            // Detener geolocation tracking
            stopTracking();

            // Limpiar interval
            if (trackingInterval.value) {
                clearInterval(trackingInterval.value);
                trackingInterval.value = null;
            }

            // Marcar como inactivo en Firebase
            if (lastKnownLocation.value) {
                await updateLocationInFirebase({
                    ...lastKnownLocation.value,
                    status: 'offline',
                    timestamp: Date.now()
                });
            }

            isTrackingActive.value = false;
            console.log('✅ Tracking detenido exitosamente');
            return true;

        } catch (error) {
            console.error('💥 Error deteniendo tracking:', error);
            trackingError.value = error.message;
            return false;
        }
    };

    /**
     * Maneja las actualizaciones de ubicación del geolocation
     */
    const handleLocationUpdate = async (position) => {
        if (!isTrackingActive.value) return;

        const locationData = {
            lat: position.coords.lat,
            lng: position.coords.lng,
            accuracy: position.accuracy,
            speed: position.speed ? Math.round(position.speed * 3.6) : 0, // km/h
            heading: position.heading,
            timestamp: position.timestamp || Date.now(),
            supplierId: user.value.id,
            username: profile.value?.username || user.value.email.split('@')[0],
            status: 'active'
        };

        // Solo actualizar si hay movimiento significativo
        if (hasSignificantMovement(locationData)) {
            await sendLocationUpdate(locationData);
        }
    };

    /**
     * Determina si hay movimiento significativo desde la última ubicación
     */
    const hasSignificantMovement = (newLocation) => {
        if (!lastKnownLocation.value) return true;

        // Calcular distancia simple (aproximada)
        const lat1 = lastKnownLocation.value.lat;
        const lng1 = lastKnownLocation.value.lng;
        const lat2 = newLocation.lat;
        const lng2 = newLocation.lng;

        const R = 6371000; // Radio de la Tierra en metros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance >= SIGNIFICANT_MOVE_THRESHOLD;
    };

    /**
     * Envía la actualización de ubicación a Firebase y almacena localmente
     */
    const sendLocationUpdate = async (locationData) => {
        try {
            // Actualizar en Firebase
            await updateLocationInFirebase(locationData);

            // Almacenar localmente
            lastKnownLocation.value = locationData;

            // Agregar al historial
            trackingHistory.value.push(locationData);
            if (trackingHistory.value.length > MAX_HISTORY_POINTS) {
                trackingHistory.value = trackingHistory.value.slice(-MAX_HISTORY_POINTS);
            }

            console.log('📍 Ubicación actualizada:', {
                lat: locationData.lat.toFixed(6),
                lng: locationData.lng.toFixed(6),
                accuracy: `${locationData.accuracy}m`,
                speed: `${locationData.speed} km/h`
            });

        } catch (error) {
            console.error('❌ Error enviando ubicación:', error);
            trackingError.value = `Error enviando ubicación: ${error.message}`;
        }
    };

    /**
     * Actualiza la ubicación en Firebase Realtime Database
     */
    const updateLocationInFirebase = async (locationData) => {
        // Modo fallback: usar API REST si Firebase SDK no está disponible
        if (!firebaseDb) {
            return await updateLocationViaREST(locationData);
        }

        try {
            const locationRef = firebaseDb.ref(`locations/${locationData.supplierId}`);
            await locationRef.set(locationData);
            return true;
        } catch (error) {
            console.error('❌ Error actualizando en Firebase:', error);
            throw error;
        }
    };

    /**
     * Fallback: actualizar ubicación via REST API
     */
    const updateLocationViaREST = async (locationData) => {
        const FIREBASE_URL = import.meta.env.VITE_FIREBASE_DATABASE_URL;

        if (!FIREBASE_URL) {
            console.warn('⚠️ Firebase URL no configurada - guardando solo localmente');
            return true;
        }

        try {
            const response = await fetch(`${FIREBASE_URL}/locations/${locationData.supplierId}.json`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(locationData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('❌ Error con REST API:', error);
            throw error;
        }
    };

    /**
     * Obtiene las ubicaciones de todos los suppliers activos
     * PARA CLIENTS Y ADMINS
     */
    const getActiveSuppliersLocations = async () => {
        try {
            console.log('📡 Obteniendo ubicaciones de suppliers activos...');

            if (!firebaseDb) {
                return await getActiveSuppliersViaREST();
            }

            const locationsRef = firebaseDb.ref('locations');
            const snapshot = await locationsRef.once('value');
            const locations = snapshot.val() || {};

            // Filtrar solo suppliers activos (últimos 5 minutos)
            const activeSuppliers = Object.values(locations)
                .filter(location => {
                    const timeDiff = Date.now() - location.timestamp;
                    return location.status === 'active' && timeDiff < 300000; // 5 minutos
                });

            console.log(`✅ ${activeSuppliers.length} suppliers activos encontrados`);
            return activeSuppliers;

        } catch (error) {
            console.error('❌ Error obteniendo suppliers:', error);
            return [];
        }
    };

    /**
     * Fallback: obtener suppliers via REST API
     */
    const getActiveSuppliersViaREST = async () => {
        const FIREBASE_URL = import.meta.env.VITE_FIREBASE_DATABASE_URL;

        if (!FIREBASE_URL) {
            console.warn('⚠️ Firebase URL no configurada');
            return [];
        }

        try {
            const response = await fetch(`${FIREBASE_URL}/locations.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const locations = await response.json() || {};

            // Filtrar suppliers activos
            const activeSuppliers = Object.values(locations)
                .filter(location => {
                    const timeDiff = Date.now() - location.timestamp;
                    return location.status === 'active' && timeDiff < 300000;
                });

            return activeSuppliers;
        } catch (error) {
            console.error('❌ Error REST API suppliers:', error);
            return [];
        }
    };

    /**
     * Suscribe a actualizaciones en tiempo real de ubicaciones
     * PARA CLIENTS Y ADMINS
     */
    const subscribeToLocationUpdates = (callback) => {
        if (!firebaseDb) {
            console.warn('⚠️ Firebase no disponible - polling cada 30 segundos');
            // Fallback: polling
            const pollInterval = setInterval(async () => {
                const suppliers = await getActiveSuppliersViaREST();
                callback(suppliers);
            }, 30000);

            return () => clearInterval(pollInterval);
        }

        const locationsRef = firebaseDb.ref('locations');

        const handleUpdate = (snapshot) => {
            const locations = snapshot.val() || {};
            const activeSuppliers = Object.values(locations)
                .filter(location => {
                    const timeDiff = Date.now() - location.timestamp;
                    return location.status === 'active' && timeDiff < 300000;
                });

            callback(activeSuppliers);
        };

        locationsRef.on('value', handleUpdate);

        // Retornar función de cleanup
        return () => locationsRef.off('value', handleUpdate);
    };

    /**
     * Obtiene el historial de ubicaciones de un supplier específico
     */
    const getSupplierLocationHistory = (supplierId, hours = 24) => {
        // Por ahora retorna el historial local
        // En producción se conectaría a una colección de historial
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);

        return trackingHistory.value.filter(location =>
            location.supplierId === supplierId &&
            location.timestamp >= cutoffTime
        );
    };

    // Inicialización
    onMounted(() => {
        initializeFirebase();

        // Auto-iniciar tracking si es supplier y tiene permisos
        if (isSupplier.value && navigator.geolocation) {
            console.log('🎯 Usuario supplier detectado - tracking disponible');
        }
    });

    // Cleanup
    onUnmounted(() => {
        if (isTrackingActive.value) {
            stopSupplierTracking();
        }

        if (trackingInterval.value) {
            clearInterval(trackingInterval.value);
        }
    });

    return {
        // Estado
        isTrackingActive,
        lastKnownLocation,
        trackingHistory,
        activeSuppliers,
        trackingError,
        canTrack,

        // Funciones para SUPPLIERS
        startSupplierTracking,
        stopSupplierTracking,

        // Funciones para CLIENTS/ADMINS
        getActiveSuppliersLocations,
        subscribeToLocationUpdates,
        getSupplierLocationHistory,

        // Utilidades
        initializeFirebase
    };
}