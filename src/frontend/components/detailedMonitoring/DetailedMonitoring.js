import React from 'react';
import './DetailedMonitoring.css';

// Helper function to normalize device status (ON/OFF)
const normalizeDeviceStatus = (status, onText = "Nyala", offText = "Mati") => {
  if (!status) return { cssClass: "mati", displayText: offText };
  
  const normalizedStatus = status.toString().toLowerCase().trim();
  
  if (normalizedStatus === "on" || normalizedStatus === "nyala" || normalizedStatus === "1" || normalizedStatus === "true") {
    return { cssClass: "nyala", displayText: onText };
  } else {
    return { cssClass: "mati", displayText: offText };
  }
};

const DetailedMonitoring = ({ 
  selectedHospital, 
  monitoringData, 
  loadingMonitoring, 
  onBackClick,
  historicalDataTable 
}) => {
  // Helper function to format current time in WIB
  const formatCurrentTime = () => {
    const currentTime = new Date();
    const options = {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    
    return currentTime.toLocaleString('id-ID', options);
  };

  if (loadingMonitoring) {
    return (
      <div className="detailed-monitoring">
        <div className="detail-header">
          <button className="back-button" onClick={onBackClick}>
            <span>←</span>
          </button>
          <h2>Loading monitoring data...</h2>
        </div>
      </div>
    );
  }

  if (!monitoringData) {
    return (
      <div className="detailed-monitoring">
        <div className="detail-header">
          <button className="back-button" onClick={onBackClick}>
            <span>←</span>
          </button>
          <h2>
            No monitoring data available for {selectedHospital.hospital_name}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="detailed-monitoring">
      <div className="detail-header">
        <button className="back-button" onClick={onBackClick}>
          <span>←</span>
        </button>
        <h2>Status Monitoring - {selectedHospital.hospital_name}</h2>
      </div>

      <div className="monitoring-grid">
        {/* Temperature */}
        <div className="monitoring-card">
          <div className="monitoring-icon">🌡️</div>
          <div className="monitoring-value">
            {monitoringData.temperature
              ? `${monitoringData.temperature}°C`
              : "N/A"}
          </div>
          <div className="monitoring-label">Suhu Temperature Ruangan</div>
        </div>

        {/* Humidity */}
        <div className="monitoring-card">
          <div className="monitoring-icon">💧</div>
          <div className="monitoring-value">{monitoringData.humidity}%</div>
          <div className="monitoring-label">Kelembapan Ruangan</div>
        </div>

        {/* Lamp Status */}
        <div className="monitoring-card lamp-status">
          <div className="lamp-item">
            <div className="lamp-label">Status Lampu 1</div>
            <div
              className={`lamp-badge ${normalizeDeviceStatus(monitoringData.status_lampu1).cssClass}`}>
              {normalizeDeviceStatus(monitoringData.status_lampu1).displayText}
            </div>
          </div>
          <div className="lamp-item">
            <div className="lamp-label">Status Lampu 2</div>
            <div
              className={`lamp-badge ${normalizeDeviceStatus(monitoringData.status_lampu2).cssClass}`}>
              {normalizeDeviceStatus(monitoringData.status_lampu2).displayText}
            </div>
          </div>
        </div>

        {/* Gas Status */}
        <div className="monitoring-card gas-card">
          <div className="gas-header">Status Gas</div>
          <div className="gas-indicator">
            <div
              className={`gas-level ${monitoringData.gas_status.toLowerCase()}`}></div>
          </div>
          <div className="gas-legend">
            <div className="legend-item">
              <div className="legend-color low"></div>
              <span>Low</span>
            </div>
            <div className="legend-item">
              <div className="legend-color medium"></div>
              <span>Medium</span>
            </div>
            <div className="legend-item">
              <div className="legend-color high"></div>
              <span>High</span>
            </div>
          </div>
        </div>

        {/* Operation Lights && Writing Table */}
        <div className="monitoring-card multiple-status">
          <div className="monitoring-header">Status Lampu Operasi</div>
          <div
            className={`status-badge ${normalizeDeviceStatus(monitoringData.status_lampu_op, "Hidup", "Mati").cssClass}`}>
            {normalizeDeviceStatus(monitoringData.status_lampu_op, "Hidup", "Mati").displayText}
          </div>
          <div className="monitoring-header">Status Writing Table</div>
          <div
            className={`status-badge ${normalizeDeviceStatus(monitoringData.status_writing_table).cssClass}`}>
            {normalizeDeviceStatus(monitoringData.status_writing_table).displayText}
          </div>
        </div>

        {/* Viewer */}
        <div className="monitoring-card">
          <div className="monitoring-header">Status Viewer</div>
          <div
            className={`status-badge ${normalizeDeviceStatus(monitoringData.status_viewer).cssClass}`}>
            {normalizeDeviceStatus(monitoringData.status_viewer).displayText}
          </div>
        </div>
      </div>

      <div className="monitoring-footer">
        <p className="last-update">
          Last Updated:{" "}
          {new Date(
            monitoringData.updated_at || monitoringData.created_at
          ).toLocaleString("id-ID", {
            timeZone: 'Asia/Jakarta',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          })} WIB
        </p>
        <p className="current-server-time">
          Current Time: {formatCurrentTime()} WIB
        </p>
      </div>

      {/* Historical Data Table */}
      {historicalDataTable}
    </div>
  );
};

export default DetailedMonitoring;
