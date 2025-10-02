import { useState, useEffect, useRef } from 'react';
import { LoadScript } from '@react-google-maps/api';
import MapView from './MapView';

// Define libraries to load
const libraries = ['places'];

// Global flag to track if we've attempted to load Google Maps
let googleMapsLoading = false;
let googleMapsLoadListeners = [];

const loadGoogleMaps = (apiKey) => {
  if (window.google && window.google.maps) {
    return Promise.resolve();
  }

  if (googleMapsLoading) {
    return new Promise((resolve) => {
      googleMapsLoadListeners.push(resolve);
    });
  }

  googleMapsLoading = true;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = (error) => {
      console.error('Failed to load Google Maps API:', error);
      reject(error);
    };

    window.initMap = () => {
      googleMapsLoadListeners.forEach(cb => cb());
      googleMapsLoadListeners = [];
      resolve();
    };

    document.head.appendChild(script);
  });
};

const MapContainer = (props) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    const initializeMap = async () => {
      if (window.google && window.google.maps) {
        if (isMounted.current) {
          setIsLoaded(true);
        }
        return;
      }

      try {
        await loadGoogleMaps(googleMapsApiKey);
        if (isMounted.current) {
          setIsLoaded(true);
          setLoadError(null);
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        if (isMounted.current) {
          setLoadError('Failed to load Google Maps. Please check your connection and try again.');
        }
      }
    };

    if (googleMapsApiKey) {
      initializeMap();
    }

    return () => {
      isMounted.current = false;
    };
  }, [googleMapsApiKey]);

  if (!googleMapsApiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-4 max-w-md">
          <h3 className="font-medium text-red-600 mb-2">Google Maps API Key Missing</h3>
          <p className="text-sm text-gray-600">
            Please ensure VITE_GOOGLE_MAPS_API_KEY is set in your .env file
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50 rounded-lg p-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">Map Error</p>
          <p className="text-sm text-gray-600 mt-1">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Reload Map
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading map...</div>
      </div>
    );
  }

  return <MapView {...props} />;
};

export default MapContainer;
