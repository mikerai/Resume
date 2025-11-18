// src/composables/useGeolocation.js

import { ref, computed } from 'vue';
import { Geolocation } from '@capacitor/geolocation';

export function useGeolocation() {
    const currentPosition = ref(null);
    const isLocationEnabled = ref(false);
    const isLoading = ref(false);
    const lastUpdateTime = ref(null);
    const locationHistory = ref([]);

    /**
     * Check and request location permissions
     */
    const requestLocationPermission = async () => {
        try {
            console.log('📍 Requesting location permissions...');

            const permissions = await Geolocation.checkPermissions();
            console.log('📍 Current permissions:', permissions);

            if (permissions.location !== 'granted') {
                const requestResult = await Geolocation.requestPermissions();
                console.log('📍 Permission request result:', requestResult);

                if (requestResult.location === 'granted') {
                    isLocationEnabled.value = true;
                    return true;
                } else {
                    console.log('❌ Location permission denied');
                    isLocationEnabled.value = false;
                    return false;
                }
            } else {
                isLocationEnabled.value = true;
                return true;
            }

        } catch (error) {
            console.error('Error requesting location permission:', error);
            isLocationEnabled.value = false;
            return false;
        }
    };

    /**
     * Get current position once
     */
    const getCurrentPosition = async (options = {}) => {
        try {
            isLoading.value = true;

            // Check permissions first
            const hasPermission = await requestLocationPermission();
            if (!hasPermission) {
                throw new Error('Location permission not granted');
            }

            const defaultOptions = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000, // 1 minute
                ...options
            };

            console.log('📍 Getting current position...');
            const position = await Geolocation.getCurrentPosition(defaultOptions);

            const locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date(position.timestamp).toISOString(),
                altitude: position.coords.altitude,
                heading: position.coords.heading,
                speed: position.coords.speed
            };

            currentPosition.value = locationData;
            lastUpdateTime.value = new Date().toISOString();

            // Add to history
            locationHistory.value.unshift(locationData);
            // Keep only last 10 positions
            if (locationHistory.value.length > 10) {
                locationHistory.value = locationHistory.value.slice(0, 10);
            }

            console.log('📍 Position obtained:', locationData);
            return locationData;

        } catch (error) {
            console.error('Error getting current position:', error);
            throw new Error(`Failed to get location: ${error.message}`);
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers

        return distance;
    };

    /**
     * Convert degrees to radians
     */
    const toRadians = (degrees) => {
        return degrees * (Math.PI / 180);
    };

    /**
     * Check-in at job location
     */
    const checkInAtJob = async (job, allowedRadiusMeters = 100) => {
        try {
            console.log('📍 Attempting check-in for job:', job.id);

            const position = await getCurrentPosition();

            const { useAuth } = await import('./useAuth.js');
            const { user } = useAuth();

            const checkInData = {
                jobId: job.id,
                technicianId: user.value?.id || 'demo-technician-id',
                location: position,
                checkInTime: new Date().toISOString(),
                accuracy: position.accuracy,
                address: job.address || 'Unknown address',
                notes: `Check-in for ${job.title}`
            };

            console.log('📡 Saving check-in to backend...', checkInData);

            // Send check-in to Supabase
            const { useSupabaseAPI } = await import('./useSupabaseAPI.js');
            const { saveCheckIn } = useSupabaseAPI();

            const result = await saveCheckIn(checkInData);

            if (result.success) {
                console.log('✅ Check-in saved successfully');
                return {
                    success: true,
                    data: { ...checkInData, id: result.data[0]?.id },
                    message: 'Check-in successful'
                };
            } else {
                console.error('❌ Failed to save check-in:', result.error);
                return {
                    success: false,
                    message: `Check-in failed: ${result.error}`
                };
            }

        } catch (error) {
            console.error('Error during check-in:', error);
            return {
                success: false,
                message: `Check-in failed: ${error.message}`
            };
        }
    };

    /**
     * Get check-in history for current technician
     */
    const getCheckInHistory = async (limit = 50) => {
        try {
            const { useAuth } = await import('./useAuth.js');
            const { user } = useAuth();

            const technicianId = user.value?.id || 'demo-technician-id';

            const { useSupabaseAPI } = await import('./useSupabaseAPI.js');
            const { getCheckInHistory: getHistory } = useSupabaseAPI();

            const result = await getHistory(technicianId, limit);

            if (result.success) {
                console.log('✅ Check-in history loaded');
                return result.data;
            } else {
                console.error('❌ Failed to load check-in history:', result.error);
                return [];
            }

        } catch (error) {
            console.error('Error loading check-in history:', error);
            return [];
        }
    };

    // Computed properties
    const lastKnownLocation = computed(() => {
        return currentPosition.value || (locationHistory.value.length > 0 ? locationHistory.value[0] : null);
    });

    const locationAccuracy = computed(() => {
        return currentPosition.value?.accuracy ? `±${Math.round(currentPosition.value.accuracy)}m` : 'Unknown';
    });

    return {
        // State
        currentPosition,
        isLocationEnabled,
        isLoading,
        lastUpdateTime,
        locationHistory,
        lastKnownLocation,
        locationAccuracy,

        // Methods
        requestLocationPermission,
        getCurrentPosition,
        checkInAtJob,
        getCheckInHistory,

        // Utilities
        calculateDistance
    };
}