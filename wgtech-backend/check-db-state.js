const mongoose = require("mongoose");
require("dotenv").config();

const Quotation = require("./model/quotationModel");
const Client = require("./model/clientModel");
const User = require("./model/userModel");

const checkDatabaseState = async () => {
  try {
    console.log("📊 Checking Database State...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/wgtech_db");
    console.log("✅ Connected to MongoDB\n");

    // Check quotations
    const quotations = await Quotation.find().populate("clientId");
    console.log(`📋 Quotations: ${quotations.length}`);
    quotations.forEach((q, i) => {
      console.log(`   ${i + 1}. Status: ${q.status}`);
    });

    // Find signed quotations
    const signedQuotations = quotations.filter(q => q.status === "signed");
    console.log(`\n✏️ Signed Quotations: ${signedQuotations.length}`);
    signedQuotations.forEach((q, i) => {
      console.log(`   ${i + 1}. ID: ${q._id}`);
      console.log(`      Client ID: ${q.clientId._id}`);
      console.log(`      Client: ${q.clientId.name} (${q.clientId.email})`);
    });

    // Check clients with and without userId
    const clients = await Client.find();
    console.log(`\n👥 Clients: ${clients.length}`);
    
    const clientsWithUser = clients.filter(c => c.userId);
    const clientsWithoutUser = clients.filter(c => !c.userId);
    
    console.log(`   With User Account: ${clientsWithUser.length}`);
    clientsWithUser.forEach((c, i) => {
      console.log(`      ${i + 1}. ${c.name} - userId: ${c.userId}`);
    });
    
    console.log(`   Without User Account: ${clientsWithoutUser.length}`);
    clientsWithoutUser.forEach((c, i) => {
      console.log(`      ${i + 1}. ${c.name} (${c.email})`);
    });

    // Check client role users
    const clientUsers = await User.find({ role: "client" });
    console.log(`\n🔐 Client Users: ${clientUsers.length}`);
    clientUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} - ${u.fullname}`);
    });

    console.log("\n✨ Database check complete!");

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

checkDatabaseState();
