import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Activity, 
  AlertTriangle,
  Wifi,
  WifiOff,
  Settings,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { getStatusColor, getStatusIcon, formatDate, formatTime, getRelativeTime } from '../../utils/helpers';
import { IOT_STATUS } from '../../utils/constants';
import './HospitalCard.css';

const HospitalCard = ({ 
  hospital, 
  onStatusClick, 
  onCardClick, 
  isSelected = false,
  showDetails = true 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [lastPulse, setLastPulse] = useState(Date.now());

  // Simulate pulse effect for online status
  useEffect(() => {
    if (hospital.status === IOT_STATUS.ONLINE) {
      const interval = setInterval(() => {
        setLastPulse(Date.now());
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [hospital.status]);

  const getStatusConfig = (status) => {
    const configs = {
      [IOT_STATUS.ONLINE]: {
        color: 'success',
        icon: <Wifi size={16} />,
        text: 'Online',
        bgClass: 'status-online'
      },
      [IOT_STATUS.OFFLINE]: {
        color: 'danger',
        icon: <WifiOff size={16} />,
        text: 'Offline',
        bgClass: 'status-offline'
      },
      [IOT_STATUS.MAINTENANCE]: {
        color: 'warning',
        icon: <Settings size={16} />,
        text: 'Maintenance',
        bgClass: 'status-maintenance'
      },
      [IOT_STATUS.ERROR]: {
        color: 'danger',
        icon: <AlertTriangle size={16} />,
        text: 'Error',
        bgClass: 'status-error'
      }
    };
    return configs[status] || configs[IOT_STATUS.OFFLINE];
  };

  const statusConfig = getStatusConfig(hospital.status);
  const devicePercentage = hospital.devices.total > 0 
    ? (hospital.devices.online / hospital.devices.total * 100).toFixed(0)
    : 0;

  const handleCardClick = () => {
    onCardClick?.(hospital);
  };

  const handleStatusClick = (e) => {
    e.stopPropagation();
    onStatusClick?.(hospital);
  };

  return (
    <div 
      className={`hospital-card ${isSelected ? 'selected' : ''} ${statusConfig.bgClass}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header Section */}
      <div className="card-header">
        <div className="hospital-info">
          <h3 className="hospital-name">{hospital.name}</h3>
          <div className="hospital-location">
            <MapPin size={14} />
            <span>{hospital.location.city}</span>
          </div>
        </div>
        
        <div className="status-indicator">
          <button 
            className={`status-badge badge-${statusConfig.color} ${hospital.status === IOT_STATUS.ONLINE ? 'pulse' : ''}`}
            onClick={handleStatusClick}
            title={`Status: ${statusConfig.text}`}
          >
            {statusConfig.icon}
            <span>{statusConfig.text}</span>
          </button>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="card-metrics">
        <div className="metric-item">
          <div className="metric-icon">
            <Activity size={16} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Devices</div>
            <div className="metric-value">
              {hospital.devices.online}/{hospital.devices.total}
              <span className="metric-percentage">({devicePercentage}%)</span>
            </div>
          </div>
        </div>

        <div className="metric-item">
          <div className="metric-icon">
            {hospital.metrics.uptime >= 95 ? <TrendingUp size={16} className="text-success" /> : <TrendingDown size={16} className="text-danger" />}
          </div>
          <div className="metric-content">
            <div className="metric-label">Uptime</div>
            <div className="metric-value">{hospital.metrics.uptime}%</div>
          </div>
        </div>

        <div className="metric-item">
          <div className="metric-icon">
            <Clock size={16} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Response</div>
            <div className="metric-value">{hospital.metrics.responseTime}ms</div>
          </div>
        </div>
      </div>

      {/* Device Status Bar */}
      <div className="device-status-bar">
        <div className="status-bar-label">Device Status</div>
        <div className="status-bar">
          <div 
            className="status-bar-fill online"
            style={{ width: `${devicePercentage}%` }}
          ></div>
        </div>
        <div className="status-bar-text">
          {hospital.devices.online} online, {hospital.devices.offline} offline
        </div>
      </div>

      {/* Details Section (expandable) */}
      {(showDetails || isHovered) && (
        <div className="card-details">
          <div className="detail-row">
            <span className="detail-label">Install Date:</span>
            <span className="detail-value">{formatDate(hospital.installDate)}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Last Update:</span>
            <span className="detail-value">{getRelativeTime(hospital.lastUpdate)}</span>
          </div>

          {hospital.metrics.alertsToday > 0 && (
            <div className="detail-row alert-row">
              <AlertTriangle size={14} />
              <span className="detail-value text-danger">
                {hospital.metrics.alertsToday} alerts today
              </span>
            </div>
          )}

          {/* Contact Info (shown on hover) */}
          {isHovered && (
            <div className="contact-info">
              <div className="contact-item">
                <Phone size={12} />
                <span>{hospital.contact.phone}</span>
              </div>
              <div className="contact-item">
                <Mail size={12} />
                <span>{hospital.contact.email}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading Overlay (for future MQTT integration) */}
      {hospital.isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <span>Updating...</span>
        </div>
      )}
    </div>
  );
};

export default HospitalCard;