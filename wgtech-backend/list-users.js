const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.dev.env" });

const User = require("./model/userModel");

const listAllUsers = async () => {
  try {
    console.log("\n📋 ALL USERS IN DATABASE\n");

    await mongoose.connect(process.env.DATABASE_URL);

    const allUsers = await User.find({});
    
    console.log(`Found ${allUsers.length} users:\n`);
    allUsers.forEach((u, i) => {
      console.log(`${i + 1}. Email: ${u.email}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Active: ${u.isActive}`);
      console.log(`   ID: ${u._id}\n`);
    });

    await mongoose.disconnect();

  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.disconnect().catch(() => {});
  }
};

listAllUsers();
