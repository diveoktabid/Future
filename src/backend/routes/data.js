const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const dataController = require("../controllers/dataController");

const router = express.Router();

// Data Routes
router.get("/", dataController.getSensorData);
router.post("/", dataController.addSensorData);
router.get("/device/:deviceId/latest", dataController.getLatestDataByDevice);
router.get(
  "/device/:deviceId/aggregate",
  dataController.getAggregatedDataByDevice
);
router.get("/stats/overview", dataController.getDataStatsOverview);

// Admin Only Routes
router.delete(
  "/device/:deviceId",
  authenticateToken,
  dataController.deleteDeviceData
);
router.delete("/cleanup", authenticateToken, dataController.cleanupOldData);

module.exports = router;
