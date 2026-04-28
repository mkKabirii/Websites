// Test script to verify worker chat filtering logic
const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.dev.env" });

// Load all models to register them
require("./model/userRole");
require("./model/chatModel");
require("./model/userModel");
require("./model/clientModel");

const Chat = require("./model/chatModel");
const User = require("./model/userModel");
const Client = require("./model/clientModel");

async function testWorkerChatFiltering() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ Connected to MongoDB\n");

    // Get a test worker - specifically find one with "worker" role
    const workerRole = await mongoose.model("UserRole").findOne({ roleName: "worker" });
    
    if (!workerRole) {
      console.log("❌ Worker role not found in database");
      process.exit(1);
    }

    const worker = await User.findOne({ designation: workerRole._id })
      .populate("designation", "roleName")
      .populate("assignedClients");

    if (!worker) {
      console.log("❌ No worker found in database");
      process.exit(1);
    }

    console.log("👷 Testing with worker:", worker.fullname);
    console.log("   Role:", worker.designation?.roleName);
    console.log("   Assigned Clients:", worker.assignedClients?.length || 0);

    if (worker.assignedClients?.length > 0) {
      console.log("   Client Details:");
      worker.assignedClients.forEach((c, i) => {
        console.log(`     ${i + 1}. ${c.name} (${c._id})`);
      });
    }

    console.log("\n─".repeat(60));

    // Simulate the filter logic
    const userId = worker._id;
    const isWorker = worker.designation?.roleName === "worker";

    if (!isWorker) {
      console.log("This user is not a worker, skipping test");
      process.exit(0);
    }

    let assignedClientIds = [];
    if (isWorker && worker.assignedClients) {
      assignedClientIds = worker.assignedClients.map(c => 
        c._id ? c._id.toString() : c.toString()
      );
    }

    console.log("\n🔍 FILTER LOGIC TEST:");
    console.log("─".repeat(60));
    console.log("Assigned Client IDs:", assignedClientIds);

    // Build the filter query (UPDATED - Workers see ONLY group chats)
    let query = { isActive: true };
    
    if (isWorker) {
      query.isGroupChat = true;
      query.participants = userId;
    }

    console.log("\n📋 MongoDB Query:");
    console.log(JSON.stringify(query, null, 2));

    // Execute the query
    const chats = await Chat.find(query)
      .populate("clientId", "username email")
      .populate("clientRef", "name email")
      .select("_id groupName clientId clientRef chatType isGroupChat participants");

    console.log("\n📊 RESULTS:");
    console.log("─".repeat(60));
    console.log(`Total Chats Found: ${chats.length}`);

    if (chats.length === 0) {
      console.log("✅ No chats found (worker has no assigned clients or group chats)");
    } else {
      console.log("\nChats filtered for worker:");
      chats.forEach((chat, idx) => {
        if (chat.isGroupChat) {
          console.log(`\n${idx + 1}. [GROUP] ${chat.groupName}`);
          console.log(`   Type: Group Chat`);
        } else {
          const clientName = chat.clientRef?.name || chat.clientId?.username || "Unknown";
          console.log(`\n${idx + 1}. ${clientName}`);
          console.log(`   Type: ${chat.chatType}`);
          console.log(`   ClientRef: ${chat.clientRef?._id || "None"}`);
          console.log(`   ClientId: ${chat.clientId?._id || "None"}`);
        }
      });
    }

    // Now count ALL chats in database to show comparison
    const allChats = await Chat.find({ isActive: true, chatType: "admin_work" })
      .select("_id groupName clientRef chatType isGroupChat");

    console.log("\n─".repeat(60));
    console.log(`\n📈 COMPARISON:`);
    console.log(`Total admin_work chats in DB: ${allChats.length}`);
    console.log(`Chats visible to this worker: ${chats.length}`);
    console.log(`✅ Filter is ${chats.length < allChats.length ? "WORKING" : "NOT FILTERING"}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testWorkerChatFiltering();
