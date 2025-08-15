const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { executeQuery } = require("../config/database");

// Email transporter setup
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "24h",
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
};

// Register
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password } = req.body;

    // Check if user already exists
    const existingUser = await executeQuery(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "User with this email already exists",
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create username from email (before @)
    const username = email.split("@")[0];
    const fullName = `${firstName} ${lastName}`;

    // Create user
    const result = await executeQuery(
      `INSERT INTO users (username, email, password, full_name, phone_number, role, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, 'user', NOW(), NOW())`,
      [username, email, hashedPassword, fullName, phoneNumber]
    );

    // Generate tokens
    const token = generateToken(result.insertId);
    const refreshToken = generateRefreshToken(result.insertId);

    // Store refresh token
    await executeQuery(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))",
      [result.insertId, refreshToken]
    );

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      user: {
        id: result.insertId,
        username,
        email,
        firstName,
        lastName,
        phoneNumber,
        fullName,
        role: "user",
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error during registration",
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Find user by email
    const users = await executeQuery(
      "SELECT id, username, email, password, full_name, phone_number, role, is_active FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        status: "error",
        message: "Account is deactivated. Please contact administrator.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await executeQuery(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))",
      [user.id, refreshToken]
    );

    // Update last login
    await executeQuery("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);

    // Prepare user response data
    const [firstName, ...lastNameParts] = user.full_name.split(" ");
    const lastName = lastNameParts.join(" ");

    res.json({
      status: "success",
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: firstName || "",
        lastName: lastName || "",
        fullName: user.full_name,
        phoneNumber: user.phone_number,
        role: user.role,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error during login",
    });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const users = await executeQuery(
      "SELECT id, username, email, full_name FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.json({
        status: "success",
        message:
          "If the email exists in our system, a password reset link has been sent.",
      });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Store reset token
    await executeQuery(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)`,
      [user.id, resetTokenHash, resetTokenExpiry]
    );

    // Create reset URL and send email (existing code)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // ... email sending logic

    res.json({
      status: "success",
      message:
        "If the email exists in our system, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while processing password reset request",
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find valid reset token
    const resetTokens = await executeQuery(
      `SELECT prt.user_id, prt.expires_at, u.username, u.email 
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = ? AND prt.expires_at > NOW()`,
      [hashedToken]
    );

    if (resetTokens.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired reset token",
      });
    }

    const resetToken = resetTokens[0];

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await executeQuery(
      "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?",
      [hashedPassword, resetToken.user_id]
    );

    // Delete used reset token
    await executeQuery("DELETE FROM password_reset_tokens WHERE user_id = ?", [
      resetToken.user_id,
    ]);

    // Invalidate all refresh tokens for this user
    await executeQuery("DELETE FROM refresh_tokens WHERE user_id = ?", [
      resetToken.user_id,
    ]);

    res.json({
      status: "success",
      message:
        "Password has been reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while resetting password",
    });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get current password
    const users = await executeQuery(
      "SELECT password FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      users[0].password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: "error",
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await executeQuery(
      "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?",
      [hashedPassword, userId]
    );

    res.json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while changing password",
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove specific refresh token
      await executeQuery(
        "DELETE FROM refresh_tokens WHERE token = ? AND user_id = ?",
        [refreshToken, req.user.id]
      );
    } else {
      // Remove all refresh tokens for this user
      await executeQuery("DELETE FROM refresh_tokens WHERE user_id = ?", [
        req.user.id,
      ]);
    }

    res.json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error during logout",
    });
  }
};

// User Profile
const UserProfile = async (req, res) => {
  try {
    const users = await executeQuery(
      "SELECT id, username, email, full_name, role, created_at, last_login FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.json({
      status: "success",
      data: {
        user: users[0],
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching profile",
    });
  }
};

// Reset Code For Reset Password
const GenerateResetPasswordCode = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const users = await executeQuery(
      "SELECT id, username, email, full_name FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Email not found in our system",
      });
    }

    const user = users[0];

    // Generate 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store verification code (reuse password_reset_tokens table)
    await executeQuery(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)`,
      [user.id, verificationCode, expiresAt]
    );

    // In production, send email with verification code
    // For development, return code in response
    console.log(`🔐 Password reset code for ${email}: ${verificationCode}`);

    res.json({
      status: "success",
      message: "Verification code has been sent to your email",
      // Remove this in production
      dev_code: verificationCode,
    });
  } catch (error) {
    console.error("Send reset code error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while sending verification code",
    });
  }
};

// Reset Password Code
const ResetPasswordCode = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "Email, verification code, and new password are required",
      });
    }

    // Validate password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 8 characters long",
      });
    }

    // Find user and verify code
    const results = await executeQuery(
      `SELECT prt.user_id, prt.expires_at, u.email 
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE u.email = ? AND prt.token = ? AND prt.expires_at > NOW()`,
      [email, code]
    );

    if (results.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification code",
      });
    }

    const userId = results[0].user_id;

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await executeQuery(
      "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?",
      [hashedPassword, userId]
    );

    // Delete used reset token
    await executeQuery("DELETE FROM password_reset_tokens WHERE user_id = ?", [
      userId,
    ]);

    res.json({
      status: "success",
      message:
        "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password with code error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while resetting password",
    });
  }
};

// Verify Authentification
const VerifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        status: "error",
        message: "Email and verification code are required",
      });
    }

    // Find user and verify code
    const results = await executeQuery(
      `SELECT prt.user_id, prt.expires_at, u.email 
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE u.email = ? AND prt.token = ? AND prt.expires_at > NOW()`,
      [email, code]
    );

    if (results.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification code",
      });
    }

    res.json({
      status: "success",
      message: "Verification code is valid",
    });
  } catch (error) {
    console.error("Verify reset code error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while verifying code",
    });
  }
};

// Refresh Token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        status: "error",
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if refresh token exists in database
    const tokens = await executeQuery(
      `SELECT rt.user_id, u.username, u.email, u.full_name, u.role, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = ? AND rt.expires_at > NOW()`,
      [refreshToken]
    );

    if (tokens.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired refresh token",
      });
    }

    const user = tokens[0];

    if (!user.is_active) {
      return res.status(401).json({
        status: "error",
        message: "Account is deactivated",
      });
    }

    // Generate new access token
    const newToken = generateToken(user.user_id);

    res.json({
      status: "success",
      message: "Token refreshed successfully",
      data: {
        token: newToken,
        user: {
          id: user.user_id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({
      status: "error",
      message: "Invalid refresh token",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    // Your implementation here
    res.json({ message: "Profile retrieved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createEmailTransporter,
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  getProfile,
  UserProfile,
  GenerateResetPasswordCode,
  ResetPasswordCode,
  VerifyResetCode,
  refreshToken,
};
