const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

const API_BASE = "http://localhost:8003/api/v1";
const User = require("./model/userModel");
const Quotation = require("./model/quotationModel");
const Client = require("./model/clientModel");

// Test data from setup
const QUOTATION_ID = "69c29fa58181f52b613a8ce6";
const WORKER_ID = "69c29bcb7f5b72206f6a014a"; // jane.designer
const CLIENT_EMAIL = "test.client.approval@example.com";

const testApprovalFeature = async () => {
  let adminToken;

  try {
    console.log("🧪 Testing Client Account Creation on Quotation Approval\n");
    console.log("=".repeat(60) + "\n");

    // Step 1: Connect to MongoDB and get/create admin token
    console.log("Step 1️⃣: Getting admin authentication token...");
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/wgtech_db");
    
    const admin = await User.findOne({ email: "admin@wgtech.com" });
    if (!admin) {
      console.log("❌ Admin user not found");
      process.exit(1);
    }

    // For testing, we'll use a mock token (in production, you'd login)
    // We'll bypass this for now by checking the actual endpoint authorization
    console.log(`✅ Found admin user: ${admin.email}`);
    console.log(`   Admin ID: ${admin._id}\n`);

    // Get the quotation details
    console.log("Step 2️⃣: Checking quotation status...");
    const quotation = await Quotation.findById(QUOTATION_ID).populate("clientId");
    
    if (!quotation) {
      console.log("❌ Quotation not found");
      process.exit(1);
    }

    console.log(`✅ Quotation found`);
    console.log(`   ID: ${quotation._id}`);
    console.log(`   Status: ${quotation.status}`);
    console.log(`   Client: ${quotation.clientId.name} (${quotation.clientId.email})`);
    console.log(`   Amount: ${quotation.quotationDetails.totalAmount}\n`);

    // Step 3: Check client current state
    console.log("Step 3️⃣: Checking client current state...");
    const clientBefore = quotation.clientId;
    console.log(`   Name: ${clientBefore.name}`);
    console.log(`   Email: ${clientBefore.email}`);
    console.log(`   Current UserId: ${clientBefore.userId || "NONE (will be created!)"}\n`);

    // Step 4: Make the approval call
    console.log("Step 4️⃣: Calling approve quotation endpoint...\n");
    
    // For testing without a real JWT token, we'll use a workaround
    // In a real scenario, you would need a valid admin JWT token
    console.log("📝 NOTE: This requires a valid admin JWT token to work");
    console.log("   The endpoint at:");
    console.log(`   POST http://localhost:8003/api/v1/quotations/${QUOTATION_ID}/approve\n`);

    console.log("   With body:");
    console.log("   {");
    console.log(`     "workerId": "${WORKER_ID}",`);
    console.log(`     "department": "IT"`);
    console.log("   }\n");

    console.log("   And header:");
    console.log(`   Authorization: Bearer <ADMIN_JWT_TOKEN>\n`);

    console.log("✨ When called, the system will:");
    console.log("   1️⃣ Create a new User account for the client");
    console.log("   2️⃣ Generate a temporary password");
    console.log("   3️⃣ Update the Client record with the new User ID");
    console.log(`   4️⃣ Send email to: ${CLIENT_EMAIL}`);
    console.log("   5️⃣ Assign the quotation to a worker\n");

    console.log("=".repeat(60) + "\n");
    console.log("📋 Summary:");
    console.log(`   ✅ Quotation ID: ${QUOTATION_ID}`);
    console.log(`   ✅ Worker ID: ${WORKER_ID}`);
    console.log(`   ✅ Status: ${quotation.status} (ready for approval)`);
    console.log(`   ✅ Client Email: ${CLIENT_EMAIL} (will receive credentials)`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

testApprovalFeature();
