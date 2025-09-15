const { executeQuery } = require("../config/database");

// Get All Hospitals for Management (with specific fields needed for management interface)
const getHospitalsForManagement = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
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

    // Get hospitals with management-specific fields
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
        h.updated_at
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
    console.error("Get hospitals for management error:", error);
    res.status(500).json({
      status: "error",
      error: "Gagal memuat data rumah sakit",
      message: "Internal server error while fetching hospitals for management",
    });
  }
};

// Create Hospital for Management Interface
const createHospitalFromManagement = async (req, res) => {
  try {
    const { name, address, phone, email, description } = req.body;

    // Validation
    if (!name || !address || !phone) {
      return res.status(400).json({
        status: "error",
        error: "Nama rumah sakit, alamat, dan telepon harus diisi"
      });
    }

    // Check if hospital name already exists
    const existingHospital = await executeQuery(
      "SELECT hospital_id FROM hospital WHERE hospital_name = ? AND is_active = 1",
      [name]
    );

    if (existingHospital.length > 0) {
      return res.status(400).json({
        status: "error",
        error: "Nama rumah sakit sudah terdaftar"
      });
    }

    // Insert new hospital
    const insertQuery = `
      INSERT INTO hospital (
        hospital_name, 
        address, 
        phone, 
        email, 
        description,
        iot_status,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, 'Mati', 1, NOW(), NOW())
    `;

    const result = await executeQuery(insertQuery, [
      name,
      address,
      phone,
      email || null,
      description || null
    ]);

    if (result.affectedRows === 1) {
      // Get the created hospital
      const newHospital = await executeQuery(
        "SELECT * FROM hospital WHERE hospital_id = ?",
        [result.insertId]
      );

      res.status(201).json({
        status: "success",
        message: "Rumah sakit berhasil ditambahkan",
        data: {
          hospital: newHospital[0]
        }
      });
    } else {
      throw new Error("Failed to create hospital");
    }

  } catch (error) {
    console.error("Create hospital from management error:", error);
    res.status(500).json({
      status: "error",
      error: "Gagal menambahkan rumah sakit",
      message: error.message
    });
  }
};

// Update Hospital from Management Interface
const updateHospitalFromManagement = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, description } = req.body;

    // Validation
    if (!name || !address || !phone) {
      return res.status(400).json({
        status: "error",
        error: "Nama rumah sakit, alamat, dan telepon harus diisi"
      });
    }

    // Check if hospital exists
    const existingHospital = await executeQuery(
      "SELECT * FROM hospital WHERE hospital_id = ? AND is_active = 1",
      [id]
    );

    if (existingHospital.length === 0) {
      return res.status(404).json({
        status: "error",
        error: "Rumah sakit tidak ditemukan"
      });
    }

    // Check if name already exists (excluding current hospital)
    const duplicateName = await executeQuery(
      "SELECT hospital_id FROM hospital WHERE hospital_name = ? AND hospital_id != ? AND is_active = 1",
      [name, id]
    );

    if (duplicateName.length > 0) {
      return res.status(400).json({
        status: "error",
        error: "Nama rumah sakit sudah terdaftar"
      });
    }

    // Update hospital
    const updateQuery = `
      UPDATE hospital 
      SET 
        hospital_name = ?,
        address = ?,
        phone = ?,
        email = ?,
        description = ?,
        updated_at = NOW()
      WHERE hospital_id = ? AND is_active = 1
    `;

    const result = await executeQuery(updateQuery, [
      name,
      address,
      phone,
      email || null,
      description || null,
      id
    ]);

    if (result.affectedRows === 1) {
      // Get updated hospital
      const updatedHospital = await executeQuery(
        "SELECT * FROM hospital WHERE hospital_id = ?",
        [id]
      );

      res.json({
        status: "success",
        message: "Rumah sakit berhasil diperbarui",
        data: {
          hospital: updatedHospital[0]
        }
      });
    } else {
      throw new Error("Failed to update hospital");
    }

  } catch (error) {
    console.error("Update hospital from management error:", error);
    res.status(500).json({
      status: "error",
      error: "Gagal memperbarui rumah sakit",
      message: error.message
    });
  }
};

