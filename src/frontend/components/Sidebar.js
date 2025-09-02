import React from 'react';
import './Sidebar.css';

const Sidebar = ({
  currentUser,
  currentView,
  sidebarCollapsed,
  setSidebarCollapsed,
  isMobile,
  showMobileSidebar,
  setShowMobileSidebar,
  onDashboardClick,
  onSettingsClick,
  onLogoutClick
}) => {
  // Handle sidebar toggle
  const toggleSidebar = () => {
    if (isMobile) {
      setShowMobileSidebar(!showMobileSidebar);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
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

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <div 
          className={`sidebar-overlay ${showMobileSidebar ? 'show' : ''}`}
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

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
            onDashboardClick();
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
            onSettingsClick();
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
              onLogoutClick();
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
    </>
  );
};

export default Sidebar;
