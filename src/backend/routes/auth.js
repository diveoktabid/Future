const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { executeQuery } = require("../config/database");
const { validate, schemas } = require("../middleware/validation");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

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

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", validate(schemas.register), async (req, res) => {
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
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", validate(schemas.login), async (req, res) => {
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
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post(
  "/forgot-password",
  validate(schemas.forgotPassword),
  async (req, res) => {
    try {
      const { email } = req.body;

      // Find user by email
      const users = await executeQuery(
        "SELECT id, username, email, full_name FROM users WHERE email = ?",
        [email]
      );

      if (users.length === 0) {
        // Don't reveal if email exists or not for security
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
      const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store reset token
      await executeQuery(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)`,
        [user.id, resetTokenHash, resetTokenExpiry]
      );

      // Create reset URL
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      // Email content
      const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #53ab5b;">Password Reset Request</h2>
        <p>Hello ${user.full_name || user.username},</p>
        <p>You have requested to reset your password for your Bartech IoT Dashboard account.</p>
        <p>Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #53ab5b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><strong>This link will expire in 10 minutes.</strong></p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          This email was sent by Bartech IoT Dashboard System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `;

      // Send email
      const transporter = createEmailTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Password Reset Request - Bartech IoT Dashboard",
        html: emailContent,
      });

      res.json({
        status: "success",
        message:
          "If the email exists in our system, a password reset link has been sent.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        status: "error",
        message:
          "Internal server error while processing password reset request",
      });
    }
  }
);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post(
  "/reset-password",
  validate(schemas.resetPassword),
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      // Hash the token to compare with stored hash
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

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
      await executeQuery(
        "DELETE FROM password_reset_tokens WHERE user_id = ?",
        [resetToken.user_id]
      );

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
  }
);

// @route   POST /api/auth/change-password
// @desc    Change password for authenticated user
// @access  Private
router.post(
  "/change-password",
  authenticateToken,
  validate(schemas.changePassword),
  async (req, res) => {
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
  }
);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post("/refresh-token", async (req, res) => {
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
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post("/logout", authenticateToken, async (req, res) => {
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
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", authenticateToken, async (req, res) => {
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
});

// @route   POST /api/auth/send-reset-code
// @desc    Send 6-digit verification code for password reset
// @access  Public
router.post(
  "/send-reset-code",
  validate(schemas.forgotPassword),
  async (req, res) => {
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
  }
);

// @route   POST /api/auth/verify-reset
// @desc    Verify reset code
// @access  Public
router.post("/verify-reset", async (req, res) => {
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
});

// @route   POST /api/auth/reset-password-code
// @desc    Reset password using verification code
// @access  Public
router.post("/reset-password-code", async (req, res) => {
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
});

module.exports = router;
