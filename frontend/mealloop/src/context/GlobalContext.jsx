import React, { createContext, useState } from "react";

// Create the context
export const GlobalContext = createContext();

// Provider component
export const GlobalProvider = ({ children }) => {
	// Authentication state
	const [user, setUser] = useState(null);
	// Role state (Donor/Volunteer)
	const [role, setRole] = useState("");
	// Dashboard data (can be extended)
	const [dashboardData, setDashboardData] = useState({});
	// Geolocation state
	const [location, setLocation] = useState(null);

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
