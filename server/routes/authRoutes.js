const express = require("express");
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  validateResetToken,
  resetPassword,
} = require("../controllers/authController");

// Helper routes (for creating a test user / verifying the new password works)
router.post("/register", register);
router.post("/login", login);

// Password reset flow
router.post("/forgot-password", forgotPassword);
router.get("/reset-password/:token", validateResetToken);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
