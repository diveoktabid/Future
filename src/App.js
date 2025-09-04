import React, { useState, useEffect } from "react";
import Dashboard from "./frontend/dashboard/Dashboard";
import Login from "./frontend/Auth/login/Login";
import Register from "./frontend/Auth/register/Register";
import ForgotPassword from "./frontend/Auth/ForgotPassword/ForgotPassword";
import ModalTest from "./frontend/components/LoginSuccess/LoginSuccessModal";
import { SettingsProvider } from "./frontend/settings/SettingsContext";
import { useLocalStorage } from "./hooks/useLocalStorage";
import "./frontend/styles/theme.css";
import "./styles/globals.css";
import "./App.css";

// Simple authentication simulator
const useAuth = () => {
  const [user, setUser] = useLocalStorage("bartech_user", null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Checking authentication...");

  useEffect(() => {
    // Quick auth check with improved UX
    const checkAuth = async () => {
      try {
        // First, set a quick loading message
        setLoadingMessage("Checking authentication...");
        
        // Minimal delay for smooth UX - just enough to avoid flash
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // If user exists, verify and load faster
        if (user) {
          setLoadingMessage("Loading dashboard...");
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          setLoadingMessage("Preparing login...");
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [user]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return { user, isLoading, login, logout, loadingMessage };
};

// Loading component
const LoadingScreen = ({ message = "Loading..." }) => (
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
      <p className="loading-text">{message}</p>
    </div>
  </div>
);

// Login component (simplified for demo)
const LoginScreen = ({ onLogin, onCreateAccount, onForgotPassword }) => {
  return (
    <Login
      onLogin={onLogin}
      onCreateAccount={onCreateAccount}
      onForgotPassword={onForgotPassword}
    />
  );
};

// Register component
const RegisterScreen = ({ onBackToLogin }) => {
  return <Register onBackToLogin={onBackToLogin} />;
};

// Forgot Password component
const ForgotPasswordScreen = ({ onBackToLogin }) => {
  return <ForgotPassword onBackToLogin={onBackToLogin} />;
};

// Main App Component
const App = () => {
  const { user, isLoading, login, logout, loadingMessage } = useAuth();
  const [currentView, setCurrentView] = useState("login"); // "login", "register", or "forgot-password"

  // Check if we should show modal test
  const urlParams = new URLSearchParams(window.location.search);
  const showModalTest = urlParams.get("test") === "modal";

  const handleCreateAccount = () => {
    setCurrentView("register");
  };

  const handleBackToLogin = () => {
    setCurrentView("login");
  };

  const handleForgotPassword = () => {
    setCurrentView("forgot-password");
  };

  // Show modal test if requested
  if (showModalTest) {
    return <ModalTest />;
  }

  // Show loading screen with dynamic message
  if (isLoading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  // Show login or register if not authenticated
  if (!user) {
    if (currentView === "register") {
      return <RegisterScreen onBackToLogin={handleBackToLogin} />;
    }
    if (currentView === "forgot-password") {
      return <ForgotPasswordScreen onBackToLogin={handleBackToLogin} />;
    }
    return (
      <LoginScreen
        onLogin={login}
        onCreateAccount={handleCreateAccount}
        onForgotPassword={handleForgotPassword}
      />
    );
  }

  // Show dashboard if authenticated
  return (
    <SettingsProvider>
      <div className="app">
        <div className="app-content">
          <Dashboard onLogout={logout} />
        </div>
      </div>
    </SettingsProvider>
  );
};

export default App;
