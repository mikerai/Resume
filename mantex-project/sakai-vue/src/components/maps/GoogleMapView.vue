<template>
  <div ref="mapContainer" :style="{ height, width: '100%' }" class="google-map-container"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { useGoogleMaps } from '@/composables/useGoogleMaps';

const props = defineProps({
  markers: {
    type: Array,
    default: () => []
    // Expected format: [{ lat, lng, title, color, info }]
  },
  height: {
    type: String,
    default: '400px'
  },
  zoom: {
    type: Number,
    default: 12
  },
  center: {
    type: Object,
    default: () => ({ lat: 19.4326, lng: -99.1332 }) // Mexico City default
  }
});

const mapContainer = ref(null);
const { initializeMap, addMarker, removeMarker, fitMarkersInView } = useGoogleMaps();
let mapInstance = null;
let markerIds = [];

const markerColors = {
  red: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
  blue: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  green: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
  yellow: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  purple: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png'
};

const init = async () => {
  if (mapContainer.value) {
    try {
      mapInstance = await initializeMap(mapContainer.value, {
        center: props.center,
        zoom: props.zoom
      });
      updateMarkers();
    } catch (error) {
      console.error('Error initializing map in GoogleMapView:', error);
    }
  }
};

const updateMarkers = () => {
  if (!mapInstance) return;

  // Clear existing markers
  markerIds.forEach(id => removeMarker(id));
  markerIds = [];

  if (props.markers.length === 0) return;

  props.markers.forEach((markerData, index) => {
    if (!markerData.lat || !markerData.lng) return;

    const id = `marker-${index}`;
    addMarker(id, { lat: parseFloat(markerData.lat), lng: parseFloat(markerData.lng) }, {
      title: markerData.title || '',
      icon: markerColors[markerData.color] || markerColors.red,
      infoContent: markerData.info ? `<div style="padding: 8px;"><strong>${markerData.title}</strong><br/>${markerData.info}</div>` : null
    });
    
    markerIds.push(id);
  });

  // Fit map to show all markers
  if (props.markers.length > 0) {
    fitMarkersInView();
  }
};

onMounted(() => {
  init();
});

watch(() => props.markers, () => {
  updateMarkers();
}, { deep: true });

// Cleanup is handled by useGoogleMaps onUnmounted, but we can clear local refs if needed
</script>

<style scoped>
.google-map-container {
  border-radius: 8px;
  overflow: hidden;
}
</style>
