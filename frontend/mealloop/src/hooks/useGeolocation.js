// src/hooks/useGeolocation.js
import { useEffect, useState } from 'react';
export default function useGeolocation() {
  const [pos, setPos] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!('geolocation' in navigator)) { setError('Geolocation not supported'); return; }
    const id = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) => setError(err.message),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  return { pos, error };
}