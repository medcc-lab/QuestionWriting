const express = require("express");
const router = express.Router();
const { protect, isFaculty } = require("../middleware/auth");
const { getConfig, updateConfig } = require("../controllers/scoringController");

router.get("/config", protect, getConfig);
router.put("/config", protect, isFaculty, updateConfig);

module.exports = router;
