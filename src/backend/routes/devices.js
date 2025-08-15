const express = require("express");
const { validate, schemas } = require("../middleware/validation");
const { authorizeRoles } = require("../middleware/auth");
const devicesController = require("../controllers/devicesController");

const router = express.Router();

// Device Routes
router.get("/", devicesController.getAllDevices);
router.get("/types/list", devicesController.getDeviceTypes);
router.get("/stats/overview", devicesController.getDeviceStatsOverview);
router.get("/:id", devicesController.getDeviceById);
router.get("/:id/status", devicesController.getDeviceStatus);

// Admin/Technician Routes
router.post(
  "/",
  authorizeRoles("admin", "technician"),
  validate(schemas.device),
  devicesController.createDevice
);
router.put(
  "/:id",
  authorizeRoles("admin", "technician"),
  validate(schemas.device),
  devicesController.updateDevice
);

// Admin Only Routes
router.delete("/:id", authorizeRoles("admin"), devicesController.deleteDevice);

module.exports = router;
