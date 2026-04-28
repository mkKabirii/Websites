const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.dev.env" });

const User = require("./model/userModel");

const ADMIN_EMAIL = "admin@wgtech.com";
const NEW_USER = {
  email: "admin@wgtech.com",
  username: "Ghazan",
  fullname: "GhazanAbbas",
  password: "Admin@123456",
  role: "admin",
  isActive: true,
  isGuest: false,
};

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing in config.dev.env");
    }

    console.log("Connecting to database...");
    await mongoose.connect(process.env.DATABASE_URL);

    const deleteResult = await User.deleteOne({ email: ADMIN_EMAIL });
    console.log(
      `Deleted ${deleteResult.deletedCount} user(s) with email ${ADMIN_EMAIL}`,
    );

    const created = await User.create(NEW_USER);
    console.log(`Created admin user: ${created.email} (${created._id})`);

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
