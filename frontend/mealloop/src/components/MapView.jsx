// src/components/MapView.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem',
  overflow: 'hidden',
  position: 'relative'
};

const defaultCenter = {
  lat: 12.9716, // Default to Bangalore
  lng: 77.5946
};

const defaultOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  zoomControl: true,
  gestureHandling: 'auto',
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

const MapView = ({ 
  center = defaultCenter, 
  markers = [], 
  origin, 
  destination, 
  userPosition, 
  zoom = 13,
  onSelect 
}) => {
  const [map, setMap] = useState(null);
  const [directions, setDirections] = useState(null);
  const directionsCallback = useRef(null);
  const markerRefs = useRef([]);
  const mapRef = useRef();
  const isMounted = useRef(true);

  // Handle map load
  const onLoad = useCallback((map) => {
    mapRef.current = map;
    setMap(map);
  }, []);

  // Handle map unload
  const onUnmount = useCallback(() => {
    setMap(null);
    mapRef.current = null;
  }, []);

  // Handle directions when origin or destination changes
  useEffect(() => {
    if (!map || !origin || !destination) return;

    const directionsService = new window.google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: new window.google.maps.LatLng(origin.position.lat, origin.position.lng),
        destination: new window.google.maps.LatLng(destination.position.lat, destination.position.lng),
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && isMounted.current) {
          directionsCallback.current = result;
          setDirections(result);
          
          // Adjust the map bounds to show the entire route
          const bounds = new window.google.maps.LatLngBounds();
          result.routes[0].legs.forEach(leg => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          
          // Add padding to the map
          const padding = 50;
          map.fitBounds(bounds, {
            top: padding,
            right: padding,
            bottom: padding,
            left: padding
          });
        }
      }
    );
    
    return () => {
      if (directionsCallback.current) {
        directionsCallback.current = null;
        setDirections(null);
      }
    };
  }, [origin, destination, map]);

  // Handle markers and center/zoom
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markerRefs.current.forEach(marker => marker.setMap(null));
    markerRefs.current = [];

    // Small delay to ensure the map container is properly sized
    const timer = setTimeout(() => {
      if (!isMounted.current) return;
      
      if (markers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        let hasValidMarkers = false;
        
        // Add markers and extend bounds
        markers.forEach(markerData => {
          const position = markerData.position || { lat: markerData.lat, lng: markerData.lng };
          if (!position || position.lat === undefined || position.lng === undefined) return;
          
          hasValidMarkers = true;
          const marker = new window.google.maps.Marker({
            position,
            map,
            title: markerData.title || 'Location',
            icon: markerData.icon || 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          });
          
          markerRefs.current.push(marker);
          bounds.extend(position);
        });
        
        // Include user position in bounds if available
        if (userPosition && userPosition.lat && userPosition.lng) {
          bounds.extend(userPosition);
        }
        
        // If we have a valid bounds, fit the map to it
        if (hasValidMarkers && !bounds.isEmpty()) {
          map.fitBounds(bounds, {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50
          });
        }
      } else if (center) {
        // If no markers, center on the provided center
        map.setCenter(center);
        map.setZoom(zoom);
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      isMounted.current = false;
    };
  }, [map, markers, center, zoom, userPosition]);

  const handleMarkerClick = useCallback((marker) => {
    if (onSelect) {
      onSelect(marker);
    }
  }, [onSelect]);

  return (
    <div className="w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center || defaultCenter}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={defaultOptions}
      >
        {/* Show directions if available */}
        {directions && <DirectionsRenderer directions={directions} />}
        
        {/* Show markers if no directions */}
        {!directions && markers.map((marker, index) => {
          const position = marker.position || { lat: marker.lat, lng: marker.lng };
          if (!position || position.lat === undefined || position.lng === undefined) return null;
          
          return (
            <Marker
              key={`${marker.id || index}-${position.lat}-${position.lng}`}
              position={position}
              onClick={() => handleMarkerClick(marker)}
              title={marker.title || 'Location'}
              icon={{
                url: marker.icon || 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new window.google.maps.Size(32, 32)
              }}
            />
          );
        })}
        
        {/* Show user location if available */}
        {userPosition && userPosition.lat && userPosition.lng && (
          <Marker
            position={userPosition}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new window.google.maps.Size(32, 32)
            }}
            title="Your Location"
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default MapView;