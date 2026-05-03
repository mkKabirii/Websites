const mongoose = require("mongoose");
const User = require("./model/userModel");
const Client = require("./model/clientModel");

async function checkDups() {
  await mongoose.connect("mongodb://localhost/wgtech_db");
  const users = await User.find({}, "email role");
  const clients = await Client.find({}, "email");

  console.log("USERS:", users);
  console.log("CLIENTS:", clients);

  const userEmails = users.map(u => u.email);
  const clientEmails = clients.map(c => c.email);
  
  const common = userEmails.filter(e => clientEmails.includes(e));
  console.log("COMMON EMAILS:", common);
  
  await mongoose.disconnect();
}

checkDups();
