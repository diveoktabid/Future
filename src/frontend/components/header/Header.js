import React, { useState, useEffect } from 'react';
import './Header.css';

// ===== CENTRALIZED DATE/TIME UTILITIES =====
// All date/time formatting functions are consolidated here

/**
 * Get current timestamp
 * @returns {Date} Current date object
 */
const getCurrentTime = () => new Date();

/**
 * Check if date is valid
 * @param {string|Date} dateInput - Date to validate
 * @returns {boolean} True if valid date
 */
const isValidDate = (dateInput) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Format date and time for Indonesian locale
 * @param {string|Date} dateInput - Date string or Date object
 * @param {object} options - Formatting options
 * @returns {string} Formatted date string
 */
const formatDateTime = (dateInput, options = {}) => {
  if (!dateInput) return 'N/A';
  
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const defaultOptions = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...options
  };
  
  return date.toLocaleString('id-ID', defaultOptions);
};

/**
 * Format date only (no time) with full weekday
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Formatted date string
 */
const formatDate = (dateInput) => {
  return formatDateTime(dateInput, {
    weekday: 'long',
    hour: undefined,
    minute: undefined,
    second: undefined
  });
};

/**
 * Format time only (no date)
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Formatted time string
 */
const formatTime = (dateInput) => {
  if (!dateInput) return 'N/A';
  
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  if (isNaN(date.getTime())) return 'Invalid Time';
  
  return date.toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * Format date and time for table display
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Formatted date-time string for tables
 */
const formatTableDateTime = (dateInput) => {
  return formatDateTime(dateInput, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: undefined
  });
};

/**
 * Format header date (full format)
 * @param {Date} date - Date object
 * @returns {string} Formatted header date string
 */
const formatHeaderDate = (date) => {
  if (!date || isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format header time (time only)
 * @param {Date} date - Date object
 * @returns {string} Formatted header time string
 */
const formatHeaderTime = (date) => {
  if (!date || isNaN(date.getTime())) return 'Invalid Time';
  
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

// ===== HEADER COMPONENT =====
const Header = ({ selectedHospital, settings, lastRefresh, onManualRefresh }) => {
  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="time-header">
      <div className="time-info">
        <div className="current-time">
          <span className="time-display">{formatHeaderTime(currentTime)}</span>
          <span className="timezone">WIB</span>
        </div>
        <div className="current-date">{formatHeaderDate(currentTime)}</div>
      </div>
      
      {/* Refresh Status Indicator */}
      {selectedHospital && settings.refreshInterval > 0 && (
        <div className="refresh-indicator">
          <div className="refresh-info">
            <span className="refresh-interval">
              🔄 Auto: {settings.refreshInterval / 1000}s
            </span>
            {settings.showLastUpdate && (
              <span className="last-refresh">
                Terakhir: {formatTime(lastRefresh)}
              </span>
            )}
          </div>
          <button 
            className="manual-refresh-btn"
            onClick={onManualRefresh}
            title="Refresh manual"
          >
            ⟳
          </button>
        </div>
      )}
    </div>
  );
};

// Export all date/time utilities for use in other components
export {
  getCurrentTime,
  isValidDate,
  formatDateTime,
  formatDate,
  formatTime,
  formatTableDateTime,
  formatHeaderDate,
  formatHeaderTime
};

export default Header;
