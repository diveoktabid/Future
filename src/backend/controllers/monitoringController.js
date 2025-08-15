const { executeQuery } = require("../config/database");

// Submit Monitoring Data from IoT Devices
const submitMonitoringData = async (req, res) => {
  try {
    const {
      hospital_id,
      temperature,
      humidity,
      gas_status,
      status_lampu1,
      status_lampu2,
      status_viewer,
      status_writing_table,
      status_lampu_op,
    } = req.body;

    // Validate required fields
    if (!hospital_id || temperature === undefined || humidity === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Hospital ID, temperature, and humidity are required",
      });
    }

    // Validate hospital exists
    const hospitalExists = await executeQuery(
      "SELECT hospital_id FROM hospital WHERE hospital_id = ? AND is_active = 1",
      [hospital_id]
    );

    if (hospitalExists.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Hospital not found or inactive",
      });
    }

    // Insert new monitoring data
    const result = await executeQuery(
      `INSERT INTO monitoring_data 
       (hospital_id, temperature, humidity, gas_status, status_lampu1, status_lampu2, 
        status_viewer, status_writing_table, status_lampu_op, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        hospital_id,
        temperature,
        humidity,
        gas_status || "Normal",
        status_lampu1 || "OFF",
        status_lampu2 || "OFF",
        status_viewer || "OFF",
        status_writing_table || "OFF",
        status_lampu_op || "OFF",
      ]
    );

    // Get the complete data that was just inserted
    const insertedData = await executeQuery(
      `SELECT 
        monitoring_id,
        hospital_id,
        temperature,
        humidity,
        gas_status,
        status_lampu1,
        status_lampu2,
        status_viewer,
        status_writing_table,
        status_lampu_op,
        created_at,
        updated_at
       FROM monitoring_data 
       WHERE monitoring_id = ?`,
      [result.insertId]
    );

    // Update hospital IoT status to online
    await executeQuery(
      "UPDATE hospital SET iot_status = 'online' WHERE hospital_id = ?",
      [hospital_id]
    );

    // Emit real-time update via WebSocket
    const io = req.app.get("io");
    if (io) {
      console.log(
        `📡 Broadcasting monitoring update for hospital ${hospital_id}`
      );

      // Broadcast to all connected clients
      io.emit("monitoring_update", insertedData[0]);

      // Broadcast to specific hospital listeners
      io.emit(`monitoring_update_${hospital_id}`, insertedData[0]);
    }

    res.status(201).json({
      status: "success",
      message: "Monitoring data submitted successfully",
      data: insertedData[0],
    });
  } catch (error) {
    console.error("Submit monitoring data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while submitting monitoring data",
    });
  }
};

// Get Latest Monitoring Data for All Hospitals
const getLatestMonitoringData = async (req, res) => {
  try {
    const { hospital_ids } = req.query;

    let whereClause = "";
    let queryParams = [];

    if (hospital_ids) {
      const idsArray = hospital_ids.split(",").map((id) => parseInt(id));
      whereClause =
        "WHERE h.hospital_id IN (" + idsArray.map(() => "?").join(",") + ")";
      queryParams = idsArray;
    }

    const latestData = await executeQuery(
      `SELECT 
        m1.monitoring_id,
        m1.hospital_id,
        h.hospital_name,
        h.iot_status,
        m1.temperature,
        m1.humidity,
        m1.gas_status,
        m1.status_lampu1,
        m1.status_lampu2,
        m1.status_viewer,
        m1.status_writing_table,
        m1.status_lampu_op,
        m1.created_at,
        m1.updated_at,
        CASE 
          WHEN m1.created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 'online'
          WHEN m1.created_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE) THEN 'warning'
          ELSE 'offline'
        END as connection_status
       FROM monitoring_data m1
       INNER JOIN hospital h ON m1.hospital_id = h.hospital_id
       INNER JOIN (
         SELECT hospital_id, MAX(created_at) as max_created_at
         FROM monitoring_data
         GROUP BY hospital_id
       ) m2 ON m1.hospital_id = m2.hospital_id AND m1.created_at = m2.max_created_at
       ${whereClause}
       ORDER BY h.hospital_name ASC`,
      queryParams
    );

    res.json({
      status: "success",
      message: "Latest monitoring data retrieved successfully",
      data: latestData,
      count: latestData.length,
    });
  } catch (error) {
    console.error("Get latest monitoring data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching latest monitoring data",
    });
  }
};

// Get Hospital Status Summary
const getHospitalStatusSummary = async (req, res) => {
  try {
    const statusData = await executeQuery(
      `SELECT 
        h.hospital_id,
        h.hospital_name,
        h.iot_status,
        CASE 
          WHEN m.monitoring_id IS NULL THEN 'No Data'
          WHEN m.created_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 'Offline'
          WHEN m.temperature > 30 OR m.humidity > 80 OR m.gas_status = 'High' THEN 'Warning'
          ELSE 'Normal'
        END as status,
        m.temperature,
        m.humidity,
        m.gas_status,
        m.created_at as last_update,
        TIMESTAMPDIFF(MINUTE, m.created_at, NOW()) as minutes_since_update
       FROM hospital h
       LEFT JOIN (
         SELECT m1.*
         FROM monitoring_data m1
         INNER JOIN (
           SELECT hospital_id, MAX(created_at) as max_created_at
           FROM monitoring_data
           GROUP BY hospital_id
         ) m2 ON m1.hospital_id = m2.hospital_id AND m1.created_at = m2.max_created_at
       ) m ON h.hospital_id = m.hospital_id
       WHERE h.is_active = 1
       ORDER BY h.hospital_name ASC`
    );

    // Get summary counts
    const summary = {
      total: statusData.length,
      normal: statusData.filter((h) => h.status === "Normal").length,
      warning: statusData.filter((h) => h.status === "Warning").length,
      offline: statusData.filter((h) => h.status === "Offline").length,
      no_data: statusData.filter((h) => h.status === "No Data").length,
    };

    res.json({
      status: "success",
      message: "Hospital status retrieved successfully",
      data: statusData,
      summary,
    });
  } catch (error) {
    console.error("Get hospital status error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching hospital status",
    });
  }
};

// Get Monitoring History
const getMonitoringHistory = async (req, res) => {
  try {
    const {
      hospital_id,
      start_date,
      end_date,
      limit = 50,
      page = 1,
      order = "desc",
    } = req.query;

    const offset = (page - 1) * limit;

    // Build conditions
    let whereClause = "WHERE 1=1";
    let queryParams = [];

    if (hospital_id) {
      whereClause += " AND m.hospital_id = ?";
      queryParams.push(hospital_id);
    }

    if (start_date) {
      whereClause += " AND m.created_at >= ?";
      queryParams.push(start_date);
    }

    if (end_date) {
      whereClause += " AND m.created_at <= ?";
      queryParams.push(end_date);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM monitoring_data m
      JOIN hospital h ON m.hospital_id = h.hospital_id
      ${whereClause}
    `;
    const countResult = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    // Get monitoring history
    const orderDirection = order.toLowerCase() === "asc" ? "ASC" : "DESC";
    const historyQuery = `
      SELECT 
        m.monitoring_id,
        m.hospital_id,
        h.hospital_name,
        m.temperature,
        m.humidity,
        m.gas_status,
        m.status_lampu1,
        m.status_lampu2,
        m.status_viewer,
        m.status_writing_table,
        m.status_lampu_op,
        m.created_at,
        m.updated_at
      FROM monitoring_data m
      JOIN hospital h ON m.hospital_id = h.hospital_id
      ${whereClause}
      ORDER BY m.created_at ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    queryParams.push(parseInt(limit), parseInt(offset));

    const history = await executeQuery(historyQuery, queryParams);

    res.json({
      status: "success",
      data: {
        history,
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
    console.error("Get monitoring history error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching monitoring history",
    });
  }
};

// Simulate Monitoring Data (for Testing)
const simulateMonitoringData = async (req, res) => {
  try {
    const { hospital_id } = req.body;

    if (!hospital_id) {
      return res.status(400).json({
        status: "error",
        message: "Hospital ID is required",
      });
    }

    // Check if hospital exists
    const hospitalExists = await executeQuery(
      "SELECT hospital_id FROM hospital WHERE hospital_id = ? AND is_active = 1",
      [hospital_id]
    );

    if (hospitalExists.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Hospital not found or inactive",
      });
    }

    // Generate random realistic monitoring data
    const simulatedData = {
      hospital_id: parseInt(hospital_id),
      temperature: parseFloat((20 + Math.random() * 15).toFixed(1)), // 20-35°C
      humidity: parseFloat((40 + Math.random() * 40).toFixed(1)), // 40-80%
      gas_status:
        Math.random() > 0.8 ? "High" : Math.random() > 0.5 ? "Medium" : "Low",
      status_lampu1: Math.random() > 0.5 ? "ON" : "OFF",
      status_lampu2: Math.random() > 0.5 ? "ON" : "OFF",
      status_viewer: Math.random() > 0.5 ? "ON" : "OFF",
      status_writing_table: Math.random() > 0.5 ? "ON" : "OFF",
      status_lampu_op: Math.random() > 0.5 ? "ON" : "OFF",
    };

    // Insert simulated data
    const result = await executeQuery(
      `INSERT INTO monitoring_data 
       (hospital_id, temperature, humidity, gas_status, status_lampu1, status_lampu2, 
        status_viewer, status_writing_table, status_lampu_op, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        simulatedData.hospital_id,
        simulatedData.temperature,
        simulatedData.humidity,
        simulatedData.gas_status,
        simulatedData.status_lampu1,
        simulatedData.status_lampu2,
        simulatedData.status_viewer,
        simulatedData.status_writing_table,
        simulatedData.status_lampu_op,
      ]
    );

    // Get the complete inserted data
    const insertedData = await executeQuery(
      `SELECT 
        monitoring_id,
        hospital_id,
        temperature,
        humidity,
        gas_status,
        status_lampu1,
        status_lampu2,
        status_viewer,
        status_writing_table,
        status_lampu_op,
        created_at,
        updated_at
       FROM monitoring_data 
       WHERE monitoring_id = ?`,
      [result.insertId]
    );

    // Update hospital IoT status
    await executeQuery(
      "UPDATE hospital SET iot_status = 'online' WHERE hospital_id = ?",
      [hospital_id]
    );

    // Emit real-time update via WebSocket
    const io = req.app.get("io");
    if (io) {
      console.log(
        `📡 Broadcasting simulated monitoring update for hospital ${hospital_id}`
      );

      // Broadcast to all connected clients
      io.emit("monitoring_update", insertedData[0]);

      // Broadcast to specific hospital listeners
      io.emit(`monitoring_update_${hospital_id}`, insertedData[0]);
    }

    res.json({
      status: "success",
      message: "Simulated monitoring data created and broadcasted",
      data: insertedData[0],
    });
  } catch (error) {
    console.error("Simulate monitoring data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while simulating monitoring data",
    });
  }
};

