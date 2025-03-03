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
    const { name, email, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user - password will be set on first login after activation
    const user = await User.create({
      name,
      email,
      role: role || "student",
      score: 0,
      active: false,
      passwordReset: true,
    });

    // If this is a faculty user, ensure ScoringConfig exists
    if (user.role === "faculty") {
      let config = await ScoringConfig.findOne();
      if (!config) {
        config = await ScoringConfig.create({
          lastUpdatedBy: user._id,
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

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.active) {
      return res.status(401).json({ message: "Account not yet activated" });
    }

    // If user needs to set password, only allow the setPassword endpoint
    if (user.passwordReset) {
      return res.status(403).json({
        message: "Password reset required",
        requiresPasswordReset: true,
        userId: user._id,
      });
    }

    if (await user.matchPassword(password)) {
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

// @desc    Set/Reset Password
// @route   POST /api/users/set-password
// @access  Public
const setPassword = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: "User ID and password required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = password;
    user.passwordReset = false;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      score: user.score,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Error setting password" });
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
        passwordReset: user.passwordReset,
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
    const users = await User.find({ role: "student", active: true })
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

    const users = await User.find({ role, active: true })
      .select("name email score")
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

// @desc    Get all inactive users awaiting approval
// @route   GET /api/users/pending
// @access  Private/Faculty
const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ active: false })
      .select("name email role createdAt")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending users" });
  }
};

// @desc    Activate user and set role
// @route   PUT /api/users/:id/activate
// @access  Private/Faculty
const activateUser = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !["student", "faculty", "admin"].includes(role)) {
      return res.status(400).json({ message: "Valid role is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.active = true;
    user.role = role;
    user.passwordReset = true;

    // Generate reset token and link
    const resetToken = await user.createResetToken();
    const resetLink = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/reset-password?token=${resetToken}&id=${user._id}`;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      resetLink,
    });
  } catch (error) {
    console.error("User activation error:", error);
    res.status(500).json({ message: "Error activating user" });
  }
};

// @desc    Create new user (by admin/faculty)
// @route   POST /api/users/create
// @access  Private/Faculty
const createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["student", "faculty", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user - active and with password reset required
    const user = await User.create({
      name,
      email,
      role,
      active: true,
      passwordReset: true,
    });

    // If this is a faculty user, ensure ScoringConfig exists
    if (user.role === "faculty" || user.role === "admin") {
      let config = await ScoringConfig.findOne();
      if (!config) {
        // Create initial config with this faculty as lastUpdatedBy
        config = await ScoringConfig.create({
          lastUpdatedBy: user._id,
          // Default values are set in the schema
        });
      }
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user" });
  }
};

// @desc    Request password reset
// @route   POST /api/users/request-reset
// @access  Public
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // For security, don't reveal if user exists
      return res.json({
        message: "If an account exists, a reset link will be sent",
      });
    }

    const resetToken = await user.createResetToken();
    const resetLink = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/reset-password?token=${resetToken}&id=${user._id}`;

    res.json({ resetLink });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ message: "Error processing request" });
  }
};

// @desc    Reset password using token
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, userId, password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Invalid reset link" });
    }

    const isValid = await user.validateResetToken(token);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    user.password = password;
    user.passwordReset = false;
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
};

// @desc    Generate password reset link
// @route   POST /api/users/:id/generate-reset-link
// @access  Private/Faculty
const generateResetLink = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = await user.createResetToken();
    const resetLink = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/reset-password?token=${resetToken}&id=${user._id}`;

    res.json({ resetLink });
  } catch (error) {
    console.error("Generate reset link error:", error);
    res.status(500).json({ message: "Error generating reset link" });
  }
};

// @desc    Get all active users
// @route   GET /api/users/active
// @access  Private/Faculty
const getActiveUsers = async (req, res) => {
  try {
    const users = await User.find({ active: true })
      .select("name email role")
      .sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching active users:", error);
    res.status(500).json({ message: "Error fetching active users" });
  }
};

module.exports = {
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
};
