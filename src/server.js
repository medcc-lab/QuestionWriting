const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const User = require("./models/User");
const { exec } = require("child_process");
const path = require("path");

// Route imports
const userRoutes = require("./routes/userRoutes");
const questionRoutes = require("./routes/questionRoutes");
const scoringRoutes = require("./routes/scoringRoutes");
const lectureRoutes = require("./routes/lectureRoutes");

dotenv.config();

const app = express();

// Connect to database with error handling
(async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB successfully");

    // Check if admin exists and initialize if needed
    const checkAndInitAdmin = async () => {
      try {
        const adminCount = await User.countDocuments({ role: "admin" });

        if (adminCount === 0) {
          console.log("No admin account found. Initializing admin account...");

          // Get the script path that works in both development and Docker
          const scriptPath = path.join(
            __dirname,
            "..",
            "scripts",
            "init-admin.js"
          );
          console.log(
            `Running admin initialization script from: ${scriptPath}`
          );

          // Run the init-admin.js script with the full path
          exec(`node ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error executing init-admin script: ${error}`);
              return;
            }
            console.log(stdout);
            if (stderr) console.error(stderr);
          });
        } else {
          console.log("Admin account exists. Skipping initialization.");
        }
      } catch (error) {
        console.error("Error checking for admin account:", error);
      }
    };

    // Call the admin check function
    await checkAndInitAdmin();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
})();

// CORS Configuration
const corsOptions = {
  origin:
    process.env.IN_DOCKER === "true"
      ? true // Allow all origins in Docker environment
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/scoring", scoringRoutes);
app.use("/api/lectures", lectureRoutes);

// Error Handling Middleware
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
