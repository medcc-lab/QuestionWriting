const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Question = require("../models/Question");

const protect = async (req, res, next) => {
  try {
    if (!req.headers.authorization?.startsWith("Bearer")) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user is active
    if (!req.user.active) {
      return res.status(401).json({ message: "Account is not active" });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized" });
  }
};

const isFaculty = (req, res, next) => {
  if (req.user && (req.user.role === "faculty" || req.user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Faculty or admin only." });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin only." });
  }
};

const isOwnerOrFaculty = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (
      req.user.role === "faculty" ||
      req.user.role === "admin" ||
      question.owner.toString() === req.user._id.toString()
    ) {
      req.question = question;
      next();
    } else {
      res
        .status(403)
        .json({ message: "Access denied. Owner, faculty, or admin only." });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { protect, isFaculty, isAdmin, isOwnerOrFaculty };
