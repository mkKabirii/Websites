const mongoose = require("mongoose");
require("dotenv").config();

const Quotation = require("./model/quotationModel");
const Client = require("./model/clientModel");

const setupTestQuotation = async () => {
  try {
    console.log("🔧 Setting up test quotation...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/wgtech_db");
    console.log("✅ Connected to MongoDB\n");

    // Get a quotation and update its status to "signed"
    const quotation = await Quotation.findOne({ status: "sent" });
    
    if (!quotation) {
      console.log("❌ No 'sent' quotation found to update");
      await mongoose.disconnect();
      return;
    }

    console.log("Found quotation to update:");
    console.log(`  ID: ${quotation._id}`);
    console.log(`  Current Status: ${quotation.status}`);
    console.log(`  Client ID: ${quotation.clientId}\n`);

    // Get the client
    const client = await Client.findById(quotation.clientId);
    console.log(`  Client: ${client.name} (${client.email})`);

    // Check if client already has userId
    if (client.userId) {
      console.log(`  Client already has User Account, removing for test...\n`);
      // For testing, let's remove the userId to test account creation
      const originalUserId = client.userId;
      client.userId = null;
      await client.save();
      console.log(`  ✅ Removed userId from client (was: ${originalUserId})\n`);
    }

    // Update quotation to "signed" status
    quotation.status = "signed";
    quotation.clientSubmission = {
      signature: "http://example.com/signature.png",
      nationalIdFront: "http://example.com/id-front.jpg",
      nationalIdBack: "http://example.com/id-back.jpg",
      paymentProof: "http://example.com/payment.jpg",
      submittedAt: new Date(),
    };
    await quotation.save();

    console.log("✅ Updated quotation status to 'signed'");
    console.log(`   Status: ${quotation.status}\n`);

    console.log("📋 Now you can approve this quotation with:");
    console.log(`   Quotation ID: ${quotation._id}`);
    console.log(`   Client: ${client.name}`);
    console.log(`   Client Email: ${client.email}\n`);

    console.log("Next step: Call the approve endpoint via API\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

setupTestQuotation();
