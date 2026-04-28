const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.dev.env" });

const User = require("./model/userModel");

const checkAndCreateAdmin = async () => {
  try {
    console.log("\n🔍 Checking Admin User...\n");

    // Connect
    await mongoose.connect(process.env.DATABASE_URL);

    // Check existing admin
    const adminUser = await User.findOne({ role: "admin" });

    if (adminUser) {
      console.log("✅ Admin exists:");
      console.log(`   ID: ${adminUser._id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Active: ${adminUser.isActive}\n`);
    } else {
      console.log("❌ No admin found, creating one...\n");

      const newAdmin = await User.create({
        email: "admin@wgtech.com",
        password: "Admin@123",
        username: "admin",
        fullname: "Admin User",
        role: "admin",
        isActive: true
      });

      console.log("✅ Admin created:");
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Password: Admin@123`);
      console.log(`   Role: ${newAdmin.role}\n`);
    }

    // List all users
    console.log("📋 All Users:");
    const allUsers = await User.find({}, { password: 0 });
    allUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} (${u.role})`);
    });

    await mongoose.disconnect();
    console.log("\n✅ Done\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.disconnect().catch(() => {});
  }
};

checkAndCreateAdmin();
