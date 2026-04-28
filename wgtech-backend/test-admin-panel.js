const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.dev.env" });

const Proposal = require("./model/proposalsModel");
const User = require("./model/userModel");
const Client = require("./model/clientModel");

const testAdminAcceptance = async () => {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("ADMIN PANEL ACCEPTANCE TEST");
    console.log("=".repeat(70) + "\n");

    await mongoose.connect(process.env.DATABASE_URL);

    // Find a pending proposal to test
    let testProposal = await Proposal.findOne({ status: "Pending" });
    
    if (!testProposal) {
      console.log("❌ No pending proposals found. Creating one...\n");
      testProposal = await Proposal.create({
        proposalId: Math.floor(100000 + Math.random() * 900000),
        fullname: "Admin Panel Test User",
        email: `admintest${Date.now()}@example.com`,
        phone: "1234567890",
        company: "Test Company",
        budget: "50000",
        messages: "Test proposal from admin panel",
        password: "TestPassword123!",
        services: [],
        subServices: [],
        status: "Pending",
        isActive: true
      });
      console.log("✅ Created test proposal\n");
    }

    console.log("📋 TEST PROPOSAL:");
    console.log(`   ID: ${testProposal._id}`);
    console.log(`   Email: ${testProposal.email}`);
    console.log(`   Status Before: ${testProposal.status}\n`);

    // Simulate admin panel making PATCH request
    console.log("🔄 Sending acceptance request from admin panel...\n");

    const response = await axios.patch(
      `http://localhost:8003/api/v1/proposals/${testProposal._id}/status`,
      { status: "Accepted" },
      {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 10000,
        validateStatus: () => true
      }
    );

    console.log("📥 API RESPONSE:");
    console.log(`   Status Code: ${response.status}`);
    console.log(`   Success: ${response.status === 200 ? "✅ YES" : "❌ NO"}`);
    console.log(`   Message: ${response.data?.message}\n`);

    if (response.data?.data?.acceptanceDetails) {
      const details = response.data.data.acceptanceDetails;
      console.log("✅ ACCEPTANCE WORKFLOW RESULTS:");
      console.log(`   ├─ Proposal Status Updated: ${details.statusUpdated ? "✅" : "❌"}`);
      console.log(`   ├─ User Created/Updated: ${details.userCreated ? "✅" : "❌"}`);
      console.log(`   ├─ Client Record Created: ${details.clientCreated ? "✅ ← THIS IS WHAT YOU NEED" : "❌"}`);
      console.log(`   └─ Email Sent: ${details.emailSent ? "✅" : "❌"}\n`);

      if (details.errors?.length > 0) {
        console.log("⚠️  ERRORS OCCURRED:");
        details.errors.forEach((err, idx) => {
          console.log(`   ${idx + 1}. ${err.step}: ${err.error}`);
        });
        console.log("");
      }
    }

    // Verify database changes
    console.log("🔍 VERIFYING DATABASE...\n");

    const updatedProposal = await Proposal.findById(testProposal._id);
    const createdUser = await User.findOne({ email: testProposal.email });
    const createdClient = createdUser ? await Client.findOne({ userId: createdUser._id }) : null;

    console.log("📊 DATABASE STATE AFTER ACCEPTANCE:");
    console.log(`   ├─ Proposal Status: ${updatedProposal.status === "Accepted" ? "✅ ACCEPTED" : `❌ ${updatedProposal.status}`}`);
    console.log(`   ├─ User Account: ${createdUser ? `✅ CREATED (ID: ${createdUser._id})` : "❌ NOT CREATED"}`);
    console.log(`   ├─ Client Record: ${createdClient ? `✅ CREATED (ID: ${createdClient._id})` : "❌ NOT CREATED"}`);

    if (createdClient) {
      console.log(`   │\n   └─ Client Details:`);
      console.log(`      ├─ Name: ${createdClient.name}`);
      console.log(`      ├─ Email: ${createdClient.email}`);
      console.log(`      ├─ Company: ${createdClient.company}`);
      console.log(`      └─ Budget: ${createdClient.budget}`);
    }

    console.log("\n" + "=".repeat(70) + "\n");

    // Final verdict
    if (response.status === 200 && createdClient) {
      console.log("🎉 SUCCESS! The workflow is working correctly!");
      console.log("   ✅ Client document IS being created when you accept a proposal");
      console.log("\nIF YOU'RE NOT SEEING IT IN YOUR ADMIN PANEL, TRY:");
      console.log("   1. Refresh the admin panel (F5 or Ctrl+R)");
      console.log("   2. Clear browser cache (Ctrl+Shift+Delete)");
      console.log("   3. Check browser console for errors (F12)");
      console.log("   4. Verify you see the success notification\n");
    } else {
      console.log("❌ Something went wrong. Check the errors above.\n");
    }

    await mongoose.disconnect();

  } catch (error) {
    console.error("\n❌ Test Error:", error.message);
    await mongoose.disconnect().catch(() => {});
  }
};

testAdminAcceptance();
