import React, { useState } from "react";
import "./Dashboard.css";

const Dashboard = () => {
  const [hospitals] = useState([
    {
      id: 1,
      name: "Rumah Sakit",
      subtitle: "Medika Sehat",
      installDate: "Senin 13 July 2025",
      time: "07:00",
      status: "Mati",
    },
    {
      id: 2,
      name: "Rumah Sakit",
      subtitle: "Pelita Mentari",
      installDate: "25 Juli 2024",
      time: "07:00",
      status: "Nyala",
    },
    {
      id: 3,
      name: "Rumah Sakit",
      subtitle: "Elisabeth",
      installDate: "8 November 2024",
      time: "07:00",
      status: "Mati",
    },
    {
      id: 4,
      name: "Rumah Sakit",
      subtitle: "Pelita Mentari",
      installDate: "9 Agustus 2024",
      time: "07:00",
      status: "Mati",
    },
    {
      id: 5,
      name: "Rumah Sakit",
      subtitle: "Karya Medika",
      installDate: "5 Januari 2025",
      time: "07:00",
      status: "Mati",
    },
    {
      id: 6,
      name: "Rumah Sakit",
      subtitle: "Diponergoro",
      installDate: "8 April 2025",
      time: "07:00",
      status: "Mati",
    },
  ]);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-content">
          <h1 className="logo">Bartech</h1>

          <nav className="navigation">
            <div className="nav-item active">
              <div className="nav-icon">
                <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <span className="nav-text">Dashboard</span>
            </div>
          </nav>
        </div>

        {/* User Profile */}
        <div className="user-profile">
          <div className="user-avatar">
            <span>R</span>
          </div>
          <div className="user-info">
            <p className="user-name">Reza Aditya</p>
            <p className="user-role">Admin</p>
          </div>
        </div>

        {/* Bottom Menu */}
        <div className="bottom-menu">
          <div className="menu-item">
            <svg
              className="menu-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Settings</span>
          </div>
          <div className="menu-item logout">
            <svg
              className="menu-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Log out</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="cards-grid">
          {hospitals.map((hospital) => (
            <div key={hospital.id} className="hospital-card">
              <div className="card-content">
                <h3 className="hospital-name">{hospital.name}</h3>
                {hospital.subtitle && (
                  <p className="hospital-subtitle">{hospital.subtitle}</p>
                )}

                <div className="date-time-section">
                  <p className="install-date">{hospital.installDate}</p>
                  <p className="time">{hospital.time}</p>
                </div>

                <div className="status-section">
                  <p className="status-label">Status IOT</p>
                  <span
                    className={`status-badge ${
                      hospital.status === "Nyala"
                        ? "status-active"
                        : "status-inactive"
                    }`}>
                    {hospital.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
