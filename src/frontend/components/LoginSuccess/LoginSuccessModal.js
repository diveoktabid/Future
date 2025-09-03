import React, { useEffect } from "react";
import "./LoginSuccessModal.css";

const LoginSuccessModal = ({ isOpen, onClose, userName, onContinue }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle click outside modal
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Close modal">
          ×
        </button>

        {/* Modal Content */}
        <div className="modal-content">
          {/* Success Icon */}
          <div className="success-icon-wrapper">
            <svg
              className="success-checkmark"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Title with Party Emoji */}
          <h2 className="modal-title">
            Selamat Datang! <span className="party-emoji">🎉</span>
          </h2>

          {/* Subtitle */}
          <p className="modal-subtitle">Login berhasil dilakukan</p>

          {/* Welcome Message */}
          <p className="welcome-message">Halo, {userName || "User"}!</p>
          {/* Continue Button */}
          <button onClick={onContinue} className="continue-btn">
            Lanjutkan ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginSuccessModal;
