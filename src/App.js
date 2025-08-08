import React, { useState, useEffect } from "react";
import Dashboard from "./frontend/dashboard/Dashboard";
import Login from "./frontend/login/Login";
import Register from "./frontend/register/Register";
import ForgotPassword from "./frontend/ForgotPasswordComponent/ForgotPassword";
import ModalTest from "./frontend/components/LoginSuccessModal";
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
  const { user, isLoading, login, logout } = useAuth();
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

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen />;
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
    <div className="app">
      <Dashboard onLogout={logout} />
    </div>
  );
};

export default App;
