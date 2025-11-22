<template>
    <div class="real-time-map-container">
        <!-- Header con controles -->
        <div class="map-header">
            <div class="map-title">
                <i class="pi pi-map-marker" />
                <h3>Mapa en Tiempo Real</h3>
            </div>

            <div class="map-controls">
                <!-- Control para suppliers -->
                <Button
                    v-if="isSupplier && !isTrackingActive"
                    @click="startTracking"
                    :loading="isStartingTracking"
                    icon="pi pi-play"
                    label="Iniciar Tracking"
                    class="p-button-success"
                    size="small"
                />

                <Button
                    v-if="isSupplier && isTrackingActive"
                    @click="stopTracking"
                    :loading="isStoppingTracking"
                    icon="pi pi-stop"
                    label="Detener Tracking"
                    class="p-button-danger"
                    size="small"
                />

                <!-- Indicadores de estado -->
                <Badge
                    v-if="isSupplier"
                    :value="isTrackingActive ? 'ACTIVO' : 'INACTIVO'"
                    :severity="isTrackingActive ? 'success' : 'secondary'"
                />

                <Badge
                    v-if="!isSupplier"
                    :value="`${activeSuppliers.length} Suppliers`"
                    severity="info"
                />
            </div>
        </div>

        <!-- Mapa -->
        <div ref="mapContainer" class="map-container" />

        <!-- Panel de información -->
        <div v-if="showInfo" class="map-info-panel">
            <!-- Info para suppliers -->
            <div v-if="isSupplier && currentLocation" class="supplier-info">
                <h4>Mi Ubicación</h4>
                <div class="location-details">
                    <div class="detail-item">
                        <i class="pi pi-compass" />
                        <span>{{ formatCoordinates(currentLocation) }}</span>
                    </div>
                    <div class="detail-item">
                        <i class="pi pi-gauge" />
                        <span>{{ getCurrentSpeed() }} km/h</span>
                    </div>
                    <div class="detail-item">
                        <i class="pi pi-clock" />
                        <span>{{ formatLastUpdate(currentLocation.timestamp) }}</span>
                    </div>
                </div>
            </div>

            <!-- Info para clients/admins -->
            <div v-if="!isSupplier" class="suppliers-info">
                <h4>Suppliers Activos</h4>
                <div class="suppliers-list">
                    <div
                        v-for="supplier in activeSuppliers"
                        :key="supplier.id"
                        class="supplier-item"
                        @click="centerOnSupplier(supplier)"
                    >
                        <div class="supplier-avatar">
                            <Avatar
                                :label="(supplier.name || supplier.company || 'S').charAt(0).toUpperCase()"
                                size="small"
                                :style="{
                                    backgroundColor: supplier.status === 'approved' ? '#2196F3' : '#FF9800',
                                    color: 'white'
                                }"
                            />
                        </div>
                        <div class="supplier-details">
                            <div class="supplier-name">{{ supplier.name || supplier.company }}</div>
                            <div class="supplier-status">
                                <i
                                    class="pi pi-circle-fill"
                                    :class="supplier.status === 'approved' ? 'text-blue-500' : 'text-orange-500'"
                                />
                                {{ supplier.status === 'approved' ? 'Aprobado' : 'Pendiente' }}
                            </div>
                        </div>
                        <div class="supplier-actions">
                            <Button
                                icon="pi pi-eye"
                                class="p-button-text p-button-sm"
                                @click.stop="focusSupplier(supplier)"
                                v-tooltip="'Ver detalles'"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading overlay -->
        <div v-if="isLoading" class="map-loading-overlay">
            <ProgressSpinner />
            <p>{{ loadingMessage }}</p>
        </div>

        <!-- Error message -->
        <Message
            v-if="error"
            :severity="'error'"
            :closable="false"
            class="map-error"
        >
            {{ error }}
        </Message>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useGoogleIntegration } from '@/composables/useGoogleIntegration.js';
import { useAuth } from '@/composables/useAuth.js';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Badge from 'primevue/badge';
import Avatar from 'primevue/avatar';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message';

// Props
const props = defineProps({
    showInfo: {
        type: Boolean,
        default: true
    },
    autoCenter: {
        type: Boolean,
        default: true
    },
    trackingInterval: {
        type: Number,
        default: 30000 // 30 segundos
    },
    suppliersData: {
        type: Array,
        default: () => []
    },
    clientsData: {
        type: Array,
        default: () => []
    }
});

