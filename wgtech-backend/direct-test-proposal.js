const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.dev.env" });

const Proposal = require("./model/proposalsModel");
const User = require("./model/userModel");
const Client = require("./model/clientModel");

const directTestProposalAcceptance = async () => {
  try {
    console.log("\n🧪 DIRECT PROPOSAL ACCEPTANCE TEST (No HTTP)\n");
    console.log("=" .repeat(70) + "\n");

    // Connect to MongoDB
    console.log("1️⃣  Connecting to MongoDB...");
    await mongoose.connect(process.env.DATABASE_URL || "mongodb://localhost:27017/wgtech_db");
    console.log("✅ Connected to MongoDB\n");

    // Create a test proposal
    console.log("2️⃣  Creating test proposal...");
    const testEmail = `test${Date.now()}@example.com`;
    const testProposal = await Proposal.create({
      proposalId: Math.floor(100000 + Math.random() * 900000),
      fullname: "Test User",
      email: testEmail,
      phone: "1234567890",
      company: "Test Company",
      budget: "50000",
      messages: "This is a test proposal",
      services: [],
      subServices: [],
      status: "Pending",
      isActive: true
    });

    console.log("✅ Test proposal created");
    console.log(`   ID: ${testProposal._id}`);
    console.log(`   Email: ${testProposal.email}`);
    console.log(`   Status: ${testProposal.status}\n`);

    // Directly call the proposal update logic (simulating what updateProposalStatus does)
    console.log("3️⃣  Simulating proposal acceptance (changing status to 'Accepted')...\n");

    const statusBeforeUpdate = testProposal.status;
    testProposal.status = "Accepted";
    const updatedProposal = await testProposal.save();

    console.log("📋 PROPOSAL STATUS UPDATE LOG:");
    console.log("=" .repeat(70));
    console.log("Previous Status:", statusBeforeUpdate);
    console.log("New Status:", updatedProposal.status);
    console.log("Status Comparison - 'Accepted' === 'Accepted'?", updatedProposal.status === "Accepted");

    if (updatedProposal.status === "Accepted") {
      console.log("\n✅ ACCEPTANCE CONDITION MATCHED\n");

      // Generate password
      const generateTempPassword = () => {
        const length = 12;
        const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        let password = "";
        for (let i = 0; i < length; i++) {
          password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
      };

      const clientPassword = updatedProposal.password || generateTempPassword();
      console.log("🔐 Using password:", clientPassword);

      // Create/Update User
      console.log("\n🔄 Creating/Checking User account...");
      let clientUser = await User.findOne({ email: testEmail });

      if (!clientUser) {
        console.log("   Creating new user...");
        clientUser = await User.create({
          email: testEmail,
          password: clientPassword,
          username: testEmail.split("@")[0],
          fullname: updatedProposal.fullname,
          role: "client",
          isActive: true,
        });
        console.log("✅ User CREATED");
        console.log(`   ID: ${clientUser._id}`);
      } else {
        console.log("ℹ️  User already exists");
        clientUser.password = clientPassword;
        await clientUser.save();
        console.log("✅ User password updated");
      }

      // Create/Update Client
      console.log("\n🔄 Creating/Checking Client record...");
      let client = await Client.findOne({ userId: clientUser._id });

      if (!client) {
        console.log("   Creating new client record...");
        client = await Client.create({
          userId: clientUser._id,
          name: updatedProposal.fullname,
          email: testEmail,
          username: testEmail.split("@")[0],
          password: clientPassword,
          phone: updatedProposal.phone || null,
          company: updatedProposal.company || "Not specified",
          address: "To be updated",
          projectName: updatedProposal.messages || "Proposal Project",
          status: "Not Started",
          budget: updatedProposal.budget ? parseInt(updatedProposal.budget) : 0,
          description: updatedProposal.messages || "Project from proposal",
        });
        console.log("✅ Client CREATED");
        console.log(`   ID: ${client._id}`);
        console.log(`   Name: ${client.name}`);
        console.log(`   Email: ${client.email}`);
        console.log(`   Project: ${client.projectName}`);
        console.log(`   Budget: ${client.budget}`);
      } else {
        console.log("ℹ️  Client record already exists");
        if (!client.password) {
          client.password = clientPassword;
          await client.save();
          console.log("✅ Client password updated");
        }
      }

      console.log("\n✅ ACCEPTANCE WORKFLOW COMPLETE");
    } else {
      console.log("\n❌ Status was not 'Accepted'");
    }

    // Verify in database
    console.log("\n" + "=" .repeat(70));
    console.log("4️⃣  VERIFYING DATABASE CHANGES:\n");

    const finalProposal = await Proposal.findById(testProposal._id);
    console.log("Proposal:");
    console.log(`  ├─ Status: ${finalProposal.status}`);
    console.log(`  ├─ ID: ${finalProposal._id}`);
    console.log(`  └─ Email: ${finalProposal.email}`);

    const finalUser = await User.findOne({ email: testEmail });
    console.log("\nUser:");
    console.log(`  ├─ Created: ${finalUser ? "✅ YES" : "❌ NO"}`);
    if (finalUser) {
      console.log(`  ├─ ID: ${finalUser._id}`);
      console.log(`  ├─ Email: ${finalUser.email}`);
      console.log(`  ├─ Role: ${finalUser.role}`);
      console.log(`  └─ Active: ${finalUser.isActive ? "✅" : "❌"}`);
    }

    const finalClient = finalUser ? await Client.findOne({ userId: finalUser._id }) : null;
    console.log("\nClient:");
    console.log(`  ├─ Created: ${finalClient ? "✅ YES" : "❌ NO"}`);
    if (finalClient) {
      console.log(`  ├─ ID: ${finalClient._id}`);
      console.log(`  ├─ Name: ${finalClient.name}`);
      console.log(`  ├─ Email: ${finalClient.email}`);
      console.log(`  ├─ Project: ${finalClient.projectName}`);
      console.log(`  ├─ Budget: ${finalClient.budget}`);
      console.log(`  └─ Status: ${finalClient.status}`);
    }

    console.log("\n" + "=" .repeat(70));
    console.log("\n✅ Test Complete!\n");

    // Cleanup
    console.log("5️⃣  Cleaning up test data...");
    await Proposal.findByIdAndDelete(testProposal._id);
    if (finalUser) await User.findByIdAndDelete(finalUser._id);
    if (finalClient) await Client.findByIdAndDelete(finalClient._id);
    console.log("✅ Test data cleaned up\n");

    await mongoose.disconnect();

  } catch (error) {
    console.error("\n❌ Test Error:", error.message);
    console.error("Stack:", error.stack);
    await mongoose.disconnect().catch(() => {});
  }
};

directTestProposalAcceptance();
