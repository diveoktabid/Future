import { IOT_STATUS, IOT_STATUS_COLORS } from './constants';

// Date & Time Helpers
export const formatDate = (date, locale = 'id-ID') => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (date, locale = 'id-ID') => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  return dateObj.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateTime = (date, locale = 'id-ID') => {
  if (!date) return '';
  
  return `${formatDate(date, locale)} ${formatTime(date, locale)}`;
};

export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return 'Baru saja';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
  
  return formatDate(date);
};

// Validation Helpers
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const minLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  
  return {
    isValid: minLength && hasNumber && hasLetter,
    errors: {
      minLength: !minLength ? 'Password minimal 6 karakter' : null,
      hasNumber: !hasNumber ? 'Password harus mengandung angka' : null,
      hasLetter: !hasLetter ? 'Password harus mengandung huruf' : null
    }
  };
};

export const validatePhone = (phone) => {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,11}$/;
  return phoneRegex.test(phone);
};

// IOT Status Helpers
export const getStatusColor = (status) => {
  return IOT_STATUS_COLORS[status] || 'secondary';
};

export const getStatusIcon = (status) => {
  const icons = {
    [IOT_STATUS.ONLINE]: '🟢',
    [IOT_STATUS.OFFLINE]: '🔴',
    [IOT_STATUS.MAINTENANCE]: '🟡',
    [IOT_STATUS.ERROR]: '⚠️'
  };
  return icons[status] || '⚪';
};

export const getRandomStatus = () => {
  const statuses = Object.values(IOT_STATUS);
  const weights = [0.7, 0.2, 0.05, 0.05]; // 70% online, 20% offline, 5% maintenance, 5% error
  
  const random = Math.random();
  let sum = 0;
  
  for (let i = 0; i < statuses.length; i++) {
    sum += weights[i];
    if (random <= sum) {
      return statuses[i];
    }
  }
  
  return IOT_STATUS.ONLINE;
};

// Data Processing Helpers
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
};

export const filterBy = (array, filters) => {
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (Array.isArray(value)) {
        return value.includes(item[key]);
      }
      return item[key] === value;
    });
  });
};

// Number & String Helpers
export const formatNumber = (number, locale = 'id-ID') => {
  return new Intl.NumberFormat(locale).format(number);
};

export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Storage Helpers
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Device & Browser Helpers
export const isMobile = () => {
  return window.innerWidth <= 768;
};

export const isTablet = () => {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
};

export const isDesktop = () => {
  return window.innerWidth > 1024;
};

export const getDeviceType = () => {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
};

// Network Helpers
export const isOnline = () => navigator.onLine;

export const simulateNetworkDelay = (min = 500, max = 2000) => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};