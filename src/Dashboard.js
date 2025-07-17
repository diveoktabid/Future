import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Heart,
  Thermometer,
  Wifi,
  Battery,
  AlertTriangle,
  Users,
  LogOut,
  Menu,
  X,
  Droplets,
  Wind,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import './Dashboard.css';

// Room data constant
const ROOMS = [
  { id: 'ICU-1', name: 'ICU Room 1', status: 'active', patients: 2 },
  { id: 'ICU-2', name: 'ICU Room 2', status: 'active', patients: 1 },
  { id: 'ER-1', name: 'Emergency Room 1', status: 'critical', patients: 3 },
  { id: 'WARD-A', name: 'Ward A', status: 'normal', patients: 8 },
  { id: 'WARD-B', name: 'Ward B', status: 'normal', patients: 6 },
  { id: 'OR-1', name: 'Operating Room 1', status: 'active', patients: 1 }
];

// Mock real-time data
const generateSensorData = () => ({
  heartRate: Math.floor(Math.random() * 40) + 60, // 60-100 bpm
  temperature: (Math.random() * 6 + 36).toFixed(1), // 36-42°C
  oxygenLevel: Math.floor(Math.random() * 10) + 90, // 90-100%
  bloodPressure: {
    systolic: Math.floor(Math.random() * 40) + 110, // 110-150
    diastolic: Math.floor(Math.random() * 20) + 70   // 70-90
  },
  humidity: Math.floor(Math.random() * 20) + 40, // 40-60%
  airQuality: Math.floor(Math.random() * 50) + 50 // 50-100
});

