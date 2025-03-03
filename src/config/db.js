const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Determine if running in Docker or local environment
    const isDocker = process.env.IN_DOCKER === "true";
    const host = isDocker ? "mongodb" : "localhost";

    // Use provided URI or construct a default one
    const connectionString =
      process.env.MONGO_URI || `mongodb://${host}:27017/mcq-writing-app`;

    console.log(`Connecting to MongoDB at: ${connectionString}`);

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      directConnection: true,
      serverSelectionTimeoutMS: 5000, // Wait 5 seconds before timing out
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    await mongoose.connect(connectionString, options);
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    console.error("Full error:", err);
    throw err; // Let the main application handle the error
  }
};

module.exports = connectDB;
