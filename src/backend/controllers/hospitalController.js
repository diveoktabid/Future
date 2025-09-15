const { executeQuery } = require("../config/database");

// Get All Hospitals
const getAllHospitals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      iot_status = "",
      is_active = "1",
    } = req.query;

    const offset = (page - 1) * limit;

    // Build search conditions
    let whereClause = "WHERE 1=1";
    let queryParams = [];

    if (is_active !== "") {
      whereClause += " AND h.is_active = ?";
      queryParams.push(is_active);
    }

    if (search) {
      whereClause += " AND h.hospital_name LIKE ?";
      queryParams.push(`%${search}%`);
    }

    if (iot_status) {
      whereClause += " AND h.iot_status = ?";
      queryParams.push(iot_status);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM hospital h ${whereClause}`;
    const countResult = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    // Get hospitals with pagination
    const hospitalsQuery = `
      SELECT 
        h.hospital_id,
        h.hospital_name,
        h.address,
        h.phone,
        h.email,
        h.capacity,
        h.description,
        h.installation_date,
        h.installation_time,
        h.iot_status,
        h.is_active,
        h.created_at,
        h.updated_at,
        (SELECT COUNT(*) FROM monitoring_data WHERE hospital_id = h.hospital_id) as total_monitoring_records,
        (SELECT created_at FROM monitoring_data WHERE hospital_id = h.hospital_id ORDER BY created_at DESC LIMIT 1) as last_monitoring_update
      FROM hospital h
      ${whereClause}
      ORDER BY h.created_at DESC
      LIMIT ? OFFSET ?
    `;
    queryParams.push(parseInt(limit), parseInt(offset));

    const hospitals = await executeQuery(hospitalsQuery, queryParams);

    res.json({
      status: "success",
      data: {
        hospitals,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalHospitals: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get hospitals error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching hospitals",
    });
  }
};

// Get Hospital by ID
const getHospitalById = async (req, res) => {
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

    // Get latest monitoring data
    const latestMonitoringQuery = `
      SELECT * FROM monitoring_data 
      WHERE hospital_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    const latestMonitoring = await executeQuery(latestMonitoringQuery, [id]);

    // Get monitoring statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_records,
        AVG(temperature) as avg_temperature,
        AVG(humidity) as avg_humidity,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as records_last_24h
      FROM monitoring_data 
      WHERE hospital_id = ?
    `;
    const stats = await executeQuery(statsQuery, [id]);

    res.json({
      status: "success",
      data: {
        hospital: hospitals[0],
        latestMonitoring,
        statistics: stats[0],
      },
    });
  } catch (error) {
    console.error("Get hospital by ID error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching hospital",
    });
  }
};

// Get Hospital Monitoring Data
const getHospitalMonitoring = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      limit = 10,
      page = 1,
      start_date,
      end_date,
      order = "desc",
    } = req.query;

    const offset = (page - 1) * limit;

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

    // Build date conditions
    let dateClause = "";
    let queryParams = [id];

    if (start_date) {
      dateClause += " AND created_at >= ?";
      queryParams.push(start_date);
    }

    if (end_date) {
      dateClause += " AND created_at <= ?";
      queryParams.push(end_date);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM monitoring_data 
      WHERE hospital_id = ? ${dateClause}
    `;
    const countResult = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    // Get monitoring data
    const orderDirection = order.toLowerCase() === "asc" ? "ASC" : "DESC";
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
      WHERE hospital_id = ? ${dateClause}
      ORDER BY created_at ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    queryParams.push(parseInt(limit), parseInt(offset));

    const monitoringData = await executeQuery(monitoringQuery, queryParams);

    res.json({
      status: "success",
      data: {
        monitoring: monitoringData,
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
    console.error("Get monitoring data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching monitoring data",
    });
  }
};

// Add Hospital Monitoring Data
const addHospitalMonitoring = async (req, res) => {
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
      temperature === undefined ||
      humidity === undefined ||
      !gas_status ||
      status_lampu1 === undefined ||
      status_viewer === undefined ||
      status_writing_table === undefined ||
      status_lampu2 === undefined ||
      status_lampu_op === undefined
    ) {
      return res.status(400).json({
        status: "error",
        message: "Missing required monitoring data fields",
        required_fields: [
          "temperature",
          "humidity",
          "gas_status",
          "status_lampu1",
          "status_viewer",
          "status_writing_table",
          "status_lampu2",
          "status_lampu_op",
        ],
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

    // Insert monitoring data
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

    // Get the inserted data
    const newMonitoring = await executeQuery(
      "SELECT * FROM monitoring_data WHERE monitoring_id = ?",
      [result.insertId]
    );

    res.status(201).json({
      status: "success",
      message: "Monitoring data added successfully",
      data: {
        monitoring: newMonitoring[0],
      },
    });
  } catch (error) {
    console.error("Add monitoring data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while adding monitoring data",
    });
  }
};

// Get Hospital Statistics
const getHospitalStats = async (req, res) => {
  try {
    // Overall hospital statistics
    const hospitalStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_hospitals,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_hospitals,
        SUM(CASE WHEN iot_status = 'online' THEN 1 ELSE 0 END) as online_hospitals,
        SUM(CASE WHEN iot_status = 'offline' THEN 1 ELSE 0 END) as offline_hospitals
      FROM hospital
    `);

    // Monitoring data statistics
    const monitoringStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_monitoring_records,
        COUNT(DISTINCT hospital_id) as hospitals_with_monitoring,
        AVG(temperature) as avg_temperature,
        AVG(humidity) as avg_humidity,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as records_last_24h,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as records_last_7_days
      FROM monitoring_data
    `);

    // Recent activity
    const recentActivity = await executeQuery(`
      SELECT 
        h.hospital_name,
        md.temperature,
        md.humidity,
        md.created_at
      FROM monitoring_data md
      JOIN hospital h ON md.hospital_id = h.hospital_id
      WHERE h.is_active = 1
      ORDER BY md.created_at DESC
      LIMIT 10
    `);

    res.json({
      status: "success",
      data: {
        hospitalStats: hospitalStats[0],
        monitoringStats: monitoringStats[0],
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Get hospital stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching hospital statistics",
    });
  }
};

// Create Hospital
const createHospital = async (req, res) => {
  try {
    const { name, address, phone, email, capacity, description } = req.body;

    // Validate required fields
    if (!name || !address || !phone) {
      return res.status(400).json({
        error: "Nama, alamat, dan telepon rumah sakit wajib diisi"
      });
    }

    // Check if hospital name already exists
    const existingHospital = await executeQuery(
      "SELECT hospital_id FROM hospital WHERE hospital_name = ?",
      [name]
    );

    if (existingHospital.length > 0) {
      return res.status(400).json({
        error: "Nama rumah sakit sudah ada"
      });
    }

    // Insert new hospital
    const insertQuery = `
      INSERT INTO hospital (
        hospital_name, 
        address, 
        phone, 
        email, 
        capacity, 
        description,
        installation_date,
        installation_time,
        iot_status,
        is_active,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), TIME(NOW()), 'Mati', 1, NOW())
    `;

    const result = await executeQuery(insertQuery, [
      name,
      address,
      phone,
      email || null,
      capacity || null,
      description || null
    ]);

    // Get the created hospital
    const newHospital = await executeQuery(
      "SELECT * FROM hospital WHERE hospital_id = ?",
      [result.insertId]
    );

    res.status(201).json({
      message: "Rumah sakit berhasil ditambahkan",
      hospital: {
        id: newHospital[0].hospital_id,
        name: newHospital[0].hospital_name,
        address: newHospital[0].address,
        phone: newHospital[0].phone,
        email: newHospital[0].email,
        capacity: newHospital[0].capacity,
        description: newHospital[0].description,
        iot_status: newHospital[0].iot_status,
        is_active: newHospital[0].is_active,
        created_at: newHospital[0].created_at
      }
    });
  } catch (error) {
    console.error("Error creating hospital:", error);
    res.status(500).json({
      error: "Terjadi kesalahan internal server",
      details: error.message
    });
  }
};

// Update Hospital
const updateHospital = async (req, res) => {
  try {
    const hospitalId = req.params.id;
    const { name, address, phone, email, capacity, description } = req.body;

    // Validate required fields
    if (!name || !address || !phone) {
      return res.status(400).json({
        error: "Nama, alamat, dan telepon rumah sakit wajib diisi"
      });
    }

    // Check if hospital exists
    const existingHospital = await executeQuery(
      "SELECT hospital_id FROM hospital WHERE hospital_id = ?",
      [hospitalId]
    );

    if (existingHospital.length === 0) {
      return res.status(404).json({
        error: "Rumah sakit tidak ditemukan"
      });
    }

    // Check if hospital name already exists (exclude current hospital)
    const duplicateName = await executeQuery(
      "SELECT hospital_id FROM hospital WHERE hospital_name = ? AND hospital_id != ?",
      [name, hospitalId]
    );

    if (duplicateName.length > 0) {
      return res.status(400).json({
        error: "Nama rumah sakit sudah ada"
      });
    }

    // Update hospital
    const updateQuery = `
      UPDATE hospital SET 
        hospital_name = ?, 
        address = ?, 
        phone = ?, 
        email = ?, 
        capacity = ?, 
        description = ?,
        updated_at = NOW()
      WHERE hospital_id = ?
    `;

    await executeQuery(updateQuery, [
      name,
      address,
      phone,
      email || null,
      capacity || null,
      description || null,
      hospitalId
    ]);

    // Get the updated hospital
    const updatedHospital = await executeQuery(
      "SELECT * FROM hospital WHERE hospital_id = ?",
      [hospitalId]
    );

    res.json({
      message: "Rumah sakit berhasil diperbarui",
      hospital: {
        id: updatedHospital[0].hospital_id,
        name: updatedHospital[0].hospital_name,
        address: updatedHospital[0].address,
        phone: updatedHospital[0].phone,
        email: updatedHospital[0].email,
        capacity: updatedHospital[0].capacity,
        description: updatedHospital[0].description,
        iot_status: updatedHospital[0].iot_status,
        is_active: updatedHospital[0].is_active,
        updated_at: updatedHospital[0].updated_at
      }
    });
  } catch (error) {
    console.error("Error updating hospital:", error);
    res.status(500).json({
      error: "Terjadi kesalahan internal server",
      details: error.message
    });
  }
};

// Delete Hospital
const deleteHospital = async (req, res) => {
  try {
    const hospitalId = req.params.id;

    // Check if hospital exists
    const existingHospital = await executeQuery(
      "SELECT hospital_id, hospital_name FROM hospital WHERE hospital_id = ?",
      [hospitalId]
    );

    if (existingHospital.length === 0) {
      return res.status(404).json({
        error: "Rumah sakit tidak ditemukan"
      });
    }

    // Check if hospital has monitoring data
    const monitoringData = await executeQuery(
      "SELECT COUNT(*) as count FROM data_monitoring WHERE hospital_id = ?",
      [hospitalId]
    );

    if (monitoringData[0].count > 0) {
      // Soft delete - mark as inactive instead of hard delete
      await executeQuery(
        "UPDATE hospital SET is_active = 0, updated_at = NOW() WHERE hospital_id = ?",
        [hospitalId]
      );

      res.json({
        message: "Rumah sakit berhasil dinonaktifkan (data monitoring masih tersimpan)",
        hospital: existingHospital[0]
      });
    } else {
      // Hard delete if no monitoring data
      await executeQuery(
        "DELETE FROM hospital WHERE hospital_id = ?",
        [hospitalId]
      );

      res.json({
        message: "Rumah sakit berhasil dihapus",
        hospital: existingHospital[0]
      });
    }
  } catch (error) {
    console.error("Error deleting hospital:", error);
    res.status(500).json({
      error: "Terjadi kesalahan internal server",
      details: error.message
    });
  }
};

module.exports = {
  getAllHospitals,
  getHospitalById,
  getHospitalMonitoring,
  addHospitalMonitoring,
  getHospitalStats,
  createHospital,
  updateHospital,
  deleteHospital,
};
