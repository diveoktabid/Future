const jwt = require("jsonwebtoken");
const { executeQuery } = require("../config/database");

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await executeQuery(
      "SELECT id, username, email, role, is_active FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (user.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "Token is not valid. User not found.",
      });
    }

    if (!user[0].is_active) {
      return res.status(401).json({
        status: "error",
        message: "Account is deactivated.",
      });
    }

    // Add user info to request
    req.user = {
      id: user[0].id,
      username: user[0].username,
      email: user[0].email,
      role: user[0].role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Token expired. Please login again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "error",
        message: "Invalid token.",
      });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error during authentication.",
    });
  }
};

// Authorize roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Insufficient permissions.",
      });
    }
    next();
  };
};

// Optional authentication (for public/private endpoints)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await executeQuery(
      "SELECT id, username, email, role, is_active FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (user.length > 0 && user[0].is_active) {
      req.user = {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email,
        role: user[0].role,
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  optionalAuth,
};
