import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Shield, 
  ChevronDown,
  Moon,
  Sun,
  Edit3
} from 'lucide-react';
import { USER_ROLES } from '../../utils/constants';
import './UserProfile.css';

const UserProfile = ({ 
  user = {
    name: 'Reza Aditya',
    role: USER_ROLES.ADMIN,
    email: 'reza.aditya@bartech.id',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format',
    isOnline: true,
    lastLogin: new Date().toISOString()
  },
  onLogout,
  onProfileEdit,
  onSettingsClick,
  compact = false
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const getRoleColor = (role) => {
    const colors = {
      [USER_ROLES.ADMIN]: 'role-admin',
      [USER_ROLES.MANAGER]: 'role-manager',
      [USER_ROLES.TECHNICIAN]: 'role-technician',
      [USER_ROLES.VIEWER]: 'role-viewer'
    };
    return colors[role] || 'role-viewer';
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleMenuItemClick = (action) => {
    setIsDropdownOpen(false);
    action?.();
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Here you would typically dispatch to a theme context
  };

  if (compact) {
    return (
      <div className="user-profile compact">
        <div className="profile-avatar">
          <img src={user.avatar} alt={user.name} />
          {user.isOnline && <div className="online-indicator"></div>}
        </div>
        <div className="profile-info">
          <div className="user-name">{user.name}</div>
          <div className={`user-role ${getRoleColor(user.role)}`}>
            {user.role}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`user-profile ${isDropdownOpen ? 'dropdown-open' : ''}`}>
      <div className="profile-main" onClick={handleDropdownToggle}>
        <div className="profile-avatar">
          <img src={user.avatar} alt={user.name} />
          {user.isOnline && <div className="online-indicator"></div>}
        </div>
        
        <div className="profile-info">
          <div className="user-name">{user.name}</div>
          <div className={`user-role ${getRoleColor(user.role)}`}>
            {user.role}
          </div>
        </div>

        <div className="dropdown-arrow">
          <ChevronDown size={16} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="profile-dropdown">
          <div className="dropdown-header">
            <div className="user-details">
              <strong>{user.name}</strong>
              <span className="user-email">{user.email}</span>
              <span className="last-login">
                Last login: {new Date(user.lastLogin).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="dropdown-menu">
            <button 
              className="menu-item"
              onClick={() => handleMenuItemClick(onProfileEdit)}
            >
              <Edit3 size={16} />
              <span>Edit Profile</span>
            </button>

            <button 
              className="menu-item"
              onClick={() => handleMenuItemClick(onSettingsClick)}
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>

            <button className="menu-item">
              <Bell size={16} />
              <span>Notifications</span>
              <div className="notification-badge">3</div>
            </button>

            <button className="menu-item">
              <Shield size={16} />
              <span>Security</span>
            </button>

            <div className="menu-divider"></div>

            <button 
              className="menu-item theme-toggle"
              onClick={toggleDarkMode}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              <div className={`theme-switch ${isDarkMode ? 'dark' : ''}`}>
                <div className="theme-switch-thumb"></div>
              </div>
            </button>

            <div className="menu-divider"></div>

            <button 
              className="menu-item logout"
              onClick={() => handleMenuItemClick(onLogout)}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isDropdownOpen && (
        <div 
          className="dropdown-backdrop"
          onClick={() => setIsDropdownOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default UserProfile;