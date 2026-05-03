const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const testSchema = new mongoose.Schema({
  email: String,
  password: { type: String, select: false }
});

testSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const TestUser = mongoose.model("TestUser", testSchema);

async function run() {
  await mongoose.connect("mongodb://localhost/wgtech_db");
  
  // 1. Create a user
  await TestUser.deleteMany({});
  const user = await TestUser.create({ email: "test@test.com", password: "oldPassword123" });
  console.log("Original Hash:", user.password); // should be hashed

  // 2. Fetch without password (select: false)
  const fetchedUser = await TestUser.findOne({ email: "test@test.com" });
  console.log("Fetched password:", fetchedUser.password); // undefined

  // 3. Reset password logic
  fetchedUser.password = "newPassword456";
  await fetchedUser.save({ validateBeforeSave: false });
  console.log("Hash after save:", fetchedUser.password);

  // 4. Login logic
  const loginUser = await TestUser.findOne({ email: "test@test.com" }).select("+password");
  const isValid = await bcrypt.compare("newPassword456", loginUser.password);
  console.log("Login valid:", isValid);

  await mongoose.disconnect();
}

run().catch(console.error);
