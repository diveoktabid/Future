// ============================================================================
// AUTH SERVICE - Frontend Service untuk Express.js Backend
// File: authService.js
// ============================================================================

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

class AuthService {
  constructor() {
    this.token = localStorage.getItem("token");
    this.refreshToken = localStorage.getItem("refreshToken");
  }

  // ============================================================================
  // REGISTER USER
  // ============================================================================
  async register(userData) {
    // Validate required fields
    if (!userData || typeof userData !== "object") {
      return {
        success: false,
        message: "User data is required",
      };
    }

    const { firstName, lastName, email, phoneNumber, password } = userData;

    if (!firstName || !lastName || !email || !password) {
      return {
        success: false,
        message: "All required fields must be filled",
      };
    }

    if (!this.validateEmail(email)) {
      return {
        success: false,
        message: "Please enter a valid email address",
      };
    }

    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: passwordValidation.errors.join(". "),
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phoneNumber: phoneNumber || "",
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: data.message,
          user: data.user,
        };
      } else {
        return {
          success: false,
          message: data.message || "Registration failed",
        };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: "Network error. Please check your connection and try again.",
      };
    }
  }

  // ============================================================================
  // LOGIN USER
  // ============================================================================
  async login(email, password, rememberMe = false) {
    // Validate inputs
    if (!email || !password) {
      return {
        success: false,
        message: "Email and password are required",
      };
    }

    if (!this.validateEmail(email)) {
      return {
        success: false,
        message: "Please enter a valid email address",
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens
        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        this.token = data.token;
        this.refreshToken = data.refreshToken;

        return {
          success: true,
          message: data.message,
          user: data.user,
          token: data.token,
        };
      } else {
        return {
          success: false,
          message: data.message || "Login failed",
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Network error. Please check your connection and try again.",
      };
    }
  }

  // ============================================================================
  // LOGOUT USER
  // ============================================================================
  async logout() {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      this.token = null;
      this.refreshToken = null;
    }
  }

  // ============================================================================
  // FORGOT PASSWORD
  // ============================================================================
  async forgotPassword(email) {
    if (!email) {
      return {
        success: false,
        message: "Email is required",
      };
    }

    if (!this.validateEmail(email)) {
      return {
        success: false,
        message: "Please enter a valid email address",
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      return {
        success: response.ok,
        message: data.message,
      };
    } catch (error) {
      console.error("Forgot password error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  }

  // ============================================================================
  // RESET PASSWORD
  // ============================================================================
  async resetPassword(token, newPassword) {
    if (!token || !newPassword) {
      return {
        success: false,
        message: "Token and new password are required",
      };
    }

    const passwordValidation = this.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: passwordValidation.errors.join(". "),
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      return {
        success: response.ok,
        message: data.message,
      };
    } catch (error) {
      console.error("Reset password error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  }

  // ============================================================================
  // REFRESH TOKEN
  // ============================================================================
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        this.token = data.token;
        return data.token;
      } else {
        // Refresh token expired, logout user
        this.logout();
        throw new Error("Session expired");
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      this.logout();
      throw error;
    }
  }

  // ============================================================================
  // GET CURRENT USER
  // ============================================================================
  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  // ============================================================================
  // CHECK IF USER IS AUTHENTICATED
  // ============================================================================
  isAuthenticated() {
    return !!this.token;
  }

  // ============================================================================
  // GET AUTH HEADER
  // ============================================================================
  getAuthHeader() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  // ============================================================================
  // AUTHENTICATED REQUEST HELPER
  // ============================================================================
  async authenticatedRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...this.getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      // If token expired, try to refresh
      if (response.status === 401 && this.refreshToken) {
        try {
          await this.refreshAccessToken();
          // Retry the request with new token
          return await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              ...this.getAuthHeader(),
              "Content-Type": "application/json",
            },
          });
        } catch (refreshError) {
          // Refresh failed, redirect to login
          throw new Error("Session expired");
        }
      }

      return response;
    } catch (error) {
      console.error("Authenticated request error:", error);
      throw error;
    }
  }

  // ============================================================================
  // AUTO LOGIN CHECK
  // ============================================================================
  async checkAutoLogin() {
    if (!this.token) {
      return { success: false, message: "No token found" };
    }

    try {
      const response = await this.authenticatedRequest(
        `${API_BASE_URL}/auth/verify`
      );
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        return {
          success: true,
          user: data.user,
        };
      } else {
        this.logout();
        return {
          success: false,
          message: "Token invalid",
        };
      }
    } catch (error) {
      console.error("Auto login check error:", error);
      this.logout();
      return {
        success: false,
        message: "Auto login failed",
      };
    }
  }

  // ============================================================================
  // SEND PASSWORD RESET CODE
  // ============================================================================
  async sendPasswordResetCode(email) {
    if (!email) {
      return {
        success: false,
        message: "Email is required",
      };
    }

    if (!this.validateEmail(email)) {
      return {
        success: false,
        message: "Please enter a valid email address",
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-reset-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      return {
        success: response.ok,
        message: data.message,
        // For development/testing - remove in production
        devCode: data.dev_code,
      };
    } catch (error) {
      console.error("Send reset code error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  }

  // ============================================================================
  // VERIFY RESET CODE
  // ============================================================================
  async verifyResetCode(email, code) {
    if (!email || !code) {
      return {
        success: false,
        message: "Email and code are required",
      };
    }

    if (!this.validateEmail(email)) {
      return {
        success: false,
        message: "Please enter a valid email address",
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
        }),
      });

      const data = await response.json();

      return {
        success: response.ok,
        message: data.message,
      };
    } catch (error) {
      console.error("Verify reset code error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  }

  // ============================================================================
  // RESET PASSWORD WITH CODE
  // ============================================================================
  async resetPasswordWithCode(email, code, newPassword) {
    if (!email || !code || !newPassword) {
      return {
        success: false,
        message: "Email, code, and new password are required",
      };
    }

    if (!this.validateEmail(email)) {
      return {
        success: false,
        message: "Please enter a valid email address",
      };
    }

    const passwordValidation = this.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: passwordValidation.errors.join(". "),
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await response.json();

      return {
        success: response.ok,
        message: data.message,
      };
    } catch (error) {
      console.error("Reset password with code error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  }

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================
  validateEmail(email) {
    if (!email || typeof email !== "string") {
      return false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  validatePassword(password) {
    const errors = [];

    if (!password || typeof password !== "string") {
      errors.push("Password is required");
      return {
        isValid: false,
        errors: errors,
      };
    }

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
