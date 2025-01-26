import { useState, useCallback } from 'react';

export const useGeolocation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get address');
      }

      const data = await response.json();
      
      // Format the address
      const address = {
        formatted: data.display_name,
        name: data.address.building || data.address.amenity || data.address.shop || '',
        street: data.address.road || '',
        houseNumber: data.address.house_number || '',
        city: data.address.city || data.address.town || data.address.village || '',
        state: data.address.state || '',
        postcode: data.address.postcode || '',
      };

      return address;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getLocation,
    isLoading,
    error
  };
}; 