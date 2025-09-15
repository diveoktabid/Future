import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { hospitalService } from "../../services/hospitalService";
import authService from "../../services/authService";
import webSocketService from "../../services/webSocketService";
import { useSettings } from "../settings/SettingsContext";
import { getCurrentTime, formatDate } from "../components/header/Header";
import Settings from "../settings/Settings";
import Sidebar from "../components/sidebar/Sidebar";
import Header from "../components/header/Header";
import DetailedMonitoring from "../components/detailedMonitoring/DetailedMonitoring";
import HistoricalDataTable from "../components/historicalDataTable/HistoricalDataTable";
import LogSistem from "../LogSistem/LogSistem";
import HospitalManagement from "../HospitalManagement/HospitalManagement";
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

const Dashboard = ({ onLogout }) => {
  const { settings } = useSettings(); // Use settings from context
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
  const [lastRefresh, setLastRefresh] = useState(getCurrentTime());
  const [isSelectingHospital, setIsSelectingHospital] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const recordsPerPage = 10;

  // Use refs to get latest values in WebSocket callbacks and intervals
  const selectedHospitalRef = useRef(selectedHospital);
  const historicalDataRef = useRef(historicalData);
  const refreshIntervalRef = useRef(null);

  // Make toast available globally for export service
  useEffect(() => {
    window.toast = toast;
    return () => {
      delete window.toast;
    };
  }, []);

  // Update refs when state changes
  useEffect(() => {
    selectedHospitalRef.current = selectedHospital;
  }, [selectedHospital]);

  useEffect(() => {
    historicalDataRef.current = historicalData;
  }, [historicalData]);

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

    // Add a small delay to prevent flash when loading is very fast
    const timeoutId = setTimeout(() => {
      fetchHospitals();
    }, 50);

    return () => clearTimeout(timeoutId);
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
          selectedHospitalRef.current &&
          data.hospital_id === selectedHospitalRef.current.hospital_id
        ) {
          setMonitoringData(data);

          // Update historical data with the new data
          setHistoricalData(prevHistoricalData => {
            // Add new data to the beginning of the array
            const updatedData = [data, ...prevHistoricalData];
            // Optional: limit to a certain number of records to prevent memory issues
            const limitedData = updatedData.slice(0, 1000); // Keep latest 1000 records
            
            // Update total pages for pagination
            setTotalPages(Math.ceil(limitedData.length / recordsPerPage));
            
            return limitedData;
          });

          // Show success toast for new data received
          toast.success(`Data monitoring baru diterima: ${formatDate(data.created_at)}`);

          // Alert for threshold violations
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
        if (selectedHospitalRef.current && data.length > 0) {
          const hospitalData = data.find(
            (item) => item.hospital_id === selectedHospitalRef.current.hospital_id
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
  }, []); // Remove selectedHospital dependency to avoid reconnections

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

  // Auto-refresh functionality based on settings
  const refreshData = useCallback(async () => {
    if (!selectedHospital) return;
    
    try {
      console.log(`🔄 Auto-refreshing data (interval: ${settings.refreshInterval}ms)`);
      
      // Update last refresh time
      setLastRefresh(getCurrentTime());
      
      // Refresh monitoring data
      const response = await hospitalService.getHospitalMonitoring(
        selectedHospital.hospital_id
      );
      
      if (response.status === "success" && response.data.monitoring && response.data.monitoring.length > 0) {
        setMonitoringData(response.data.monitoring[0]);
        
        // Show subtle notification for auto-refresh (optional)
        if (settings.showLastUpdate) {
          toast.success("Data diperbarui", {
            duration: 2000,
            position: 'bottom-right',
            style: {
              fontSize: '12px',
              padding: '8px 12px'
            }
          });
        }
      }
      
      // Also refresh historical data
      const historicalResponse = await hospitalService.getHospitalMonitoring(
        selectedHospital.hospital_id,
        100
      );
      
      if (historicalResponse.status === "success" && historicalResponse.data.monitoring) {
        setHistoricalData(historicalResponse.data.monitoring);
        setTotalPages(Math.ceil(historicalResponse.data.monitoring.length / recordsPerPage));
      }
      
    } catch (error) {
      console.error("Error during auto-refresh:", error);
      // Don't show error toast for auto-refresh to avoid spam
    }
  }, [selectedHospital, settings.refreshInterval, settings.showLastUpdate, setLastRefresh, setMonitoringData, setHistoricalData, setTotalPages]);

  // Setup interval refresh based on settings
  useEffect(() => {
    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    // Only setup interval if we have a selected hospital and settings allow it
    if (selectedHospital && settings.refreshInterval > 0) {
      console.log(`⏰ Setting up auto-refresh interval: ${settings.refreshInterval}ms`);
      
      refreshIntervalRef.current = setInterval(() => {
        refreshData();
      }, settings.refreshInterval);
    }

    // Cleanup interval on unmount or dependencies change
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [selectedHospital, settings.refreshInterval, refreshData]); // Re-setup when hospital or interval changes

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleHospitalClick = (hospital) => {
    setIsSelectingHospital(true);
    setSelectedCardId(hospital.hospital_id);
    
    // Add selecting class to the grid
    const gridElement = document.querySelector('.hospital-cards-grid');
    if (gridElement) {
      gridElement.classList.add('selecting');
    }
    
    // Add selecting class to the clicked card
    const cardElement = document.querySelector(`[data-hospital-id="${hospital.hospital_id}"]`);
    if (cardElement) {
      cardElement.classList.add('selecting');
    }
    
    // Show loading toast
    const loadingToast = toast.loading('Memuat data monitoring...', {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
    
    // Delay for animation effect
    setTimeout(() => {
      setSelectedHospital(hospital);
      setCurrentPage(1); // Reset to first page when selecting new hospital
      setIsSelectingHospital(false);
      setSelectedCardId(null);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show success toast
      toast.success(`Menampilkan data ${hospital.hospital_name}`, {
        duration: 2000,
        style: {
          borderRadius: '10px',
          background: '#10b981',
          color: '#fff',
        },
      });
    }, 600); // Match animation duration
  };

  const handleBackClick = () => {
    // Show loading effect
    const loadingToast = toast.loading('Kembali ke dashboard...', {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
    
    // Delay for smooth transition
    setTimeout(() => {
      setSelectedHospital(null);
      setMonitoringData(null);
      setHistoricalData([]);
      setCurrentPage(1);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show success toast
      toast.success('Kembali ke dashboard', {
        duration: 1500,
        style: {
          borderRadius: '10px',
          background: '#10b981',
          color: '#fff',
        },
      });
    }, 300);
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
    setIsTransitioning(true);
    
    // Show loading toast
    const loadingToast = toast.loading('Memuat pengaturan...', {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
    
    // Add transition class to main content
    const mainContentElement = document.querySelector('.main-content');
    if (mainContentElement) {
      mainContentElement.classList.add('transitioning');
    }
    
    // Delay for smooth transition
    setTimeout(() => {
      setCurrentView('settings');
      setIsTransitioning(false);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show success toast
      toast.success('Pengaturan dimuat', {
        duration: 1500,
        style: {
          borderRadius: '10px',
          background: '#10b981',
          color: '#fff',
        },
      });
      
      // Remove transition class
      if (mainContentElement) {
        mainContentElement.classList.remove('transitioning');
      }
    }, 400);
  };

  const handleDashboardClick = () => {
    setIsTransitioning(true);
    
    // Show loading toast
    const loadingToast = toast.loading('Kembali ke dashboard...', {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
    
    // Add transition class to main content
    const mainContentElement = document.querySelector('.main-content');
    if (mainContentElement) {
      mainContentElement.classList.add('transitioning');
    }
    
    // Delay for smooth transition
    setTimeout(() => {
      setCurrentView('dashboard');
      setSelectedHospital(null); // Reset hospital selection when going back to dashboard
      setIsTransitioning(false);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show success toast
      toast.success('Dashboard dimuat', {
        duration: 1500,
        style: {
          borderRadius: '10px',
          background: '#10b981',
          color: '#fff',
        },
      });
      
      // Remove transition class
      if (mainContentElement) {
        mainContentElement.classList.remove('transitioning');
      }
    }, 400);
  };

  const handleLogSistemClick = () => {
    setIsTransitioning(true);
    
    // Show loading toast
    const loadingToast = toast.loading('Memuat log sistem...', {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
    
    // Add transition class to main content
    const mainContentElement = document.querySelector('.main-content');
    if (mainContentElement) {
      mainContentElement.classList.add('transitioning');
    }
    
    // Delay for smooth transition
    setTimeout(() => {
      setCurrentView('log-sistem');
      setSelectedHospital(null); // Reset hospital selection when going to log sistem
      setIsTransitioning(false);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show success toast
      toast.success('Log sistem dimuat', {
        duration: 1500,
        style: {
          borderRadius: '10px',
          background: '#10b981',
          color: '#fff',
        },
      });
      
      // Remove transition class
      if (mainContentElement) {
        mainContentElement.classList.remove('transitioning');
      }
    }, 400);
  };

  const handleManajemenRumahSakitClick = () => {
    setIsTransitioning(true);
    
    // Show loading toast
    const loadingToast = toast.loading('Memuat manajemen rumah sakit...', {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
    
    // Add transition class to main content
    const mainContentElement = document.querySelector('.main-content');
    if (mainContentElement) {
      mainContentElement.classList.add('transitioning');
    }
    
    // Delay for smooth transition
    setTimeout(() => {
      setCurrentView('manajemen-rumah-sakit');
      setSelectedHospital(null); // Reset hospital selection when going to manajemen rumah sakit
      setIsTransitioning(false);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show success toast
      toast.success('Manajemen rumah sakit dimuat', {
        duration: 1500,
        style: {
          borderRadius: '10px',
          background: '#10b981',
          color: '#fff',
        },
      });
      
      // Remove transition class
      if (mainContentElement) {
        mainContentElement.classList.remove('transitioning');
      }
    }, 400);
  };
  

  // Render detailed monitoring view
  const renderDetailedView = () => {
    return (
      <DetailedMonitoring
        selectedHospital={selectedHospital}
        monitoringData={monitoringData}
        loadingMonitoring={loadingMonitoring}
        onBackClick={handleBackClick}
        historicalDataTable={
          <HistoricalDataTable
            historicalData={historicalData}
            loadingHistorical={loadingHistorical}
            selectedHospital={selectedHospital}
            currentPage={currentPage}
            totalPages={totalPages}
            recordsPerPage={recordsPerPage}
            onPageChange={handlePageChange}
          />
        }
      />
    );
  };

  return (
    <div className="dashboard">
      <Toaster position="top-right" />

      {/* Sidebar Component */}
      <Sidebar
        currentUser={currentUser}
        currentView={currentView}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        isMobile={isMobile}
        showMobileSidebar={showMobileSidebar}
        setShowMobileSidebar={setShowMobileSidebar}
        onDashboardClick={handleDashboardClick}
        onSettingsClick={handleSettingsClick}
        onLogSistemClick={handleLogSistemClick}
        onManajemenRumahSakitClick={handleManajemenRumahSakitClick}
        onLogoutClick={handleLogoutClick}
      />

      {/* Main Content */}
      <main className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Mobile hamburger button */}
        {isMobile && (
          <button className="mobile-menu-toggle" onClick={() => setShowMobileSidebar(!showMobileSidebar)}>
            <div className="hamburger">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        )}

        {/* Time Header */}
        <Header 
          selectedHospital={selectedHospital}
          settings={settings}
          lastRefresh={lastRefresh}
          onManualRefresh={refreshData}
        />
        
        {/* Content with smooth transitions */}
        <div className={`content-wrapper ${isTransitioning ? 'transitioning' : ''}`}>
          {currentView === 'settings' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="view-container settings-view"
            >
              <Settings />
            </motion.div>
          ) : currentView === 'log-sistem' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="view-container log-sistem-view"
            >
              <LogSistem />
            </motion.div>
          ) : currentView === 'manajemen-rumah-sakit' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="view-container manajemen-rumah-sakit-view"
            >
              <HospitalManagement />
            </motion.div>
          ) : selectedHospital ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="view-container detailed-view"
            >
              {renderDetailedView()}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="view-container dashboard-view"
            >
              <div className={`hospital-cards-grid ${isSelectingHospital ? 'selecting' : ''}`}>
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Memuat data rumah sakit...</p>
              </div>
            ) : !Array.isArray(hospitals) || hospitals.length === 0 ? (
              <div className="no-data-container">
                <p>Tidak ada data rumah sakit</p>
              </div>
            ) : (
              hospitals.map((hospital, index) => (
                <motion.div
                  key={hospital.hospital_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`hospital-card ${
                    selectedCardId === hospital.hospital_id ? 'selecting' : ''
                  }`}
                  data-hospital-id={hospital.hospital_id}
                  onClick={() => handleHospitalClick(hospital)}
                  whileHover={{ 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ 
                    scale: 0.98,
                    transition: { duration: 0.1 }
                  }}>
                  <div className="hospital-card-header">
                    <h3>{hospital.hospital_name}</h3>
                  </div>

                  <div className="hospital-card-info">
                    <div className="installation-date">
                      <span className="label">Tanggal Instalasi</span>
                      <span className="value">
                        {formatDate(hospital.installation_date)}
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
            </motion.div>
          )}
        </div>
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
