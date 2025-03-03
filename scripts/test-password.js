require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User");

const testPassword = async () => {
  try {
    // Connect to database
    const uri = process.argv[2] || "mongodb://localhost:27017/mcq-writing-app";
    console.log(`Connecting to MongoDB at: ${uri}`);

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Get email and password from command line or use defaults
    const email = process.argv[3] || "admin@example.com";
    const password = process.argv[4] || "adminpassword";

    console.log(`Testing login for: ${email}`);

    // Find the user but include the password
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User with email ${email} not found!`);
      return;
    }

    console.log("\n===== USER DETAILS =====");
    console.log(`Name: ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log(`Active: ${user.active}`);
    console.log(`Password Reset Required: ${user.passwordReset}`);
    console.log(`Has password field: ${!!user.password}`);

    // Test direct password comparison
    if (user.password) {
      console.log("\n===== PASSWORD VERIFICATION =====");
      const isMatch = await bcrypt.compare(password, user.password);
      console.log(`Password match using bcrypt.compare: ${isMatch}`);

      const matchMethod = user.matchPassword
        ? await user.matchPassword(password)
        : "matchPassword method not available";
      console.log(`Password match using user.matchPassword: ${matchMethod}`);

      if (!isMatch) {
        console.log(
          "\n=> The password is incorrect. Try using force-create-admin.js to reset it."
        );
      }
    } else {
      console.log("\n=> User has no password set!");
    }

    // Additional verification of the user document
    console.log("\n===== MODEL VERIFICATION =====");
    console.log("User model has methods:", Object.keys(User.prototype));
    console.log(
      "User instance has methods:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(user))
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
};

testPassword().catch(console.error);
