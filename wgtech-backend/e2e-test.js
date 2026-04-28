const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.dev.env" });

const Proposal = require("./model/proposalsModel");
const User = require("./model/userModel");
const Client = require("./model/clientModel");

const API_BASE = "http://localhost:8003/api";

const endToEndTest = async () => {
  try {
    console.log("\n🔄 END-TO-END PROPOSAL ACCEPTANCE TEST\n");
    console.log("=" .repeat(70) + "\n");

    // Connect to DB
    await mongoose.connect(process.env.DATABASE_URL);

    // Create a test proposal
    console.log("1️⃣ Creating Test Proposal...");
    const testEmail = `test${Date.now()}@example.com`;
    const proposal = await Proposal.create({
      proposalId: Math.floor(100000 + Math.random() * 900000),
      fullname: "End-to-End Test",
      email: testEmail,
      phone: "1234567890",
      company: "Test Co",
      budget: "100000",
      messages: "E2E test proposal",
      password: "TestPass123!",
      services: [],
      subServices: [],
      status: "Pending",
      isActive: true
    });

    console.log("✅ Proposal created");
    console.log(`   ID: ${proposal._id}`);
    console.log(`   Email: ${proposal.email}`);
    console.log(`   Initial Status: ${proposal.status}\n`);

    // Simulate frontend call
    console.log("2️⃣ Simulating Frontend API Call...");
    console.log(`   Endpoint: PATCH /api/v1/proposals/${proposal._id}/status`);
    console.log("   Payload: { status: 'Accepted' }");
    console.log("   Auth: None (frontend sends token, but testing without)\n");

    let response;
    try {
      response = await axios.patch(
        `${API_BASE}/v1/proposals/${proposal._id}/status`,
        { status: "Accepted" },
        {
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 10000,
          validateStatus: () => true // Don't throw on any status
        }
      );

      console.log("✅ API Response Received");
      console.log(`   Status Code: ${response.status}`);
      console.log(`   Success: ${response.status === 200 ? "✅" : "❌"}`);
      console.log(`   Message: ${response.data?.message || "N/A"}\n`);

      if (response.data?.data?.acceptanceDetails) {
        const details = response.data.data.acceptanceDetails;
        console.log("3️⃣ Acceptance Details:");
        console.log(`   ├─ User Created: ${details.userCreated ? "✅" : "❌"}`);
        console.log(`   ├─ Client Created: ${details.clientCreated ? "✅" : "❌"}`);
        console.log(`   ├─ Email Sent: ${details.emailSent ? "✅" : "❌"}`);
        if (details.errors?.length) {
          console.log("   └─ Errors:");
          details.errors.forEach(err => {
            console.log(`      • ${err.step}: ${err.error}`);
          });
        }
        console.log("");
      }

    } catch (apiError) {
      console.log("❌ API Call Failed");
      console.log("   Error:", apiError.message);
      console.log("   Response Status:", apiError.response?.status);
      console.log("   Response Data:", JSON.stringify(apiError.response?.data, null, 2));
      if (apiError.code) {
        console.log("   Error Code:", apiError.code);
      }
    }

    // Verify database changes
    console.log("4️⃣ Verifying Database Changes...");

    const updatedProposal = await Proposal.findById(proposal._id);
    const createdUser = await User.findOne({ email: testEmail });
    const createdClient = createdUser ? await Client.findOne({ userId: createdUser._id }) : null;

    console.log(`   Proposal Status: ${updatedProposal.status === "Accepted" ? "✅ ACCEPTED" : `❌ ${updatedProposal.status}`}`);
    console.log(`   User Created: ${createdUser ? `✅ YES (ID: ${createdUser._id})` : "❌ NO"}`);
    console.log(`   Client Created: ${createdClient ? `✅ YES (ID: ${createdClient._id})` : "❌ NO"}\n`);

    // Cleanup
    console.log("5️⃣ Cleaning Up...");
    await Proposal.findByIdAndDelete(proposal._id);
    if (createdUser) await User.findByIdAndDelete(createdUser._id);
    if (createdClient) await Client.findByIdAndDelete(createdClient._id);
    console.log("✅ Done\n");

    if (response?.status === 200 && createdUser && createdClient && updatedProposal.status === "Accepted") {
      console.log("=" .repeat(70));
      console.log("\n🎉 SUCCESS! All systems working:");
      console.log("  ✅ Proposal status changed");
      console.log("  ✅ User account created");
      console.log("  ✅ Client record created");
      console.log("  ✅ Email module ready (tested separately)");
      console.log("\n💡 If frontend acceptance isn't working:");
      console.log("  1. Check browser console for JS errors");
      console.log("  2. Verify admin panel is sending correct proposal ID");
      console.log("  3. Make sure status value is exactly 'Accepted' (case-sensitive)");
      console.log("  4. Check that admin user has valid JWT token");
      console.log("\n");
    }

    await mongoose.disconnect();

  } catch (error) {
    console.error("\n❌ Test Error:", error.message);
    await mongoose.disconnect().catch(() => {});
  }
};

endToEndTest();
