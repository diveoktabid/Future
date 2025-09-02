import React, { useState } from 'react';
import { useSettings } from './SettingsContext';
import './Settings.css';

const Settings = () => {
  const { settings, updateSetting, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaved, setIsSaved] = useState(false);

  const handleInputChange = (key, value) => {
    updateSetting(key, value);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset semua pengaturan ke default?')) {
      resetSettings();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3>Pengaturan Umum</h3>
      
      <div className="setting-item">
        <label>Interval Refresh Data (detik)</label>
        <select 
          value={settings.refreshInterval / 1000}
          onChange={(e) => handleInputChange('refreshInterval', parseInt(e.target.value) * 1000)}
        >
          <option value={1}>1 detik</option>
          <option value={5}>5 detik</option>
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
          <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
          <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
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

      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.soundAlerts}
            onChange={(e) => handleInputChange('soundAlerts', e.target.checked)}
          />
          Suara Peringatan
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

  const renderDataSettings = () => (
    <div className="settings-section">
      <h3>Pengaturan Data</h3>
      
      <div className="setting-item">
        <label>Penyimpanan Data (hari)</label>
        <select 
          value={settings.dataRetentionDays}
          onChange={(e) => handleInputChange('dataRetentionDays', parseInt(e.target.value))}
        >
          <option value={7}>7 hari</option>
          <option value={30}>30 hari</option>
          <option value={90}>90 hari</option>
          <option value={365}>1 tahun</option>
        </select>
      </div>

      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.autoBackup}
            onChange={(e) => handleInputChange('autoBackup', e.target.checked)}
          />
          Backup Otomatis
        </label>
      </div>

      <div className="setting-item">
        <label>Format Export</label>
        <select 
          value={settings.exportFormat}
          onChange={(e) => handleInputChange('exportFormat', e.target.value)}
        >
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
          <option value="excel">Excel</option>
        </select>
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

      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.darkMode}
            onChange={(e) => handleInputChange('darkMode', e.target.checked)}
          />
          Mode Gelap
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
      <div className="settings-header">
        <h1>⚙️ Pengaturan Sistem</h1>
        <p>Kelola pengaturan monitoring IoT sesuai kebutuhan Anda</p>
      </div>

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
            className={`tab ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            💾 Data
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
          {activeTab === 'data' && renderDataSettings()}
          {activeTab === 'display' && renderDisplaySettings()}
          {activeTab === 'connection' && renderConnectionSettings()}
        </div>

        <div className="settings-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            {isSaved ? '✅ Tersimpan!' : '💾 Simpan Pengaturan'}
          </button>
          <button className="btn btn-secondary" onClick={handleReset}>
            🔄 Reset ke Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
