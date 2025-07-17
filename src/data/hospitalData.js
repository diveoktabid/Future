import { IOT_STATUS, HOSPITAL_TYPES } from '../utils/constants';
import { getRandomStatus } from '../utils/helpers';

// Data rumah sakit yang realistis
export const hospitalData = [
  {
    id: 1,
    name: "RS Medika Sehat",
    type: HOSPITAL_TYPES.GENERAL,
    location: {
      city: "Jakarta Selatan",
      district: "Kebayoran Baru",
      address: "Jl. Senopati No. 15, Jakarta Selatan 12110"
    },
    installDate: "2025-07-13T00:00:00Z",
    lastUpdate: "2025-01-17T07:00:00Z",
    status: IOT_STATUS.OFFLINE,
    devices: {
      total: 15,
      online: 12,
      offline: 3
    },
    metrics: {
      uptime: 95.5,
      responseTime: 120,
      alertsToday: 2
    },
    contact: {
      phone: "+62-21-7208888",
      email: "info@medikaSehat.id"
    }
  },
  {
    id: 2,
    name: "RS Prima Medika",
    type: HOSPITAL_TYPES.GENERAL,
    location: {
      city: "Jakarta Pusat",
      district: "Menteng",
      address: "Jl. MH Thamrin No. 89, Jakarta Pusat 10310"
    },
    installDate: "2025-01-10T00:00:00Z",
    lastUpdate: "2025-01-17T07:15:00Z",
    status: IOT_STATUS.ONLINE,
    devices: {
      total: 12,
      online: 12,
      offline: 0
    },
    metrics: {
      uptime: 98.2,
      responseTime: 85,
      alertsToday: 0
    },
    contact: {
      phone: "+62-21-3904567",
      email: "contact@primamedika.co.id"
    }
  },
  {
    id: 3,
    name: "RS Husada Utama",
    type: HOSPITAL_TYPES.SPECIALIZED,
    location: {
      city: "Bandung",
      district: "Bandung Wetan",
      address: "Jl. Pasteur No. 38, Bandung 40161"
    },
    installDate: "2025-01-05T00:00:00Z",
    lastUpdate: "2025-01-17T06:45:00Z",
    status: IOT_STATUS.MAINTENANCE,
    devices: {
      total: 8,
      online: 6,
      offline: 2
    },
    metrics: {
      uptime: 92.1,
      responseTime: 150,
      alertsToday: 1
    },
    contact: {
      phone: "+62-22-2034567",
      email: "admin@husadautama.ac.id"
    }
  },
  {
    id: 4,
    name: "RS Harapan Bunda",
    type: HOSPITAL_TYPES.SPECIALIZED,
    location: {
      city: "Surabaya",
      district: "Gubeng",
      address: "Jl. Raya Gubeng No. 70, Surabaya 60281"
    },
    installDate: "2024-12-20T00:00:00Z",
    lastUpdate: "2025-01-17T07:30:00Z",
    status: IOT_STATUS.ONLINE,
    devices: {
      total: 10,
      online: 9,
      offline: 1
    },
    metrics: {
      uptime: 96.8,
      responseTime: 95,
      alertsToday: 0
    },
    contact: {
      phone: "+62-31-5031234",
      email: "info@harapanbunda.com"
    }
  },
  {
    id: 5,
    name: "Klinik Sehat Bersama",
    type: HOSPITAL_TYPES.CLINIC,
    location: {
      city: "Yogyakarta",
      district: "Sleman",
      address: "Jl. Kaliurang KM 7, Sleman 55284"
    },
    installDate: "2025-01-15T00:00:00Z",
    lastUpdate: "2025-01-17T06:30:00Z",
    status: IOT_STATUS.ERROR,
    devices: {
      total: 5,
      online: 2,
      offline: 3
    },
    metrics: {
      uptime: 78.3,
      responseTime: 200,
      alertsToday: 5
    },
    contact: {
      phone: "+62-274-881234",
      email: "klinik@sehatbersama.id"
    }
  },
  {
    id: 6,
    name: "RS Bunda Sejahtera",
    type: HOSPITAL_TYPES.GENERAL,
    location: {
      city: "Medan",
      district: "Medan Baru",
      address: "Jl. Guru Patimpus No. 23, Medan 20154"
    },
    installDate: "2024-12-01T00:00:00Z",
    lastUpdate: "2025-01-17T07:00:00Z",
    status: IOT_STATUS.ONLINE,
    devices: {
      total: 18,
      online: 17,
      offline: 1
    },
    metrics: {
      uptime: 97.5,
      responseTime: 110,
      alertsToday: 1
    },
    contact: {
      phone: "+62-61-4567890",
      email: "admin@bundasejahtera.co.id"
    }
  }
];

