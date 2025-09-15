import React, { useState, useEffect, useCallback } from 'react';
import { useSettings } from './SettingsContext';
import './Settings.css';

const Settings = () => {
  const { settings, updateSetting, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaved, setIsSaved] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState({});

  // Store original settings when component loads
  useEffect(() => {
    setOriginalSettings({ ...settings });
  }, [settings]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = Object.keys(settings).some(
      key => settings[key] !== originalSettings[key]
    );
    setHasUnsavedChanges(hasChanges);
  }, [settings, originalSettings]);

  const handleInputChange = (key, value) => {
    updateSetting(key, value);
    console.log(`Setting updated: ${key} = ${value}`);
  };

  const handleSave = () => {
    try {
      // Settings are already saved automatically in SettingsContext
      // This function provides user feedback and applies theme changes
      
      // Apply theme changes immediately
      applyThemeChanges();
      
      // Apply display changes
      applyDisplayChanges();
      
      // Update original settings to current settings
      setOriginalSettings({ ...settings });
      setHasUnsavedChanges(false);
      
      setIsSaved(true);
      console.log('✅ Settings saved successfully:', settings);
      
      // Show success feedback
      setTimeout(() => setIsSaved(false), 3000);
      
      // Show success toast if available
      if (window.toast) {
        window.toast.success('Pengaturan berhasil disimpan!');
      }
      
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      if (window.toast) {
        window.toast.error('Gagal menyimpan pengaturan!');
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset semua pengaturan ke default?')) {
      try {
        resetSettings();
        setOriginalSettings({ ...settings }); // Will be updated after reset
        setHasUnsavedChanges(false);
        setIsReset(true);
        
        console.log('🔄 Settings reset to default');
        
        // Apply default theme
        applyThemeChanges(true);
        
        setTimeout(() => setIsReset(false), 3000);
        
        if (window.toast) {
          window.toast.success('Pengaturan berhasil direset ke default!');
        }
        
      } catch (error) {
        console.error('❌ Error resetting settings:', error);
        if (window.toast) {
          window.toast.error('Gagal mereset pengaturan!');
        }
      }
    }
  };

  // Apply theme changes to document
  const applyThemeChanges = useCallback((useDefault = false) => {
    const root = document.documentElement;
    const currentSettings = useDefault ? { theme: 'light', darkMode: false } : settings;
    
    // Remove existing theme classes
    root.classList.remove('dark-theme', 'light-theme', 'auto-theme');
    
    // Apply theme based on settings
    if (currentSettings.darkMode || currentSettings.theme === 'dark') {
      root.classList.add('dark-theme');
      document.body.style.background = 'var(--bg-dark, #1a1a1a)';
      document.body.style.color = 'var(--text-dark, #ffffff)';
    } else if (currentSettings.theme === 'auto') {
      // Auto theme based on system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark-theme');
      } else {
        root.classList.add('light-theme');
      }
    } else {
      // Light theme
      root.classList.add('light-theme');
      document.body.style.background = 'var(--bg-light, #ffffff)';
      document.body.style.color = 'var(--text-light, #000000)';
    }
    
    console.log(`🎨 Theme applied: ${currentSettings.theme}, Dark Mode: ${currentSettings.darkMode}`);
  }, [settings]);

  // Apply display changes
  const applyDisplayChanges = useCallback(() => {
    const root = document.documentElement;
    
    // Apply compact view
    if (settings.compactView) {
      root.classList.add('compact-view');
    } else {
      root.classList.remove('compact-view');
    }
    
    // Apply other display settings
    root.style.setProperty('--refresh-interval', `${settings.refreshInterval}ms`);
    
    console.log(`🖥️ Display settings applied: Compact: ${settings.compactView}`);
  }, [settings.compactView, settings.refreshInterval]);

  // Apply settings on component mount and when settings change
  useEffect(() => {
    applyThemeChanges();
    applyDisplayChanges();
  }, [settings.theme, settings.darkMode, settings.compactView, applyThemeChanges, applyDisplayChanges]);

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3>Pengaturan Umum</h3>
      
      <div className="setting-item">
        <label>Interval Refresh Data (detik)</label>
        <select 
          value={settings.refreshInterval / 1000}
          onChange={(e) => handleInputChange('refreshInterval', parseInt(e.target.value) * 1000)}
        >
          <option value={10}>10 detik</option>
          <option value={30}>30 detik</option>
          <option value={60}>1 menit</option>
        </select>
      </div>

      <div className="setting-item">
        <label>Tema</label>
        <select 
          value={settings.theme}
          onChange={(e) => handleInputChange('theme', e.target.value)}
        >
          <option value="light">Terang</option>
          <option value="dark">Gelap</option>
          <option value="auto">Otomatis</option>
        </select>
      </div>

      <div className="setting-item">
        <label>Zona Waktu</label>
        <select 
          value={settings.timezone}
          onChange={(e) => handleInputChange('timezone', e.target.value)}
        >
          <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
        </select>
      </div>
    </div>
  );

  const renderMonitoringSettings = () => (
    <div className="settings-section">
      <h3>Pengaturan Monitoring</h3>
      
      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.alertsEnabled}
            onChange={(e) => handleInputChange('alertsEnabled', e.target.checked)}
          />
          Aktifkan Peringatan
        </label>
      </div>

      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
          />
          Notifikasi Email
        </label>
      </div>

      <div className="setting-item">
        <label>Batas Kritis (%)</label>
        <input
          type="range"
          min="70"
          max="100"
          value={settings.criticalThreshold}
          onChange={(e) => handleInputChange('criticalThreshold', parseInt(e.target.value))}
        />
        <span className="range-value">{settings.criticalThreshold}%</span>
      </div>

      <div className="setting-item">
        <label>Batas Peringatan (%)</label>
        <input
          type="range"
          min="40"
          max="80"
          value={settings.warningThreshold}
          onChange={(e) => handleInputChange('warningThreshold', parseInt(e.target.value))}
        />
        <span className="range-value">{settings.warningThreshold}%</span>
      </div>
    </div>
  );

  const renderDisplaySettings = () => (
    <div className="settings-section">
      <h3>Pengaturan Tampilan</h3>
      
      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.showDeviceStatus}
            onChange={(e) => handleInputChange('showDeviceStatus', e.target.checked)}
          />
          Tampilkan Status Device
        </label>
      </div>

      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.showLastUpdate}
            onChange={(e) => handleInputChange('showLastUpdate', e.target.checked)}
          />
          Tampilkan Update Terakhir
        </label>
      </div>

      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.compactView}
            onChange={(e) => handleInputChange('compactView', e.target.checked)}
          />
          Tampilan Kompak
        </label>
      </div>
    </div>
  );

  const renderConnectionSettings = () => (
    <div className="settings-section">
      <h3>Pengaturan Koneksi</h3>
      
      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.autoReconnect}
            onChange={(e) => handleInputChange('autoReconnect', e.target.checked)}
          />
          Koneksi Ulang Otomatis
        </label>
      </div>

      <div className="setting-item">
        <label>Timeout Koneksi (detik)</label>
        <select 
          value={settings.connectionTimeout / 1000}
          onChange={(e) => handleInputChange('connectionTimeout', parseInt(e.target.value) * 1000)}
        >
          <option value={5}>5 detik</option>
          <option value={10}>10 detik</option>
          <option value={15}>15 detik</option>
          <option value={30}>30 detik</option>
        </select>
      </div>

      <div className="setting-item">
        <label>Maksimal Percobaan Ulang</label>
        <select 
          value={settings.maxRetries}
          onChange={(e) => handleInputChange('maxRetries', parseInt(e.target.value))}
        >
          <option value={1}>1 kali</option>
          <option value={3}>3 kali</option>
          <option value={5}>5 kali</option>
          <option value={10}>10 kali</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="settings-container">
      <div className="settings-content">
        <div className="settings-tabs">
          <button 
            className={`tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            🔧 Umum
          </button>
          <button 
            className={`tab ${activeTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitoring')}
          >
            📊 Monitoring
          </button>
          <button 
            className={`tab ${activeTab === 'display' ? 'active' : ''}`}
            onClick={() => setActiveTab('display')}
          >
            🎨 Tampilan
          </button>
          <button 
            className={`tab ${activeTab === 'connection' ? 'active' : ''}`}
            onClick={() => setActiveTab('connection')}
          >
            🔗 Koneksi
          </button>
        </div>

        <div className="settings-panel">
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'monitoring' && renderMonitoringSettings()}
          {activeTab === 'display' && renderDisplaySettings()}
          {activeTab === 'connection' && renderConnectionSettings()}
        </div>

        <div className="settings-actions">
          {/* Unsaved changes indicator */}
          {hasUnsavedChanges && (
            <div className="unsaved-changes-indicator">
              <span className="indicator-icon">⚠️</span>
              <span className="indicator-text">Ada perubahan yang belum disimpan</span>
            </div>
          )}
          
          <div className="action-buttons">
            <button 
              className={`btn btn-primary ${hasUnsavedChanges ? 'has-changes' : ''}`}
              onClick={handleSave}
              disabled={isSaved}
            >
              {isSaved ? '✅ Tersimpan!' : hasUnsavedChanges ? '💾 Simpan Perubahan' : '💾 Simpan Pengaturan'}
            </button>
            
            <button 
              className="btn btn-secondary" 
              onClick={handleReset}
              disabled={isReset}
            >
              {isReset ? '✅ Direset!' : '🔄 Reset ke Default'}
            </button>
            
            {hasUnsavedChanges && (
              <button 
                className="btn btn-tertiary"
                onClick={() => {
                  // Reload settings from original
                  Object.keys(originalSettings).forEach(key => {
                    updateSetting(key, originalSettings[key]);
                  });
                  setHasUnsavedChanges(false);
                }}
              >
                ↺ Batalkan Perubahan
              </button>
            )}
          </div>
          
          {/* Settings info */}
          <div className="settings-info">
            <small>
              Interval refresh saat ini: <strong>{settings.refreshInterval / 1000} detik</strong> | 
              Tema: <strong>{settings.theme === 'light' ? 'Terang' : settings.theme === 'dark' ? 'Gelap' : 'Otomatis'}</strong> |
              Status: <strong>{hasUnsavedChanges ? 'Ada perubahan' : 'Tersimpan'}</strong>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
