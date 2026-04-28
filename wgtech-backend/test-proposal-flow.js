const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.dev.env" });

const API_BASE = "http://localhost:8003/api/v1";
const Proposal = require("./model/proposalsModel");
const User = require("./model/userModel");
const Client = require("./model/clientModel");

let adminToken = null;

const testProposalAcceptanceFlow = async () => {
  try {
    console.log("\n🧪 COMPREHENSIVE PROPOSAL ACCEPTANCE TEST\n");
    console.log("=" .repeat(70) + "\n");

    // Connect to MongoDB
    console.log("1️⃣  Connecting to MongoDB...");
    await mongoose.connect(process.env.DATABASE_URL || "mongodb://localhost:27017/wgtech_db");
    console.log("✅ Connected to MongoDB\n");

    // Get admin token
    console.log("2️⃣  Getting admin authentication token...");
    try {
      // Try to login with default admin credentials
      const loginRes = await axios.post(
        `${API_BASE.replace('/v1', '')}/v1/auth/login`,
        {
          email: "admin@wgtech.com",
          password: "Admin@123"
        },
        { timeout: 5000 }
      );

      if (loginRes.status === 200 && loginRes.data?.data?.token) {
        adminToken = loginRes.data.data.token;
        console.log("✅ Admin token obtained\n");
      } else {
        console.log("⚠️  Status:", loginRes.status);
        throw new Error("Invalid login response");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("⚠️  Admin login failed - checking if admin exists...\n");
        const adminUser = await User.findOne({ role: "admin" });
        if (!adminUser) {
          console.log("❌ No admin user found in database");
          throw new Error("Admin not found");
        }
        console.log("✅ Admin user exists in database");
        console.log("⚠️  Skipping token-based testing\n");
        // Don't return - continue testing with direct DB manipulation
      } else {
        throw error;
      }
    }

    // Find a pending proposal
    console.log("3️⃣  Finding a pending proposal...");
    const pendingProposal = await Proposal.findOne({ status: "Pending" }).limit(1);

    if (!pendingProposal) {
      console.log("⚠️  No pending proposal found\n");
      
      // Create a test proposal
      console.log("   Creating a test proposal...");
      const testProposal = await Proposal.create({
        proposalId: Math.floor(100000 + Math.random() * 900000),
        fullname: "Test Proposal User",
        email: `testproposal${Date.now()}@test.com`,
        phone: "1234567890",
        company: "Test Company",
        budget: "50000",
        messages: "Test proposal message",
        services: [],
        subServices: [],
        status: "Pending",
        isActive: true
      });

      console.log("✅ Test proposal created\n");
      console.log("   Proposal ID:", testProposal._id);
      console.log("   Email:", testProposal.email);
      console.log("   Status:", testProposal.status);
      console.log("   Budget:", testProposal.budget + "\n");

      // Now test acceptance of this proposal
      console.log("4️⃣  Testing PROPOSAL ACCEPTANCE (changing status to 'Accepted')...\n");

      try {
        const updateRes = await axios.patch(
          `${API_BASE}/proposals/${testProposal._id}/status`,
          { status: "Accepted" },
          {
            headers: {
              "Authorization": `Bearer ${adminToken}`,
              "Content-Type": "application/json"
            },
            timeout: 10000
          }
        );

        console.log("✅ Status update API call successful\n");
        console.log("   Response Status:", updateRes.status);
        console.log("   Message:", updateRes.data?.message);

        if (updateRes.data?.data?.acceptanceDetails) {
          const details = updateRes.data.data.acceptanceDetails;
          console.log("\n   📊 Acceptance Details:");
          console.log("      ├─ User Created:", details.userCreated ? "✅ YES" : "❌ NO");
          console.log("      ├─ Client Created:", details.clientCreated ? "✅ YES" : "❌ NO");
          console.log("      ├─ Email Sent:", details.emailSent ? "✅ YES" : "❌ NO");
          if (details.errors && details.errors.length > 0) {
            console.log("      └─ Errors:");
            details.errors.forEach((err, i) => {
              console.log(`         ${i + 1}. ${err.step}: ${err.error}`);
            });
          }
        }

        // Verify database changes
        console.log("\n5️⃣  Verifying database changes...\n");

        // Check proposal
        const updatedProposal = await Proposal.findById(testProposal._id);
        console.log("   Proposal Status:", updatedProposal.status);

        // Check user
        const newUser = await User.findOne({ email: testProposal.email });
        if (newUser) {
          console.log("   ✅ User Created:");
          console.log("      - ID:", newUser._id);
          console.log("      - Email:", newUser.email);
          console.log("      - Role:", newUser.role);
          console.log("      - Active:", newUser.isActive);
        } else {
          console.log("   ❌ User NOT created");
        }

        // Check client
        if (newUser) {
          const newClient = await Client.findOne({ userId: newUser._id });
          if (newClient) {
            console.log("   ✅ Client Created:");
            console.log("      - ID:", newClient._id);
            console.log("      - Name:", newClient.name);
            console.log("      - Email:", newClient.email);
            console.log("      - Project Name:", newClient.projectName);
            console.log("      - Budget:",newClient.budget);
          } else {
            console.log("   ❌ Client NOT created");
          }
        }

      } catch (updateError) {
        console.error("❌ Error updating proposal status:");
        console.error("   Status:", updateError.response?.status);
        console.error("   Error:", updateError.response?.data?.message || updateError.message);
      }

    } else {
      console.log("✅ Pending proposal found:");
      console.log("   ID:", pendingProposal._id);
      console.log("   Name:", pendingProposal.fullname);
      console.log("   Email:", pendingProposal.email + "\n");

      console.log("4️⃣  Testing PROPOSAL ACCEPTANCE...\n");
      
      try {
        const updateRes = await axios.patch(
          `${API_BASE}/proposals/${pendingProposal._id}/status`,
          { status: "Accepted" },
          {
            headers: {
              "Authorization": `Bearer ${adminToken}`,
              "Content-Type": "application/json"
            },
            timeout: 10000
          }
        );

        console.log("✅ Status update successful\n");
        console.log("   Response Status:", updateRes.status);

        if (updateRes.data?.data?.acceptanceDetails) {
          const details = updateRes.data.data.acceptanceDetails;
          console.log("   📊 Results:");
          console.log("      ├─ User Created:", details.userCreated ? "✅" : "❌");
          console.log("      ├─ Client Created:", details.clientCreated ? "✅" : "❌");
          console.log("      ├─ Email Sent:", details.emailSent ? "✅" : "❌");
          if (details.errors?.length) {
            console.log("      └─ Errors:", details.errors);
          }
        }
      } catch (updateError) {
        console.error("❌ Error:", updateError.response?.data?.message || updateError.message);
      }
    }

    console.log("\n" + "=" .repeat(70));
    await mongoose.disconnect();
    console.log("\n✅ Test complete. Check backend console logs for detailed execution flow.\n");

  } catch (error) {
    console.error("\n❌ Test Error:", error.message);
    await mongoose.disconnect().catch(() => {});
  }
};

testProposalAcceptanceFlow();
