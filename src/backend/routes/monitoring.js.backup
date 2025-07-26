const express = require("express");
const { executeQuery } = require("../config/database");

const router = express.Router();

// @route   POST /api/monitoring/submit
// @desc    Submit new monitoring data from IoT devices (NO AUTH REQUIRED)
// @access  Public (for IoT devices)
router.post("/submit", async (req, res) => {
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
      status_lampu_op
    } = req.body;

    // Validate required fields
    if (!hospital_id || temperature === undefined || humidity === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Hospital ID, temperature, and humidity are required"
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
        gas_status || 'Normal',
        status_lampu1 || 'OFF',
        status_lampu2 || 'OFF',
        status_viewer || 'OFF',
        status_writing_table || 'OFF',
        status_lampu_op || 'OFF'
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

    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      console.log(`📡 Broadcasting monitoring update for hospital ${hospital_id}`);
      
      // Broadcast to all connected clients
      io.emit('monitoring_update', insertedData[0]);
      
      // Broadcast to specific hospital listeners
      io.emit(`monitoring_update_${hospital_id}`, insertedData[0]);
    }

    res.status(201).json({
      status: "success",
      message: "Monitoring data submitted successfully",
      data: insertedData[0]
    });

  } catch (error) {
    console.error("Submit monitoring data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while submitting monitoring data"
    });
  }
});

// @route   GET /api/monitoring/latest
// @desc    Get latest monitoring data for all hospitals
// @access  Public (for real-time dashboard)
router.get("/latest", async (req, res) => {
  try {
    const latestData = await executeQuery(
      `SELECT 
        m1.monitoring_id,
        m1.hospital_id,
        h.hospital_name,
        m1.temperature,
        m1.humidity,
        m1.gas_status,
        m1.status_lampu1,
        m1.status_lampu2,
        m1.status_lampu3,
        m1.status_viewer,
        m1.sensor_gerak,
        m1.recorded_at
       FROM monitoring_data m1
       INNER JOIN hospitals h ON m1.hospital_id = h.hospital_id
       INNER JOIN (
         SELECT hospital_id, MAX(recorded_at) as max_recorded_at
         FROM monitoring_data
         GROUP BY hospital_id
       ) m2 ON m1.hospital_id = m2.hospital_id AND m1.recorded_at = m2.max_recorded_at
       ORDER BY h.hospital_name ASC`
    );

    res.json({
      status: "success",
      message: "Latest monitoring data retrieved successfully",
      data: latestData,
      count: latestData.length
    });

  } catch (error) {
    console.error("Get latest monitoring data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching latest monitoring data"
    });
  }
});

// @route   GET /api/monitoring/hospitals/status
// @desc    Get status summary for all hospitals
// @access  Public
router.get("/hospitals/status", async (req, res) => {
  try {
    const statusData = await executeQuery(
      `SELECT 
        h.hospital_id,
        h.hospital_name,
        CASE 
          WHEN m.monitoring_id IS NULL THEN 'No Data'
          WHEN m.recorded_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 'Offline'
          WHEN m.temperature > 30 OR m.humidity > 80 OR m.gas_status = 'High' THEN 'Warning'
          ELSE 'Normal'
        END as status,
        m.recorded_at as last_update
       FROM hospitals h
       LEFT JOIN (
         SELECT m1.*
         FROM monitoring_data m1
         INNER JOIN (
           SELECT hospital_id, MAX(recorded_at) as max_recorded_at
           FROM monitoring_data
           GROUP BY hospital_id
         ) m2 ON m1.hospital_id = m2.hospital_id AND m1.recorded_at = m2.max_recorded_at
       ) m ON h.hospital_id = m.hospital_id
       ORDER BY h.hospital_name ASC`
    );

    res.json({
      status: "success",
      message: "Hospital status retrieved successfully",
      data: statusData
    });

  } catch (error) {
    console.error("Get hospital status error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching hospital status"
    });
  }
});

// @route   POST /api/monitoring/simulate
// @desc    Simulate monitoring data updates (for testing)
// @access  Public (for development/testing)
router.post("/simulate", async (req, res) => {
  try {
    const { hospital_id } = req.body;
    
    if (!hospital_id) {
      return res.status(400).json({
        status: "error",
        message: "Hospital ID is required"
      });
    }

    // Generate random realistic monitoring data
    const simulatedData = {
      hospital_id: parseInt(hospital_id),
      temperature: parseFloat((20 + Math.random() * 15).toFixed(1)), // 20-35°C
      humidity: parseFloat((40 + Math.random() * 40).toFixed(1)), // 40-80%
      gas_status: Math.random() > 0.8 ? 'High' : (Math.random() > 0.5 ? 'Medium' : 'Low'),
      status_lampu1: Math.random() > 0.5 ? 'ON' : 'OFF',
      status_lampu2: Math.random() > 0.5 ? 'ON' : 'OFF',
      status_viewer: Math.random() > 0.5 ? 'ON' : 'OFF',
      status_writing_table: Math.random() > 0.5 ? 'ON' : 'OFF',
      status_lampu_op: Math.random() > 0.5 ? 'ON' : 'OFF'
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
        simulatedData.status_lampu_op
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

    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      console.log(`📡 Broadcasting simulated monitoring update for hospital ${hospital_id}`);
      
      // Broadcast to all connected clients
      io.emit('monitoring_update', insertedData[0]);
      
      // Broadcast to specific hospital listeners
      io.emit(`monitoring_update_${hospital_id}`, insertedData[0]);
    }

    res.json({
      status: "success",
      message: "Simulated monitoring data created and broadcasted",
      data: insertedData[0]
    });

  } catch (error) {
    console.error("Simulate monitoring data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while simulating monitoring data"
    });
  }
});

module.exports = router;
