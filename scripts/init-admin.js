require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User");
const ScoringConfig = require("../src/models/ScoringConfig");

// Direct MongoDB connection for the script
const connectDB = async () => {
  try {
    // Check if we're in Docker or local environment
    // In local environment, use localhost, in Docker use the service name
    const isDocker = process.env.IN_DOCKER === "true";
    const host = isDocker ? "mongodb" : "localhost";
    const mongoURI =
      process.env.MONGO_URI || `mongodb://${host}:27017/mcq-writing-app`;

    console.log(`Running in ${isDocker ? "Docker" : "local"} environment`);
    console.log(`Connecting to MongoDB at: ${mongoURI}`);

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB Connected");
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    return false;
  }
};

const initAdminAccount = async () => {
  let connected = false;
  try {
    connected = await connectDB();
    if (!connected) {
      console.error("Failed to connect to the database. Exiting.");
      process.exit(1);
    }

    // Check if any admin accounts already exist
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("Admin account already exists. Skipping initialization.");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Get config from environment or use defaults
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminName = process.env.ADMIN_NAME || "System Administrator";
    const adminDefaultPassword =
      process.env.ADMIN_DEFAULT_PASSWORD || "changeme";

    console.log(`Creating admin account with email: ${adminEmail}`);

    // Create admin user with password hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminDefaultPassword, salt);

    // Create admin user with explicit fields
    const adminUser = await User.create({
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: "admin",
      active: true,
      passwordReset: true,
      score: 0,
    });

    console.log(`Admin user created with ID: ${adminUser._id}`);

    // Create initial scoring config
    const scoringConfigExists = await ScoringConfig.findOne({});
    if (!scoringConfigExists) {
      await ScoringConfig.create({
        lastUpdatedBy: adminUser._id,
        newQuestionScore: 10,
        editSuggestionBaseScore: 2,
        editAcceptBonus: 3,
        editRejectPenalty: 1,
        gradingScore: 1,
      });
      console.log("Initial scoring configuration created");
    }

    console.log(`\n==== ADMIN ACCOUNT CREATED SUCCESSFULLY ====`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminDefaultPassword}`);
    console.log("You will be prompted to change this password on first login.");
    console.log(`==========================================\n`);
  } catch (error) {
    console.error("Error initializing admin account:", error);
    process.exit(1);
  } finally {
    if (connected) {
      try {
        await mongoose.disconnect();
        console.log("MongoDB disconnected");
      } catch (err) {
        console.error("Error disconnecting from MongoDB:", err);
      }
    }
    process.exit(0);
  }
};

// Run the script
initAdminAccount();
