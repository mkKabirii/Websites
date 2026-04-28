const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.dev.env" });

const User = require("./model/userModel");
const UserRole = require("./model/userRole");

const ADMIN_EMAIL = "admin@wgtech.com";
const ADMIN_ROLE_NAME = "admin";

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing in config.dev.env");
    }

    console.log("Connecting to database...");
    await mongoose.connect(process.env.DATABASE_URL);

    const role = await UserRole.findOne({ roleName: ADMIN_ROLE_NAME });
    if (!role) {
      throw new Error(`UserRole not found: ${ADMIN_ROLE_NAME}`);
    }

    const user = await User.findOne({ email: ADMIN_EMAIL });
    if (!user) {
      throw new Error(`User not found: ${ADMIN_EMAIL}`);
    }

    user.designation = role._id;
    user.role = "admin";
    await user.save();

    console.log(`Assigned designation ${role._id} to ${user.email}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
})();
