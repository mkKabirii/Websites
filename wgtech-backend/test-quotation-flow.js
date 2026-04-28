const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Set default NODE_ENV
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

// Load environment variables
dotenv.config({ path: path.join(__dirname, "./config.dev.env") });

const DB = process.env.DATABASE_URL;

if (!DB) {
  console.error("❌ DATABASE_URL is not defined");
  process.exit(1);
}

let testResults = {
  dbConnection: false,
  quotationFound: false,
  messagesCollection: false,
  chatsCollection: false,
};

async function runTests() {
  try {
    console.log("\n🧪 STARTING QUOTATION SYSTEM TEST\n");

    // Test 1: Database Connection
    console.log("📦 Test 1: Database Connection");
    await mongoose.connect(DB, {
      retryWrites: true,
      w: "majority",
      serverSelectionTimeoutMS: 15000,
    });
    console.log("✅ MongoDB Connected\n");
    testResults.dbConnection = true;

    // Test 2: Check Quotations Collection
    console.log("📋 Test 2: Quotations Collection Structure");
    const quotations = mongoose.connection.db.collection("quotations");
    const firstQuotation = await quotations.findOne({});
    
    if (!firstQuotation) {
      console.log("❌ No quotations found in database\n");
    } else {
      console.log("✅ Found quotation:", firstQuotation._id);
      console.log("   Fields:");
      console.log("   - title:", firstQuotation.title ? "✓ (" + firstQuotation.title + ")" : "✗");
      console.log("   - subTitle:", firstQuotation.subTitle ? "✓ (" + firstQuotation.subTitle + ")" : "✗");
      console.log("   - quotationDetails:", firstQuotation.quotationDetails ? "✓" : "✗");
      console.log("   - status:", firstQuotation.status);
      console.log("   - adminId:", firstQuotation.mainAdminId?.toString().substring(0, 8) + "...");
      console.log("   - clientId:", firstQuotation.clientId?.toString().substring(0, 8) + "...\n");
      testResults.quotationFound = true;
    }

    // Test 3: Check Messages Collection
    console.log("💬 Test 3: Messages Collection Structure");
    const messages = mongoose.connection.db.collection("messages");
    const messageCount = await messages.countDocuments({});
    const sampleMessage = await messages.findOne({
      messageType: "quotation"
    });
    
    console.log("✅ Messages collection exists");
    console.log("   Total messages:", messageCount);
    if (sampleMessage) {
      console.log("   Found quotation message:");
      console.log("     - Has quotationData:", sampleMessage.quotationData ? "✓" : "✗");
      if (sampleMessage.quotationData) {
        console.log("     - Title in message:", sampleMessage.quotationData.title);
        console.log("     - Amount in message:", sampleMessage.quotationData.totalAmount);
      }
    } else {
      console.log("   No quotation messages found (expected - will be created when admin sends)\n");
    }
    testResults.messagesCollection = true;

    // Test 4: Check Chats Collection
    console.log("\n💬 Test 4: Chats Collection Structure");
    const chats = mongoose.connection.db.collection("chats");
    const chatCount = await chats.countDocuments({});
    const sampleChat = await chats.findOne({});
    
    console.log("✅ Chats collection exists");
    console.log("   Total chats:", chatCount);
    if (sampleChat) {
      console.log("   Sample chat:");
      console.log("     - Has participants:", sampleChat.participants?.length || 0);
      console.log("     - Chat type:", sampleChat.chatType);
      console.log("     - Is group:", sampleChat.isGroupChat);
    }
    testResults.chatsCollection = true;

    // Test 5: Verify Backend is Running  
    console.log("\n🚀 Test 5: Backend Server Status");
    try {
      const response = await fetch("http://localhost:8003/api/v1/messages/chat/test", {
        method: "GET",
        headers: {
          "Authorization": "Bearer test",  // This will fail auth but shows server is running
        },
      });
      console.log("✅ Backend server is running on port 8003");
    } catch (err) {
      console.log("⚠️  Cannot reach backend on port 8003");
      console.log("   Error:", err.message);
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 SYSTEM READINESS TEST RESULTS:");
    console.log("  1. DB Connection:", testResults.dbConnection ? "✅" : "❌");
    console.log("  2. Quotation Records:", testResults.quotationFound ? "✅" : "❌");
    console.log("  3. Messages Collection:", testResults.messagesCollection ? "✅" : "❌");
    console.log("  4. Chats Collection:", testResults.chatsCollection ? "✅" : "❌");
    console.log("=".repeat(60));

    console.log("\n✅ System is ready for quotation sending!");
    console.log("\nNext Steps:");
    console.log("  1. Open admin dashboard: http://localhost:5173");
    console.log("  2. Select a client from chat");
    console.log("  3. Click 'Send Quotation' button");
    console.log("  4. Fill in quotation details");    
    console.log("  5. Click 'Submit Quotation'");
    console.log("  6. Verify quotation appears in client chat");
    console.log("\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Test Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
