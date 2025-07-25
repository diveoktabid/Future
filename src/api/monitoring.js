const express = require("express");
const { executeQuery } = require("../config/database");

const router = express.Router();

// API Logging function untuk debugging
const logAPIActivity = async (hospitalId, action, requestData, responseData, status, req) => {
  try {
    await executeQuery(
      'INSERT INTO api_logs (hospital_id, action, request_data, response_data, status, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        hospitalId || null,
        action,
        JSON.stringify(requestData),
        JSON.stringify(responseData),
        status,
        req.ip,
        req.get('User-Agent') || 'Unknown'
      ]
    );
  } catch (error) {
    console.error('Failed to log API activity:', error.message);
  }
};

// ===========================================
// REAL-TIME IoT ENDPOINTS (TANPA AUTH)
// ===========================================

// @route   POST /api/monitoring/submit
// @desc    Submit monitoring data from IoT devices (SESUAI PERMINTAAN DOSEN)
// @access  Public (untuk IoT devices)
router.post("/submit", async (req, res) => {
  try {
    const { 
      hospital_id, 
      temperature, 
      humidity, 
      gas_status, 
      status_lampu1, 
      status_viewer, 
      status_writing_table, 
      status_lampu2,
      status_lampu_op
    } = req.body;
    
    // Validation
    if (!hospital_id) {
      await logAPIActivity(hospital_id, 'submit_monitoring', req.body, null, 'failed', req);
      return res.status(400).json({
        status: "error",
        message: "hospital_id is required",
      });
    }
    
    // Validate hospital exists dan active
    const hospitalQuery = `
      SELECT hospital_id, hospital_name, is_active 
      FROM hospital 
      WHERE hospital_id = ?
    `;
    const hospitals = await executeQuery(hospitalQuery, [hospital_id]);
    
    if (hospitals.length === 0) {
      await logAPIActivity(hospital_id, 'submit_monitoring', req.body, null, 'hospital_not_found', req);
      return res.status(404).json({
        status: "error",
        message: "Hospital not found",
      });
    }
    
    if (!hospitals[0].is_active) {
      await logAPIActivity(hospital_id, 'submit_monitoring', req.body, null, 'hospital_inactive', req);
      return res.status(400).json({
        status: "error",
        message: "Hospital is not active",
      });
    }
    
    // Use stored procedure untuk insert/update dengan logic "latest data only"
    const result = await executeQuery(
      'CALL UpsertMonitoringData(?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        hospital_id,
        temperature || null,
        humidity || null,
        gas_status || 'Low',
        status_lampu1 || 'OFF',
        status_viewer || 'OFF',
        status_writing_table || 'OFF',
        status_lampu2 || 'OFF',
        status_lampu_op || 'OFF'
      ]
    );
    
    // Get updated data untuk response
    const latestDataQuery = `
      SELECT * FROM latest_monitoring_data 
      WHERE hospital_id = ?
    `;
    const latestData = await executeQuery(latestDataQuery, [hospital_id]);
    
    const responseData = latestData[0] || null;
    
    // Log successful API call
    await logAPIActivity(hospital_id, 'submit_monitoring', req.body, responseData, 'success', req);
    
    // Emit real-time update via WebSocket (REAL-TIME FEATURE)
    const io = req.app.get('io');
    if (io) {
      io.emit('monitoring_update', {
        hospital_id: hospital_id,
        hospital_name: hospitals[0].hospital_name,
        data: responseData,
        timestamp: new Date().toISOString(),
        action: result[0]?.[0]?.action || 'updated'
      });
      
      console.log(`📡 Real-time update broadcasted for ${hospitals[0].hospital_name} (ID: ${hospital_id})`);
    }
    
    console.log(`✅ [${new Date().toLocaleTimeString()}] Data received from ${hospitals[0].hospital_name}: Temp=${temperature}°C, Humidity=${humidity}%`);
    
    res.json({
      status: "success",
      message: `Monitoring data updated for ${hospitals[0].hospital_name}`,
      data: responseData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Submit monitoring data error:", error);
    await logAPIActivity(req.body.hospital_id, 'submit_monitoring', req.body, null, 'error', req);
    
    res.status(500).json({
      status: "error",
      message: "Internal server error while submitting monitoring data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/monitoring/latest
// @desc    Get latest monitoring data for all hospitals (SESUAI PERMINTAAN DOSEN)
// @access  Public (untuk dashboard real-time)
router.get("/latest", async (req, res) => {
  try {
    const latestData = await executeQuery(`
      SELECT * FROM latest_monitoring_data 
      ORDER BY hospital_id ASC
    `);
    
    await logAPIActivity(null, 'get_latest_all', null, { count: latestData.length }, 'success', req);
    
    res.json({
      status: "success",
      data: latestData,
      timestamp: new Date().toISOString(),
      message: "Latest monitoring data retrieved successfully"
    });
    
  } catch (error) {
    console.error("Get latest monitoring data error:", error);
    await logAPIActivity(null, 'get_latest_all', null, null, 'error', req);
    
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching latest monitoring data",
    });
  }
});

// @route   GET /api/monitoring/latest/:hospitalId
// @desc    Get latest monitoring data for specific hospital
// @access  Public
router.get("/latest/:hospitalId", async (req, res) => {
  try {
    const hospitalId = req.params.hospitalId;
    
    const latestData = await executeQuery(`
      SELECT * FROM latest_monitoring_data 
      WHERE hospital_id = ?
    `, [hospitalId]);
    
    if (latestData.length === 0) {
      await logAPIActivity(hospitalId, 'get_latest_single', null, null, 'not_found', req);
      return res.status(404).json({
        status: "error",
        message: "No monitoring data found for this hospital",
      });
    }
    
    await logAPIActivity(hospitalId, 'get_latest_single', null, latestData[0], 'success', req);
    
    res.json({
      status: "success",
      data: latestData[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Get monitoring data error:", error);
    await logAPIActivity(req.params.hospitalId, 'get_latest_single', null, null, 'error', req);
    
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching monitoring data",
    });
  }
});

// @route   GET /api/monitoring/hospitals/status
// @desc    Get connection status of all hospitals (UNTUK DEBUGGING)
// @access  Public
router.get("/hospitals/status", async (req, res) => {
  try {
    const statusData = await executeQuery(`
      SELECT 
        hospital_id,
        hospital_name,
        iot_status,
        is_active,
        connection_status,
        last_data_received,
        data_count,
        CASE 
          WHEN last_data_received IS NULL THEN 'Never Connected'
          WHEN last_data_received < DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 'Offline'
          WHEN last_data_received < DATE_SUB(NOW(), INTERVAL 1 MINUTE) THEN 'Warning'
          ELSE 'Online'
        END as real_time_status,
        CASE 
          WHEN last_data_received IS NULL THEN 0
          ELSE TIMESTAMPDIFF(SECOND, last_data_received, NOW())
        END as seconds_since_last_data,
        created_at,
        updated_at
      FROM hospital 
      ORDER BY hospital_id ASC
    `);
    
    await logAPIActivity(null, 'get_hospital_status', null, { count: statusData.length }, 'success', req);
    
    res.json({
      status: "success",
      data: statusData,
      timestamp: new Date().toISOString(),
      summary: {
        total_hospitals: statusData.length,
        connected: statusData.filter(h => h.connection_status === 'Connected').length,
        disconnected: statusData.filter(h => h.connection_status === 'Disconnected').length,
        unknown: statusData.filter(h => h.connection_status === 'Unknown').length
      }
    });
    
  } catch (error) {
    console.error("Get hospital status error:", error);
    await logAPIActivity(null, 'get_hospital_status', null, null, 'error', req);
    
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching hospital status",
    });
  }
});

// ===========================================
// TESTING & DEBUGGING ENDPOINTS
// ===========================================

// @route   GET /api/monitoring/test
// @desc    Test endpoint untuk verifikasi API
// @access  Public
router.get("/test", async (req, res) => {
  try {
    // Test database connection
    const testQuery = await executeQuery('SELECT 1 as test');
    
    // Get basic stats
    const hospitalCount = await executeQuery('SELECT COUNT(*) as count FROM hospital');
    const monitoringCount = await executeQuery('SELECT COUNT(*) as count FROM monitoring_data');
    
    const systemInfo = {
      message: 'Monitoring API is working!',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      statistics: {
        hospitals: hospitalCount[0].count,
        monitoring_records: monitoringCount[0].count
      }
    };
    
    await logAPIActivity(null, 'api_test', null, systemInfo, 'success', req);
    
    res.json({
      status: "success",
      data: systemInfo
    });
    
  } catch (error) {
    console.error("Test API error:", error);
    await logAPIActivity(null, 'api_test', null, null, 'error', req);
    
    res.status(500).json({
      status: "error",
      message: "API test failed",
    });
  }
});

// @route   GET /api/monitoring/logs
// @desc    Get recent API logs untuk debugging
// @access  Public
router.get("/logs", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const hospitalId = req.query.hospital_id;
    
    let query = 'SELECT * FROM api_logs';
    let params = [];
    
    if (hospitalId) {
      query += ' WHERE hospital_id = ?';
      params.push(hospitalId);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);
    
    const logs = await executeQuery(query, params);
    
    res.json({
      status: "success",
      data: logs,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Get API logs error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching API logs",
    });
  }
});

// @route   POST /api/monitoring/simulate/:hospitalId
// @desc    Simulate random data untuk testing (UNTUK DEVELOPMENT)
// @access  Public
router.post("/simulate/:hospitalId", async (req, res) => {
  try {
    const hospitalId = req.params.hospitalId;
    
    // Generate random realistic data
    const simulatedData = {
      hospital_id: parseInt(hospitalId),
      temperature: (Math.random() * 8 + 22).toFixed(1), // 22-30°C
      humidity: (Math.random() * 30 + 50).toFixed(1),    // 50-80%
      gas_status: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      status_lampu1: Math.random() > 0.3 ? 'ON' : 'OFF',
      status_viewer: Math.random() > 0.3 ? 'ON' : 'OFF',
      status_writing_table: Math.random() > 0.3 ? 'ON' : 'OFF',
      status_lampu2: Math.random() > 0.3 ? 'ON' : 'OFF',
      status_lampu_op: Math.random() > 0.3 ? 'ON' : 'OFF'
    };
    
    // Submit simulated data menggunakan endpoint yang sama
    req.body = simulatedData;
    
    // Call submit endpoint recursively
    const simulateReq = {
      ...req,
      body: simulatedData,
      path: '/api/monitoring/submit'
    };
    
    // Forward to submit endpoint
    return router.handle(simulateReq, res);
    
  } catch (error) {
    console.error("Simulate data error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while simulating data",
    });
  }
});

module.exports = router;