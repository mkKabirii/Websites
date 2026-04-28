const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.dev.env" });

const Proposal = require("./model/proposalsModel");
const User = require("./model/userModel");
const Client = require("./model/clientModel");

const verifyAcceptance = async () => {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("DATABASE VERIFICATION - Checking for Accepted Proposals");
    console.log("=".repeat(70) + "\n");

    await mongoose.connect(process.env.DATABASE_URL);

    // Find all accepted proposals
    const acceptedProposals = await Proposal.find({ status: "Accepted" }).sort({ createdAt: -1 }).limit(5);
    
    if (acceptedProposals.length === 0) {
      console.log("❌ No accepted proposals found in database");
    } else {
      console.log(`✅ Found ${acceptedProposals.length} accepted proposal(s):\n`);

      for (const proposal of acceptedProposals) {
        console.log("─".repeat(70));
        console.log(`📋 Proposal ID: ${proposal._id}`);
        console.log(`   Proposal Email: ${proposal.email}`);
        console.log(`   Status: ${proposal.status}`);
        console.log(`   Created: ${proposal.createdAt}\n`);

        // Check for User account
        const user = await User.findOne({ email: proposal.email });
        if (user) {
          console.log(`   ✅ User Account Created`);
          console.log(`      - User ID: ${user._id}`);
          console.log(`      - Username: ${user.username}`);
          console.log(`      - Role: ${user.role}`);
        } else {
          console.log(`   ❌ NO User Account Found`);
        }

        // Check for Client record
        const client = user 
          ? await Client.findOne({ userId: user._id })
          : null;

        if (client) {
          console.log(`   ✅ Client Record Created`);
          console.log(`      - Client ID: ${client._id}`);
          console.log(`      - Name: ${client.name}`);
          console.log(`      - Email: ${client.email}`);
          console.log(`      - Budget: ${client.budget}`);
        } else {
          console.log(`   ❌ NO Client Record Found`);
        }

        console.log("");
      }
    }

    console.log("=".repeat(70) + "\n");

    // Show summary statistics
    const totalProposals = await Proposal.countDocuments();
    const acceptedCount = await Proposal.countDocuments({ status: "Accepted" });
    const pendingCount = await Proposal.countDocuments({ status: "Pending" });
    const totalUsers = await User.countDocuments();
    const clientUsers = await User.countDocuments({ role: "client" });
    const totalClients = await Client.countDocuments();

    console.log("📊 DATABASE SUMMARY:");
    console.log(`   Total Proposals: ${totalProposals}`);
    console.log(`   ├─ Accepted: ${acceptedCount}`);
    console.log(`   └─ Pending: ${pendingCount}`);
    console.log(`\n   Total Users: ${totalUsers}`);
    console.log(`   ├─ Client Users: ${clientUsers}`);
    console.log(`   └─ Client Records: ${totalClients}`);

    if (acceptedCount > 0 && clientUsers === 0) {
      console.log("\n⚠️  WARNING: Accepted proposals exist but no client users created!");
      console.log("   This suggests the acceptance workflow is NOT working properly.");
    } else if (acceptedCount > 0 && clientUsers > 0 && clientUsers < acceptedCount) {
      console.log(`\n⚠️  WARNING: Only ${clientUsers} client users but ${acceptedCount} accepted proposals`);
    } else if (acceptedCount > 0 && clientUsers === acceptedCount) {
      console.log("\n✅ All accepted proposals have corresponding client accounts!");
    }

    console.log("\n" + "=".repeat(70) + "\n");

    await mongoose.disconnect();

  } catch (error) {
    console.error("\n❌ Verification Error:", error.message);
    await mongoose.disconnect().catch(() => {});
  }
};

verifyAcceptance();
