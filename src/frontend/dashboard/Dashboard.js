import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { hospitalService } from "../services/hospitalService";
import authService from "../services/authService";
import webSocketService from "../services/webSocketService";
import Settings from "../settings/Settings";
import "./Dashboard.css";

// Helper function to normalize IOT status
const normalizeIotStatus = (status) => {
  if (!status) return { cssClass: "mati", displayText: "Mati" };
  
  const normalizedStatus = status.toString().toLowerCase().trim();
  
  if (normalizedStatus === "nyala" || normalizedStatus === "on" || normalizedStatus === "online" || normalizedStatus === "1" || normalizedStatus === "true") {
    return { cssClass: "nyala", displayText: "Nyala" };
  } else {
    return { cssClass: "mati", displayText: "Mati" };
  }
};

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
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'settings'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const recordsPerPage = 10;

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
    // Handle window resize
    const handleResize = () => {
      const mobile = window.innerWidth <= 480;
      setIsMobile(mobile);
      if (!mobile) {
        setShowMobileSidebar(false);
      }
    };

    window.addEventListener('resize', handleResize);

    // Connect to WebSocket
    webSocketService.connect();

    // Subscribe to general monitoring updates
    const unsubscribeMonitoring = webSocketService.subscribeToMonitoringUpdates(
      (data) => {
        console.log("Real-time monitoring update received:", data);

        // Update hospitals iot_status when monitoring data is received
        if (data.hospital_id) {
          setHospitals(prevHospitals => 
            prevHospitals.map(hospital => 
              hospital.hospital_id === data.hospital_id 
                ? { ...hospital, iot_status: 'online' }
                : hospital
            )
          );
        }

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
      window.removeEventListener('resize', handleResize);
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
          if (
            response.status === "success" &&
            response.data.monitoring &&
            response.data.monitoring.length > 0
          ) {
            setMonitoringData(response.data.monitoring[0]);
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
          if (response.status === "success" && response.data.monitoring) {
            setHistoricalData(response.data.monitoring);
            setTotalPages(
              Math.ceil(response.data.monitoring.length / recordsPerPage)
            );
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

  // Handle navigation
  const handleSettingsClick = () => {
    setCurrentView('settings');
  };

  const handleDashboardClick = () => {
    setCurrentView('dashboard');
    setSelectedHospital(null); // Reset hospital selection when going back to dashboard
  };

  // Handle sidebar toggle
  const toggleSidebar = () => {
    if (isMobile) {
      setShowMobileSidebar(!showMobileSidebar);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Close mobile sidebar when clicking outside
  const closeMobileSidebar = () => {
    if (isMobile) {
      setShowMobileSidebar(false);
    }
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

  // Helper function to format current time in WIB
  const formatCurrentTime = () => {
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

  // Helper function to get just the time for header
  const formatHeaderTime = () => {
    const options = {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    
    return currentTime.toLocaleString('id-ID', options);
  };

  // Helper function to get date for header
  const formatHeaderDate = () => {
    const options = {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return currentTime.toLocaleString('id-ID', options);
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
                  <td>
                    {formatDate(
                      data.updated_at || data.created_at || data.timestamp
                    )}
                  </td>
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
          {/* Time Header untuk loading state */}
          <div className="time-header">
            <div className="time-info">
              <div className="current-time">
                <span className="time-display">{formatHeaderTime()}</span>
                <span className="timezone">WIB</span>
              </div>
              <div className="current-date">{formatHeaderDate()}</div>
            </div>
          </div>

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
          {/* Time Header untuk no data state */}
          <div className="time-header">
            <div className="time-info">
              <div className="current-time">
                <span className="time-display">{formatHeaderTime()}</span>
                <span className="timezone">WIB</span>
              </div>
              <div className="current-date">{formatHeaderDate()}</div>
            </div>
          </div>

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
        {/* Time Header untuk detailed view */}
        <div className="time-header">
          <div className="time-info">
            <div className="current-time">
              <span className="time-display">{formatHeaderTime()}</span>
              <span className="timezone">WIB</span>
            </div>
            <div className="current-date">{formatHeaderDate()}</div>
          </div>
        </div>

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
        {renderHistoricalDataTable()}
      </div>
    );
  };

  return (
    <div className="dashboard">
      <Toaster position="top-right" />

      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <div 
          className={`sidebar-overlay ${showMobileSidebar ? 'show' : ''}`}
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${isMobile && showMobileSidebar ? 'show' : ''}`}>
        <div className="sidebar-header">
          {(!sidebarCollapsed || isMobile) && <h1>Bartech</h1>}
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <div className="hamburger">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>

        <div className="sidebar-menu">
          <div 
            className={`menu-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              handleDashboardClick();
              if (isMobile) setShowMobileSidebar(false);
            }}
            style={{ cursor: 'pointer' }}
            title="Dashboard"
          >
            <div className="menu-icon">📊</div>
            {(!sidebarCollapsed || isMobile) && <span>Dashboard</span>}
          </div>
          <div 
            className={`menu-item ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => {
              handleSettingsClick();
              if (isMobile) setShowMobileSidebar(false);
            }}
            style={{ cursor: 'pointer' }}
            title="Settings"
          >
            <div className="menu-icon">⚙️</div>
            {(!sidebarCollapsed || isMobile) && <span>Settings</span>}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div 
              className="user-avatar"
              title={sidebarCollapsed ? `${getDisplayName(currentUser)} - ${getUserRole(currentUser)}` : ''}
            >
              <div className="avatar-placeholder">
                {getUserInitials(currentUser)}
              </div>
            </div>
            {(!sidebarCollapsed || isMobile) && (
              <div className="user-info">
                <div className="user-name">{getDisplayName(currentUser)}</div>
                <div className="user-role">{getUserRole(currentUser)}</div>
              </div>
            )}
          </div>

          <div className="sidebar-actions">
            <button 
              onClick={() => {
                handleLogoutClick();
                if (isMobile) setShowMobileSidebar(false);
              }} 
              className="logout-button" 
              title="Log out"
            >
              <div className="logout-icon">🔓</div>
              {(!sidebarCollapsed || isMobile) && <span>Log out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Mobile hamburger button */}
        {isMobile && (
          <button className="mobile-menu-toggle" onClick={toggleSidebar}>
            <div className="hamburger">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        )}

        {/* Time Header */}
        <div className="time-header">
          <div className="time-info">
            <div className="current-time">
              <span className="time-display">{formatHeaderTime()}</span>
              <span className="timezone">WIB</span>
            </div>
            <div className="current-date">{formatHeaderDate()}</div>
          </div>
        </div>
        
        {currentView === 'settings' ? (
          <Settings />
        ) : selectedHospital ? (
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
                        className={`status-badge ${normalizeIotStatus(hospital.iot_status).cssClass}`}>
                        {normalizeIotStatus(hospital.iot_status).displayText}
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
