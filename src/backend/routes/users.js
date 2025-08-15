const express = require("express");
const { validate, schemas } = require("../middleware/validation");
const { authorizeRoles } = require("../middleware/auth");
const userController = require("../controllers/userController");

const router = express.Router();

// Public/General Routes
router.get(
  "/stats/overview",
  authorizeRoles("admin"),
  userController.getUserStats
);
router.get(
  "/activity",
  authorizeRoles("admin"),
  userController.getUserActivityLog
);

// User Management Routes
router.get("/", authorizeRoles("admin"), userController.getAllUsers);
router.post(
  "/",
  authorizeRoles("admin"),
  validate(schemas.createUser),
  userController.createUser
);
router.get("/:id", userController.getUserById);
router.put(
  "/:id",
  validate(schemas.updateProfile),
  userController.updateUserProfile
);

// Admin Only Routes
router.put("/:id/role", authorizeRoles("admin"), userController.updateUserRole);
router.put(
  "/:id/status",
  authorizeRoles("admin"),
  userController.updateUserStatus
);
router.delete("/:id", authorizeRoles("admin"), userController.deleteUser);

module.exports = router;
