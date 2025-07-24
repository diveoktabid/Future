const express = require("express");
const { executeQuery } = require("../config/database");

const router = express.Router();

// @route   GET /api/hospitals
// @desc    Get all hospitals with their latest monitoring data
// @access  Private
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT 
        h.hospital_id,
        h.hospital_name,
        h.installation_date,
        h.installation_time,
        h.iot_status,
        h.is_active,
        h.created_at,
        h.updated_at
      FROM hospital h
      WHERE h.is_active = 1
      ORDER BY h.created_at DESC
    `;

    const hospitals = await executeQuery(query);

    res.json({
      status: "success",
      data: hospitals,
    });
  } catch (error) {
    console.error("Get hospitals error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching hospitals",
    });
  }
});

// @route   GET /api/hospitals/:id
// @desc    Get specific hospital with its details
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const hospitalQuery = `
      SELECT 
        hospital_id,
        hospital_name,
        installation_date,
        installation_time,
        iot_status,
        is_active,
        created_at,
        updated_at
      FROM hospital 
      WHERE hospital_id = ? AND is_active = 1
    `;

    const hospitals = await executeQuery(hospitalQuery, [id]);

    if (hospitals.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Hospital not found",
      });
    }

    res.json({
      status: "success",
      data: hospitals[0],
    });
  } catch (error) {
    console.error("Get hospital by ID error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching hospital",
    });
  }
});

// @route   GET /api/hospitals/:id/monitoring
// @desc    Get latest monitoring data for a specific hospital
// @access  Private
router.get("/:id/monitoring", async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 1 } = req.query;

    // First check if hospital exists
    const hospitalQuery = `
      SELECT hospital_id FROM hospital 
      WHERE hospital_id = ? AND is_active = 1
    `;
    const hospitals = await executeQuery(hospitalQuery, [id]);

    if (hospitals.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Hospital not found",
      });
    }

    const monitoringQuery = `
      SELECT 
        monitoring_id,
        hospital_id,
        temperature,
        humidity,
        gas_status,
        status_lampu1,
        status_viewer,
        status_writing_table,
        status_lampu2,
        status_lampu_op,
        created_at,
        updated_at
      FROM monitoring_data 
      WHERE hospital_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const monitoringData = await executeQuery(monitoringQuery, [
      id,
      parseInt(limit),
    ]);

    res.json({
      status: "success",
      data: monitoringData,
    });
  } catch (error) {
    console.error("Get monitoring data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching monitoring data",
    });
  }
});

// @route   POST /api/hospitals/:id/monitoring
// @desc    Add new monitoring data for a hospital
// @access  Private
router.post("/:id/monitoring", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      temperature,
      humidity,
      gas_status,
      status_lampu1,
      status_viewer,
      status_writing_table,
      status_lampu2,
      status_lampu_op,
    } = req.body;

    // Validate required fields
    if (
      !humidity ||
      !gas_status ||
      !status_lampu1 ||
      !status_viewer ||
      !status_writing_table ||
      !status_lampu2 ||
      !status_lampu_op
    ) {
      return res.status(400).json({
        status: "error",
        message: "Missing required monitoring data fields",
      });
    }

    // Check if hospital exists
    const hospitalQuery = `
      SELECT hospital_id FROM hospital 
      WHERE hospital_id = ? AND is_active = 1
    `;
    const hospitals = await executeQuery(hospitalQuery, [id]);

    if (hospitals.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Hospital not found",
      });
    }

    const insertQuery = `
      INSERT INTO monitoring_data 
      (hospital_id, temperature, humidity, gas_status, status_lampu1, 
       status_viewer, status_writing_table, status_lampu2, status_lampu_op, 
       created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await executeQuery(insertQuery, [
      id,
      temperature,
      humidity,
      gas_status,
      status_lampu1,
      status_viewer,
      status_writing_table,
      status_lampu2,
      status_lampu_op,
    ]);

    res.status(201).json({
      status: "success",
      message: "Monitoring data added successfully",
      data: {
        monitoring_id: result.insertId,
        hospital_id: id,
      },
    });
  } catch (error) {
    console.error("Add monitoring data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while adding monitoring data",
    });
  }
});

module.exports = router;
