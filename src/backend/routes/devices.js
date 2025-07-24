const express = require("express");
const { executeQuery } = require("../config/database");
const { validate, schemas } = require("../middleware/validation");
const { authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/devices
// @desc    Get all devices
// @access  Private
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      type = "",
      location = "",
      is_active,
    } = req.query;
    const offset = (page - 1) * limit;

    // Build search conditions
    let whereClause = "WHERE 1=1";
    let queryParams = [];

    if (search) {
      whereClause += " AND (name LIKE ? OR description LIKE ?)";
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    if (type) {
      whereClause += " AND type = ?";
      queryParams.push(type);
    }

    if (location) {
      whereClause += " AND location LIKE ?";
      queryParams.push(`%${location}%`);
    }

    if (is_active !== undefined && is_active !== "") {
      whereClause += " AND is_active = ?";
      queryParams.push(is_active === "true" ? 1 : 0);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM devices ${whereClause}`;
    const countResult = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    // Get devices with pagination
    const devicesQuery = `
      SELECT id, name, type, location, description, is_active, created_at, updated_at,
             (SELECT COUNT(*) FROM sensor_data WHERE device_id = devices.id AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as data_count_24h
      FROM devices 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    queryParams.push(parseInt(limit), parseInt(offset));

    const devices = await executeQuery(devicesQuery, queryParams);

    res.json({
      status: "success",
      data: {
        devices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalDevices: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get devices error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching devices",
    });
  }
});

// @route   GET /api/devices/:id
// @desc    Get device by ID
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const deviceId = req.params.id;

    const devices = await executeQuery("SELECT * FROM devices WHERE id = ?", [
      deviceId,
    ]);

    if (devices.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Device not found",
      });
    }

    // Get latest sensor data
    const latestData = await executeQuery(
      "SELECT * FROM sensor_data WHERE device_id = ? ORDER BY created_at DESC LIMIT 10",
      [deviceId]
    );

    res.json({
      status: "success",
      data: {
        device: devices[0],
        latestData,
      },
    });
  } catch (error) {
    console.error("Get device error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching device",
    });
  }
});

// @route   POST /api/devices
// @desc    Create new device
// @access  Private (Admin, Technician)
router.post(
  "/",
  authorizeRoles("admin", "technician"),
  validate(schemas.device),
  async (req, res) => {
    try {
      const { name, type, location, description, is_active = true } = req.body;

      // Check if device name already exists
      const existingDevice = await executeQuery(
        "SELECT id FROM devices WHERE name = ?",
        [name]
      );

      if (existingDevice.length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Device with this name already exists",
        });
      }

      // Create device
      const result = await executeQuery(
        `INSERT INTO devices (name, type, location, description, is_active, created_by, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [name, type, location, description, is_active, req.user.id]
      );

      // Get created device
      const newDevice = await executeQuery(
        "SELECT * FROM devices WHERE id = ?",
        [result.insertId]
      );

      res.status(201).json({
        status: "success",
        message: "Device created successfully",
        data: {
          device: newDevice[0],
        },
      });
    } catch (error) {
      console.error("Create device error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error while creating device",
      });
    }
  }
);

// @route   PUT /api/devices/:id
// @desc    Update device
// @access  Private (Admin, Technician)
router.put(
  "/:id",
  authorizeRoles("admin", "technician"),
  validate(schemas.device),
  async (req, res) => {
    try {
      const deviceId = req.params.id;
      const { name, type, location, description, is_active } = req.body;

      // Check if device exists
      const existingDevice = await executeQuery(
        "SELECT id FROM devices WHERE id = ?",
        [deviceId]
      );

      if (existingDevice.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Device not found",
        });
      }

      // Check if device name already exists (excluding current device)
      const nameCheck = await executeQuery(
        "SELECT id FROM devices WHERE name = ? AND id != ?",
        [name, deviceId]
      );

      if (nameCheck.length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Device with this name already exists",
        });
      }

      // Update device
      await executeQuery(
        `UPDATE devices 
       SET name = ?, type = ?, location = ?, description = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
        [name, type, location, description, is_active, deviceId]
      );

      // Get updated device
      const updatedDevice = await executeQuery(
        "SELECT * FROM devices WHERE id = ?",
        [deviceId]
      );

      res.json({
        status: "success",
        message: "Device updated successfully",
        data: {
          device: updatedDevice[0],
        },
      });
    } catch (error) {
      console.error("Update device error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error while updating device",
      });
    }
  }
);

