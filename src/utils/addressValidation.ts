interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

/**
 * Validate address against postal code by geocoding both and checking proximity
 */
export const validateAddressWithPostalCode = async (
  address: string,
  postalCode: string,
  country: string = 'IN'
): Promise<{ isValid: boolean; message: string; coordinates?: { lat: number; lng: number } }> => {
  if (!address.trim()) {
    return { isValid: false, message: 'Address is required for validation' };
  }

  if (!postalCode.trim()) {
    return { isValid: false, message: 'Postal code is required for validation' };
  }

  try {
    // Geocode the full address
    const addressQuery = `${address}, ${postalCode}, ${country}`;
    const encodedAddressQuery = encodeURIComponent(addressQuery);

    const addressResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddressQuery}&limit=1&countrycodes=${country.toLowerCase()}`,
      {
        headers: {
          'User-Agent': 'FurryHub/1.0 (furryhubindia@gmail.com)'
        }
      }
    );

    if (!addressResponse.ok) {
      throw new Error('Address geocoding service error');
    }

    const addressData: NominatimResponse[] = await addressResponse.json();

    if (addressData.length === 0) {
      return {
        isValid: false,
        message: 'Address could not be found. Please check the address and try again.'
      };
    }

    const addressResult = addressData[0];
    const addressLat = parseFloat(addressResult.lat);
    const addressLng = parseFloat(addressResult.lon);

    // Geocode just the postal code for comparison
    const postalQuery = `${postalCode}, ${country}`;
    const encodedPostalQuery = encodeURIComponent(postalQuery);

    const postalResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedPostalQuery}&limit=1&countrycodes=${country.toLowerCase()}`,
      {
        headers: {
          'User-Agent': 'FurryHub/1.0 (furryhubindia@gmail.com)'
        }
      }
    );

    if (!postalResponse.ok) {
      throw new Error('Postal code geocoding service error');
    }

    const postalData: NominatimResponse[] = await postalResponse.json();

    if (postalData.length === 0) {
      return {
        isValid: false,
        message: 'Postal code could not be found. Please check the postal code and try again.'
      };
    }

    const postalResult = postalData[0];
    const postalLat = parseFloat(postalResult.lat);
    const postalLng = parseFloat(postalResult.lon);

    // Calculate distance between address coordinates and postal code coordinates
    const distance = calculateDistance(addressLat, addressLng, postalLat, postalLng);

    // Allow up to 10km difference (addresses in same postal code area)
    const maxAllowedDistance = 10; // km

    if (distance <= maxAllowedDistance) {
      return {
        isValid: true,
        message: `Address validated successfully. Distance from postal code center: ${distance.toFixed(1)}km`,
        coordinates: { lat: addressLat, lng: addressLng }
      };
    } else {
      return {
        isValid: false,
        message: `Address appears to be ${distance.toFixed(1)}km away from the postal code area. Please verify the address and postal code match.`
      };
    }

  } catch (error) {
    console.error('Address validation error:', error);
    return {
      isValid: false,
      message: 'Unable to validate address. Please try again or proceed with GPS location.'
    };
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};