// Emits
const emit = defineEmits(['supplierSelected', 'trackingStarted', 'trackingStopped']);

// Composables
const googleIntegration = useGoogleIntegration();
const { user, profile } = useAuth();
const toast = useToast();

// Referencias del template
const mapContainer = ref(null);

// Estados reactivos
const isLoading = ref(false);
const loadingMessage = ref('');
const error = ref(null);
const isStartingTracking = ref(false);
const isStoppingTracking = ref(false);
const activeSuppliers = ref([]);
const currentLocation = ref(null);
const unsubscribeUpdates = ref(null);

// Computadas
const isSupplier = computed(() => profile.value?.role === 'supplier');
const isTrackingActive = computed(() => googleIntegration.tracking.isTrackingActive.value);

/**
 * Inicializa el mapa y la integración de Google APIs
 */
const initializeMap = async () => {
    try {
        isLoading.value = true;
        loadingMessage.value = 'Cargando Google Maps...';

        // Para admin/client: inicialización simple, solo mapa
        if (!isSupplier.value) {
            // Solo cargar Google Maps API
            await googleIntegration.maps.loadGoogleMapsScript();

            loadingMessage.value = 'Configurando mapa...';

            // Inicializar mapa
            const map = await googleIntegration.maps.initializeMap(mapContainer.value, {
                zoom: 13,
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true
            });

            if (!map) {
                throw new Error('Error inicializando mapa');
            }

            // Configurar mapa para admin/client
            await setupClientAdminMap();

            console.log('[OK] Mapa inicializado correctamente');
        } else {
            // Para suppliers: inicialización completa con tracking
            loadingMessage.value = 'Inicializando servicios...';

            const success = await googleIntegration.initializeGoogleIntegration();

            if (!success) {
                throw new Error('Error inicializando Google APIs');
            }

            loadingMessage.value = 'Configurando mapa...';

            const map = await googleIntegration.maps.initializeMap(mapContainer.value, {
                zoom: 13,
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true
            });

            if (!map) {
                throw new Error('Error inicializando mapa');
            }

            await setupSupplierMap();

            console.log('[OK] Mapa inicializado correctamente');
        }

    } catch (err) {
        console.error('[ERROR] Error inicializando mapa:', err);
        error.value = `Error inicializando mapa: ${err.message}`;
    } finally {
        isLoading.value = false;
        loadingMessage.value = '';
    }
};

/**
 * Configura el mapa para suppliers
 */
