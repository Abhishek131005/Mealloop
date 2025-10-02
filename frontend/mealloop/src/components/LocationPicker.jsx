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
      // Update the form with the default location
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

  const onMapLoad = (map) => {
    mapRef.current = map;
  };

  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(14);
  }, []);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps</div>;

  return (
    <div className="location-picker space-y-2">
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700">Donation Location</label>
        <p className="text-xs text-gray-500">Search or click on the map to select pickup location</p>
      </div>
      <Search 
        panTo={panTo} 
        onLocationSelect={onLocationSelect} 
        setSelected={setSelected}
        form={form}
        setForm={setForm}
      />
      <div className="h-64 w-full rounded-lg overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={selected ? 14 : 4}
          center={selected || center}
          options={options}
          onClick={(e) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setSelected({ lat, lng });
            onLocationSelect({ lat, lng });
          }}
          onLoad={onMapLoad}
        >
          {selected && <Marker position={selected} />}
        </GoogleMap>
      </div>
    </div>
  );
}

function Search({ panTo, onLocationSelect, setSelected, form, setForm }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 20.5937, lng: () => 78.9629 }, // Center on India
      radius: 2000, // 2km radius
      componentRestrictions: { country: 'in' }, // Restrict to India
    },
  });

  // Initialize with the current form address if available
  useEffect(() => {
    if (form?.address && !value) {
      setValue(form.address, false);
    }
  }, [form?.address, setValue]);

  const handleInput = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Update the address in the form as the user types
    if (setForm) {
      setForm(prev => ({
        ...prev,
        address: newValue
      }));
    }
  };

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = getLatLng(results[0]);
      setSelected({ lat, lng });
      panTo({ lat, lng });
      
      // Update the form with the selected location
      if (setForm) {
        setForm(prev => ({
          ...prev,
          lat,
          lng,
          address: address
        }));
      }
      
      onLocationSelect({ lat, lng, address });
    } catch (error) {
      console.error('Error: ', error);
    }
  };

  return (
    <div className="w-full">
      <Combobox value={value} onChange={handleSelect}>
        <div className="relative">
          <div className="relative w-full">
            <Combobox.Input
              className="w-full rounded-md border border-gray-300 bg-gray-700 py-2 pl-3 pr-10 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              displayValue={(value) => value}
              onChange={handleInput}
              onBlur={(e) => {
                // Ensure we don't have an empty address
                if (setForm && e.target.value.trim() === '') {
                  setForm(prev => ({
                    ...prev,
                    address: '',
                    lat: null,
                    lng: null
                  }));
                }
              }}
              placeholder="Search for a location in India"
              disabled={!ready}
              required
            />
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {status === 'OK' && data.length === 0 && value !== '' ? (
                <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                  No locations found.
                </div>
              ) : (
                data.map(({ place_id, description }) => (
                  <Combobox.Option
                    key={place_id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-200'
                      }`
                    }
                    value={description}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {description}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? 'text-white' : 'text-blue-600'
                            }`}
                          >
                            ✓
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
}