// Helper functions untuk data manipulation
export const getHospitalById = (id) => {
  return hospitalData.find(hospital => hospital.id === parseInt(id));
};

export const getHospitalsByStatus = (status) => {
  return hospitalData.filter(hospital => hospital.status === status);
};

export const getHospitalsByCity = (city) => {
  return hospitalData.filter(hospital => 
    hospital.location.city.toLowerCase().includes(city.toLowerCase())
  );
};

export const getHospitalsByType = (type) => {
  return hospitalData.filter(hospital => hospital.type === type);
};

// Statistics helpers
export const getHospitalStats = () => {
  const total = hospitalData.length;
  const online = getHospitalsByStatus(IOT_STATUS.ONLINE).length;
  const offline = getHospitalsByStatus(IOT_STATUS.OFFLINE).length;
  const maintenance = getHospitalsByStatus(IOT_STATUS.MAINTENANCE).length;
  const error = getHospitalsByStatus(IOT_STATUS.ERROR).length;
  
  return {
    total,
    online,
    offline,
    maintenance,
    error,
    onlinePercentage: ((online / total) * 100).toFixed(1),
    offlinePercentage: ((offline / total) * 100).toFixed(1)
  };
};

export const getTotalDevices = () => {
  return hospitalData.reduce((total, hospital) => total + hospital.devices.total, 0);
};

export const getTotalOnlineDevices = () => {
  return hospitalData.reduce((total, hospital) => total + hospital.devices.online, 0);
};

export const getAverageUptime = () => {
  const totalUptime = hospitalData.reduce((total, hospital) => total + hospital.metrics.uptime, 0);
  return (totalUptime / hospitalData.length).toFixed(1);
};

export const getTodayAlerts = () => {
  return hospitalData.reduce((total, hospital) => total + hospital.metrics.alertsToday, 0);
};

// Simulation functions (untuk development, nanti akan diganti dengan MQTT)
export const simulateStatusUpdate = (hospitalId) => {
  const hospital = getHospitalById(hospitalId);
  if (hospital) {
    const newStatus = getRandomStatus();
    hospital.status = newStatus;
    hospital.lastUpdate = new Date().toISOString();
    
    // Update device counts based on status
    if (newStatus === IOT_STATUS.ONLINE) {
      hospital.devices.online = hospital.devices.total;
      hospital.devices.offline = 0;
    } else if (newStatus === IOT_STATUS.OFFLINE) {
      hospital.devices.online = 0;
      hospital.devices.offline = hospital.devices.total;
    } else {
      const onlineCount = Math.floor(hospital.devices.total * 0.6);
      hospital.devices.online = onlineCount;
      hospital.devices.offline = hospital.devices.total - onlineCount;
    }
    
    return hospital;
  }
  return null;
};

export const simulateAllStatusUpdates = () => {
  return hospitalData.map(hospital => ({
    ...hospital,
    status: getRandomStatus(),
    lastUpdate: new Date().toISOString()
  }));
};

// Mock MQTT data structure (untuk persiapan integrasi MQTT)
export const createMqttMessage = (hospitalId, status, deviceData) => {
  return {
    topic: `bartech/hospital/${hospitalId}/status`,
    payload: {
      hospitalId,
      status,
      timestamp: new Date().toISOString(),
      devices: deviceData,
      metrics: {
        uptime: Math.random() * 100,
        responseTime: Math.floor(Math.random() * 200) + 50,
        alertsToday: Math.floor(Math.random() * 10)
      }
    }
  };
};