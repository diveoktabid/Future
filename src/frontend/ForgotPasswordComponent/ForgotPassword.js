import React, { useState } from "react";
import "./ForgotPassword.css";
import authService from "../services/authService";

const ForgotPassword = ({ onBackToLogin }) => {
  const [step, setStep] = useState(1); // 1: email, 2: verification code, 3: new password
  const [formData, setFormData] = useState({
    email: "",
    verificationCode: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      if (step === 1 && formData.email) {
        handleSendCode();
      } else if (step === 2 && formData.verificationCode) {
        handleVerifyCode();
      } else if (
        step === 3 &&
        formData.newPassword &&
        formData.confirmPassword
      ) {
        handleResetPassword();
      }
    }
  };

  // Step 1: Send verification code to email
  const handleSendCode = async () => {
    if (!formData.email) {
      setError("Please enter your email address");
      return;
    }

    if (!authService.validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await authService.sendPasswordResetCode(formData.email);
      if (result.success) {
        setSuccessMessage("Verification code sent to your email!");
        setStep(2);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify the code
  const handleVerifyCode = async () => {
    if (!formData.verificationCode) {
      setError("Please enter the verification code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await authService.verifyResetCode(
        formData.email,
        formData.verificationCode
      );
      if (result.success) {
        setSuccessMessage("Code verified! Please enter your new password.");
        setStep(3);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      setError("Please fill in all password fields");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordValidation = authService.validatePassword(
      formData.newPassword
    );
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join(", "));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await authService.resetPasswordWithCode(
        formData.email,
        formData.verificationCode,
        formData.newPassword
      );
      if (result.success) {
        setSuccessMessage(
          "Password reset successful! You can now login with your new password."
        );
        setTimeout(() => {
          onBackToLogin();
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleResendCode = () => {
    setStep(1);
    setFormData({ ...formData, verificationCode: "" });
    setError("");
    setSuccessMessage("");
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="welcome-message">
              <h2>Forgot Your Password?</h2>
              <p>
                Enter your email address and we'll send you a verification code
                to reset your password.
              </p>
            </div>

            <div className="login-form">
              {error && <div className="error-message">{error}</div>}
              {successMessage && (
                <div className="success-message">{successMessage}</div>
              )}

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

              <button
                onClick={handleSendCode}
                className="signin-button"
                disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Verification Code"}
              </button>

              <div className="create-account">
                <span>Remember your password? </span>
                <button
                  type="button"
                  className="create-link"
                  onClick={onBackToLogin}>
                  Go back to login
                </button>
              </div>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className="welcome-message">
              <h2>Enter Verification Code</h2>
              <p>
                We've sent a 6-digit code to {formData.email}. Please enter it
                below.
              </p>
            </div>

            <div className="login-form">
              {error && <div className="error-message">{error}</div>}
              {successMessage && (
                <div className="success-message">{successMessage}</div>
              )}

              <div className="input-group">
                <input
                  type="text"
                  name="verificationCode"
                  placeholder="Enter 6-digit code"
                  value={formData.verificationCode}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  required
                  className="form-input"
                  maxLength="6"
                />
              </div>

              <button
                onClick={handleVerifyCode}
                className="signin-button"
                disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>

              <div className="create-account">
                <span>Didn't receive the code? </span>
                <button
                  type="button"
                  className="create-link"
                  onClick={handleResendCode}>
                  Resend Code
                </button>
              </div>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <div className="welcome-message">
              <h2>Set New Password</h2>
              <p>
                Please enter your new password. Make sure it's strong and
                secure.
              </p>
            </div>

            <div className="login-form">
              {error && <div className="error-message">{error}</div>}
              {successMessage && (
                <div className="success-message">{successMessage}</div>
              )}

              <div className="input-group">
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    required
                    className="form-input"
                    autoComplete="new-password"
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

              <div className="input-group">
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    required
                    className="form-input"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={toggleConfirmPasswordVisibility}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }>
                    {showConfirmPassword ? (
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

              <button
                onClick={handleResetPassword}
                className="signin-button"
                disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>

              <div className="create-account">
                <span>Remember your password? </span>
                <button
                  type="button"
                  className="create-link"
                  onClick={onBackToLogin}>
                  Go back to login
                </button>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="login-page">
      <div className="login-left-section">
        <div className="login-container">
          <div className="login-form-section">
            <div className="login-header">
              <h1 className="brand-title">Bartech</h1>
            </div>

            {renderStepContent()}
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
    </div>
  );
};

export default ForgotPassword;
