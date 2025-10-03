import React, { createContext, useState, useEffect } from "react";

// Create the context
export const GlobalContext = createContext();

// Provider component
export const GlobalProvider = ({ children }) => {
	// Authentication state
	const [user, setUser] = useState(() => {
		const stored = localStorage.getItem('user');
		return stored ? JSON.parse(stored) : null;
	});
	// Role state (Donor/Volunteer)
	const [role, setRole] = useState(() => {
		const stored = localStorage.getItem('user');
		return stored ? JSON.parse(stored).role || "" : "";
	});
	// Dashboard data (can be extended)
	const [dashboardData, setDashboardData] = useState({});
	// Geolocation state
	const [location, setLocation] = useState(null);

	// Keep user and role in sync with localStorage
	useEffect(() => {
		if (user) {
			localStorage.setItem('user', JSON.stringify(user));
		} else {
			localStorage.removeItem('user');
		}
	}, [user]);
	useEffect(() => {
		if (user && user.role) {
			setRole(user.role);
		}
	}, [user]);

	return (
		<GlobalContext.Provider
			value={{
				user, setUser,
				role, setRole,
				dashboardData, setDashboardData,
				location, setLocation,
			}}
		>
			{children}
		</GlobalContext.Provider>
	);
};
