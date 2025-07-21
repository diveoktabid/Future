import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import "./Dashboard.css";

// Room data constant
const ROOMS = [
  { id: "ICU-1", status: "active" },
  { id: "ICU-2", status: "active" },
  { id: "ER-1", status: "critical" },
  { id: "WARD-A", status: "normal" },
  { id: "WARD-B", status: "normal" },
  { id: "OR-1", status: "active" },
];

const Dashboard = ({ onLogout }) => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [monitoringData, setMonitoringData] = useState({
    temperature: 27,
    humidity: 75,
    gasStatus: "Low",
    operationLights: "ON",
    writingTable: "Nyala",
    viewer: "Mati",
    lamp1: "Nyala",
    lamp2: "Mati",
  });

  // Simulate real-time data updates for alerts only
  useEffect(() => {
    const interval = setInterval(() => {
      // Random alerts
      if (Math.random() < 0.1) {
        // 10% chance every 3 seconds
        const alertMessages = [
          "Suhu ruangan mencapai batas maksimum",
          "Kelembaban ruangan tidak normal",
          "Status gas berubah menjadi High",
          "Lampu operasi mengalami gangguan",
        ];
        toast.error(
          alertMessages[Math.floor(Math.random() * alertMessages.length)]
        );
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Simulate real-time monitoring data updates
  useEffect(() => {
    const dataUpdateInterval = setInterval(() => {
      setMonitoringData((prevData) => ({
        ...prevData,
        temperature: Math.floor(Math.random() * 10) + 23, // 23-32°C
        humidity: Math.floor(Math.random() * 20) + 65, // 65-84%
        gasStatus: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
        operationLights: Math.random() > 0.3 ? "ON" : "OFF",
        writingTable: Math.random() > 0.4 ? "Nyala" : "Mati",
        viewer: Math.random() > 0.5 ? "Nyala" : "Mati",
        lamp1: Math.random() > 0.3 ? "Nyala" : "Mati",
        lamp2: Math.random() > 0.6 ? "Nyala" : "Mati",
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(dataUpdateInterval);
  }, []);

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
  };

  const handleBackClick = () => {
    setSelectedRoom(null);
  };

  // Render detailed monitoring view
  const renderDetailedView = () => {
    return (
      <div className="detailed-monitoring">
        <div className="detail-header">
          <button className="back-button" onClick={handleBackClick}>
            <span>←</span>
          </button>
          <h2>Status Monitoring - Rumah Sakit Medika Sehat</h2>
        </div>

        <div className="monitoring-grid">
          {/* Temperature */}
          <div className="monitoring-card">
            <div className="monitoring-icon">🌡️</div>
            <div className="monitoring-value">
              {monitoringData.temperature}°C
            </div>
            <div className="monitoring-label">Suhu Tempterature Ruangan</div>
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
                className={`lamp-badge ${
                  monitoringData.lamp1 === "Nyala" ? "nyala" : "mati"
                }`}>
                {monitoringData.lamp1}
              </div>
            </div>
            <div className="lamp-item">
              <div className="lamp-label">Status Lampu 2</div>
              <div
                className={`lamp-badge ${
                  monitoringData.lamp2 === "Nyala" ? "nyala" : "mati"
                }`}>
                {monitoringData.lamp2}
              </div>
            </div>
          </div>

          {/* Gas Status */}
          <div className="monitoring-card gas-card">
            <div className="gas-header">Status Gas</div>
            <div className="gas-indicator">
              <div
                className={`gas-level ${monitoringData.gasStatus.toLowerCase()}`}></div>
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

          {/* Operation Lights */}
          <div className="monitoring-card operation-card">
            <div className="operation-header">Status Lampu Operasi</div>
            <div className="operation-status">
              <div className="operation-display">
                {monitoringData.operationLights}
              </div>
            </div>
          </div>

          {/* Writing Table */}
          <div className="monitoring-card">
            <div className="monitoring-header">Status Writing Table</div>
            <div
              className={`status-badge ${
                monitoringData.writingTable === "Nyala" ? "nyala" : "mati"
              }`}>
              {monitoringData.writingTable}
            </div>
          </div>

          {/* Viewer */}
          <div className="monitoring-card">
            <div className="monitoring-header">Status Viewer</div>
            <div
              className={`status-badge ${
                monitoringData.viewer === "Nyala" ? "nyala" : "mati"
              }`}>
              {monitoringData.viewer}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Bartech</h1>
        </div>

        <div className="sidebar-menu">
          <div className="menu-item active">
            <div className="menu-icon">📊</div>
            <span>Dashboard</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              <div className="avatar-placeholder">RA</div>
            </div>
            <div className="user-info">
              <div className="user-name">Reza Aditya</div>
              <div className="user-role">Admin</div>
            </div>
          </div>

          <div className="sidebar-actions">
            <button className="settings-button">
              <div className="settings-icon">⚙️</div>
              <span>Settings</span>
            </button>
            <button onClick={onLogout} className="logout-button">
              <div className="logout-icon">🔓</div>
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {selectedRoom ? (
          renderDetailedView()
        ) : (
          <div className="hospital-cards-grid">
            {ROOMS.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="hospital-card"
                onClick={() => handleRoomClick(room)}>
                <div className="hospital-card-header">
                  <h3>Rumah Sakit</h3>
                  <p>Pelita Utama</p>
                </div>

                <div className="hospital-card-info">
                  <div className="installation-date">
                    <span className="label">Tanggal Instalasi</span>
                    <span className="value">
                      {index === 0 ? "Senin 13 July 2025" : "07:00"}
                    </span>
                  </div>

                  <div className="iot-status">
                    <span className="label">Status IOT</span>
                    <div
                      className={`status-badge ${
                        room.status === "normal" ? "nyala" : "mati"
                      }`}>
                      {room.status === "normal" ? "Nyala" : "Mati"}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
