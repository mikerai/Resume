// src/composables/useGoogleMaps.js

import { ref, onMounted, onUnmounted } from 'vue';

export function useGoogleMaps() {
    // Estados reactivos
    const map = ref(null);
    const isMapLoaded = ref(false);
    const currentLocation = ref(null);
    const markers = ref(new Map());
    const directionsService = ref(null);
    const directionsRenderer = ref(null);
    const watchId = ref(null);

    // Configuración de Google Maps
    const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    // Configuración por defecto (Ciudad de México)
    const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 };
    const DEFAULT_ZOOM = 12;

    /**
     * Carga el script de Google Maps API de forma dinámica
     */
    const loadGoogleMapsScript = () => {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            if (window.google && window.google.maps) {
                resolve();
                return;
            }

            // Crear script tag
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places,geometry`;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                console.log('✅ Google Maps API cargado exitosamente');
                resolve();
            };

            script.onerror = (error) => {
                console.error('❌ Error cargando Google Maps API:', error);
                reject(error);
            };

            document.head.appendChild(script);
        });
    };

    /**
     * Inicializa el mapa de Google Maps
     * @param {HTMLElement} mapContainer - Elemento DOM del contenedor del mapa
     * @param {Object} options - Opciones de configuración del mapa
     */
    const initializeMap = async (mapContainer, options = {}) => {
        try {
            console.log('🗺️ Inicializando Google Maps...');

            // Cargar API si no está cargada
            if (!window.google || !window.google.maps) {
                await loadGoogleMapsScript();
            }

            // Obtener ubicación actual del usuario
            const userLocation = await getCurrentLocation();

            // Configuración del mapa
            const mapOptions = {
                center: userLocation || DEFAULT_CENTER,
                zoom: options.zoom || DEFAULT_ZOOM,
                mapTypeId: window.google.maps.MapTypeId.ROADMAP,
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: true,
                zoomControl: true,
                ...options
            };

            // Crear instancia del mapa
            map.value = new window.google.maps.Map(mapContainer, mapOptions);

            // Inicializar servicios de direcciones
            directionsService.value = new window.google.maps.DirectionsService();
            directionsRenderer.value = new window.google.maps.DirectionsRenderer({
                suppressMarkers: false,
                draggable: true
            });

            directionsRenderer.value.setMap(map.value);

            // Marcar ubicación actual si está disponible
            if (userLocation) {
                addMarker('current-location', userLocation, {
                    title: 'Mi ubicación',
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="8" fill="#4285F4"/>
                                <circle cx="12" cy="12" r="3" fill="white"/>
                            </svg>
                        `),
                        scaledSize: new window.google.maps.Size(24, 24)
                    }
                });
            }

            isMapLoaded.value = true;
            console.log('✅ Mapa inicializado correctamente');

            return map.value;

        } catch (error) {
            console.error('💥 Error inicializando mapa:', error);
            throw error;
        }
    };

    /**
     * Obtiene la ubicación actual del usuario con HTML5 Geolocation
     */
    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                console.warn('⚠️ Geolocation no soportado por este navegador');
                resolve(null);
                return;
            }

            console.log('📍 Obteniendo ubicación actual...');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    currentLocation.value = location;
                    console.log('✅ Ubicación obtenida:', location);
                    resolve(location);
                },
                (error) => {
                    console.warn('⚠️ Error obteniendo ubicación:', error.message);
                    resolve(null); // No fallar, usar ubicación por defecto
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutos
                }
            );
        });
    };

    /**
     * Inicia el tracking de ubicación en tiempo real
     * @param {Function} callback - Función a llamar con cada actualización de ubicación
     */
    const startLocationTracking = (callback) => {
        if (!navigator.geolocation) {
            console.error('❌ Geolocation no disponible');
            return;
        }

        console.log('🔄 Iniciando tracking de ubicación...');

        watchId.value = navigator.geolocation.watchPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };

                currentLocation.value = location;

                // Actualizar marcador de ubicación actual
                if (markers.value.has('current-location')) {
                    markers.value.get('current-location').setPosition(location);
                }

                // Llamar callback personalizado
                if (callback) {
                    callback(location);
                }

                console.log('📍 Ubicación actualizada:', location);
            },
            (error) => {
                console.error('❌ Error en tracking:', error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 30000 // Actualizar cada 30 segundos
            }
        );
    };

    /**
     * Detiene el tracking de ubicación
     */
    const stopLocationTracking = () => {
        if (watchId.value) {
            navigator.geolocation.clearWatch(watchId.value);
            watchId.value = null;
            console.log('🛑 Tracking de ubicación detenido');
        }
    };

    /**
     * Agrega un marcador al mapa
     * @param {string} id - ID único del marcador
     * @param {Object} position - Posición {lat, lng}
     * @param {Object} options - Opciones del marcador
     */
    const addMarker = (id, position, options = {}) => {
        if (!map.value) {
            console.error('❌ Mapa no inicializado');
            return;
        }

        // Eliminar marcador existente si existe
        if (markers.value.has(id)) {
            markers.value.get(id).setMap(null);
        }

        // Crear nuevo marcador
        const marker = new window.google.maps.Marker({
            position: position,
            map: map.value,
            title: options.title || '',
            icon: options.icon,
            animation: options.animation || null,
            ...options
        });

        // Agregar InfoWindow si se proporciona contenido
        if (options.infoContent) {
            const infoWindow = new window.google.maps.InfoWindow({
                content: options.infoContent
            });

            marker.addListener('click', () => {
                infoWindow.open(map.value, marker);
            });
        }

        markers.value.set(id, marker);
        return marker;
    };

    /**
     * Elimina un marcador del mapa
     * @param {string} id - ID del marcador a eliminar
     */
    const removeMarker = (id) => {
        if (markers.value.has(id)) {
            markers.value.get(id).setMap(null);
            markers.value.delete(id);
        }
    };

    /**
     * Calcula y muestra una ruta entre dos puntos
     * @param {Object} origin - Punto de origen {lat, lng}
     * @param {Object} destination - Punto de destino {lat, lng}
     * @param {Object} options - Opciones de la ruta
     */
    const calculateRoute = async (origin, destination, options = {}) => {
        if (!directionsService.value || !directionsRenderer.value) {
            console.error('❌ Servicios de direcciones no inicializados');
            return;
        }

        try {
            console.log('🧭 Calculando ruta...', { origin, destination });

            const request = {
                origin: origin,
                destination: destination,
                travelMode: options.travelMode || window.google.maps.TravelMode.DRIVING,
                unitSystem: window.google.maps.UnitSystem.METRIC,
                avoidHighways: options.avoidHighways || false,
                avoidTolls: options.avoidTolls || false,
                ...options
            };

            const result = await new Promise((resolve, reject) => {
                directionsService.value.route(request, (result, status) => {
                    if (status === 'OK') {
                        resolve(result);
                    } else {
                        reject(new Error(`Error calculando ruta: ${status}`));
                    }
                });
            });

            // Mostrar ruta en el mapa
            directionsRenderer.value.setDirections(result);

            // Extraer información útil de la ruta
            const route = result.routes[0];
            const leg = route.legs[0];

            const routeInfo = {
                distance: leg.distance.text,
                duration: leg.duration.text,
                durationInSeconds: leg.duration.value,
                startAddress: leg.start_address,
                endAddress: leg.end_address,
                steps: leg.steps.map(step => ({
                    instruction: step.instructions,
                    distance: step.distance.text,
                    duration: step.duration.text
                }))
            };

            console.log('✅ Ruta calculada:', routeInfo);
            return routeInfo;

        } catch (error) {
            console.error('💥 Error calculando ruta:', error);
            throw error;
        }
    };

    /**
     * Centra el mapa en una ubicación específica
     * @param {Object} location - Ubicación {lat, lng}
     * @param {number} zoom - Nivel de zoom opcional
     */
    const centerMap = (location, zoom = null) => {
        if (!map.value) {
            console.error('❌ Mapa no inicializado');
            return;
        }

        map.value.setCenter(location);
        if (zoom) {
            map.value.setZoom(zoom);
        }
    };

    /**
     * Ajusta el mapa para mostrar todos los marcadores
     */
    const fitMarkersInView = () => {
        if (!map.value || markers.value.size === 0) {
            return;
        }

        const bounds = new window.google.maps.LatLngBounds();
        markers.value.forEach(marker => {
            bounds.extend(marker.getPosition());
        });

        map.value.fitBounds(bounds);
    };

    /**
     * Busca lugares usando Google Places API
     * @param {string} query - Término de búsqueda
     * @param {Object} location - Ubicación de referencia
     */
    const searchPlaces = async (query, location = null) => {
        if (!window.google || !window.google.maps.places) {
            console.error('❌ Google Places API no cargada');
            return [];
        }

        try {
            const service = new window.google.maps.places.PlacesService(map.value);
            const searchLocation = location || currentLocation.value || DEFAULT_CENTER;

            const request = {
                query: query,
                location: searchLocation,
                radius: 50000, // 50km radius
                type: ['establishment']
            };

            const results = await new Promise((resolve, reject) => {
                service.textSearch(request, (results, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                        resolve(results);
                    } else {
                        reject(new Error(`Error en búsqueda: ${status}`));
                    }
                });
            });

            return results.map(place => ({
                placeId: place.place_id,
                name: place.name,
                address: place.formatted_address,
                location: {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                },
                rating: place.rating,
                types: place.types
            }));

        } catch (error) {
            console.error('💥 Error buscando lugares:', error);
            return [];
        }
    };

    /**
     * Calcula la distancia entre dos puntos
     * @param {Object} point1 - Primer punto {lat, lng}
     * @param {Object} point2 - Segundo punto {lat, lng}
     */
    const calculateDistance = (point1, point2) => {
        if (!window.google || !window.google.maps.geometry) {
            console.error('❌ Google Maps Geometry API no cargada');
            return null;
        }

        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
            new window.google.maps.LatLng(point1.lat, point1.lng),
            new window.google.maps.LatLng(point2.lat, point2.lng)
        );

        return {
            meters: Math.round(distance),
            kilometers: Math.round(distance / 1000 * 100) / 100,
            formatted: distance >= 1000 ?
                `${Math.round(distance / 1000 * 100) / 100} km` :
                `${Math.round(distance)} m`
        };
    };

    // Cleanup al desmontar el componente
    onUnmounted(() => {
        stopLocationTracking();

        // Limpiar marcadores
        markers.value.forEach(marker => {
            marker.setMap(null);
        });
        markers.value.clear();
    });

    return {
        // Estado
        map,
        isMapLoaded,
        currentLocation,
        markers,

        // Inicialización
        loadGoogleMapsScript,
        initializeMap,

        // Geolocalización
        getCurrentLocation,
        startLocationTracking,
        stopLocationTracking,

        // Marcadores
        addMarker,
        removeMarker,

        // Rutas y navegación
        calculateRoute,
        centerMap,
        fitMarkersInView,

        // Búsqueda y utilidades
        searchPlaces,
        calculateDistance
    };
}