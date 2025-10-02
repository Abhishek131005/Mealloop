import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { createContext, useEffect, useState } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DonorDashboard from './pages/DonorDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import './App.css';

// Create a context for Google Maps
export const GoogleMapsContext = createContext({ loaded: false });

// Google Maps Loader Component
function GoogleMapsLoader({ children }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Check if script is already loaded
  const isScriptLoaded = () => {
    return document.querySelector('script[src*="maps.googleapis.com"]') !== null;
  };

  useEffect(() => {
    // Check if script is already loaded
    if (window.google && window.google.maps) {
      setLoaded(true);
      return;
    }

    // Check if script is already in the document but not loaded
    if (isScriptLoaded()) {
      // If script exists but google.maps is not available, it might still be loading
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps) {
          setLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);
      
      // Give up after 5 seconds
      setTimeout(() => {
        clearInterval(checkGoogle);
        if (!window.google || !window.google.maps) {
          setError(new Error('Google Maps API is taking too long to load'));
        }
      }, 5000);
      
      return () => clearInterval(checkGoogle);
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&callback=Function.prototype`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google && window.google.maps) {
        setLoaded(true);
      } else {
        setError(new Error('Google Maps API failed to load'));
        console.error('Google Maps API failed to load - window.google.maps is not available');
      }
    };

    script.onerror = (err) => {
      console.error('Script error:', err);
      setError(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if component unmounts
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  if (error) {
    console.error('Google Maps API Error:', error);
    return <div>Error loading Google Maps. Please check your API key and try again.</div>;
  }

  return (
    <GoogleMapsContext.Provider value={{ loaded }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

// Wrapper component to use location correctly
function AppContent() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/donor" element={<DonorDashboard />} />
            <Route path="/volunteer" element={<VolunteerDashboard />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

// Root App with Router
export default function App() {
  return (
    <GoogleMapsLoader>
      <Router>
        <AppContent />
      </Router>
    </GoogleMapsLoader>
  );
}