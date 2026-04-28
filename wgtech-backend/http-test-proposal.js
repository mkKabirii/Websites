const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.dev.env" });

const API_BASE = "http://localhost:8003/api";
const Proposal = require("./model/proposalsModel");
const User = require("./model/userModel");

const httpTestProposalAcceptance = async () => {
  try {
    console.log("\n🧪 HTTP API PROPOSAL ACCEPTANCE TEST\n");
    console.log("=" .repeat(70) + "\n");

    // Connect to MongoDB
    console.log("1️⃣  Connecting to MongoDB...");
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ Connected\n");

    // Create a test proposal
    console.log("2️⃣  Creating test proposal...");
    const testEmail = `test${Date.now()}@example.com`;
    const testProposal = await Proposal.create({
      proposalId: Math.floor(100000 + Math.random() * 900000),
      fullname: "HTTP Test User",
      email: testEmail,
      phone: "1234567890",
      company: "HTTP Test Co",
      budget: "75000",
      messages: "Test via HTTP",
      services: [],
      subServices: [],
      status: "Pending",
      isActive: true
    });

    console.log("✅ Proposal created");
    console.log(`   ID: ${testProposal._id}`);
    console.log(`   Email: ${testProposal.email}\n`);

    // Get admin user and token
    console.log("3️⃣  Getting admin credentials...");
    const admin = await User.findOne({ role: "admin" });
    
    if (!admin) {
      console.log("❌ Admin user not found");
      await mongoose.disconnect();
      return;
    }

    console.log("✅ Admin found:", admin.email);

    // Login to get token
    console.log("\n4️⃣  Attempting admin login...");
    try {
      const loginRes = await axios.post(`${API_BASE}/v1/auth/login`, {
        email: admin.email,
        password: "Admin@123"
      });

      const token = loginRes.data?.data?.token;
      if (!token) {
        console.log("⚠️  No token returned, using direct update (will fail with 401 but we'll see the logs)");
      } else {
        console.log("✅ Login successful, token obtained\n");
      }

      // Call the proposal status endpoint
      console.log("5️⃣  Calling PATCH /api/v1/proposals/{id}/status with status='Accepted'...\n");
      
      const headers = token ? {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      } : {
        "Content-Type": "application/json"
      };

      const updateRes = await axios.patch(
        `${API_BASE}/v1/proposals/${testProposal._id}/status`,
        { status: "Accepted" },
        { headers, timeout: 10000 }
      ).catch(err => {
        console.log("⚠️  API Error (expected if no token):");
        console.log("   Status:", err.response?.status);
        console.log("   Message:", err.response?.data?.message);
        return null;
      });

      if (updateRes) {
        console.log("✅ API Call Successful!");
        console.log("   Status Code:", updateRes.status);
        console.log("   Response:", JSON.stringify(updateRes.data, null, 2));
      }

    } catch (authError) {
      console.log("⚠️  Auth error - testing with direct DB update instead\n");
      
      // Direct update for testing
      const updated = await Proposal.findByIdAndUpdate(
        testProposal._id,
        { status: "Accepted" },
        { new: true }
      );
      console.log("✅ Direct DB update done, status:", updated.status);
    }

    // Verify results
    console.log("\n" + "=" .repeat(70));
    console.log("6️⃣  VERIFICATION:\n");

    const finalProposal = await Proposal.findById(testProposal._id);
    const finalUser = await User.findOne({ email: testEmail });

    console.log("Proposal Status:", finalProposal.status);
    console.log("User Created:", finalUser ? `✅ ${finalUser._id}` : "❌");

    // Cleanup
    await Proposal.findByIdAndDelete(testProposal._id);
    if (finalUser) await User.findByIdAndDelete(finalUser._id);

    console.log("\n✅ Test complete!\n");
    await mongoose.disconnect();

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    await mongoose.disconnect().catch(() => {});
  }
};

httpTestProposalAcceptance();
