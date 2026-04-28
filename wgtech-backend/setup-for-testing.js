const mongoose = require("mongoose");
require("dotenv").config();

const Quotation = require("./model/quotationModel");
const Client = require("./model/clientModel");
const User = require("./model/userModel");

const setupForTesting = async () => {
  try {
    console.log("🔧 Setting up for testing account creation feature...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/wgtech_db");
    console.log("✅ Connected to MongoDB\n");

    // Step 1: Create a new test client without userId
    console.log("Step 1️⃣: Creating new test client (without user account)...");
    const newClient = await Client.create({
      userId: new mongoose.Types.ObjectId(), // Placeholder UUID, we'll create real user on approval
      name: "Test Client for Approval",
      email: "test.client.approval@example.com",
      phone: "+92-300-1234567",
      company: "Test Company",
      address: "Test Address",
      projectName: "Test Project for Account Creation",
      budget: 50000,
      description: "This is a test client for testing account creation on approval",
      status: "Not Started",
    });

    console.log(`✅ Created client: ${newClient._id}`);
    console.log(`   Email: ${newClient.email}\n`);

    // Step 2: Create a quotation for this client
    console.log("Step 2️⃣: Creating quotation for test client...");
    
    // Get an admin user for the quotation
    const admin = await User.findOne({ email: "admin@wgtech.com" });
    
    const newQuotation = await Quotation.create({
      clientId: newClient._id,
      mainAdminId: admin._id,
      status: "signed", // Set to signed so we can approve it immediately
      clientSubmission: {
        signature: "http://example.com/signature.png",
        nationalIdFront: "http://example.com/id-front.jpg",
        nationalIdBack: "http://example.com/id-back.jpg",
        paymentProof: "http://example.com/payment.jpg",
        submittedAt: new Date(),
      },
      quotationDetails: {
        items: [
          {
            name: "Website Development",
            qty: 1,
            rate: 50000,
            description: "Full website development",
          },
        ],
        totalAmount: 50000,
        advanceRequired: 25000,
        description: "Website development project",
        currency: "PKR",
      },
    });

    console.log(`✅ Created quotation: ${newQuotation._id}`);
    console.log(`   Status: ${newQuotation.status}`);
    console.log(`   Amount: ${newQuotation.quotationDetails.totalAmount}\n`);

    // Step 3: Display info for API testing
    console.log("✨ Test Setup Complete!\n");
    console.log("📋 Use these details to test the approve endpoint:\n");
    console.log("Quotation ID:", newQuotation._id);
    console.log("Client Email:", newClient.email);
    console.log("Client Name:", newClient.name);
    console.log("\nAPI Call Example:");
    console.log(`POST /api/v1/quotations/${newQuotation._id}/approve`);
    console.log("Body: { workerId: <worker-id>, department: 'IT' }\n");

    console.log("When approved:");
    console.log("✅ New user account will be created with generated password");
    console.log("✅ Email will be sent to:", newClient.email);
    console.log("✅ Client can then login with email and generated password\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.errors) {
      console.error("Validation errors:", error.errors);
    }
  } finally {
    await mongoose.disconnect();
  }
};

setupForTesting();
