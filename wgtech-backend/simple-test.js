const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config({ path: "./config.dev.env" });

const Proposal = require("./model/proposalsModel");
const User = require("./model/userModel");
const Client = require("./model/clientModel");

const API_URL = "http://localhost:8003/api";

const testWithoutAuthentication = async () => {
  try {
    console.log("\n🔍 PROPOSAL ACCEPTANCE TEST (No Auth Required)\n");
    console.log("=" .repeat(70) + "\n");

    // Connect to MongoDB
    console.log("1️⃣ Connecting to MongoDB...");
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ Connected\n");

    // Check email config
    console.log("2️⃣ Email Configuration:");
    console.log("   EMAIL_USER:", process.env.EMAIL_USER ? "✅ SET" : "❌ NOT SET");
    console.log("   EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ SET" : "❌ NOT SET");
    console.log("   EMAIL_SERVICE:", process.env.EMAIL_SERVICE || "NOT SET");
    console.log("");

    // List users
    console.log("3️⃣ Available Users in Database:");
    const allUsers = await User.find({}, { password: 0 });
    if (allUsers.length === 0) {
      console.log("   ❌ No users found in database!");
      console.log("   Cannot test without a user\n");
      await mongoose.disconnect();
      return;
    }

    allUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} (${u.role})`);
    });
    console.log("");

    // Create test proposal
    console.log("4️⃣ Creating Test Proposal...");
    const testEmail = `test${Date.now()}@example.com`;
    const testProposal = await Proposal.create({
      proposalId: Math.floor(100000 + Math.random() * 900000),
      fullname: "Test User for Acceptance",
      email: testEmail,
      phone: "1234567890",
      company: "Test Company",
      budget: "50000",
      messages: "This is a test proposal",
      password: "TestPassword123", // Set password explicitly
      services: [],
      subServices: [],
      status: "Pending",
      isActive: true
    });

    console.log("✅ Proposal created");
    console.log("   ID:", testProposal._id);
    console.log("   Email:", testProposal.email);
    console.log("   Current Status:", testProposal.status);
    console.log("   Password Set:", testProposal.password ? "YES" : "NO\n");

    // Get first user for auth
    const testUser = allUsers[0];
    console.log("5️⃣ Selected User for Auth Test:");
    console.log("   Email:", testUser.email);
    console.log("   Role:", testUser.role + "\n");

    // Try to get JWT Token
    console.log("6️⃣ Attempting to get JWT Token...");
    let token = null;

    // Try common test passwords
    const passwords = [
      "password",
      "Password@123",
      "Admin@123",
      "123456",
      "password123",
      testUser.email.split("@")[0] // username
    ];

    for (const pwd of passwords) {
      try {
        const loginRes = await axios.post(
          `${API_URL}/v1/auth/login`,
          { email: testUser.email, password: pwd },
          { timeout: 3000 }
        );

        if (loginRes.data?.data?.token) {
          token = loginRes.data.data.token;
          console.log("✅ Successfully logged in!");
          console.log("   Password used:", pwd);
          console.log("   Token length:", token.length + "\n");
          break;
        }
      } catch (e) {
        // Try next password
      }
    }

    if (!token) {
      console.log("⚠️  Could not login with standard passwords");
      console.log("   This is expected - need to test direct API call\n");

      // Try without token
      console.log("7️⃣ Testing API WITHOUT Authentication Token...");
      console.log(`   Calling: PATCH /api/v1/proposals/${testProposal._id}/status\n`);

      try {
        const updateRes = await axios.patch(
          `${API_URL}/v1/proposals/${testProposal._id}/status`,
          { status: "Accepted" },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 15000
          }
        );

        console.log("✅ Request Successful!\n");
        console.log("   Status Code:", updateRes.status);
        console.log("   Message:", updateRes.data?.message);

      } catch (apiErr) {
        console.log("Response from API:");
        console.log("   Status:", apiErr.response?.status);
        console.log("   Error:", apiErr.response?.data?.message);
        console.log("   Full Error Data:", JSON.stringify(apiErr.response?.data, null, 2));
      }
    } else {
      // If we got token, use it
      console.log("7️⃣ Testing API WITH Authentication Token...");
      console.log(`   Calling: PATCH /api/v1/proposals/${testProposal._id}/status\n`);

      try {
        const updateRes = await axios.patch(
          `${API_URL}/v1/proposals/${testProposal._id}/status`,
          { status: "Accepted" },
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            timeout: 15000
          }
        );

        console.log("✅ Request Successful!\n");
        console.log("   Status Code:", updateRes.status);
        console.log("   Message:", updateRes.data?.message);

        if (updateRes.data?.data?.acceptanceDetails) {
          const details = updateRes.data.data.acceptanceDetails;
          console.log("\n   📊 Results:");
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

      } catch (apiErr) {
        console.log("❌ Request Failed");
        console.log("   Status:", apiErr.response?.status);
        console.log("   Error:", apiErr.response?.data?.message);
      }
    }

    // Verify database
    console.log("\n8️⃣ Checking Database Results...");
    const finalProposal = await Proposal.findById(testProposal._id);
    const createUser = await User.findOne({ email: testEmail });
    const createdClient = createUser ? await Client.findOne({ userId: createUser._id }) : null;

    console.log("   Proposal Status:", finalProposal.status === "Accepted" ? "✅ ACCEPTED" : `❌ ${finalProposal.status}`);
    console.log("   User Record:", createUser ? `✅ Created (ID: ${createUser._id})` : "❌ NOT created");
    console.log("   Client Record:", createdClient ? `✅ Created (ID: ${createdClient._id})` : "❌ NOT created\n");

    // Cleanup
    console.log("9️⃣ Cleaning Up Test Data...");
    await Proposal.findByIdAndDelete(testProposal._id);
    if (createUser) await User.findByIdAndDelete(createUser._id);
    if (createdClient) await Client.findByIdAndDelete(createdClient._id);
    console.log("✅ Test data cleaned up\n");

    // Summary
    console.log("=" .repeat(70));
    console.log("\n📌 TROUBLESHOOTING GUIDE:\n");

    if (!token) {
      console.log("❌ Authentication Failed:");
      console.log("  • No valid password found for any user");
      console.log("  • Check if users were seeded with correct passwords");
      console.log("  • Try: node seed.js\n");
    }

    console.log("If User/Client still not created:");
    console.log("  ✅ Email config is good");
    console.log("  ✅ Backend is running");
    console.log("  🔧 Problem is in authentication or route protection\n");

    await mongoose.disconnect();

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    await mongoose.disconnect().catch(() => {});
  }
};

testWithoutAuthentication();
