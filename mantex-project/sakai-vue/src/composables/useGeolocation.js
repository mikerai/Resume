// src/composables/useGeolocation.js

import { ref, computed, onUnmounted } from 'vue';
import { useGoogleMaps } from './useGoogleMaps.js';

export function useGeolocation() {
    // Estados reactivos
    const currentPosition = ref(null);
    const positionHistory = ref([]);
    const isTracking = ref(false);
    const watchId = ref(null);
    const error = ref(null);
    const isLoading = ref(false);

    // Composable de Google Maps para funcionalidades avanzadas
    const { calculateDistance } = useGoogleMaps();

    // Configuración de geolocalización
    const GEOLOCATION_OPTIONS = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000 // 30 segundos
    };

    // Computadas
    const hasLocation = computed(() => !!currentPosition.value);
    const isSupported = computed(() => 'geolocation' in navigator);

    const totalDistanceTraveled = computed(() => {
        if (positionHistory.value.length < 2) return 0;

        let totalDistance = 0;
        for (let i = 1; i < positionHistory.value.length; i++) {
            const prev = positionHistory.value[i - 1];
            const curr = positionHistory.value[i];

            if (calculateDistance) {
                const distance = calculateDistance(prev.coords, curr.coords);
                totalDistance += distance?.meters || 0;
            }
        }

        return totalDistance;
    });

    /**
     * Obtiene la ubicación actual una sola vez
     */
    const getCurrentPosition = () => {
        return new Promise((resolve, reject) => {
            if (!isSupported.value) {
                const errorMsg = 'Geolocation no soportado por este navegador';
                error.value = errorMsg;
                reject(new Error(errorMsg));
                return;
            }

            isLoading.value = true;
            error.value = null;

            console.log('📍 Obteniendo ubicación actual...');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const locationData = {
                        coords: {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        },
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: position.timestamp
                    };

                    currentPosition.value = locationData;
                    isLoading.value = false;

                    console.log('✅ Ubicación obtenida:', locationData);
                    resolve(locationData);
                },
                (err) => {
                    isLoading.value = false;

                    let errorMessage = 'Error desconocido obteniendo ubicación';
                    switch (err.code) {
                        case err.PERMISSION_DENIED:
                            errorMessage = 'Acceso a ubicación denegado por el usuario';
                            break;
                        case err.POSITION_UNAVAILABLE:
                            errorMessage = 'Información de ubicación no disponible';
                            break;
                        case err.TIMEOUT:
                            errorMessage = 'Timeout obteniendo ubicación';
                            break;
                    }

                    error.value = errorMessage;
                    console.error('❌ Error geolocalización:', errorMessage, err);
                    reject(new Error(errorMessage));
                },
                GEOLOCATION_OPTIONS
            );
        });
    };

    /**
     * Inicia el tracking continuo de ubicación
     * @param {Function} onUpdate - Callback que se ejecuta en cada actualización
     * @param {Object} options - Opciones adicionales de tracking
     */
    const startTracking = (onUpdate = null, options = {}) => {
        if (!isSupported.value) {
            console.error('❌ Geolocation no soportado');
            return false;
        }

        if (isTracking.value) {
            console.warn('⚠️ Tracking ya está activo');
            return false;
        }

        console.log('🔄 Iniciando tracking de ubicación...');
        isTracking.value = true;
        error.value = null;

        const trackingOptions = {
            ...GEOLOCATION_OPTIONS,
            ...options
        };

        watchId.value = navigator.geolocation.watchPosition(
            (position) => {
                const locationData = {
                    coords: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    },
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed, // m/s
                    timestamp: position.timestamp
                };

                // Actualizar posición actual
                currentPosition.value = locationData;

                // Agregar al historial (mantener últimas 100 posiciones)
                positionHistory.value.push(locationData);
                if (positionHistory.value.length > 100) {
                    positionHistory.value = positionHistory.value.slice(-100);
                }

                // Llamar callback personalizado
                if (onUpdate) {
                    onUpdate(locationData);
                }

                console.log('📍 Ubicación actualizada:', {
                    lat: locationData.coords.lat,
                    lng: locationData.coords.lng,
                    accuracy: `${locationData.accuracy}m`,
                    speed: locationData.speed ? `${Math.round(locationData.speed * 3.6)} km/h` : 'N/A'
                });
            },
            (err) => {
                let errorMessage = 'Error en tracking de ubicación';
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = 'Permisos de ubicación denegados durante tracking';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = 'Ubicación no disponible durante tracking';
                        break;
                    case err.TIMEOUT:
                        errorMessage = 'Timeout durante tracking de ubicación';
                        break;
                }

                error.value = errorMessage;
                console.error('❌ Error tracking:', errorMessage, err);

                // No detener tracking por errores temporales
                // Solo alertar al usuario
            },
            trackingOptions
        );

        return true;
    };

    /**
     * Detiene el tracking de ubicación
     */
    const stopTracking = () => {
        if (watchId.value) {
            navigator.geolocation.clearWatch(watchId.value);
            watchId.value = null;
            isTracking.value = false;
            console.log('🛑 Tracking de ubicación detenido');
            return true;
        }
        return false;
    };

    /**
     * Calcula la velocidad basada en las últimas dos posiciones
     */
    const getCurrentSpeed = () => {
        if (positionHistory.value.length < 2) return 0;

        const current = positionHistory.value[positionHistory.value.length - 1];
        const previous = positionHistory.value[positionHistory.value.length - 2];

        if (current.speed !== null && current.speed !== undefined) {
            // Usar velocidad del GPS si está disponible
            return Math.round(current.speed * 3.6); // Convertir m/s a km/h
        }

        // Calcular velocidad basada en distancia y tiempo
        if (calculateDistance) {
            const distance = calculateDistance(previous.coords, current.coords);
            const timeDiff = (current.timestamp - previous.timestamp) / 1000; // segundos

            if (distance && timeDiff > 0) {
                const speedMs = distance.meters / timeDiff;
                return Math.round(speedMs * 3.6); // km/h
            }
        }

        return 0;
    };

    /**
     * Verifica si el usuario está en movimiento
     * @param {number} threshold - Velocidad mínima para considerar movimiento (km/h)
     */
    const isMoving = (threshold = 1) => {
        const speed = getCurrentSpeed();
        return speed >= threshold;
    };

    /**
     * Obtiene el rumbo/dirección de movimiento
     */
    const getHeading = () => {
        if (currentPosition.value?.heading !== null) {
            return currentPosition.value.heading;
        }

        // Calcular rumbo basado en las últimas dos posiciones
        if (positionHistory.value.length >= 2) {
            const current = positionHistory.value[positionHistory.value.length - 1];
            const previous = positionHistory.value[positionHistory.value.length - 2];

            const lat1 = previous.coords.lat * Math.PI / 180;
            const lat2 = current.coords.lat * Math.PI / 180;
            const deltaLng = (current.coords.lng - previous.coords.lng) * Math.PI / 180;

            const y = Math.sin(deltaLng) * Math.cos(lat2);
            const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

            const bearing = Math.atan2(y, x) * 180 / Math.PI;
            return (bearing + 360) % 360;
        }

        return null;
    };

    /**
     * Obtiene estadísticas del viaje actual
     */
    const getTripStats = () => {
        if (positionHistory.value.length === 0) {
            return {
                duration: 0,
                distance: 0,
                avgSpeed: 0,
                maxSpeed: 0,
                points: 0
            };
        }

        const startTime = positionHistory.value[0].timestamp;
        const endTime = positionHistory.value[positionHistory.value.length - 1].timestamp;
        const duration = (endTime - startTime) / 1000; // segundos

        let maxSpeed = 0;
        let totalSpeed = 0;
        let speedCount = 0;

        positionHistory.value.forEach(position => {
            if (position.speed !== null && position.speed !== undefined) {
                const speedKmh = position.speed * 3.6;
                maxSpeed = Math.max(maxSpeed, speedKmh);
                totalSpeed += speedKmh;
                speedCount++;
            }
        });

        return {
            duration: Math.round(duration),
            distance: totalDistanceTraveled.value,
            avgSpeed: speedCount > 0 ? Math.round(totalSpeed / speedCount) : 0,
            maxSpeed: Math.round(maxSpeed),
            points: positionHistory.value.length
        };
    };

    /**
     * Limpia el historial de posiciones
     */
    const clearHistory = () => {
        positionHistory.value = [];
        console.log('🧹 Historial de ubicaciones limpiado');
    };

    /**
     * Exporta el historial de ubicaciones para análisis
     */
    const exportHistory = () => {
        return {
            positions: positionHistory.value,
            stats: getTripStats(),
            exportedAt: Date.now()
        };
    };

    // Cleanup al desmontar
    onUnmounted(() => {
        stopTracking();
    });

    return {
        // Estado
        currentPosition,
        positionHistory,
        isTracking,
        error,
        isLoading,

        // Computadas
        hasLocation,
        isSupported,
        totalDistanceTraveled,

        // Funciones principales
        getCurrentPosition,
        startTracking,
        stopTracking,

        // Análisis de movimiento
        getCurrentSpeed,
        isMoving,
        getHeading,
        getTripStats,

        // Utilidades
        clearHistory,
        exportHistory
    };
}