// Fix script to update existing worker role with Chat route
const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.dev.env" });
const UserRole = require("./model/userRole");

async function fixWorkerRoutes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ Connected to MongoDB");

    // Find worker role
    const workerRole = await UserRole.findOne({ roleName: "worker" });
    if (!workerRole) {
      console.log("❌ Worker role not found in database");
      process.exit(1);
    }

    console.log("📋 Current worker role:", {
      roleName: workerRole.roleName,
      totalRoutes: workerRole.totalRoutes,
      routes: workerRole.routes.map(r => ({ path: r.path, order: r.order }))
    });

    // Check if Chat route exists
    const hasChatRoute = workerRole.routes.some(r => r.path === "/chat");
    if (!hasChatRoute) {
      console.log("➕ Adding Chat route to worker role...");
      workerRole.routes.push({
        order: 2,
        title: "Chat",
        path: "/chat",
        permissions: [{ isView: true }]
      });
    }

    // Update totalRoutes to match actual routes count
    workerRole.totalRoutes = workerRole.routes.length;

    // Save updated role
    await workerRole.save();
    console.log("✅ Worker role updated successfully");
    console.log("📋 Updated worker role:", {
      roleName: workerRole.roleName,
      totalRoutes: workerRole.totalRoutes,
      routes: workerRole.routes.map(r => ({ path: r.path, order: r.order }))
    });

    console.log("\n✅ Fix completed! Now:");
    console.log("1. Logout and login again to refresh routes");
    console.log("2. Chat should appear in worker navigation");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing worker routes:", error.message);
    process.exit(1);
  }
}

fixWorkerRoutes();
