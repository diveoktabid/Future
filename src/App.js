import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import { useLocalStorage } from './hooks/useLocalStorage';
import './styles/globals.css';
import './App.css';

// Simple authentication simulator
const useAuth = () => {
  const [user, setUser] = useLocalStorage('bartech_user', null);
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
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
  const [formData, setFormData] = useState({
    email: 'admin@bartech.id',
    password: 'admin123'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate login
    onLogin({
      name: 'Reza Aditya',
      email: formData.email,
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format'
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <h1>Bartech</h1>
          <p>IoT Monitoring Dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <button type="submit" className="login-button">
            Sign In
          </button>
          
          <div className="demo-info">
            <p>Demo credentials:</p>
            <p>Email: admin@bartech.id</p>
            <p>Password: admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
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