// Delete Hospital from Management Interface
const deleteHospitalFromManagement = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if hospital exists
    const existingHospital = await executeQuery(
      "SELECT * FROM hospital WHERE hospital_id = ? AND is_active = 1",
      [id]
    );

    if (existingHospital.length === 0) {
      return res.status(404).json({
        status: "error",
        error: "Rumah sakit tidak ditemukan"
      });
    }

    // Check if hospital has monitoring data
    const monitoringData = await executeQuery(
      "SELECT COUNT(*) as count FROM monitoring_data WHERE hospital_id = ?",
      [id]
    );

    // Soft delete hospital (set is_active to 0)
    const deleteQuery = `
      UPDATE hospital 
      SET 
        is_active = 0,
        updated_at = NOW()
      WHERE hospital_id = ? AND is_active = 1
    `;

    const result = await executeQuery(deleteQuery, [id]);

    if (result.affectedRows === 1) {
      res.json({
        status: "success",
        message: "Rumah sakit berhasil dihapus",
        data: {
          hospital: existingHospital[0],
          hadMonitoringData: monitoringData[0].count > 0
        }
      });
    } else {
      throw new Error("Failed to delete hospital");
    }

  } catch (error) {
    console.error("Delete hospital from management error:", error);
    res.status(500).json({
      status: "error",
      error: "Gagal menghapus rumah sakit",
      message: error.message
    });
  }
};

// Get Hospital by ID for Management
const getHospitalByIdForManagement = async (req, res) => {
  try {
    const { id } = req.params;

    const hospitalQuery = `
      SELECT 
        hospital_id,
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
        created_at,
        updated_at
      FROM hospital 
      WHERE hospital_id = ? AND is_active = 1
    `;

    const hospitals = await executeQuery(hospitalQuery, [id]);

    if (hospitals.length === 0) {
      return res.status(404).json({
        status: "error",
        error: "Rumah sakit tidak ditemukan"
      });
    }

    res.json({
      status: "success",
      data: {
        hospital: hospitals[0]
      }
    });

  } catch (error) {
    console.error("Get hospital by ID for management error:", error);
    res.status(500).json({
      status: "error",
      error: "Gagal memuat data rumah sakit",
      message: error.message
    });
  }
};

// Get Hospital Management Statistics
const getHospitalManagementStats = async (req, res) => {
  try {
    // Get statistics for management dashboard
    const statsQuery = `
      SELECT 
        COUNT(*) as total_hospitals,
        SUM(CASE WHEN iot_status = 'Nyala' THEN 1 ELSE 0 END) as active_iot,
        SUM(CASE WHEN iot_status = 'Mati' THEN 1 ELSE 0 END) as inactive_iot,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_hospitals,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as deleted_hospitals
      FROM hospital
    `;

    const stats = await executeQuery(statsQuery);

    // Get recent hospitals
    const recentHospitalsQuery = `
      SELECT 
        hospital_id,
        hospital_name,
        iot_status,
        created_at
      FROM hospital 
      WHERE is_active = 1
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const recentHospitals = await executeQuery(recentHospitalsQuery);

    res.json({
      status: "success",
      data: {
        statistics: stats[0],
        recentHospitals
      }
    });

  } catch (error) {
    console.error("Get hospital management stats error:", error);
    res.status(500).json({
      status: "error",
      error: "Gagal memuat statistik manajemen rumah sakit",
      message: error.message
    });
  }
};

module.exports = {
  getHospitalsForManagement,
  createHospitalFromManagement,
  updateHospitalFromManagement,
  deleteHospitalFromManagement,
  getHospitalByIdForManagement,
  getHospitalManagementStats
};