// src/composables/useGoogleMaps.js

export function useGoogleMaps() {
  /**
   * Open Google Maps app for navigation
   */
  const openNavigation = async (destination, origin = null) => {
    try {
      let mapsUrl;

      if (origin) {
        // Navigation from origin to destination
        mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`;
      } else {
        // Navigation to destination from current location
        mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
      }

      console.log('🗺️ Opening navigation:', mapsUrl);

      // On mobile, try to open native app first
      if (typeof window !== 'undefined') {
        window.open(mapsUrl, '_blank');
      }

      return { success: true, url: mapsUrl };

    } catch (error) {
      console.error('Error opening navigation:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Calculate rough distance between coordinates (Haversine formula)
   */
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return {
      success: true,
      distance: `${distance.toFixed(1)} km`,
      distanceValue: Math.round(distance * 1000) // meters
    };
  };

  /**
   * Open address in maps
   */
  const openAddress = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

    if (typeof window !== 'undefined') {
      window.open(mapsUrl, '_blank');
    }

    return { success: true, url: mapsUrl };
  };

  return {
    // Methods
    openNavigation,
    calculateDistance,
    openAddress
  };
}