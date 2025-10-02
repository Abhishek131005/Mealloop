// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();           // clear auth state
    navigate('/');      // redirect to homepage
  };

  return (
    <nav className="bg-white dark:bg-gray-900 px-6 py-4 shadow flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-primary">Mealloop</Link>
      <div className="space-x-4">
        {!isLoggedIn && (
          <>
            <Link to="/login" className="text-gray-700 dark:text-white hover:underline">Login</Link>
            <Link to="/signup" className="text-gray-700 dark:text-white hover:underline">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}