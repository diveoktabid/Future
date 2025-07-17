import React, { useState, useEffect } from 'react';
import { RefreshCw, Bell, Search, User } from 'lucide-react';
import './header.css';

const Header = ({ onRefresh, lastUpdate, notificationCount = 0 }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="logo">Bartech</h1>
          <div className="header-subtitle">
            IoT Monitoring Dashboard
          </div>
        </div>

        <div className="header-center">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search hospitals..."
              className="search-input"
            />
          </div>
        </div>

        <div className="header-right">
          <div className="time-display">
            <div className="current-time">{formatTime(currentTime)}</div>
            <div className="current-date">{formatDate(currentTime)}</div>
          </div>

          <button 
            className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            title="Refresh Data"
          >
            <RefreshCw size={20} />
          </button>

          <button className="notification-btn" title="Notifications">
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </button>

          <button className="profile-btn" title="User Profile">
            <User size={20} />
          </button>
        </div>
      </div>

      {lastUpdate && (
        <div className="last-update">
          Last updated: {new Date(lastUpdate).toLocaleTimeString('id-ID')}
        </div>
      )}
    </header>
  );
};

export default Header;