import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { hospitalService } from "../services/hospitalService";
import authService from "../services/authService";
import webSocketService from "../services/webSocketService";
import "./Dashboard.css";

const Dashboard = ({ onLogout }) => {
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monitoringData, setMonitoringData] = useState(null);
  const [loadingMonitoring, setLoadingMonitoring] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const recordsPerPage = 10;

  // Fetch hospitals data on component mount
  useEffect(() => {
    // Get current user data
    const user = authService.getCurrentUser();
    console.log("Current user data:", user); // Debug log
    setCurrentUser(user);

    // If no user data, handle gracefully
    if (!user) {
      console.warn("No user data found in localStorage");
    }

    const fetchHospitals = async () => {
      try {
        setLoading(true);
        const response = await hospitalService.getAllHospitals();
        if (response.status === "success") {
          setHospitals(response.data.hospitals || []);
        } else {
          setHospitals([]);
        }
      } catch (error) {
        console.error("Error fetching hospitals:", error);
        toast.error("Gagal memuat data rumah sakit");
        setHospitals([]); // Ensure hospitals is always an array

        // If it's an authentication error, handle logout
        if (
          error.message.includes("401") ||
          error.message.includes("Unauthorized")
        ) {
          toast.error("Session expired. Please login again.");
          onLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, [onLogout]);

  // Initialize WebSocket connection and monitoring data when component mounts
  useEffect(() => {
    // Connect to WebSocket
    webSocketService.connect();

    // Subscribe to general monitoring updates
    const unsubscribeMonitoring = webSocketService.subscribeToMonitoringUpdates(
      (data) => {
        console.log("Real-time monitoring update received:", data);

        // Update monitoring data if it matches selected hospital
        if (
          selectedHospital &&
          data.hospital_id === selectedHospital.hospital_id
        ) {
          setMonitoringData(data);

          // Random alerts based on data thresholds
          if (data.temperature > 30) {
            toast.error("Suhu ruangan mencapai batas maksimum");
          }
          if (data.humidity > 80) {
            toast.error("Kelembaban ruangan tidak normal");
          }
          if (data.gas_status === "High") {
            toast.error("Status gas berubah menjadi High");
          }
        }
      }
    );

    // Subscribe to latest data response
    const unsubscribeLatestData = webSocketService.subscribeToLatestData(
      (data) => {
        console.log("Latest data received:", data);
        if (selectedHospital && data.length > 0) {
          const hospitalData = data.find(
            (item) => item.hospital_id === selectedHospital.hospital_id
          );
          if (hospitalData) {
            setMonitoringData(hospitalData);
          }
        }
      }
    );

    // Cleanup WebSocket on unmount
    return () => {
      if (unsubscribeMonitoring) unsubscribeMonitoring();
      if (unsubscribeLatestData) unsubscribeLatestData();
      webSocketService.disconnect();
    };
  }, [selectedHospital]);

  // Fetch monitoring data when hospital is selected
  useEffect(() => {
    if (selectedHospital) {
      const fetchMonitoringData = async () => {
        try {
          setLoadingMonitoring(true);
          const response = await hospitalService.getHospitalMonitoring(
            selectedHospital.hospital_id
          );
          if (response.status === "success" && response.data.length > 0) {
            setMonitoringData(response.data[0]);
          }
        } catch (error) {
          console.error("Error fetching monitoring data:", error);
          toast.error("Gagal memuat data monitoring");
        } finally {
          setLoadingMonitoring(false);
        }
      };

      const fetchHistoricalData = async () => {
        try {
          setLoadingHistorical(true);
          const response = await hospitalService.getHospitalMonitoring(
            selectedHospital.hospital_id,
            100 // Get more records for historical data
          );
          if (response.status === "success") {
            setHistoricalData(response.data);
            setTotalPages(Math.ceil(response.data.length / recordsPerPage));
          }
        } catch (error) {
          console.error("Error fetching historical data:", error);
          toast.error("Gagal memuat data riwayat");
        } finally {
          setLoadingHistorical(false);
        }
      };

      fetchMonitoringData();
      fetchHistoricalData();

      // Request latest data via WebSocket
      if (webSocketService.getConnectionStatus().connected) {
        webSocketService.requestLatestData();
      }
    }
  }, [selectedHospital]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleHospitalClick = (hospital) => {
    setSelectedHospital(hospital);
    setCurrentPage(1); // Reset to first page when selecting new hospital
  };

  const handleBackClick = () => {
    setSelectedHospital(null);
    setMonitoringData(null);
    setHistoricalData([]);
    setCurrentPage(1);
  };

  // Handle logout confirmation
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Helper function to get user initials
  const getUserInitials = (user) => {
    if (!user) return "U";

    // Try firstName and lastName first
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(
        0
      )}`.toUpperCase();
    }

    // Try fullName
    if (user.fullName) {
      const names = user.fullName.split(" ");
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(
          0
        )}`.toUpperCase();
      } else {
        return names[0].charAt(0).toUpperCase();
      }
    }

    // Try full_name (backend format)
    if (user.full_name) {
      const names = user.full_name.split(" ");
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(
          0
        )}`.toUpperCase();
      } else {
        return names[0].charAt(0).toUpperCase();
      }
    }

    // Try username
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }

    // Try email
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    return "U";
  };

  // Helper function to get display name
  const getDisplayName = (user) => {
    if (!user) return "User";

    // Try firstName and lastName first
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }

    // Try fullName
    if (user.fullName) {
      return user.fullName;
    }

    // Try full_name (backend format)
    if (user.full_name) {
      return user.full_name;
    }

    // Try username
    if (user.username) {
      return user.username;
    }

    // Try email without domain
    if (user.email) {
      return user.email.split("@")[0];
    }

    return "User";
  };

  // Helper function to get user role
  const getUserRole = (user) => {
    if (!user) return "User";

    if (user.role) {
      // Capitalize first letter
      return user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }

    return "User";
  };

  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return historicalData.slice(startIndex, endIndex);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render historical data table
  const renderHistoricalDataTable = () => {
    if (loadingHistorical) {
      return (
        <div className="historical-data-section">
          <h3>Riwayat Data</h3>
          <div className="loading-table">
            <p>Memuat data riwayat...</p>
          </div>
        </div>
      );
    }

    if (historicalData.length === 0) {
      return (
        <div className="historical-data-section">
          <h3>Riwayat Data</h3>
          <div className="no-data-table">
            <p>Tidak ada data riwayat tersedia</p>
          </div>
        </div>
      );
    }

    const paginatedData = getPaginatedData();

    return (
      <div className="historical-data-section">
        <h3>Riwayat Data - {selectedHospital.hospital_name}</h3>

        <div className="table-container">
          <table className="historical-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Suhu (°C)</th>
                <th>Kelembaban (%)</th>
                <th>Status Gas</th>
                <th>Lampu 1</th>
                <th>Lampu 2</th>
                <th>Lampu Operasi</th>
                <th>Writing Table</th>
                <th>Viewer</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((data, index) => (
                <tr key={index}>
                  <td>{formatDate(data.updated_at || data.timestamp)}</td>
                  <td>{data.temperature || "N/A"}</td>
                  <td>{data.humidity || "N/A"}</td>
                  <td>
                    <span
                      className={`gas-status-badge ${data.gas_status?.toLowerCase()}`}>
                      {data.gas_status || "N/A"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge-small ${
                        data.status_lampu1 === "ON" ? "on" : "off"
                      }`}>
                      {data.status_lampu1 || "N/A"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge-small ${
                        data.status_lampu2 === "ON" ? "on" : "off"
                      }`}>
                      {data.status_lampu2 || "N/A"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge-small ${
                        data.status_lampu_op === "ON" ? "on" : "off"
                      }`}>
                      {data.status_lampu_op || "N/A"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge-small ${
                        data.status_writing_table === "ON" ? "on" : "off"
                      }`}>
                      {data.status_writing_table || "N/A"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge-small ${
                        data.status_viewer === "ON" ? "on" : "off"
                      }`}>
                      {data.status_viewer || "N/A"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}>
              ‹ Sebelumnya
            </button>

            <div className="pagination-info">
              <span>
                Halaman {currentPage} dari {totalPages}
              </span>
            </div>

            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}>
              Selanjutnya ›
            </button>
          </div>
        )}

        <div className="table-info">
          <p>
            Menampilkan {paginatedData.length} dari {historicalData.length} data
          </p>
        </div>
      </div>
    );
  };

  // Render detailed monitoring view
  const renderDetailedView = () => {
    if (loadingMonitoring) {
      return (
        <div className="detailed-monitoring">
          <div className="detail-header">
            <button className="back-button" onClick={handleBackClick}>
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
            <button className="back-button" onClick={handleBackClick}>
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
          <button className="back-button" onClick={handleBackClick}>
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
                className={`lamp-badge ${
                  monitoringData.status_lampu1 === "ON" ? "nyala" : "mati"
                }`}>
                {monitoringData.status_lampu1 === "ON" ? "Nyala" : "Mati"}
              </div>
            </div>
            <div className="lamp-item">
              <div className="lamp-label">Status Lampu 2</div>
              <div
                className={`lamp-badge ${
                  monitoringData.status_lampu2 === "ON" ? "nyala" : "mati"
                }`}>
                {monitoringData.status_lampu2 === "ON" ? "Nyala" : "Mati"}
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
              className={`status-badge ${
                monitoringData.status_lampu_op === "ON" ? "nyala" : "mati"
              }`}>
              {monitoringData.status_lampu_op === "ON" ? "Hidup" : "Mati"}
            </div>
            <div className="monitoring-header">Status Writing Table</div>
            <div
              className={`status-badge ${
                monitoringData.status_writing_table === "ON" ? "nyala" : "mati"
              }`}>
              {monitoringData.status_writing_table === "ON" ? "Nyala" : "Mati"}
            </div>
          </div>

          {/* Viewer */}
          <div className="monitoring-card">
            <div className="monitoring-header">Status Viewer</div>
            <div
              className={`status-badge ${
                monitoringData.status_viewer === "ON" ? "nyala" : "mati"
              }`}>
              {monitoringData.status_viewer === "ON" ? "Nyala" : "Mati"}
            </div>
          </div>
        </div>

        <div className="monitoring-footer">
          <p className="last-update">
            Last Updated:{" "}
            {new Date(monitoringData.updated_at).toLocaleString("id-ID")}
          </p>
        </div>

        {/* Historical Data Table */}
        {renderHistoricalDataTable()}
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
              <div className="avatar-placeholder">
                {getUserInitials(currentUser)}
              </div>
            </div>
            <div className="user-info">
              <div className="user-name">{getDisplayName(currentUser)}</div>
              <div className="user-role">{getUserRole(currentUser)}</div>
            </div>
          </div>

          <div className="sidebar-actions">
            <button className="settings-button">
              <div className="settings-icon">⚙️</div>
              <span>Settings</span>
            </button>
            <button onClick={handleLogoutClick} className="logout-button">
              <div className="logout-icon">🔓</div>
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {selectedHospital ? (
          renderDetailedView()
        ) : (
          <div className="hospital-cards-grid">
            {loading ? (
              <div className="loading-container">
                <p>Loading hospitals...</p>
              </div>
            ) : !Array.isArray(hospitals) || hospitals.length === 0 ? (
              <div className="no-data-container">
                <p>No hospitals found</p>
              </div>
            ) : (
              hospitals.map((hospital, index) => (
                <motion.div
                  key={hospital.hospital_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hospital-card"
                  onClick={() => handleHospitalClick(hospital)}>
                  <div className="hospital-card-header">
                    <h3>{hospital.hospital_name}</h3>
                  </div>

                  <div className="hospital-card-info">
                    <div className="installation-date">
                      <span className="label">Tanggal Instalasi</span>
                      <span className="value">
                        {new Date(
                          hospital.installation_date
                        ).toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="installation-time">
                      <span className="label">Waktu Instalasi</span>
                      <span className="value">
                        {hospital.installation_time}
                      </span>
                    </div>

                    <div className="iot-status">
                      <span className="label">Status IOT</span>
                      <div
                        className={`status-badge ${
                          hospital.iot_status === "Nyala" ? "nyala" : "mati"
                        }`}>
                        {hospital.iot_status}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Konfirmasi Logout</h3>
            </div>
            <div className="modal-body">
              <p>Apakah Anda yakin ingin keluar dari dashboard?</p>
            </div>
            <div className="modal-actions">
              <button
                className="modal-button cancel-button"
                onClick={handleCancelLogout}>
                Tidak
              </button>
              <button
                className="modal-button confirm-button"
                onClick={handleConfirmLogout}>
                Iya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
