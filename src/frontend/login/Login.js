import React, { useState } from "react";
import "./Login.css";
import authService from "../services/authService";
import LoginSuccessModal from "../components/LoginSuccessModal";

const Login = ({ onLogin, onCreateAccount, onForgotPassword }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const handleKeyPress = (e) => {
    if (
      e.key === "Enter" &&
      formData.email &&
      formData.password &&
      !isLoading
    ) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await authService.login(
        formData.email,
        formData.password,
        formData.rememberMe
      );

      if (result.success) {
        setLoggedInUser(result.user);
        setShowSuccessModal(true);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  const handleContinueToDashboard = () => {
    setShowSuccessModal(false);
    onLogin(loggedInUser);
  };

  return (
    <div className="login-page">
      <div className="login-left-section">
        <div className="login-container">
          <div className="login-form-section">
            <div className="login-header">
              <h1 className="brand-title">Bartech</h1>
            </div>

            <div className="welcome-message">
              <h2>It's good to see you again.</h2>
              <p>Stay ahead, stay organized.</p>
            </div>

            <div className="login-form">
              {error && <div className="error-message">{error}</div>}

              <div className="input-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  required
                  className="form-input"
                  autoComplete="email"
                />
              </div>

              <div className="input-group">
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    required
                    className="form-input"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={togglePasswordVisibility}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }>
                    {showPassword ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="forgot-password">
                <button
                  type="button"
                  className="forgot-link"
                  onClick={onForgotPassword}>
                  Forgot Your Password?
                </button>
              </div>

              <button
                onClick={handleSubmit}
                className="signin-button"
                disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </button>

              <div className="create-account">
                <span>Don't have an account? </span>
                <button
                  type="button"
                  className="create-link"
                  onClick={onCreateAccount}>
                  Create your account
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="footer">
          <p>© 2025, Bartech Utama Mandiri. All Rights Reserved.</p>
        </div>
      </div>

      <div className="login-right-section">
        <img
          src="/Hospitalbuilding.png"
          alt="Hospital Building"
          className="hospital-image"
        />
        <div className="hospital-text">
          <h3>
            Better data. Better decisions.
            <br />
            Better care
          </h3>
        </div>
      </div>

      {/* Login Success Modal */}
      <LoginSuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        userName={loggedInUser ? `${loggedInUser.firstName} ${loggedInUser.lastName}` : ''}
        onContinue={handleContinueToDashboard}
      />
    </div>
  );
};

export default Login;
