import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

const defaultSettings = {
  // General Settings
  refreshInterval: 5000,
  theme: 'light',
  language: 'id',
  timezone: 'Asia/Jakarta',
  
  // Monitoring Settings
  alertsEnabled: true,
  emailNotifications: true,
  soundAlerts: false,
  criticalThreshold: 80,
  warningThreshold: 60,
  
  // Data Settings
  dataRetentionDays: 30,
  autoBackup: false,
  exportFormat: 'csv',
  
  // Display Settings
  showDeviceStatus: true,
  showLastUpdate: true,
  compactView: false,
  darkMode: false,
  
  // Connection Settings
  autoReconnect: true,
  connectionTimeout: 10000,
  maxRetries: 3,
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('monitoringSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Apply theme changes immediately
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }
  }, [settings.darkMode]);

  // Apply theme color changes
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }
  }, [settings.theme]);

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('monitoringSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('monitoringSettings', JSON.stringify(updated));
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('monitoringSettings');
  };

  const value = {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
