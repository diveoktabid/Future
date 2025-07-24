const express = require("express");
const { executeQuery } = require("../config/database");

const router = express.Router();

// @route   GET /api/data
// @desc    Get sensor data with filtering
// @access  Private
router.get("/", async (req, res) => {
  try {
    const {
      device_id,
      type,
      start_date,
      end_date,
      limit = 100,
      page = 1,
      order = "desc",
    } = req.query;

    const offset = (page - 1) * limit;

    // Build search conditions
    let whereClause = "WHERE 1=1";
    let queryParams = [];

    if (device_id) {
      whereClause += " AND sd.device_id = ?";
      queryParams.push(device_id);
    }

    if (type) {
      whereClause += " AND d.type = ?";
      queryParams.push(type);
    }

    if (start_date) {
      whereClause += " AND sd.created_at >= ?";
      queryParams.push(start_date);
    }

    if (end_date) {
      whereClause += " AND sd.created_at <= ?";
      queryParams.push(end_date);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM sensor_data sd
      JOIN devices d ON sd.device_id = d.id
      ${whereClause}
    `;
    const countResult = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    // Get sensor data with device info
    const orderDirection = order.toLowerCase() === "asc" ? "ASC" : "DESC";
    const dataQuery = `
      SELECT 
        sd.id,
        sd.device_id,
        sd.value,
        sd.unit,
        sd.created_at,
        d.name as device_name,
        d.type as device_type,
        d.location as device_location
      FROM sensor_data sd
      JOIN devices d ON sd.device_id = d.id
      ${whereClause}
      ORDER BY sd.created_at ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    queryParams.push(parseInt(limit), parseInt(offset));

    const data = await executeQuery(dataQuery, queryParams);

    res.json({
      status: "success",
      data: {
        sensorData: data,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get sensor data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching sensor data",
    });
  }
});

// @route   POST /api/data
// @desc    Add new sensor data (for IoT devices)
// @access  Private
router.post("/", async (req, res) => {
  try {
    const { device_id, value, unit } = req.body;

    // Validate required fields
    if (!device_id || value === undefined || !unit) {
      return res.status(400).json({
        status: "error",
        message: "device_id, value, and unit are required",
      });
    }

    // Check if device exists and is active
    const devices = await executeQuery(
      "SELECT id, is_active FROM devices WHERE id = ?",
      [device_id]
    );

    if (devices.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Device not found",
      });
    }

    if (!devices[0].is_active) {
      return res.status(400).json({
        status: "error",
        message: "Device is not active",
      });
    }

    // Insert sensor data
    const result = await executeQuery(
      "INSERT INTO sensor_data (device_id, value, unit, created_at) VALUES (?, ?, ?, NOW())",
      [device_id, value, unit]
    );

    // Get the inserted data
    const newData = await executeQuery(
      "SELECT * FROM sensor_data WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      status: "success",
      message: "Sensor data recorded successfully",
      data: {
        sensorData: newData[0],
      },
    });
  } catch (error) {
    console.error("Add sensor data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while recording sensor data",
    });
  }
});

// @route   GET /api/data/device/:deviceId/latest
// @desc    Get latest data for a specific device
// @access  Private
router.get("/device/:deviceId/latest", async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const { limit = 10 } = req.query;

    // Check if device exists
    const devices = await executeQuery(
      "SELECT id, name, type, location FROM devices WHERE id = ?",
      [deviceId]
    );

    if (devices.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Device not found",
      });
    }

    // Get latest sensor data
    const data = await executeQuery(
      "SELECT * FROM sensor_data WHERE device_id = ? ORDER BY created_at DESC LIMIT ?",
      [deviceId, parseInt(limit)]
    );

    res.json({
      status: "success",
      data: {
        device: devices[0],
        sensorData: data,
      },
    });
  } catch (error) {
    console.error("Get latest sensor data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching latest sensor data",
    });
  }
});

