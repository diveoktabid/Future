const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const monitoringController = require("../controllers/MonitoringController");
const router = express.Router();

// Public Routes (No Auth Required - for IoT devices)
router.post("/submit", monitoringController.submitMonitoringData);
router.get("/latest", monitoringController.getLatestMonitoringData);
router.get("/hospitals/status", monitoringController.getHospitalStatusSummary);

// Protected Routes (Optional Auth)
router.get("/history", monitoringController.getMonitoringHistory);
router.get("/statistics", monitoringController.getMonitoringStatistics);

// Development/Testing Routes
router.post("/simulate", monitoringController.simulateMonitoringData);

module.exports = router;
