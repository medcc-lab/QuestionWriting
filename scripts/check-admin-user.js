require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");

const checkAdminUser = async () => {
  try {
    // Connect to database
    const uri = process.argv[2] || "mongodb://localhost:27017/mcq-writing-app";
    console.log(`Connecting to MongoDB at: ${uri}`);

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Find admin user
    const adminUser = await User.findOne({ role: "admin" }).select("-password");

    if (adminUser) {
      console.log("\n===== ADMIN USER DETAILS =====");
      console.log(`ID: ${adminUser._id}`);
      console.log(`Name: ${adminUser.name}`);
      console.log(`Email: ${adminUser.email}`);
      console.log(`Role: ${adminUser.role}`);
      console.log(`Active: ${adminUser.active}`);
      console.log(`Password Reset Required: ${adminUser.passwordReset}`);
      console.log(`Created At: ${adminUser.createdAt}`);

      // Count total users
      const userCount = await User.countDocuments();
      console.log(`\nTotal users in database: ${userCount}`);

      // Get user counts by role and status
      const activeUsers = await User.countDocuments({ active: true });
      const inactiveUsers = await User.countDocuments({ active: false });
      const facultyCount = await User.countDocuments({ role: "faculty" });
      const studentCount = await User.countDocuments({ role: "student" });
      const adminCount = await User.countDocuments({ role: "admin" });

      console.log("\n===== USER STATISTICS =====");
      console.log(`Active users: ${activeUsers}`);
      console.log(`Inactive users: ${inactiveUsers}`);
      console.log(`Faculty users: ${facultyCount}`);
      console.log(`Student users: ${studentCount}`);
      console.log(`Admin users: ${adminCount}`);

      console.log("\n===== VERIFICATION =====");
      // Check if we can find the admin user with the exact email
      const exactEmailMatch = await User.findOne({
        email: adminUser.email.toLowerCase(),
        role: "admin",
      });
      console.log(
        `Can find admin with exact email match: ${!!exactEmailMatch}`
      );

      // Try finding with login query
      const loginQuery = await User.findOne({
        email: adminUser.email.toLowerCase(),
      });
      console.log(`Can find admin with login query: ${!!loginQuery}`);
      if (loginQuery) {
        console.log(
          `Login query found user with role: ${loginQuery.role}, active: ${loginQuery.active}`
        );
      }
    } else {
      console.log("No admin user found in the database!");

      // List all users briefly
      console.log("\nListing all users:");
      const allUsers = await User.find().select("name email role active");
      allUsers.forEach((user) => {
        console.log(
          `- ${user.name} (${user.email}), role: ${user.role}, active: ${user.active}`
        );
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

checkAdminUser().catch(console.error);
