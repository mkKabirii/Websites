const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./model/userModel");

const getWorker = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/wgtech_db");
    
    const workers = await User.find({ email: { $regex: /john|jane|mike/ } });
    
    if (workers.length === 0) {
      console.log("❌ No workers found");
      await mongoose.disconnect();
      return;
    }

    console.log("👷 Workers available:\n");
    workers.forEach((w, i) => {
      console.log(`${i + 1}. ID: ${w._id}`);
      console.log(`   Email: ${w.email}\n`);
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

getWorker();
