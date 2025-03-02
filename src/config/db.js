const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connectionString = process.env.MONGO_URI;
    const options = {
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
