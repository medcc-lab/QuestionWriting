const express = require("express");
const router = express.Router();
const { protect, isFaculty } = require("../middleware/auth");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserScore,
  getLeaderboard,
  getUsersByRole,
} = require("../controllers/userController");

// Order matters! Put the base route before more specific routes
router.get("/", protect, isFaculty, getUsersByRole);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/:id/score", protect, isFaculty, updateUserScore);
router.get("/leaderboard", protect, isFaculty, getLeaderboard);

module.exports = router;
