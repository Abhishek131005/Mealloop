import React, { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Combobox, Transition } from '@headlessui/react';

// Load Google Maps API key from environment variables
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const libraries = ['places'];
const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '8px',
  marginTop: '0.5rem',
};

const center = {
  lat: 20.5937,  // Default to India's center
  lng: 78.9629,
};

const options = {
  disableDefaultUI: true,
  zoomControl: true,
};

// Search component for location search
function Search({ panTo, onLocationSelect, setSelected, form, setForm, selectedLocation }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 20.5937, lng: () => 78.9629 },
      radius: 2000,
      componentRestrictions: { country: 'in' },
    },
  });

  // Update the input value when a location is selected
  useEffect(() => {
    if (selectedLocation?.address) {
      setValue(selectedLocation.address, false);
    }
  }, [selectedLocation, setValue]);

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = getLatLng(results[0]);
      
      panTo({ lat, lng });
      const location = { lat, lng, address };
      setSelected(location);
      onLocationSelect(location);
      
      if (form && setForm) {
        setForm(prev => ({
          ...prev,
          lat,
          lng,
          address
        }));
      }
    } catch (error) {
      console.error('Error: ', error);
    }
  };

  return (
    <div className="relative">
      <Combobox value={value} onChange={handleSelect}>
        <div className="relative">
          <Combobox.Input
            className="w-full rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm py-2.5 pl-4 pr-10 text-sm leading-5 text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/50 shadow-sm transition-colors duration-200"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search for a location..."
            disabled={!ready}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </Combobox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setValue('')}
        >
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-white/30 bg-white/80 backdrop-blur-sm py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {status === 'OK' &&
              data.map(({ place_id, description }) => (
                <Combobox.Option
                  key={place_id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-blue-600 text-white' : 'text-gray-900'
                    }`
                  }
                  value={description}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        {description}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))}
          </Combobox.Options>
        </Transition>
      </Combobox>
    </div>
  );
}

export default function LocationPicker({ onLocationSelect, defaultLocation = null, form, setForm }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [selected, setSelected] = useState(null);
  const mapRef = useRef();

  useEffect(() => {
    if (defaultLocation) {
      setSelected({ lat: defaultLocation.lat, lng: defaultLocation.lng });
      if (form && setForm) {
        setForm(prev => ({
          ...prev,
          lat: defaultLocation.lat,
          lng: defaultLocation.lng,
          address: defaultLocation.address || ''
        }));
      }
    }
  }, [defaultLocation, form, setForm]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const panTo = useCallback(({ lat, lng }) => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(14);
    }
  }, []);

  const handleMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const location = { lat, lng };
    
    // Get address using reverse geocoding
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address;
        setSelected(location);
        onLocationSelect({ ...location, address });
        
        if (form && setForm) {
          setForm(prev => ({
            ...prev,
            lat,
            lng,
            address
          }));
        }
      }
    });
  }, [onLocationSelect, form, setForm]);

  if (loadError) return <div>Error loading maps. Please check your internet connection.</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="location-picker space-y-4 bg-white/30 backdrop-blur-md p-4 rounded-lg shadow-lg border border-white/20">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Donation Pickup Location</h3>
        <p className="text-sm text-gray-600">Search for your location or click on the map to select it.</p>
      </div>
      <Search 
        panTo={panTo} 
        onLocationSelect={(location) => {
          setSelected(location);
          onLocationSelect(location);
        }} 
        setSelected={setSelected}
        form={form}
        setForm={setForm}
        selectedLocation={selected}
      />
      <div className="h-64 w-full rounded-lg overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={selected ? 14 : 4}
          center={selected || center}
          options={options}
          onClick={handleMapClick}
          onLoad={onMapLoad}
        >
          {selected && (
            <Marker 
              position={selected}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233B82F6" width="40" height="40"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'
                )}`,
                scaledSize: new window.google.maps.Size(40, 40),
                anchor: new window.google.maps.Point(20, 40),
              }}
            />
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
