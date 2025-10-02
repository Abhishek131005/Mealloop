import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const defaultTabs = [
  { key: "find", label: "Find Donations", icon: "🔍" },
  { key: "active", label: "Active Pickups", icon: "🚚" },
  { key: "history", label: "Pickup History", icon: "📜" },
  { key: "impact", label: "My Impact", icon: "📊" }
];

export default function DashboardSidebar({ 
  tabs = defaultTabs, 
  activeTab, 
  onTabChange = () => {}, 
  role = "Volunteer" 
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 h-screen flex flex-col shadow-lg">
      {/* Mini Profile */}
      <div className="flex flex-col items-center py-6 border-b border-gray-200 dark:border-gray-700">
        <img
          src="/src/assets/react.svg" // Replace with user.avatar or org logo if available
          alt="Avatar"
          className="w-16 h-16 rounded-full mb-2"
        />
        <div className="font-bold text-lg text-gray-800 dark:text-white">{user?.name || user?.email}</div>
        <div className="text-xs text-gray-500 dark:text-gray-300 mb-2">{role}</div>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
        >
          Logout
        </button>
      </div>
      {/* Tabs */}
      <nav className="flex-1 py-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange && onTabChange(tab.key)}
            className={`w-full flex items-center px-6 py-3 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
              activeTab === tab.key ? "bg-gray-100 dark:bg-gray-700 font-semibold" : ""
            }`}
          >
            <span className="mr-3 text-xl">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}