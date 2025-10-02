// src/pages/VolunteerDashboard.jsx
import { useCallback, useEffect, useState } from 'react';
import DashboardSidebar from '../components/DashboardSidebar';
import MapContainer from '../components/MapContainer';
import useGeolocation from '../hooks/useGeolocation';
import {
  getNearbyDonations,
  claimDonation,
  markPickedUp,
  markDelivered,
  getMe,
  getDeliveredDonations,
} from '../services/api';

export default function VolunteerDashboard() {
  const { pos } = useGeolocation();
  const [nearby, setNearby] = useState([]);
  const [deliveredDonations, setDeliveredDonations] = useState([]);
  const [karma, setKarma] = useState(0);
  const [activeTab, setActiveTab] = useState('find');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const center = pos ? { lat: pos.lat, lng: pos.lng } : null;

  // Fetch user data and donations
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userData, donationsData, deliveredData] = await Promise.all([
          getMe(),
          getNearbyDonations({ lat: pos?.lat, lng: pos?.lng }),
          getDeliveredDonations()
        ]);
        
        setKarma(userData.data.karma || 0);
        setNearby(donationsData.data || []);
        setDeliveredDonations(deliveredData || []);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (pos) {
      fetchUserData();
    }
  }, [pos]);

  // Fetch nearby donations
  const fetchDonations = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getNearbyDonations();
      setNearby(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and set up refresh interval
  useEffect(() => {
    const fetchData = async () => {
      await fetchDonations();
      // Set loading to false after initial data fetch
      setIsLoading(false);
    };
    
    fetchData();
    const interval = setInterval(fetchDonations, 30000);
    return () => clearInterval(interval);
  }, [fetchDonations]);

  // Handle donation selection
  const handleDonationSelect = (donation) => {
    setSelectedDonation(donation);
  };

  // Handle claiming a donation
  const handleClaim = async (donation) => {
    try {
      console.log('Claiming donation:', donation);
      const donationId = donation._id || donation.id;
      if (!donationId) {
        console.error('No donation ID found:', donation);
        return;
      }
      await claimDonation(donationId);
      // Update the local state to reflect the change immediately
      setNearby(prevDonations => 
        prevDonations.map(d => 
          (d._id === donationId || d.id === donationId)
            ? { ...d, status: 'Claimed', claimedBy: 'current-user' } // You might want to get the current user ID here
            : d
        )
      );
      setSelectedDonation(null);
      alert('Donation claimed successfully!');
    } catch (error) {
      console.error('Error claiming donation:', error);
      alert('Failed to claim donation. Please try again.');
    }
  };

  // Handle marking a donation as picked up
  const handleMarkPickedUp = async (donation) => {
    try {
      const donationId = donation._id || donation.id;
      if (!donationId) {
        console.error('No donation ID found:', donation);
        alert('Error: Could not identify donation');
        return;
      }
      
      console.log('Marking as picked up:', donationId);
      const response = await markPickedUp(donationId, {});
      console.log('Picked up response:', response);
      
      if (response && response.data && response.data.success) {
        // Update the local state to reflect the change immediately
        setNearby(prevDonations => 
          prevDonations.map(d => 
            (d._id === donationId || d.id === donationId)
              ? { 
                  ...d, 
                  status: 'Picked Up', 
                  pickedUpAt: new Date().toISOString() 
                }
              : d
          )
        );
        
        // Update the selected donation if it's the one being marked
        if (selectedDonation && (selectedDonation._id === donationId || selectedDonation.id === donationId)) {
          setSelectedDonation(prev => ({
            ...prev,
            status: 'Picked Up',
            pickedUpAt: new Date().toISOString()
          }));
        }
        
        // Show success message
        alert('Successfully marked as picked up!');
      } else {
        throw new Error(response?.data?.message || 'Failed to mark as picked up');
      }
    } catch (error) {
      console.error('Error marking donation as picked up:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert(`Failed to mark as picked up: ${error.response?.data?.message || error.message}`);
    }
  };
  
  // Handle marking a donation as delivered
  const handleMarkDelivered = async (donation) => {
    try {
      const donationId = donation._id || donation.id;
      if (!donationId) {
        console.error('No donation ID found:', donation);
        alert('Error: Could not identify donation');
        return;
      }
      
      console.log('Marking as delivered:', donationId);
      const response = await markDelivered(donationId);
      console.log('Delivered response:', response);
      
      if (response && response.data && response.data.success) {
        // Create the delivered donation object
        const deliveredDonation = {
          ...donation,
          status: 'Delivered',
          deliveredAt: new Date().toISOString()
        };
        
        // Add to delivered donations
        setDeliveredDonations(prev => [deliveredDonation, ...prev]);
        
        // Remove from active donations
        setNearby(prevDonations => 
          prevDonations.filter(d => 
            d._id !== donationId && d.id !== donationId
          )
        );
        
        // Clear the selected donation if it's the one being marked
        if (selectedDonation && (selectedDonation._id === donationId || selectedDonation.id === donationId)) {
          setSelectedDonation(null);
        }
        
        // Show success message
        alert('Successfully marked as delivered! Donation moved to Pickup History.');
      } else {
        throw new Error(response?.data?.message || 'Failed to mark as delivered');
      }
    } catch (error) {
      console.error('Error marking donation as delivered:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert(`Failed to mark as delivered: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <DashboardSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        karma={karma} 
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {activeTab === 'find' ? 'Find Donations' : 
               activeTab === 'mypickups' ? 'My Pickups' :
               activeTab === 'active' ? 'Active Pickups' : 'Impact Report'}
            </h1>
          </div>
          
          {activeTab === 'active' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Your Active Pickups</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {nearby
                  .filter(donation => 
                    donation.status === 'Claimed' || donation.status === 'Picked Up'
                  )
                  .map((donation) => (
                    <div
                      key={donation.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-lg">{donation.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            donation.status === 'Claimed' ? 'bg-blue-100 text-blue-800' :
                            donation.status === 'Picked Up' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {donation.status}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                          <span className="font-medium">Quantity:</span> {donation.quantity}
                        </p>
                        {donation.pickedUpAt && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Picked up: {new Date(donation.pickedUpAt).toLocaleString()}
                          </p>
                        )}
                        <div className="mt-4">
                          <button
                            onClick={() => handleDonationSelect(donation)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                {nearby.filter(d => d.status === 'Claimed' || d.status === 'Picked Up').length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No active pickups found</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'find' && (
            <div className="space-y-6">
              {/* Donation List */}
              <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {nearby.length > 0 ? (
                  <div className="space-y-4">
                    {nearby.map((donation) => {
                      const donationId = donation._id || donation.id;
                      const isSelected = selectedDonation && (
                        (selectedDonation._id === donationId) || 
                        (selectedDonation.id === donationId)
                      );
                      
                      return (
                        <div
                          key={donationId}
                          onClick={() => handleDonationSelect(donation)}
                          className={`p-4 rounded-lg shadow cursor-pointer transition-all hover:shadow-lg ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500' 
                              : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{donation.title}</h3>
                              <p className="text-gray-600 dark:text-gray-300">
                                Quantity: {donation.quantity}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-md relative">
                    <MapContainer 
                      center={center || { lat: 12.9716, lng: 77.5946 }} 
                      markers={[]}
                      userPosition={pos}
                      zoom={12}
                    />
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <div className="inline-block bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300">No donations available in your area</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Selected Donation Modal */}
              {selectedDonation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                          {selectedDonation.title}
                        </h2>
                        <button
                          onClick={() => setSelectedDonation(null)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <div className="h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-md">
                            <MapContainer 
                              center={center} 
                              markers={[{
                                position: { 
                                  lat: parseFloat(selectedDonation.latitude || selectedDonation.lat), 
                                  lng: parseFloat(selectedDonation.longitude || selectedDonation.lng)
                                },
                                title: selectedDonation.title,
                                id: selectedDonation.id
                              }]}
                              userPosition={pos}
                            />
                          </div>
                          
                          <div className="mt-4 space-y-3 bg-white dark:bg-gray-800 p-4 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center text-gray-700 dark:text-gray-300">
                                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="font-medium">Quantity:</span> {selectedDonation.quantity}
                              </div>
                              <div className="flex items-center text-gray-700 dark:text-gray-300">
                                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="font-medium">Status:</span> 
                                <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                                  selectedDonation.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                  selectedDonation.status === 'Claimed' ? 'bg-blue-100 text-blue-800' :
                                  selectedDonation.status === 'Picked Up' ? 'bg-green-100 text-green-800' :
                                  selectedDonation.status === 'Delivered' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {selectedDonation.status}
                                </span>
                              </div>
                            </div>
                            {selectedDonation.description && (
                              <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">Note:</span> {selectedDonation.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-lg mb-4">Pickup Information</h3>
                          <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm">
                              <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Pickup Location (Donor)
                              </h4>
                              <p className="mt-1 text-gray-600 dark:text-gray-300 pl-7">
                                {selectedDonation.address || 'No pickup address provided'}
                              </p>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm">
                              <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Delivery Location (Shelter)
                              </h4>
                              <p className="mt-1 text-gray-600 dark:text-gray-300 pl-7">
                                {selectedDonation.shelterAddress || 'No delivery address provided'}
                              </p>
                            </div>
                            
                            <div className="pt-2 space-y-2">
                              {selectedDonation.status === 'Pending' && (
                                <button
                                  onClick={() => handleClaim(selectedDonation)}
                                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                >
                                  Claim This Donation
                                </button>
                              )}
                              
                              {selectedDonation.status === 'Claimed' && (
                                <button
                                  onClick={() => handleMarkPickedUp(selectedDonation)}
                                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                >
                                  Mark as Picked Up
                                </button>
                              )}
                              
                              {selectedDonation.status === 'Picked Up' && (
                                <button
                                  onClick={() => handleMarkDelivered(selectedDonation)}
                                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                >
                                  Food Delivered
                                </button>
                              )}
                              
                              {selectedDonation.status === 'Delivered' && (
                                <div className="text-center py-2">
                                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                    {selectedDonation.status}
                                  </span>
                                  {selectedDonation.deliveredAt && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      Delivered on: {new Date(selectedDonation.deliveredAt).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {(selectedDonation.pickedUpAt && selectedDonation.status !== 'Delivered') && (
                                <p className="text-sm text-gray-500 text-center">
                                  Picked up on: {new Date(selectedDonation.pickedUpAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === "mypickups" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">My Pickups</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Your completed pickups will appear here.
              </p>
            </div>
          )}
          
          {activeTab === "active" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Your Active Pickups</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {nearby
                  .filter(donation => 
                    donation.status === 'Claimed' || donation.status === 'Picked Up'
                  )
                  .map((donation) => (
                    <div
                      key={donation.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-lg">{donation.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            donation.status === 'Claimed' ? 'bg-blue-100 text-blue-800' :
                            donation.status === 'Picked Up' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {donation.status}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                          <span className="font-medium">Quantity:</span> {donation.quantity}
                        </p>
                        {donation.pickedUpAt && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Picked up: {new Date(donation.pickedUpAt).toLocaleString()}
                          </p>
                        )}
                        <div className="mt-4">
                          <button
                            onClick={() => handleDonationSelect(donation)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                {nearby.filter(d => d.status === 'Claimed' || d.status === 'Picked Up').length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No active pickups found</p>
                  </div>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Your active pickups will appear here.
              </p>
            </div>
          )}
          
          {activeTab === "history" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Your Pickup History</h2>
              {deliveredDonations.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {deliveredDonations.map((donation) => {
                    const donationId = donation._id || donation.id;
                    return (
                      <div
                        key={donationId}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-lg">{donation.title}</h3>
                            <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              Delivered
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mt-2">
                            <span className="font-medium">Quantity:</span> {donation.quantity}
                          </p>
                          {donation.pickedUpAt && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Picked up: {new Date(donation.pickedUpAt).toLocaleString()}
                            </p>
                          )}
                          {donation.deliveredAt && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Delivered: {new Date(donation.deliveredAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No delivery history found</p>
                  <p className="text-sm text-gray-400 mt-2">Delivered donations will appear here</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === "impact" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Your Impact</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-300">Meals Delivered</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-white">{deliveredDonations.length}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-300">Hours Volunteered</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-white">0</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 dark:text-purple-300">Total Impact</p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-white">{deliveredDonations.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
