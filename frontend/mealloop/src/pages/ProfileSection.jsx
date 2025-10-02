import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ProfileSection = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Welcome, {user.name || user.email}!</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">Email: <span className="font-medium">{user.email}</span></p>
      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
      >
        Logout
      </button>
      {/* Add more features below */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Profile Features</h3>
        <ul className="list-disc pl-5 text-gray-700 dark:text-gray-200">
          <li>View and edit your profile info (name, email)</li>
          <li>See your selected role (Donor/Volunteer)</li>
          <li>Quick links to your dashboard</li>
          <li>Show recent activity (donations, pickups)</li>
        </ul>
      </div>
    </div>
  );
};

export default ProfileSection;
