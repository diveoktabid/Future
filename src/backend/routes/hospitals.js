const express = require("express");
const { validate, schemas } = require("../middleware/validation");
const { authenticateToken } = require("../middleware/auth");
const hospitalController = require("../controllers/hospitalController");
const router = express.Router();

// Hospital Routes
router.get("/", hospitalController.getAllHospitals);
router.get("/stats", hospitalController.getHospitalStats);
router.get("/:id", hospitalController.getHospitalById);
router.post("/", authenticateToken, hospitalController.createHospital);
router.put("/:id", authenticateToken, hospitalController.updateHospital);
router.delete("/:id", authenticateToken, hospitalController.deleteHospital);

// Monitoring Routes
router.get("/:id/monitoring", hospitalController.getHospitalMonitoring);
router.post("/:id/monitoring", hospitalController.addHospitalMonitoring);

module.exports = router;
