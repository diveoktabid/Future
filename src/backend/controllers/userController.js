const { executeQuery } = require("../config/database");

// Get All Users (Admin Only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", role = "" } = req.query;
    const offset = (page - 1) * limit;

    // Build search conditions
    let whereClause = "WHERE 1=1";
    let queryParams = [];

    if (search) {
      whereClause +=
        " AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)";
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (role) {
      whereClause += " AND role = ?";
      queryParams.push(role);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    // Get users with pagination
    const usersQuery = `
      SELECT id, username, email, full_name, role, is_active, created_at, last_login 
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    queryParams.push(parseInt(limit), parseInt(offset));

    const users = await executeQuery(usersQuery, queryParams);

    res.json({
      status: "success",
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching users",
    });
  }
};

// Get User by ID
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user can access this profile
    if (req.user.role !== "admin" && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        status: "error",
        message: "Access denied. You can only view your own profile.",
      });
    }

    const users = await executeQuery(
      "SELECT id, username, email, full_name, role, is_active, created_at, last_login FROM users WHERE id = ?",
      [userId]
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
    console.error("Get user error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching user",
    });
  }
};

// Update User Profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const { full_name, email } = req.body;

    // Check if user can update this profile
    if (req.user.role !== "admin" && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        status: "error",
        message: "Access denied. You can only update your own profile.",
      });
    }

    // Check if user exists
    const existingUsers = await executeQuery(
      "SELECT id FROM users WHERE id = ?",
      [userId]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Check if email is already taken by another user
    if (email) {
      const emailCheck = await executeQuery(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, userId]
      );

      if (emailCheck.length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Email is already taken by another user",
        });
      }
    }

    // Build update query
    let updateFields = [];
    let updateValues = [];

    if (full_name !== undefined) {
      updateFields.push("full_name = ?");
      updateValues.push(full_name);
    }

    if (email !== undefined) {
      updateFields.push("email = ?");
      updateValues.push(email);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No fields to update",
      });
    }

    updateFields.push("updated_at = NOW()");
    updateValues.push(userId);

    // Update user
    await executeQuery(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    // Get updated user
    const updatedUser = await executeQuery(
      "SELECT id, username, email, full_name, role, is_active, created_at, last_login FROM users WHERE id = ?",
      [userId]
    );

    res.json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user: updatedUser[0],
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while updating user",
    });
  }
};

// Update User Role (Admin Only)
const updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    // Validate role
    const validRoles = ["admin", "technician", "viewer", "user"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: "error",
        message:
          "Invalid role. Must be one of: admin, technician, viewer, user",
      });
    }

    // Check if user exists
    const existingUsers = await executeQuery(
      "SELECT id, role FROM users WHERE id = ?",
      [userId]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Prevent admin from demoting themselves
    if (req.user.id === parseInt(userId) && role !== "admin") {
      return res.status(400).json({
        status: "error",
        message: "You cannot change your own admin role",
      });
    }

    // Update user role
    await executeQuery(
      "UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?",
      [role, userId]
    );

    // Get updated user
    const updatedUser = await executeQuery(
      "SELECT id, username, email, full_name, role, is_active, created_at, last_login FROM users WHERE id = ?",
      [userId]
    );

    res.json({
      status: "success",
      message: "User role updated successfully",
      data: {
        user: updatedUser[0],
      },
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while updating user role",
    });
  }
};

// Update User Status (Admin Only)
const updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        status: "error",
        message: "is_active must be a boolean value",
      });
    }

    // Check if user exists
    const existingUsers = await executeQuery(
      "SELECT id FROM users WHERE id = ?",
      [userId]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Prevent admin from deactivating themselves
    if (req.user.id === parseInt(userId) && !is_active) {
      return res.status(400).json({
        status: "error",
        message: "You cannot deactivate your own account",
      });
    }

    // Update user status
    await executeQuery(
      "UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?",
      [is_active, userId]
    );

    // If deactivating, remove all refresh tokens
    if (!is_active) {
      await executeQuery("DELETE FROM refresh_tokens WHERE user_id = ?", [
        userId,
      ]);
    }

    // Get updated user
    const updatedUser = await executeQuery(
      "SELECT id, username, email, full_name, role, is_active, created_at, last_login FROM users WHERE id = ?",
      [userId]
    );

    res.json({
      status: "success",
      message: `User ${is_active ? "activated" : "deactivated"} successfully`,
      data: {
        user: updatedUser[0],
      },
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while updating user status",
    });
  }
};

// Delete User (Admin Only)
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const existingUsers = await executeQuery(
      "SELECT id, username FROM users WHERE id = ?",
      [userId]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === parseInt(userId)) {
      return res.status(400).json({
        status: "error",
        message: "You cannot delete your own account",
      });
    }

    const userName = existingUsers[0].username;

    // Delete user and related data
    await executeQuery("DELETE FROM refresh_tokens WHERE user_id = ?", [
      userId,
    ]);
    await executeQuery("DELETE FROM password_reset_tokens WHERE user_id = ?", [
      userId,
    ]);
    await executeQuery("DELETE FROM users WHERE id = ?", [userId]);

    res.json({
      status: "success",
      message: `User '${userName}' deleted successfully`,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while deleting user",
    });
  }
};

// Get User Statistics (Admin Only)
const getUserStats = async (req, res) => {
  try {
    // Get user statistics
    const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN role = 'technician' THEN 1 ELSE 0 END) as technician_count,
        SUM(CASE WHEN role = 'viewer' THEN 1 ELSE 0 END) as viewer_count,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_count,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_users_30_days,
        SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as active_last_7_days
      FROM users
    `);

    // Get monthly registration data for the last 12 months
    const monthlyRegistrations = await executeQuery(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as registrations
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // Get role distribution
    const roleDistribution = await executeQuery(`
      SELECT 
        role,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users)), 2) as percentage
      FROM users
      GROUP BY role
      ORDER BY count DESC
    `);

    res.json({
      status: "success",
      data: {
        overallStats: stats[0],
        monthlyRegistrations,
        roleDistribution,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching user statistics",
    });
  }
};

// Create New User (Admin Only)
const createUser = async (req, res) => {
  try {
    const {
      username,
      email,
      full_name,
      password,
      role = "user",
      is_active = true,
    } = req.body;

    // Check if username or email already exists
    const existingUser = await executeQuery(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Username or email already exists",
      });
    }

    // Validate role
    const validRoles = ["admin", "technician", "viewer", "user"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: "error",
        message:
          "Invalid role. Must be one of: admin, technician, viewer, user",
      });
    }

    // Hash password
    const bcrypt = require("bcryptjs");
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await executeQuery(
      `INSERT INTO users (username, email, password, full_name, role, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [username, email, hashedPassword, full_name, role, is_active]
    );

    // Get created user (without password)
    const newUser = await executeQuery(
      "SELECT id, username, email, full_name, role, is_active, created_at FROM users WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: {
        user: newUser[0],
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while creating user",
    });
  }
};

// Get User Activity Log (Admin Only)
const getUserActivityLog = async (req, res) => {
  try {
    const { user_id, limit = 50, page = 1, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    let queryParams = [];

    if (user_id) {
      whereClause += " AND u.id = ?";
      queryParams.push(user_id);
    }

    if (start_date) {
      whereClause += " AND u.last_login >= ?";
      queryParams.push(start_date);
    }

    if (end_date) {
      whereClause += " AND u.last_login <= ?";
      queryParams.push(end_date);
    }

    // Get user activity (based on last_login and refresh_tokens)
    const activityQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.role,
        u.last_login,
        u.created_at,
        (SELECT COUNT(*) FROM refresh_tokens WHERE user_id = u.id) as active_sessions
      FROM users u
      ${whereClause}
      ORDER BY u.last_login DESC
      LIMIT ? OFFSET ?
    `;
    queryParams.push(parseInt(limit), parseInt(offset));

    const activity = await executeQuery(activityQuery, queryParams);

    res.json({
      status: "success",
      data: {
        activity,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(activity.length / limit),
          hasNextPage: activity.length === parseInt(limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get user activity error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching user activity",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserProfile,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getUserStats,
  createUser,
  getUserActivityLog,
};
