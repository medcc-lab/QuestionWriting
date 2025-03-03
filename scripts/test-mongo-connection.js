require("dotenv").config();
const mongoose = require("mongoose");

// Function to test MongoDB connection
const testConnection = async (uri) => {
  console.log(`Testing connection to: ${uri}`);
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    console.log("✅ Connection successful!");
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
    return false;
  }
};

// Get URI from command line argument or environment variable or default
const getUri = () => {
  if (process.argv.length > 2) {
    return process.argv[2];
  }
  return process.env.MONGO_URI || "mongodb://localhost:27017/mcq-writing-app";
};

// Test common connection strings
const testAllConnections = async () => {
  const uris = [
    "mongodb://localhost:27017/mcq-writing-app",
    "mongodb://127.0.0.1:27017/mcq-writing-app",
    "mongodb://mongodb:27017/mcq-writing-app",
    getUri(),
  ];

  // Remove duplicates
  const uniqueUris = [...new Set(uris)];

  console.log("Testing MongoDB connections...");

  for (const uri of uniqueUris) {
    await testConnection(uri);
  }
};

// Run the tests
testAllConnections()
  .then(() => {
    console.log("All tests completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error during tests:", err);
    process.exit(1);
  });