const setupSupplierMap = async () => {
    try {
        console.log('[INFO] Configurando mapa para supplier...');

        // Escuchar cambios de ubicación
        googleIntegration.geolocation.startTracking((location) => {
            currentLocation.value = location;

            // Actualizar marcador en el mapa
            googleIntegration.maps.addMarker('my-location', location.coords, {
                title: 'Mi ubicación',
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="12" fill="#4CAF50"/>
                            <circle cx="16" cy="16" r="6" fill="white"/>
                            <circle cx="16" cy="16" r="3" fill="#4CAF50"/>
                        </svg>
                    `),
                    scaledSize: new window.google.maps.Size(32, 32)
                }
            });

            // Auto-centrar si está habilitado
            if (props.autoCenter) {
                googleIntegration.maps.centerMap(location.coords, 16);
            }
        });

    } catch (error) {
        console.error('[ERROR] Error configurando mapa supplier:', error);
        throw error;
    }
};

/**
 * Configura el mapa para clients y admins
 */
const setupClientAdminMap = async () => {
    try {
        console.log('[INFO] Configurando mapa para client/admin...');

        // Cargar suppliers activos inicialmente
        await loadActiveSuppliers();

        // Suscribirse a actualizaciones en tiempo real
        if (googleIntegration.firebase.isFirebaseInitialized.value) {
            unsubscribeUpdates.value = googleIntegration.firebase.subscribeToRealTimeUpdates(
                'locations',
                handleSuppliersUpdate
            );
        } else {
            // Fallback: polling cada 30 segundos
            const interval = setInterval(loadActiveSuppliers, props.trackingInterval);

            onUnmounted(() => {
                clearInterval(interval);
            });
        }

    } catch (error) {
        console.error('[ERROR] Error configurando mapa client/admin:', error);
        throw error;
    }
};

/**
 * Carga suppliers activos
 */
const loadActiveSuppliers = async () => {
    try {
        // Si hay datos pasados por props, usarlos
        if (props.suppliersData && props.suppliersData.length > 0) {
            // Filtrar solo suppliers con coordenadas
            const suppliersWithCoords = props.suppliersData.filter(s => s.location && s.location.lat && s.location.lng);
            activeSuppliers.value = suppliersWithCoords;
            updateSuppliersOnMap(suppliersWithCoords);
            console.log('[INFO] Loaded', suppliersWithCoords.length, 'suppliers with coordinates');
        } else {
            // Fallback a google integration si no hay props
            const suppliers = await googleIntegration.getActiveSuppliersWithLocations();
            activeSuppliers.value = suppliers;
            updateSuppliersOnMap(suppliers);
        }

    } catch (error) {
        console.error('[ERROR] Error cargando suppliers:', error);
    }
};

/**
 * Maneja actualizaciones de suppliers en tiempo real
 */
const handleSuppliersUpdate = (locations) => {
    if (!locations) return;

    const suppliers = Object.entries(locations)
        .filter(([id, data]) => {
            const timeDiff = Date.now() - data.timestamp;
            return data.status === 'active' && timeDiff < 300000; // 5 minutos
        })
        .map(([id, data]) => ({
            id,
            ...data
        }));

    activeSuppliers.value = suppliers;
    updateSuppliersOnMap(suppliers);
};

/**
 * Actualiza marcadores de suppliers en el mapa
 */
const updateSuppliersOnMap = (suppliers) => {
    // Limpiar marcadores existentes (excepto ubicación propia)
    Object.entries(googleIntegration.maps.markers.value).forEach(([id, marker]) => {
        if (id !== 'my-location') {
            marker.setMap(null);
            delete googleIntegration.maps.markers.value[id];
        }
    });

    // Agregar nuevos marcadores
    suppliers.forEach((supplier) => {
        if (!supplier.location || !supplier.location.lat || !supplier.location.lng) {
            console.warn('[WARN] Supplier sin coordenadas:', supplier.id, supplier.name);
            return;
        }

        const displayName = supplier.name || supplier.company || 'Supplier';
        const statusText = supplier.status === 'approved' ? 'Aprobado' : supplier.status === 'pending' ? 'Pendiente' : supplier.status;
        const initial = displayName.charAt(0).toUpperCase();

        // Color según status: azul para aprobados, naranja para pendientes
        const markerColor = supplier.status === 'approved' ? '#2196F3' : '#FF9800';

        googleIntegration.maps.addMarker(`supplier-${supplier.id}`, supplier.location, {
            title: displayName,
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="12" fill="${markerColor}"/>
                        <circle cx="16" cy="16" r="6" fill="white"/>
                        <text x="16" y="20" text-anchor="middle" fill="${markerColor}" font-size="10" font-weight="bold">
                            ${initial}
                        </text>
                    </svg>
                `),
                scaledSize: new window.google.maps.Size(32, 32)
            },
            infoContent: `
                <div style="padding: 10px; min-width: 250px;">
                    <h4 style="margin: 0 0 8px 0;">${displayName}</h4>
                    ${supplier.company ? `<p style="margin: 4px 0;"><strong>Empresa:</strong> ${supplier.company}</p>` : ''}
                    <p style="margin: 4px 0;"><strong>Estado:</strong> ${statusText}</p>
                    ${supplier.address ? `<p style="margin: 4px 0;"><strong>Dirección:</strong> ${supplier.address}</p>` : ''}
                    ${supplier.phone ? `<p style="margin: 4px 0;"><strong>Teléfono:</strong> ${supplier.phone}</p>` : ''}
                </div>
            `
        });
    });

    // Ajustar vista para mostrar todos los marcadores
    if (suppliers.length > 0) {
        googleIntegration.maps.fitMarkersInView();
    }
};

/**
 * Inicia tracking para supplier
 */
const startTracking = async () => {
    try {
        isStartingTracking.value = true;

        const success = await googleIntegration.startSupplierTracking();

        if (success) {
            toast.add({
                severity: 'success',
                summary: 'Tracking Iniciado',
                detail: 'Tu ubicación se está compartiendo en tiempo real',
                life: 3000
            });

            emit('trackingStarted');
        } else {
            throw new Error('No se pudo iniciar el tracking');
        }

    } catch (error) {
        console.error('[ERROR] Error iniciando tracking:', error);

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: `No se pudo iniciar tracking: ${error.message}`,
            life: 5000
        });
    } finally {
        isStartingTracking.value = false;
    }
};

