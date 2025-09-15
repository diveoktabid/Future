const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const hospitalManagementController = require("../controllers/hospitalManagementController");
const router = express.Router();

// Hospital Management Routes
router.get("/hospitals", authenticateToken, hospitalManagementController.getHospitalsForManagement);
router.get("/hospitals/stats", authenticateToken, hospitalManagementController.getHospitalManagementStats);
router.get("/hospitals/:id", authenticateToken, hospitalManagementController.getHospitalByIdForManagement);
router.post("/hospitals", authenticateToken, hospitalManagementController.createHospitalFromManagement);
router.put("/hospitals/:id", authenticateToken, hospitalManagementController.updateHospitalFromManagement);
router.delete("/hospitals/:id", authenticateToken, hospitalManagementController.deleteHospitalFromManagement);

module.exports = router;