const Dashboard = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('ICU-1');
  const [sensorData, setSensorData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = {};
      ROOMS.forEach(room => {
        newData[room.id] = generateSensorData();
      });
      setSensorData(newData);
      setLastUpdated(new Date());
      
      // Random alerts
      if (Math.random() < 0.1) { // 10% chance every 3 seconds
        const alertMessages = [
          'High temperature detected in ICU-1',
          'Low oxygen level in ER-1',
          'Heart rate anomaly in ICU-2',
          'Humidity level exceeded in Ward A'
        ];
        toast.error(alertMessages[Math.floor(Math.random() * alertMessages.length)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'text-red-500 bg-red-50';
      case 'active': return 'text-yellow-500 bg-yellow-50';
      case 'normal': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getValueStatus = (value, type) => {
    switch (type) {
      case 'heartRate':
        if (value < 60 || value > 100) return 'critical';
        if (value < 70 || value > 90) return 'warning';
        return 'normal';
      case 'temperature':
        if (value < 36 || value > 38) return 'critical';
        if (value < 36.5 || value > 37.5) return 'warning';
        return 'normal';
      case 'oxygen':
        if (value < 90) return 'critical';
        if (value < 95) return 'warning';
        return 'normal';
      default:
        return 'normal';
    }
  };

  const getTrendIcon = () => {
    const trend = Math.random();
    if (trend < 0.33) return <TrendingDown className="w-4 h-4 text-red-500" />;
    if (trend < 0.66) return <Minus className="w-4 h-4 text-gray-500" />;
    return <TrendingUp className="w-4 h-4 text-green-500" />;
  };

  const currentData = sensorData[selectedRoom] || generateSensorData();

  return (
    <div className="dashboard">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="menu-button"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="header-title">
            <h1>Bartech IoT Dashboard</h1>
            <p>Hospital Monitoring System</p>
          </div>
        </div>
        
        <div className="header-right">
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span>System Online</span>
          </div>
          <button className="notification-button">
            <Bell className="w-5 h-5" />
            <span className="notification-badge">3</span>
          </button>
          <button onClick={onLogout} className="logout-button">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="sidebar"
            >
              <div className="sidebar-header">
                <h2>Rooms</h2>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="room-list">
                {ROOMS.map(room => (
                  <motion.button
                    key={room.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedRoom(room.id);
                      setSidebarOpen(false);
                    }}
                    className={`room-item ${selectedRoom === room.id ? 'active' : ''}`}
                  >
                    <div className="room-info">
                      <h3>{room.name}</h3>
                      <p>{room.patients} patients</p>
                    </div>
                    <div className={`room-status ${getStatusColor(room.status)}`}>
                      {room.status}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="main-content">
          <div className="content-header">
            <h2>{ROOMS.find(r => r.id === selectedRoom)?.name}</h2>
            <p className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>

          {/* Sensor Cards Grid */}
          <div className="sensor-grid">
            {/* Heart Rate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`sensor-card ${getValueStatus(currentData.heartRate, 'heartRate')}`}
            >
              <div className="sensor-header">
                <Heart className="w-6 h-6 text-red-500" />
                <span>Heart Rate</span>
                {getTrendIcon()}
              </div>
              <div className="sensor-value">
                <span className="value">{currentData.heartRate}</span>
                <span className="unit">bpm</span>
              </div>
              <div className="sensor-status">
                Normal range: 60-100 bpm
              </div>
            </motion.div>

            {/* Temperature */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`sensor-card ${getValueStatus(currentData.temperature, 'temperature')}`}
            >
              <div className="sensor-header">
                <Thermometer className="w-6 h-6 text-orange-500" />
                <span>Temperature</span>
                {getTrendIcon()}
              </div>
              <div className="sensor-value">
                <span className="value">{currentData.temperature}</span>
                <span className="unit">°C</span>
              </div>
              <div className="sensor-status">
                Normal range: 36.5-37.5°C
              </div>
            </motion.div>

            {/* Oxygen Level */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`sensor-card ${getValueStatus(currentData.oxygenLevel, 'oxygen')}`}
            >
              <div className="sensor-header">
                <Activity className="w-6 h-6 text-blue-500" />
                <span>Oxygen Level</span>
                {getTrendIcon()}
              </div>
              <div className="sensor-value">
                <span className="value">{currentData.oxygenLevel}</span>
                <span className="unit">%</span>
              </div>
              <div className="sensor-status">
                Normal range: 95-100%
              </div>
            </motion.div>

            {/* Blood Pressure */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="sensor-card normal"
            >
              <div className="sensor-header">
                <Droplets className="w-6 h-6 text-purple-500" />
                <span>Blood Pressure</span>
                {getTrendIcon()}
              </div>
              <div className="sensor-value">
                <span className="value">{currentData.bloodPressure.systolic}/{currentData.bloodPressure.diastolic}</span>
                <span className="unit">mmHg</span>
              </div>
              <div className="sensor-status">
                Normal range: 120/80 mmHg
              </div>
            </motion.div>

            {/* Humidity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="sensor-card normal"
            >
              <div className="sensor-header">
                <Droplets className="w-6 h-6 text-cyan-500" />
                <span>Humidity</span>
                {getTrendIcon()}
              </div>
              <div className="sensor-value">
                <span className="value">{currentData.humidity}</span>
                <span className="unit">%</span>
              </div>
              <div className="sensor-status">
                Optimal range: 40-60%
              </div>
            </motion.div>

            {/* Air Quality */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="sensor-card normal"
            >
              <div className="sensor-header">
                <Wind className="w-6 h-6 text-green-500" />
                <span>Air Quality</span>
                {getTrendIcon()}
              </div>
              <div className="sensor-value">
                <span className="value">{currentData.airQuality}</span>
                <span className="unit">AQI</span>
              </div>
              <div className="sensor-status">
                Good: 50-100 AQI
              </div>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <h3>Room Overview</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <Users className="w-5 h-5 text-blue-500" />
                <span>Patients</span>
                <strong>{ROOMS.find(r => r.id === selectedRoom)?.patients}</strong>
              </div>
              <div className="stat-item">
                <Wifi className="w-5 h-5 text-green-500" />
                <span>Connectivity</span>
                <strong>100%</strong>
              </div>
              <div className="stat-item">
                <Battery className="w-5 h-5 text-yellow-500" />
                <span>Sensors Active</span>
                <strong>6/6</strong>
              </div>
              <div className="stat-item">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>Alerts</span>
                <strong>2</strong>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;