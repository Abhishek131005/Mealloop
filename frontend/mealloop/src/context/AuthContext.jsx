// src/context/AuthContext.js
import { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Register user on sign up (backend)
  const signup = async (userData = {}) => {
    try {
      // Ensure role is included in the signup data, default to 'donor' if not provided
      const signupData = {
        ...userData,
        role: userData.role || 'donor' // Default to 'donor' if role is not specified
      };
      const res = await axios.post(`${API_BASE}/auth/signup`, signupData);
      return true;
    } catch (e) {
      alert(e?.response?.data?.error || 'Signup failed');
      return false;
    }
  };

  // Login using backend
  const login = async (userData = {}) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, userData);
      const { token, user } = res.data;
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user', JSON.stringify(user)); // Store user data in localStorage
      setUser(user);
      return true;
    } catch (e) {
      alert(e?.response?.data?.error || 'Login failed');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user'); // Remove user data on logout
  };

  const isLoggedIn = !!user;
  const role = user?.role;

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn, signup, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}