// @route   GET /api/data/device/:deviceId/aggregate
// @desc    Get aggregated data for a specific device
// @access  Private
router.get("/device/:deviceId/aggregate", async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const {
      start_date,
      end_date,
      interval = "hour", // hour, day, week, month
    } = req.query;

    // Check if device exists
    const devices = await executeQuery(
      "SELECT id, name, type, location FROM devices WHERE id = ?",
      [deviceId]
    );

    if (devices.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Device not found",
      });
    }

    // Build date conditions
    let dateClause = "";
    let queryParams = [deviceId];

    if (start_date) {
      dateClause += " AND created_at >= ?";
      queryParams.push(start_date);
    }

    if (end_date) {
      dateClause += " AND created_at <= ?";
      queryParams.push(end_date);
    }

    // Determine grouping based on interval
    let dateFormat;
    switch (interval) {
      case "hour":
        dateFormat = "%Y-%m-%d %H:00:00";
        break;
      case "day":
        dateFormat = "%Y-%m-%d";
        break;
      case "week":
        dateFormat = "%Y-%u";
        break;
      case "month":
        dateFormat = "%Y-%m";
        break;
      default:
        dateFormat = "%Y-%m-%d %H:00:00";
    }

    // Get aggregated data
    const aggregatedData = await executeQuery(
      `SELECT 
        DATE_FORMAT(created_at, ?) as time_period,
        COUNT(*) as count,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        STDDEV(value) as std_value
       FROM sensor_data 
       WHERE device_id = ? ${dateClause}
       GROUP BY DATE_FORMAT(created_at, ?)
       ORDER BY time_period ASC`,
      [dateFormat, ...queryParams, dateFormat]
    );

    res.json({
      status: "success",
      data: {
        device: devices[0],
        interval,
        aggregatedData,
      },
    });
  } catch (error) {
    console.error("Get aggregated sensor data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching aggregated sensor data",
    });
  }
});

// @route   GET /api/data/stats/overview
// @desc    Get data statistics overview
// @access  Private
router.get("/stats/overview", async (req, res) => {
  try {
    // Get overall statistics
    const overallStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT device_id) as active_devices,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 ELSE 0 END) as records_last_hour,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as records_last_24h,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as records_last_7_days
      FROM sensor_data
    `);

    // Get statistics by device type
    const deviceTypeStats = await executeQuery(`
      SELECT 
        d.type,
        COUNT(sd.id) as record_count,
        COUNT(DISTINCT sd.device_id) as device_count,
        AVG(sd.value) as avg_value,
        MIN(sd.value) as min_value,
        MAX(sd.value) as max_value
      FROM sensor_data sd
      JOIN devices d ON sd.device_id = d.id
      WHERE sd.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY d.type
      ORDER BY record_count DESC
    `);

    // Get hourly data for the last 24 hours
    const hourlyData = await executeQuery(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
        COUNT(*) as record_count
      FROM sensor_data
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00')
      ORDER BY hour ASC
    `);

    res.json({
      status: "success",
      data: {
        overallStats: overallStats[0],
        deviceTypeStats,
        hourlyData,
      },
    });
  } catch (error) {
    console.error("Get data stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching data statistics",
    });
  }
});

// @route   DELETE /api/data/device/:deviceId
// @desc    Delete all data for a specific device (admin only)
// @access  Private (Admin)
router.delete("/device/:deviceId", async (req, res) => {
  try {
    // Check admin permission
    if (req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Admin permission required.",
      });
    }

    const deviceId = req.params.deviceId;

    // Check if device exists
    const devices = await executeQuery(
      "SELECT id, name FROM devices WHERE id = ?",
      [deviceId]
    );

    if (devices.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Device not found",
      });
    }

    // Get count of records to be deleted
    const countResult = await executeQuery(
      "SELECT COUNT(*) as count FROM sensor_data WHERE device_id = ?",
      [deviceId]
    );

    // Delete all data for the device
    await executeQuery("DELETE FROM sensor_data WHERE device_id = ?", [
      deviceId,
    ]);

    res.json({
      status: "success",
      message: `Deleted ${countResult[0].count} sensor data records for device: ${devices[0].name}`,
    });
  } catch (error) {
    console.error("Delete device data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while deleting sensor data",
    });
  }
});

// @route   DELETE /api/data/cleanup
// @desc    Cleanup old data (admin only)
// @access  Private (Admin)
router.delete("/cleanup", async (req, res) => {
  try {
    // Check admin permission
    if (req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Admin permission required.",
      });
    }

    const { days = 90 } = req.query;

    // Get count of records to be deleted
    const countResult = await executeQuery(
      "SELECT COUNT(*) as count FROM sensor_data WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
      [parseInt(days)]
    );

    // Delete old data
    await executeQuery(
      "DELETE FROM sensor_data WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
      [parseInt(days)]
    );

    res.json({
      status: "success",
      message: `Deleted ${countResult[0].count} sensor data records older than ${days} days`,
    });
  } catch (error) {
    console.error("Cleanup data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while cleaning up sensor data",
    });
  }
});

module.exports = router;
