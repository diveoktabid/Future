import React, { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import Login from "./Login";
import { useLocalStorage } from "./hooks/useLocalStorage";
import "./styles/globals.css";
import "./App.css";

// Simple authentication simulator
const useAuth = () => {
  const [user, setUser] = useLocalStorage("bartech_user", null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return { user, isLoading, login, logout };
};

// Loading component
const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-container">
      <div className="logo-container">
        <div className="logo-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 22V12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 7L12 12L22 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1>Bartech</h1>
        <p>IoT Monitoring Dashboard</p>
      </div>
      <div className="loading-spinner"></div>
      <p className="loading-text">Initializing system...</p>
    </div>
  </div>
);

// Login component (simplified for demo)
const LoginScreen = ({ onLogin }) => {
  return <Login onLogin={onLogin} />;
};

// Main App Component
const App = () => {
  const { user, isLoading, login, logout } = useAuth();

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginScreen onLogin={login} />;
  }

  // Show dashboard if authenticated
  return (
    <div className="app">
      <Dashboard onLogout={logout} />
    </div>
  );
};

export default App;
