// Quick diagnostic to check worker role status
const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.dev.env" });
const UserRole = require("./model/userRole");
const User = require("./model/userModel");

async function checkWorkerRoutes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ Connected to MongoDB\n");

    // Check worker role
    const workerRole = await UserRole.findOne({ roleName: "worker" });
    if (!workerRole) {
      console.log("❌ Worker role NOT found in database");
      process.exit(1);
    }

    console.log("📋 WORKER ROLE STATUS:");
    console.log("─".repeat(50));
    console.log(`Role Name: ${workerRole.roleName}`);
    console.log(`Total Routes: ${workerRole.totalRoutes}`);
    console.log(`Routes Count: ${workerRole.routes.length}`);
    console.log("\nRoutes defined:");
    workerRole.routes.forEach(r => {
      console.log(`  ✓ ${r.order}. ${r.title} (${r.path})`);
    });

    // Check if Chat route exists
    const hasChatRoute = workerRole.routes.some(r => r.path === "/chat");
    console.log(`\n🔍 Chat Route Status: ${hasChatRoute ? "✅ PRESENT" : "❌ MISSING"}`);

    // Check workers in database
    console.log("\n─".repeat(50));
    console.log("📋 WORKER USERS IN DATABASE:");
    console.log("─".repeat(50));
    const workers = await User.find({ designation: workerRole._id })
      .select("username email fullname designation")
      .populate("designation", "roleName totalRoutes");

    if (workers.length === 0) {
      console.log("❌ No workers found in database");
    } else {
      console.log(`Found ${workers.length} worker(s):\n`);
      workers.forEach((w, idx) => {
        console.log(`${idx + 1}. ${w.fullname}`);
        console.log(`   Username: ${w.username}`);
        console.log(`   Email: ${w.email}`);
        console.log(`   Role: ${w.designation.roleName}`);
        console.log(`   Routes: ${w.designation.totalRoutes}\n`);
      });
    }

    console.log("─".repeat(50));
    if (hasChatRoute && workers.length > 0) {
      console.log("✅ Everything looks good!");
      console.log("   → Workers should see Chat in navigation");
      console.log("   → If not visible, workers need to logout and login again");
    } else if (!hasChatRoute) {
      console.log("⚠️ Chat route is MISSING from worker role!");
      console.log("   → Run: node fix-worker-routes.js");
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkWorkerRoutes();