/**
 * Detiene tracking para supplier
 */
const stopTracking = async () => {
    try {
        isStoppingTracking.value = true;

        const success = await googleIntegration.stopSupplierTracking();

        if (success) {
            toast.add({
                severity: 'info',
                summary: 'Tracking Detenido',
                detail: 'Ya no se comparte tu ubicación',
                life: 3000
            });

            emit('trackingStopped');
        }

    } catch (error) {
        console.error('[ERROR] Error deteniendo tracking:', error);

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error deteniendo tracking: ${error.message}`,
            life: 5000
        });
    } finally {
        isStoppingTracking.value = false;
    }
};

/**
 * Centra el mapa en un supplier específico
 */
const centerOnSupplier = (supplier) => {
    if (supplier.location) {
        googleIntegration.maps.centerMap(supplier.location, 16);
    } else {
        console.warn('[WARN] Supplier sin ubicación:', supplier.id);
    }
};

/**
 * Enfoca un supplier específico
 */
const focusSupplier = (supplier) => {
    centerOnSupplier(supplier);
    emit('supplierSelected', supplier);
};

/**
 * Obtiene la velocidad actual
 */
const getCurrentSpeed = () => {
    return googleIntegration.geolocation.getCurrentSpeed() || 0;
};

/**
 * Formatea coordenadas para mostrar
 */
const formatCoordinates = (location) => {
    if (!location || !location.coords) return 'N/A';
    return `${location.coords.lat.toFixed(6)}, ${location.coords.lng.toFixed(6)}`;
};

/**
 * Formatea la última actualización
 */
const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Nunca';

    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
        return `hace ${minutes}m ${seconds}s`;
    } else {
        return `hace ${seconds}s`;
    }
};

// Watch for changes in suppliers/clients data
watch(() => [props.suppliersData, props.clientsData], () => {
    console.log('[INFO] Suppliers/Clients data updated, reloading map...');
    loadActiveSuppliers();
}, { deep: true });

// Lifecycle
onMounted(() => {
    initializeMap();
});

onUnmounted(() => {
    // Cleanup
    if (unsubscribeUpdates.value) {
        unsubscribeUpdates.value();
    }

    if (isTrackingActive.value) {
        googleIntegration.stopSupplierTracking();
    }

    googleIntegration.geolocation.stopTracking();
});

// Watchers
watch(() => googleIntegration.isFullyInitialized.value, (isInitialized) => {
    if (isInitialized) {
        console.log('[OK] Google Integration completamente inicializada');
    }
});
</script>

<style scoped>
.real-time-map-container {
    position: relative;
    width: 100%;
    height: 600px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 1000;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.map-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.map-title h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #333;
}

.map-title i {
    color: #2196F3;
    font-size: 1.5rem;
}

.map-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.map-container {
    width: 100%;
    height: 100%;
    margin-top: 80px;
}

.map-info-panel {
    position: absolute;
    top: 100px;
    right: 1rem;
    width: 300px;
    max-height: 400px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    padding: 1rem;
    z-index: 1000;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.supplier-info h4,
.suppliers-info h4 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.1rem;
}

.location-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.detail-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
}

.detail-item i {
    color: #2196F3;
    width: 16px;
}

.suppliers-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.supplier-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba(0, 0, 0, 0.05);
}

.supplier-item:hover {
    background: rgba(33, 150, 243, 0.1);
    border-color: #2196F3;
}

.supplier-details {
    flex: 1;
}

.supplier-name {
    font-weight: 500;
    color: #333;
    font-size: 0.95rem;
}

.supplier-status {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
    color: #666;
    margin-top: 2px;
}

.map-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.map-loading-overlay p {
    margin-top: 1rem;
    color: #666;
    font-size: 1rem;
}

.map-error {
    position: absolute;
    top: 100px;
    left: 1rem;
    right: 1rem;
    z-index: 1000;
}

/* Responsive */
@media (max-width: 768px) {
    .map-header {
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem;
    }

    .map-container {
        margin-top: 120px;
    }

    .map-info-panel {
        position: static;
        width: 100%;
        margin: 1rem;
        max-height: none;
    }

    .real-time-map-container {
        height: 500px;
    }
}
</style>