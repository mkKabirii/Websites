const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.dev.env" });

const User = require("./model/userModel");
const UserRole = require("./model/userRole");

const NEW_WORKER = {
  email: "worker1@wgtech.com",
  username: "worker1",
  fullname: "Worker One",
  password: "Worker@123456",
  role: "worker",
  isActive: true,
  isGuest: false,
  assignedDepartment: "general",
};

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing in config.dev.env");
    }

    console.log("Connecting to database...");
    await mongoose.connect(process.env.DATABASE_URL);

    const workerRole = await UserRole.findOne({ roleName: "worker" }).select(
      "_id",
    );
    if (!workerRole) {
      throw new Error("Worker role not found. Run seed.js to create roles.");
    }

    const existing = await User.findOne({ email: NEW_WORKER.email });
    if (existing) {
      existing.username = NEW_WORKER.username || existing.username;
      existing.fullname = NEW_WORKER.fullname || existing.fullname;
      existing.role = "worker";
      existing.isActive = true;
      existing.isGuest = false;
      existing.assignedDepartment =
        NEW_WORKER.assignedDepartment || existing.assignedDepartment;
      existing.designation = workerRole._id;
      await existing.save();
      console.log(
        `Worker updated with designation: ${existing.email} (${existing._id})`,
      );
      await mongoose.disconnect();
      process.exit(0);
    }

    const created = await User.create({
      ...NEW_WORKER,
      designation: workerRole._id,
    });
    console.log(`Created worker user: ${created.email} (${created._id})`);

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