// Get Monitoring Statistics
const getMonitoringStatistics = async (req, res) => {
  try {
    const { hospital_id, period = "24h" } = req.query;

    let timeInterval;
    switch (period) {
      case "1h":
        timeInterval = "INTERVAL 1 HOUR";
        break;
      case "24h":
        timeInterval = "INTERVAL 24 HOUR";
        break;
      case "7d":
        timeInterval = "INTERVAL 7 DAY";
        break;
      case "30d":
        timeInterval = "INTERVAL 30 DAY";
        break;
      default:
        timeInterval = "INTERVAL 24 HOUR";
    }

    let whereClause = "";
    let queryParams = [];

    if (hospital_id) {
      whereClause = "WHERE hospital_id = ?";
      queryParams.push(hospital_id);
    }

    // Get statistics
    const stats = await executeQuery(
      `SELECT 
        COUNT(*) as total_records,
        AVG(temperature) as avg_temperature,
        MIN(temperature) as min_temperature,
        MAX(temperature) as max_temperature,
        AVG(humidity) as avg_humidity,
        MIN(humidity) as min_humidity,
        MAX(humidity) as max_humidity,
        SUM(CASE WHEN gas_status = 'High' THEN 1 ELSE 0 END) as high_gas_alerts,
        SUM(CASE WHEN gas_status = 'Medium' THEN 1 ELSE 0 END) as medium_gas_alerts,
        SUM(CASE WHEN temperature > 30 THEN 1 ELSE 0 END) as high_temperature_alerts,
        SUM(CASE WHEN humidity > 80 THEN 1 ELSE 0 END) as high_humidity_alerts
      FROM monitoring_data 
      ${whereClause} 
      AND created_at >= DATE_SUB(NOW(), ${timeInterval})`,
      queryParams
    );

    res.json({
      status: "success",
      data: {
        period,
        statistics: stats[0],
      },
    });
  } catch (error) {
    console.error("Get monitoring statistics error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching monitoring statistics",
    });
  }
};

module.exports = {
  submitMonitoringData,
  getLatestMonitoringData,
  getHospitalStatusSummary,
  getMonitoringHistory,
  simulateMonitoringData,
  getMonitoringStatistics,
};
