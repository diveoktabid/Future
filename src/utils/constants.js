export const APP_CONFIG = {
  APP_NAME: 'Bartech',
  VERSION: '1.0.0',
  COMPANY: 'Bartech Utama Mandiri',
  COPYRIGHT_YEAR: new Date().getFullYear()
};

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  HOSPITALS: '/hospitals',
  SETTINGS: '/settings',
  PROFILE: '/profile'
};

export const IOT_STATUS = {
  ONLINE: 'Nyala',
  OFFLINE: 'Mati',
  MAINTENANCE: 'Maintenance',
  ERROR: 'Error'
};

export const IOT_STATUS_COLORS = {
  [IOT_STATUS.ONLINE]: 'success',
  [IOT_STATUS.OFFLINE]: 'danger',
  [IOT_STATUS.MAINTENANCE]: 'warning',
  [IOT_STATUS.ERROR]: 'danger'
};

export const HOSPITAL_TYPES = {
  GENERAL: 'Rumah Sakit Umum',
  SPECIALIZED: 'Rumah Sakit Khusus',
  CLINIC: 'Klinik',
  EMERGENCY: 'Rumah Sakit Darurat'
};

export const USER_ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  TECHNICIAN: 'Teknisi',
  VIEWER: 'Viewer'
};

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// MQTT Configuration (untuk nanti)
export const MQTT_CONFIG = {
  BROKER_URL: process.env.REACT_APP_MQTT_BROKER || 'ws://localhost:8083/mqtt',
  CLIENT_ID: `bartech_client_${Math.random().toString(16).substr(2, 8)}`,
  TOPICS: {
    HOSPITAL_STATUS: 'bartech/hospital/+/status',
    DEVICE_STATUS: 'bartech/device/+/status',
    ALERTS: 'bartech/alerts/+'
  },
  QOS: 0,
  KEEP_ALIVE: 60
};

// Simulation untuk development
export const SIMULATION_CONFIG = {
  STATUS_UPDATE_INTERVAL: 10000, // 10 detik
  ENABLE_REAL_TIME: true,
  RANDOM_STATUS_CHANGE: true
};