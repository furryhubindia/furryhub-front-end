interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Get fallback coordinates for common Indian postal codes
 * This ensures registration works even when geocoding service is unavailable
 */
const getFallbackCoordinates = (postalCode: string): GeocodeResult | null => {
  const fallbackMap: { [key: string]: GeocodeResult } = {
    // Major cities - using approximate coordinates for postal code areas
    '110001': { latitude: 28.6139, longitude: 77.2090, displayName: 'New Delhi, Delhi' },
    '400001': { latitude: 18.9220, longitude: 72.8347, displayName: 'Mumbai, Maharashtra' },
    '560001': { latitude: 12.9716, longitude: 77.5946, displayName: 'Bangalore, Karnataka' },
    '700001': { latitude: 22.5726, longitude: 88.3639, displayName: 'Kolkata, West Bengal' },
    '600001': { latitude: 13.0827, longitude: 80.2707, displayName: 'Chennai, Tamil Nadu' },
    '380001': { latitude: 23.0225, longitude: 72.5714, displayName: 'Ahmedabad, Gujarat' },
    '500001': { latitude: 17.3850, longitude: 78.4867, displayName: 'Hyderabad, Telangana' },
    '302001': { latitude: 26.9124, longitude: 75.7873, displayName: 'Jaipur, Rajasthan' },
    '411001': { latitude: 18.5204, longitude: 73.8567, displayName: 'Pune, Maharashtra' },
    '530017': { latitude: 17.6868, longitude: 83.2185, displayName: 'Visakhapatnam, Andhra Pradesh' },
    // Add more as needed
  };

  // Check for exact match
  if (fallbackMap[postalCode]) {
    return fallbackMap[postalCode];
  }

  // Check for postal code prefix (first 3 digits for city area)
  const prefix = postalCode.substring(0, 3);
  const cityFallbacks: { [key: string]: GeocodeResult } = {
    '110': { latitude: 28.6139, longitude: 77.2090, displayName: 'Delhi, India' },
    '400': { latitude: 19.0760, longitude: 72.8777, displayName: 'Mumbai, Maharashtra' },
    '560': { latitude: 12.9716, longitude: 77.5946, displayName: 'Bangalore, Karnataka' },
    '700': { latitude: 22.5726, longitude: 88.3639, displayName: 'Kolkata, West Bengal' },
    '600': { latitude: 13.0827, longitude: 80.2707, displayName: 'Chennai, Tamil Nadu' },
    '380': { latitude: 23.0225, longitude: 72.5714, displayName: 'Ahmedabad, Gujarat' },
    '500': { latitude: 17.3850, longitude: 78.4867, displayName: 'Hyderabad, Telangana' },
    '302': { latitude: 26.9124, longitude: 75.7873, displayName: 'Jaipur, Rajasthan' },
    '411': { latitude: 18.5204, longitude: 73.8567, displayName: 'Pune, Maharashtra' },
    '530': { latitude: 17.6868, longitude: 83.2185, displayName: 'Visakhapatnam, Andhra Pradesh' },
  };

  if (cityFallbacks[prefix]) {
    return cityFallbacks[prefix];
  }

  return null;
};

/**
 * Geocode a postal code to get latitude and longitude coordinates
 * Uses fallback coordinates first, then Nominatim API as backup
 */
export const geocodePostalCode = async (postalCode: string, country: string = 'IN'): Promise<GeocodeResult> => {
  if (!postalCode.trim()) {
    throw new Error('Postal code is required');
  }

  // First try fallback coordinates (works offline and avoids CORS issues)
  const fallbackCoordinates = getFallbackCoordinates(postalCode);
  if (fallbackCoordinates) {
    console.log('Using fallback coordinates for postal code:', postalCode, fallbackCoordinates);
    return fallbackCoordinates;
  }

  try {
    // Fallback to Nominatim API if no predefined coordinates
    const query = `${postalCode}, ${country}`;
    const encodedQuery = encodeURIComponent(query);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1&countrycodes=${country.toLowerCase()}`,
      {
        headers: {
          'User-Agent': 'FurryHub/1.0 (furryhubindia@gmail.com)'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding service error: ${response.status}`);
    }

    const data: NominatimResponse[] = await response.json();

    if (data.length === 0) {
      throw new Error('Postal code not found. Please check the postal code and try again.');
    }

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to geocode postal code. Please try again later.');
  }
};

/**
 * Validate postal code format (basic validation for India)
 * Indian postal codes are 6 digits
 */
export const validatePostalCode = (postalCode: string): boolean => {
  const indiaPostalCodeRegex = /^[1-9][0-9]{5}$/;
  return indiaPostalCodeRegex.test(postalCode.trim());
};