// @route   DELETE /api/devices/:id
// @desc    Delete device
// @access  Private (Admin)
router.delete("/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    const deviceId = req.params.id;

    // Check if device exists
    const existingDevice = await executeQuery(
      "SELECT id FROM devices WHERE id = ?",
      [deviceId]
    );

    if (existingDevice.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Device not found",
      });
    }

    // Delete device and related data
    await executeQuery("DELETE FROM sensor_data WHERE device_id = ?", [
      deviceId,
    ]);
    await executeQuery("DELETE FROM devices WHERE id = ?", [deviceId]);

    res.json({
      status: "success",
      message: "Device deleted successfully",
    });
  } catch (error) {
    console.error("Delete device error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while deleting device",
    });
  }
});

// @route   GET /api/devices/types/list
// @desc    Get available device types
// @access  Private
router.get("/types/list", async (req, res) => {
  try {
    const types = [
      { value: "temperature", label: "Temperature Sensor" },
      { value: "humidity", label: "Humidity Sensor" },
      { value: "air_quality", label: "Air Quality Sensor" },
      { value: "motion", label: "Motion Detector" },
      { value: "door", label: "Door Sensor" },
      { value: "other", label: "Other" },
    ];

    res.json({
      status: "success",
      data: {
        types,
      },
    });
  } catch (error) {
    console.error("Get device types error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching device types",
    });
  }
});

// @route   GET /api/devices/stats/overview
// @desc    Get device statistics
// @access  Private
router.get("/stats/overview", async (req, res) => {
  try {
    // Get device statistics
    const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total_devices,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_devices,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_devices,
        SUM(CASE WHEN type = 'temperature' THEN 1 ELSE 0 END) as temperature_sensors,
        SUM(CASE WHEN type = 'humidity' THEN 1 ELSE 0 END) as humidity_sensors,
        SUM(CASE WHEN type = 'air_quality' THEN 1 ELSE 0 END) as air_quality_sensors,
        SUM(CASE WHEN type = 'motion' THEN 1 ELSE 0 END) as motion_detectors,
        SUM(CASE WHEN type = 'door' THEN 1 ELSE 0 END) as door_sensors,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_devices_30_days
      FROM devices
    `);

    // Get data transmission statistics
    const dataStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_data_points,
        COUNT(DISTINCT device_id) as devices_with_data,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as data_last_24h,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as data_last_7_days
      FROM sensor_data
    `);

    res.json({
      status: "success",
      data: {
        deviceStats: stats[0],
        dataStats: dataStats[0],
      },
    });
  } catch (error) {
    console.error("Get device stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching device statistics",
    });
  }
});

// @route   GET /api/devices/:id/status
// @desc    Get device status and latest data
// @access  Private
router.get("/:id/status", async (req, res) => {
  try {
    const deviceId = req.params.id;

    // Check if device exists
    const devices = await executeQuery(
      "SELECT id, name, type, is_active FROM devices WHERE id = ?",
      [deviceId]
    );

    if (devices.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Device not found",
      });
    }

    const device = devices[0];

    // Get latest sensor data
    const latestData = await executeQuery(
      "SELECT * FROM sensor_data WHERE device_id = ? ORDER BY created_at DESC LIMIT 1",
      [deviceId]
    );

    // Get data count for last 24 hours
    const dataCount = await executeQuery(
      "SELECT COUNT(*) as count FROM sensor_data WHERE device_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)",
      [deviceId]
    );

    // Determine if device is online (received data in last 30 minutes)
    const isOnline =
      latestData.length > 0 &&
      new Date() - new Date(latestData[0].created_at) < 30 * 60 * 1000;

    res.json({
      status: "success",
      data: {
        device: {
          ...device,
          isOnline,
          lastDataReceived:
            latestData.length > 0 ? latestData[0].created_at : null,
          dataCount24h: dataCount[0].count,
        },
        latestData: latestData.length > 0 ? latestData[0] : null,
      },
    });
  } catch (error) {
    console.error("Get device status error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching device status",
    });
  }
});

module.exports = router;
