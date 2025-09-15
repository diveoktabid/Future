const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const monitoringController = require("../controllers/monitoringController");
const dataController = require("../controllers/dataController");
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

// Auto-simulation management routes
router.post("/simulation/start", monitoringController.startSimulation);
router.post("/simulation/stop", monitoringController.stopSimulation);
router.get("/simulation/status", monitoringController.getSimulationStatus);

// Export Routes (No Auth Required for PDF export)
router.get("/export/hospital/:hospital_id", dataController.getMonitoringDataForExport);

module.exports = router;
