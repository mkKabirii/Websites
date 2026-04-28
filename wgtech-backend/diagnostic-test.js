const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config({ path: "./config.dev.env" });

const Proposal = require("./model/proposalsModel");
const User = require("./model/userModel");
const Client = require("./model/clientModel");

const API_URL = "http://localhost:8003/api";

const diagnosticTest = async () => {
  try {
    console.log("\n🔍 COMPREHENSIVE DIAGNOSTIC TEST\n");
    console.log("=" .repeat(70) + "\n");

    // 1. Connect to MongoDB
    console.log("1️⃣ STEP: Connecting to MongoDB...");
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ MongoDB connected\n");

    // 2. Check email env variables
    console.log("2️⃣ STEP: Checking Email Configuration...");
    console.log("   EMAIL_USER:", process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 5)}...` : "❌ NOT SET");
    console.log("   EMAIL_PASS:", process.env.EMAIL_PASS ? `${process.env.EMAIL_PASS.substring(0, 5)}...` : "❌ NOT SET");
    console.log("   EMAIL_SERVICE:", process.env.EMAIL_SERVICE || "❌ NOT SET\n");

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("❌ EMAIL CREDENTIALS MISSING!\n");
    } else {
      console.log("✅ Email credentials are configured\n");
    }

    // 3. Test backend connectivity
    console.log("3️⃣ STEP: Testing Backend Connectivity...");
    try {
      const healthCheck = await axios.get(`${API_URL}/v1/users`, {
        timeout: 5000,
        headers: { Authorization: "Bearer test" }
      }).catch(err => err.response);

      if (healthCheck) {
        console.log("✅ Backend is running on port 8003");
        console.log("   Response status:", healthCheck.status);
        console.log("   Response message:", healthCheck.data?.message || "N/A\n");
      }
    } catch (err) {
      console.log("❌ Backend not accessible");
      console.log("   Make sure server is running: npm start");
      console.log("   Error:", err.code || err.message);
      console.log("   Cannot continue testing without backend\n");
      await mongoose.disconnect();
      return;
    }

    // 4. Get an admin user
    console.log("4️⃣ STEP: Finding Admin User...");
    const admin = await User.findOne({ role: "admin" });

    if (!admin) {
      console.log("❌ No admin user found in database");
      console.log("   Database likely has no users\n");
      await mongoose.disconnect();
      return;
    }

    console.log("✅ Admin user found");
    console.log("   Email:", admin.email);
    console.log(`   Password: Admin@123 (assumed)\n`);

    // 5. Login to get token
    console.log("5️⃣ STEP: Attempting Admin Login...");
    let adminToken = null;
    
    try {
      const loginRes = await axios.post(`${API_URL}/v1/auth/login`, {
        email: admin.email,
        password: "Admin@123"
      }, { timeout: 5000 });

      if (loginRes.data?.data?.token) {
        adminToken = loginRes.data.data.token;
        console.log("✅ Login successful");
        console.log("   Token received (length:", adminToken.length, ")\n");
      } else {
        console.log("⚠️  Login response received but no token");
        console.log("   Response:", JSON.stringify(loginRes.data, null, 2) + "\n");
      }
    } catch (loginErr) {
      if (loginErr.response?.status === 401) {
        console.log("⚠️  Login failed - wrong password or user not found");
        console.log("   Trying with test credentials...\n");
      } else {
        console.log("❌ Login request failed:", loginErr.message + "\n");
      }
    }

    // 6. Create test proposal
    console.log("6️⃣ STEP: Creating Test Proposal...");
    const testEmail = `diag-${Date.now()}@test.com`;
    const testProposal = await Proposal.create({
      proposalId: Math.floor(100000 + Math.random() * 900000),
      fullname: "Diagnostic Test User",
      email: testEmail,
      phone: "0000000000",
      company: "Test Company",
      budget: "50000",
      messages: "Diagnostic test proposal",
      services: [],
      subServices: [],
      status: "Pending",
      isActive: true
    });

    console.log("✅ Test proposal created");
    console.log("   ID:", testProposal._id);
    console.log("   Email:", testProposal.email);
    console.log("   Status:", testProposal.status + "\n");

    // 7. Test updateProposalStatus via API
    console.log("7️⃣ STEP: Calling updateProposalStatus via HTTP API...");
    console.log(`   Endpoint: PATCH ${API_URL}/v1/proposals/${testProposal._id}/status`);
    console.log("   Body: { status: 'Accepted' }");

    if (!adminToken) {
      console.log("   ⚠️  No token available - showing what error to expect\n");
    } else {
      console.log(`   Token: ${adminToken.substring(0, 20)}...\n`);
    }

    try {
      const updateRes = await axios.patch(
        `${API_URL}/v1/proposals/${testProposal._id}/status`,
        { status: "Accepted" },
        {
          headers: adminToken ? {
            "Authorization": `Bearer ${adminToken}`,
            "Content-Type": "application/json"
          } : {
            "Content-Type": "application/json"
          },
          timeout: 15000
        }
      );

      console.log("✅ API Call Successful!\n");
      console.log("   Status:", updateRes.status);
      console.log("   Message:", updateRes.data?.message);

      if (updateRes.data?.data?.acceptanceDetails) {
        const details = updateRes.data.data.acceptanceDetails;
        console.log("\n   📊 Acceptance Details:");
        console.log("      ├─ User Created:", details.userCreated ? "✅" : "❌");
        console.log("      ├─ Client Created:", details.clientCreated ? "✅" : "❌");
        console.log("      ├─ Email Sent:", details.emailSent ? "✅" : "❌");
        if (details.errors?.length) {
          console.log("      └─ Errors:");
          details.errors.forEach(err => {
            console.log(`         • ${err.step}: ${err.error}`);
          });
        }
      }

    } catch (apiError) {
      console.log("❌ API Error\n");
      console.log("   Status:", apiError.response?.status);
      console.log("   Error:", apiError.response?.data?.message || apiError.message);

      if (apiError.response?.status === 401) {
        console.log("\n   💡 HINT: Authentication failed - check token or auth middleware");
      } else if (apiError.code === "ECONNREFUSED") {
        console.log("\n   💡 HINT: Connection refused - backend might not be running");
        console.log("            Try: npm start");
      }
    }

    // 8. Verify database changes
    console.log("\n8️⃣ STEP: Verifying Database Changes...");

    const updatedProposal = await Proposal.findById(testProposal._id);
    const createdUser = await User.findOne({ email: testEmail });
    const createdClient = createdUser ? await Client.findOne({ userId: createdUser._id }) : null;

    console.log("   Proposal Status:", updatedProposal.status);
    console.log("   User Created:", createdUser ? "✅ YES" : "❌ NO");
    console.log("   Client Created:", createdClient ? "✅ YES" : "❌ NO");

    // 9. Cleanup
    console.log("\n9️⃣ STEP: Cleaning Up...");
    await Promise.all([
      Proposal.findByIdAndDelete(testProposal._id),
      createdUser && User.findByIdAndDelete(createdUser._id),
      createdClient && Client.findByIdAndDelete(createdClient._id)
    ]);
    console.log("✅ Test data cleaned up\n");

    // Summary
    console.log("=" .repeat(70));
    console.log("\n📋 DIAGNOSTIC SUMMARY:\n");
    console.log("If User and Client were NOT created via HTTP but WERE created in step 8:");
    console.log("  → Backend logic is working but API endpoint not being called correctly");
    console.log("  → Frontend might not be sending auth token");
    console.log("  → Or middleware is blocking the request\n");

    console.log("If email says NOT sent:");
    console.log("  → Check EMAIL_USER and EMAIL_PASS in .env");
    console.log("  → Check Gmail less secure apps setting or app password\n");

    await mongoose.disconnect();
    console.log("✅ Diagnostic complete\n");

  } catch (error) {
    console.error("\n❌ Test Error:", error.message);
    await mongoose.disconnect().catch(() => {});
  }
};

diagnosticTest();
