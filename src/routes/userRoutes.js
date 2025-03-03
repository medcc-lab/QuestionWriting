const express = require("express");
const router = express.Router();
const { protect, isFaculty } = require("../middleware/auth");
const {
  registerUser,
  loginUser,
  setPassword,
  getUserProfile,
  updateUserScore,
  getLeaderboard,
  getUsersByRole,
  getPendingUsers,
  activateUser,
  createUser,
  requestPasswordReset,
  resetPassword,
  generateResetLink,
  getActiveUsers,
} = require("../controllers/userController");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/request-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/set-password", setPassword);

// Protected routes
router.get("/profile", protect, getUserProfile);
router.get("/", protect, isFaculty, getUsersByRole);
router.get("/pending", protect, isFaculty, getPendingUsers);
router.get("/active", protect, isFaculty, getActiveUsers);
router.get("/leaderboard", protect, isFaculty, getLeaderboard);
router.put("/:id/score", protect, isFaculty, updateUserScore);
router.put("/:id/activate", protect, isFaculty, activateUser);
router.post("/:id/generate-reset-link", protect, isFaculty, generateResetLink);
router.post("/create", protect, isFaculty, createUser);

module.exports = router;
