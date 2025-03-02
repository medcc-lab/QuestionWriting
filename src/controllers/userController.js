const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ScoringConfig = require("../models/ScoringConfig");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "student",
      score: 0,
    });

    // If this is a faculty user, ensure ScoringConfig exists
    if (user.role === "faculty") {
      let config = await ScoringConfig.findOne();
      if (!config) {
        // Create initial config with this faculty as lastUpdatedBy
        config = await ScoringConfig.create({
          lastUpdatedBy: user._id,
          // Default values are set in the schema
        });
      }
    }

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        score: user.score,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Error registering user" });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        score: user.score,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        score: user.score,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update user score
// @route   PUT /api/users/:id/score
// @access  Private/Faculty
const updateUserScore = async (req, res) => {
  try {
    const { score } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.score = score;
    await user.save();

    res.json({ message: "Score updated successfully", score: user.score });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all users (for faculty leaderboard)
// @route   GET /api/users/leaderboard
// @access  Private/Faculty
const getLeaderboard = async (req, res) => {
  try {
    // Only get students, sorted by score
    const users = await User.find({ role: "student" })
      .select("name score")
      .sort({ score: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
};

// @desc    Get users by role
// @route   GET /api/users
// @access  Private/Faculty
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.query;
    if (!role) {
      return res.status(400).json({ message: "Role parameter is required" });
    }

    const users = await User.find({ role })
      .select("name email score")
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserScore,
  getLeaderboard,
  getUsersByRole,
};
