const express = require("express");
const { validate, schemas } = require("../middleware/validation");
const { authenticateToken } = require("../middleware/auth");
const authController = require("../controllers/authController");

const router = express.Router();

// Auth Routes
router.post("/register", validate(schemas.register), authController.register);
router.post("/login", validate(schemas.login), authController.login);
router.post(
  "/forgot-password",
  validate(schemas.forgotPassword),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  validate(schemas.resetPassword),
  authController.resetPassword
);
router.post(
  "/change-password",
  authenticateToken,
  validate(schemas.changePassword),
  authController.changePassword
);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authenticateToken, authController.logout);
router.get("/me", authenticateToken, authController.getProfile);
router.post(
  "/send-reset-code",
  validate(schemas.forgotPassword),
  authController.GenerateResetPasswordCode
);
router.post("/verify-reset", authController.VerifyResetCode);
router.post("/reset-password-code", authController.ResetPasswordCode);

module.exports = router;
