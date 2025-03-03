require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const ScoringConfig = require("../src/models/ScoringConfig");

// Direct MongoDB connection for the script
const connectDB = async () => {
  try {
    // Determine if running in Docker or local environment
    const isDocker = process.env.IN_DOCKER === "true";
    const host = isDocker ? "mongodb" : "localhost";

    // Use provided URI or construct a default one
    let mongoURI =
      process.env.MONGO_URI || `mongodb://${host}:27017/mcq-writing-app`;

    // Allow command-line override
    if (process.argv.length > 2) {
      mongoURI = process.argv[2];
    }

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

// Parse command-line arguments
const getAdminCredentials = () => {
  const args = process.argv.slice(2);
  const credentials = {
    email: process.env.ADMIN_EMAIL || "admin@example.com",
    name: process.env.ADMIN_NAME || "System Administrator",
    password: process.env.ADMIN_DEFAULT_PASSWORD || "adminpassword",
  };

  // Override with command-line arguments if provided
  for (const arg of args) {
    if (arg.startsWith("--email=")) {
      credentials.email = arg.split("=")[1];
    } else if (arg.startsWith("--name=")) {
      credentials.name = arg.split("=")[1];
    } else if (arg.startsWith("--password=")) {
      credentials.password = arg.split("=")[1];
    }
  }

  return credentials;
};

const createAdminAccount = async () => {
  let connected = false;
  try {
    connected = await connectDB();
    if (!connected) {
      console.error("Failed to connect to the database. Exiting.");
      process.exit(1);
    }

    // Get admin credentials
    const { email, name, password } = getAdminCredentials();

    console.log(`Creating/updating admin account with email: ${email}`);

    // Find existing admin or create new one
    const existingAdmin = await User.findOne({ role: "admin", email });

    let adminUser;

    if (existingAdmin) {
      console.log(`Admin account already exists, updating password`);
      existingAdmin.password = password; // Set plain password, let middleware hash it
      existingAdmin.passwordReset = false; // Skip password reset on next login
      adminUser = await existingAdmin.save();
    } else {
      console.log(`Creating new admin account`);
      adminUser = await User.create({
        email,
        password, // Set plain password, let middleware hash it
        name,
        role: "admin",
        active: true,
        passwordReset: false, // Skip password reset on next login
        score: 0,
      });
    }

    // Ensure scoring config exists
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

    console.log(`\n==== ADMIN ACCOUNT CREATED/UPDATED SUCCESSFULLY ====`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`ID: ${adminUser._id}`);
    console.log(`==========================================\n`);
  } catch (error) {
    console.error("Error creating/updating admin account:", error);
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
createAdminAccount();
