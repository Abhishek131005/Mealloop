// src/pages/DonorDashboard.jsx
import { useEffect, useMemo, useState, useContext, useCallback } from 'react';
import LocationPicker from '../components/LocationPicker';
import ShelterMapPicker from '../components/ShelterMapPicker';
import TimePicker from '../components/TimePicker';
import { format } from 'date-fns';
import DashboardSidebar from '../components/DashboardSidebar';
import { GlobalContext } from '../context/GlobalContext';
import UploadImage from '../components/UploadImage';
import useGeolocation from '../hooks/useGeolocation';
import useSocket from '../hooks/useSocket';
import {
  postDonation, getMyDonations, updateDonation,
  deleteDonation, getMyDonationHistory
} from '../services/api';

export default function DonorDashboard() {
  const [editDonation, setEditDonation] = useState(null);
  const [newDonationCount, setNewDonationCount] = useState(0);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const { user, location, setLocation } = useContext(GlobalContext);
  const [activeTab, setActiveTab] = useState('post');
  const { pos } = useGeolocation();
  const socketRef = useSocket(); // listens to server events
  const [donations, setDonations] = useState([]);
  const [history, setHistory] = useState([]);
  const [img, setImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingDonations, setIsLoadingDonations] = useState(true);
  const [error, setError] = useState(null);

  // form local state
  const [form, setForm] = useState({
    title: '', 
    quantity: '', 
    pickupStart: '', 
    pickupEnd: '',
    address: '', 
    lat: '', 
    lng: '',
    shelterAddress: '',
    shelterLat: '',
    shelterLng: ''
  });

  // Fetch donations when the component mounts and when the user changes
  useEffect(() => {
    // Only fetch if we have a user
    if (!user) {
      console.log('No user found, clearing donations');
      setDonations([]);
      setHistory([]);
      setIsLoadingDonations(false);
      return;
    }
    
    const fetchDonations = async () => {
      console.log(`Fetching donations for user: ${user.id} (${user.email})`);
      setIsLoadingDonations(true);
      setError(null);
      
      try {
        // Get the JWT token from localStorage
        const token = localStorage.getItem('jwt_token');
        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }

        // First try to fetch donations
        console.log('Fetching donations with token:', token.substring(0, 10) + '...');
        const donations = await getMyDonations();
        console.log('Donations API response:', donations);
        
        if (donations) {
          // Ensure we have an array
          const donationsArray = Array.isArray(donations) ? donations : [donations];
          console.log(`Found ${donationsArray.length} donations for user`);
          
          // Process the donations data
          const processedDonations = donationsArray.map(d => ({
            ...d,
            id: d._id || d.id,
            title: d.title || 'No title',
            quantity: d.quantity || 'Unknown',
            pickupStart: d.pickupStart || new Date().toISOString(),
            pickupEnd: d.pickupEnd || new Date(Date.now() + 3600000).toISOString(),
            address: d.address || 'No address provided',
            status: d.status || 'Pending',
            photoUrl: d.photoUrl || 'https://via.placeholder.com/150',
            // Ensure donor info is properly set
            donor: d.donor || {
              _id: user.id,
              name: user.name,
              email: user.email
            }
          }));
          
          setDonations(processedDonations);
          
          // Try to fetch history (if the endpoint exists)
          try {
            const histRes = await getMyDonationHistory();
            if (histRes && histRes.data) {
              console.log(`Found ${histRes.data.length} historical donations`);
              setHistory(histRes.data);
            }
          } catch (histError) {
            console.warn('Could not load donation history (endpoint might not exist):', histError);
            setHistory([]);
          }
        } else {
          console.log('No donations data received');
          setDonations([]);
        }
        
      } catch (e) {
        console.error('Failed to fetch donations:', e);
        setError('Failed to load your donations. ' + (e.response?.data?.message || e.message || 'Please try again.'));
      } finally {
        setIsLoadingDonations(false);
      }
    };
    
    fetchDonations();
    
    // Add event listener for new donations
    const handleNewDonation = (newDonation) => {
      console.log('New donation received:', newDonation);
      setDonations(prev => [{
        ...newDonation,
        id: newDonation._id || newDonation.id
      }, ...prev]);
    };
    
    if (socketRef.current) {
      socketRef.current.on('new-donation', handleNewDonation);
    }
    
    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.off('new-donation', handleNewDonation);
      }
      // You could add request cancellation here if using axios cancel tokens
    };
  }, [user?.id]); // Only re-run if user ID changes

  useEffect(() => {
    if (pos) {
      setForm((f) => ({ ...f, lat: pos.lat, lng: pos.lng }));
      setLocation(pos); // update global location state
    }
  }, [pos, setLocation]);

  // socket: live status updates
  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;
    s.on('donation:updated', (updated) => {
      setDonations((prev) => prev.map(d => d.id === updated.id ? updated : d));
    });
    s.on('donation:new-status', (payload) => {
      setDonations((prev) => prev.map(d => d.id === payload.id ? { ...d, status: payload.status } : d));
    });
    return () => {
      s.off('donation:updated');
      s.off('donation:new-status');
    };
  }, [socketRef]);

  const handlePost = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!img || !img.url) {
      alert('Please upload a photo before submitting.');
      setLoading(false);
      return;
    }

    if (!form.shelterLat || !form.shelterLng) {
      alert('Please select a shelter location before submitting.');
      setLoading(false);
      return;
    }

    // Create a temporary ID for optimistic UI update
    const tempId = Date.now().toString();
    
    // Create the donation payload
    const payload = {
      ...form,
      photoUrl: img?.url || '',
      donor: user?._id,
      status: 'Pending',
      // Ensure shelter location is included
      shelterAddress: form.shelterAddress || form.address, // Fallback to pickup address if shelter address not set
      shelterLat: form.shelterLat || form.lat,
      shelterLng: form.shelterLng || form.lng
    };

    try {
      // Optimistically update the UI
      setDonations(prev => [
        { ...payload, _id: tempId, id: tempId, donor: user },
        ...prev
      ]);
      setNewDonationCount(prev => prev + 1);

      // Submit the donation to the server
      console.log('Submitting donation:', payload);
      const response = await postDonation(payload);
      console.log('Server response:', response);

      if (response.data) {
        // Update the donation with server response data
        setDonations(prev =>
          prev.map(d => 
            d.id === tempId 
              ? { ...response.data, id: response.data._id || response.data.id }
              : d
          )
        );
      }

      // Reset form but keep shelter information
      setForm({
        title: '',
        quantity: '',
        pickupStart: '',
        pickupEnd: '',
        address: '',
        lat: '',
        lng: '',
        shelterAddress: form.shelterAddress, // Keep shelter info
        shelterLat: form.shelterLat,
        shelterLng: form.shelterLng
      });
      setImg(null);

      // Refresh donations from server to ensure consistency
      try {
        const updatedDonations = await getMyDonations();
        console.log('Refreshed donations:', updatedDonations);
        setDonations(updatedDonations.data || []);
      } catch (refreshError) {
        console.error('Error refreshing donations:', refreshError);
        // Don't show error to user for refresh failure
      }
    } catch (e) {
      console.error('Error submitting donation:', e);
      
      // Remove the optimistically added donation
      setDonations(prev => prev.filter(d => d.id !== tempId));
      
      // Show error to user
      setError('Failed to submit donation. Please try again.');
      
      // Re-throw the error to be caught by the outer try-catch
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    // Remove the donation from local state immediately
    setDonations(prev => prev.filter(d => d._id !== id && d.id !== id));
    
    // Update the donation count
    setNewDonationCount(prev => Math.max(0, prev - 1));
    
    // Send delete request in the background (don't wait for response)
    deleteDonation(id).catch(console.error);
  };

  const handleEditSubmit = async (e, donationId) => {
    // Note: We don't call e.preventDefault() here since it's already called in the form's onSubmit
    
    try {
      console.log('Starting update for donation ID:', donationId);
      
      const formData = new FormData(e.target);
      
      // Get all form values
      const updatedData = {
        title: formData.get('title') || '',
        quantity: formData.get('quantity') || '',
        pickupStart: formData.get('pickupStart') || '',
        pickupEnd: formData.get('pickupEnd') || '',
        address: formData.get('address') || '',
        lat: formData.get('lat') || '',
        lng: formData.get('lng') || '',
      };

      // Log the data being sent for debugging
      console.log('Updating donation with data:', {
        donationId,
        updatedData
      });

      console.log('Sending update request...');
      const response = await updateDonation(donationId, updatedData);
      
      console.log('Update response:', response);
      
      if (response && response.data) {
        // Update the local state with the updated donation
        setDonations(prev => 
          prev.map(d => (d._id === donationId || d.id === donationId) ? { ...d, ...response.data } : d)
        );
        
        // Also update the history if the donation exists there
        setHistory(prev => 
          prev.map(d => (d._id === donationId || d.id === donationId) ? { ...d, ...response.data } : d)
        );
        
        console.log('Donation updated successfully');
        setEditDonation(null); // Close the edit modal
      } else {
        throw new Error('No data returned from server');
      }
    } catch (error) {
      console.error('Failed to update donation:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        donationId,
        formData: e.target ? Object.fromEntries(new FormData(e.target).entries()) : 'No form data'
      });
      
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'An unknown error occurred while updating the donation.';
      
      alert(`Failed to update donation: ${errorMessage}`);
    }
  };

  const pending = useMemo(() => donations.filter(d => d.status === 'Pending'), [donations]);

  const donorTabs = [
    { key: "post", label: "Post Food", icon: "📦" },
    { 
      key: "active", 
      label: "Active Donations", 
      icon: (
        <span className="relative">
          🔔
          {newDonationCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-xs px-2 py-0.5">
              {newDonationCount}
            </span>
          )}
        </span>
      ) 
    },
    { key: "history", label: "Pickup History", icon: "📜" }
  ];

  // Handle tab change
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    // Reset any error states when changing tabs
    setError(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar 
        tabs={donorTabs} 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        role="Donor" 
      />
      <main className="flex-1 p-8">
        {activeTab === "post" && (
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-4">Post Food</h2>
            <form onSubmit={handlePost} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="input" placeholder="Title (e.g., Veg Biryani)" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required />
              <input className="input" placeholder="Quantity (e.g., 6 boxes)" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} required />
              <TimePicker 
                value={form.pickupStart} 
                onChange={(value) => setForm({...form, pickupStart: value})} 
                label="Pickup Start Time"
              />
              <TimePicker 
                value={form.pickupEnd} 
                onChange={(value) => setForm({...form, pickupEnd: value})} 
                label="Pickup End Time"
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pickup Location
                </label>
                <LocationPicker 
                  onLocationSelect={({ lat, lng, address = '' }) => {
                    console.log('Location selected:', { lat, lng, address });
                    setForm(prev => ({
                      ...prev,
                      lat: lat.toString(),
                      lng: lng.toString(),
                      address: address || prev.address
                    }));
                  }}
                  defaultLocation={form.lat && form.lng ? { 
                    lat: parseFloat(form.lat), 
                    lng: parseFloat(form.lng) 
                  } : null}
                  placeholder="Enter pickup location"
                  className="w-full"
                />
                <input type="hidden" name="lat" value={form.lat} />
                <input type="hidden" name="lng" value={form.lng} />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Shelter/Drop-off Location
                </label>
                <ShelterMapPicker
                  onSelect={({ lat, lng, address }) => {
                    console.log('Shelter selected:', { lat, lng, address });
                    setForm(prev => ({
                      ...prev,
                      shelterLat: lat.toString(),
                      shelterLng: lng.toString(),
                      shelterAddress: address
                    }));
                  }}
                  defaultLocation={form.shelterLat && form.shelterLng ? {
                    lat: parseFloat(form.shelterLat),
                    lng: parseFloat(form.shelterLng),
                    address: form.shelterAddress
                  } : null}
                  placeholder="Search for a shelter or drop-off location"
                  className="w-full"
                />
                <input type="hidden" name="shelterLat" value={form.shelterLat} />
                <input type="hidden" name="shelterLng" value={form.shelterLng} />
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <div>
                  <UploadImage onUploaded={imgObj => setImg(imgObj)} label="Upload Food Photo" />
                  {!img?.url && <p className="text-red-500 text-xs mt-1">* Photo required</p>}
                </div>
                {img?.url && <img src={img.url} alt="Food preview" className="h-12 w-12 rounded object-cover" />}
              </div>
              <div className="md:col-span-2">
                <button disabled={loading} className="btn">{loading ? 'Posting…' : 'Submit Donation'}</button>
              </div>
            </form>
          </div>
        )}
        {activeTab === "active" && !isLoadingDonations && (
          <div className="card mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Active / Pending Posts</h2>
              <button 
                onClick={async () => {
                  setIsLoadingDonations(true);
                  setError(null);
                  
                  try {
                    // First fetch donations
                    const donRes = await getMyDonations();
                    // The response from getMyDonations is already the data array
                    if (donRes) {
                      setDonations(Array.isArray(donRes) ? donRes : [donRes]);
                    }
                    
                    // Then try to fetch history (but don't fail if it doesn't exist)
                    try {
                      const histRes = await getMyDonationHistory();
                      if (histRes && histRes.data) {
                        setHistory(histRes.data);
                      }
                    } catch (histError) {
                      console.warn('Could not load donation history (endpoint might not exist):', histError);
                      // Continue even if history fails
                    }
                    
                  } catch (e) {
                    console.error('Error refreshing donations:', e);
                    setError('Failed to refresh donations. ' + (e.response?.data?.message || e.message || ''));
                  } finally {
                    setIsLoadingDonations(false);
                  }
                }}
                disabled={isLoadingDonations}
                className="flex items-center gap-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-md transition-colors"
              >
                <svg 
                  className={`w-4 h-4 ${isLoadingDonations ? 'animate-spin' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoadingDonations ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {isLoadingDonations ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error! </strong>
                <span className="block sm:inline">{error}</span>
                <button 
                  onClick={() => window.location.reload()} 
                  className="absolute top-0 bottom-0 right-0 px-4 py-3"
                >
                  <span className="sr-only">Reload</span>
                  <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <title>Close</title>
                    <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                  </svg>
                </button>
              </div>
            ) : donations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You don't have any active donations yet.</p>
                <button 
                  onClick={() => setActiveTab('post')} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                >
                  Post Your First Donation
                </button>
              </div>
            ) : (
              <ul className="space-y-4">
                {donations.map((d) => (
                    <li key={d._id || d.id} className="border rounded p-4 dark:border-gray-700 cursor-pointer hover:shadow-lg transition group">
                      <div className="flex justify-between items-center gap-4">
                        <div>
                          <p className="font-semibold">{d.title} <span className="text-sm text-gray-500">({d.quantity})</span></p>
                          <p className="text-sm text-gray-500">{d.address}</p>
                          <span className="text-xs px-2 py-0.5 rounded bg-yellow-200 text-yellow-800">
                            {d.status || 'pending'}
                          </span>
                        </div>
                        {d.photoUrl && <img src={d.photoUrl} alt="Food" className="h-12 w-12 rounded object-cover" />}
                        <div className="flex flex-col gap-2 ml-4">
                          <button 
                            type="button" 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded text-xs" 
                            onClick={e => {e.stopPropagation(); setEditDonation(d);}}
                          >
                            Edit
                          </button>
                          <button 
                            type="button" 
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded text-xs" 
                            onClick={e => {e.stopPropagation(); handleDelete(d._id || d.id);}}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
            {/* Modal for details */}
            {/* Edit Donation Modal */}
            {editDonation && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl relative">
                  <button 
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" 
                    onClick={() => setEditDonation(null)}
                    type="button"
                  >
                    &times;
                  </button>
                  <h3 className="text-lg font-bold mb-4">Edit Donation</h3>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const donationId = editDonation?._id || editDonation?.id;
                      if (!donationId) {
                        console.error('No donation ID found in editDonation:', editDonation);
                        alert('Error: Could not find donation ID. Please try again.');
                        return;
                      }
                      handleEditSubmit(e, donationId);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Title
                      </label>
                      <input 
                        name="title" 
                        className="input w-full" 
                        defaultValue={editDonation.title} 
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Pickup Start Time
                      </label>
                      <input
                        type="datetime-local"
                        name="pickupStart"
                        className="input w-full"
                        value={editDonation.pickupStart ? new Date(editDonation.pickupStart).toISOString().slice(0, 16) : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : new Date();
                          setEditDonation(prev => ({
                            ...prev,
                            pickupStart: date.toISOString()
                          }));
                        }}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Pickup End Time
                      </label>
                      <input
                        type="datetime-local"
                        name="pickupEnd"
                        className="input w-full"
                        value={editDonation.pickupEnd ? new Date(editDonation.pickupEnd).toISOString().slice(0, 16) : ''}
                        min={editDonation.pickupStart ? new Date(editDonation.pickupStart).toISOString().slice(0, 16) : undefined}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : new Date();
                          setEditDonation(prev => ({
                            ...prev,
                            pickupEnd: date.toISOString()
                          }));
                        }}
                        required
                      />
                    </div>
                    
                    {/* Fixed address display */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Pickup Location
                      </label>
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                        {editDonation.address || 'No address provided'}
                      </div>
                      <input type="hidden" name="lat" value={editDonation.lat || ''} />
                      <input type="hidden" name="lng" value={editDonation.lng || ''} />
                      <input type="hidden" name="address" value={editDonation.address || ''} />
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setEditDonation(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {selectedDonation && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl relative">
                  <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setSelectedDonation(null)}>&times;</button>
                  <h3 className="text-lg font-bold mb-2">{selectedDonation.title}</h3>
                  <img src={selectedDonation.photoUrl} alt="Food" className="w-full h-40 object-cover rounded mb-2" />
                  <p><span className="font-semibold">Quantity:</span> {selectedDonation.quantity}</p>
                  <p><span className="font-semibold">Pickup Time:</span> {selectedDonation.pickupStart} → {selectedDonation.pickupEnd}</p>
                  <p><span className="font-semibold">Address:</span> {selectedDonation.address}</p>
                  <p><span className="font-semibold">Status:</span> <span className="px-2 py-0.5 rounded bg-yellow-200 text-yellow-800">{selectedDonation.status}</span></p>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "history" && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Pickup History</h2>
            {history.length === 0 ? (
              <p className="text-gray-500">No completed donations yet.</p>
            ) : (
              <ul className="space-y-3">
                {history.map(h => (
                  <li key={h.id} className="flex justify-between items-center border rounded p-3 dark:border-gray-700">
                    <div>
                      <p className="font-medium">{h.title}</p>
                      <p className="text-xs text-gray-500">Delivered on {h.completedAt}</p>
                    </div>
                    <span className="text-sm px-2 py-0.5 rounded bg-green-200 text-green-800">Completed</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {/* AboutUsSection is now always visible, so no need for tab conditional here */}
      </main>
    </div>
  );
}