import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Hospital, 
  Users, 
  Settings, 
  BarChart3, 
  AlertTriangle,
  FileText,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';
import UserProfile from '../UserProfile/UserProfile';
import { getHospitalStats } from '../../data/hospitalData';
import './Sidebar.css';

const Sidebar = ({ 
  activeMenu = 'dashboard',
  onMenuChange,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
  hospitalData = []
}) => {
  const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);

  // Update stats when hospital data changes
  useEffect(() => {
    if (hospitalData.length > 0) {
      setStats(getHospitalStats());
      
      // Generate notifications based on hospital status
      const newNotifications = [];
      hospitalData.forEach(hospital => {
        if (hospital.status === 'Error') {
          newNotifications.push({
            id: hospital.id,
            type: 'error',
            message: `${hospital.name} has critical errors`,
            time: new Date(hospital.lastUpdate)
          });
        } else if (hospital.metrics.alertsToday > 0) {
          newNotifications.push({
            id: `alert-${hospital.id}`,
            type: 'warning',
            message: `${hospital.name} has ${hospital.metrics.alertsToday} alerts`,
            time: new Date()
          });
        }
      });
      setNotifications(newNotifications);
    }
  }, [hospitalData]);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      color: 'text-primary'
    },
    {
      id: 'hospitals',
      label: 'Hospitals',
      icon: Hospital,
      badge: stats.total || 0,
      color: 'text-blue'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      badge: null,
      color: 'text-purple'
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: AlertTriangle,
      badge: notifications.length,
      color: notifications.length > 0 ? 'text-danger' : 'text-orange'
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      badge: null,
      color: 'text-green'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      badge: null,
      color: 'text-teal'
    }
  ];

  const bottomMenuItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      color: 'text-gray'
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: HelpCircle,
      color: 'text-gray'
    }
  ];

  const handleMenuClick = (menuId) => {
    onMenuChange?.(menuId);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Collapse Toggle */}
      <button 
        className="collapse-toggle"
        onClick={onToggleCollapse}
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="sidebar-content">
        {/* Logo Section */}
        <div className="sidebar-logo">
          {!isCollapsed ? (
            <div className="logo-full">
              <Activity size={32} className="logo-icon" />
              <div className="logo-text">
                <h2>Bartech</h2>
                <span>IoT Monitor</span>
              </div>
            </div>
          ) : (
            <div className="logo-collapsed">
              <Activity size={24} />
            </div>
          )}
        </div>

        {/* Stats Overview (when expanded) */}
        {!isCollapsed && stats.total > 0 && (
          <div className="sidebar-stats">
            <div className="stats-header">System Overview</div>
            <div className="stats-grid">
              <div className="stat-item online">
                <div className="stat-value">{stats.online}</div>
                <div className="stat-label">Online</div>
              </div>
              <div className="stat-item offline">
                <div className="stat-value">{stats.offline}</div>
                <div className="stat-label">Offline</div>
              </div>
            </div>
            <div className="uptime-display">
              <span>System Uptime: {stats.onlinePercentage}%</span>
              <div className="uptime-bar">
                <div 
                  className="uptime-fill"
                  style={{ width: `${stats.onlinePercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            {!isCollapsed && <div className="nav-section-title">Main</div>}
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeMenu === item.id ? 'active' : ''} ${item.color}`}
                onClick={() => handleMenuClick(item.id)}
                title={isCollapsed ? item.label : ''}
              >
                <div className="nav-icon">
                  <item.icon size={20} />
                </div>
                {!isCollapsed && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    {item.badge !== null && item.badge > 0 && (
                      <span className={`nav-badge ${item.id === 'alerts' && item.badge > 0 ? 'pulse' : ''}`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>

          <div className="nav-section">
            {!isCollapsed && <div className="nav-section-title">System</div>}
            {bottomMenuItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeMenu === item.id ? 'active' : ''} ${item.color}`}
                onClick={() => handleMenuClick(item.id)}
                title={isCollapsed ? item.label : ''}
              >
                <div className="nav-icon">
                  <item.icon size={20} />
                </div>
                {!isCollapsed && (
                  <span className="nav-label">{item.label}</span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Recent Notifications (when expanded) */}
        {!isCollapsed && notifications.length > 0 && (
          <div className="sidebar-notifications">
            <div className="notifications-header">
              <AlertTriangle size={16} />
              <span>Recent Alerts</span>
            </div>
            <div className="notifications-list">
              {notifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className={`notification-item ${notification.type}`}>
                  <div className="notification-dot"></div>
                  <div className="notification-content">
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">
                      {notification.time.toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="sidebar-user">
          <UserProfile
            compact={isCollapsed}
            onLogout={onLogout}
          />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;