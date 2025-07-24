const express = require("express");
const { executeQuery } = require("../config/database");
const { validate, schemas } = require("../middleware/validation");
const { authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get("/", authorizeRoles("admin"), async (req, res) => {
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
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin or own profile)
router.get("/:id", async (req, res) => {
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
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (Admin or own profile)
router.put("/:id", validate(schemas.updateProfile), async (req, res) => {
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
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (admin only)
// @access  Private (Admin)
router.put("/:id/role", authorizeRoles("admin"), async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    // Validate role
    const validRoles = ["admin", "technician", "viewer"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid role. Must be one of: admin, technician, viewer",
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

    res.json({
      status: "success",
      message: "User role updated successfully",
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while updating user role",
    });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Activate/Deactivate user (admin only)
// @access  Private (Admin)
router.put("/:id/status", authorizeRoles("admin"), async (req, res) => {
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

    res.json({
      status: "success",
      message: `User ${is_active ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while updating user status",
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private (Admin)
router.delete("/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    const userId = req.params.id;

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

    // Prevent admin from deleting themselves
    if (req.user.id === parseInt(userId)) {
      return res.status(400).json({
        status: "error",
        message: "You cannot delete your own account",
      });
    }

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
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while deleting user",
    });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics (admin only)
// @access  Private (Admin)
router.get("/stats/overview", authorizeRoles("admin"), async (req, res) => {
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
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_users_30_days,
        SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as active_last_7_days
      FROM users
    `);

    res.json({
      status: "success",
      data: {
        stats: stats[0],
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching user statistics",
    });
  }
});

module.exports = router;
