const mongoose = require('mongoose');
const User = require('./model/userModel');
const Client = require('./model/clientModel');
const dotenv = require('dotenv');

dotenv.config({ path: './config.dev.env' });

(async () => {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.DATABASE_URL);
    
    console.log('\n📊 USER COLLECTION:');
    const allUsers = await User.find().select('email fullname role');
    console.log(`Total users: ${allUsers.length}`);
    allUsers.forEach(u => {
      console.log(`  - ${u.email} | role: "${u.role}" | name: ${u.fullname}`);
    });
    
    console.log('\n📋 CLIENT COLLECTION:');
    const allClients = await Client.find()
      .populate('userId', 'email fullname')
      .select('name email company projectName budget');
    console.log(`Total clients: ${allClients.length}`);
    allClients.forEach(c => {
      console.log(`  - ${c.name} (${c.email})`);
      console.log(`      Company: ${c.company}`);
      console.log(`      Project: ${c.projectName} | Budget: PKR ${c.budget?.toLocaleString()}`);
    });
    
    console.log('\n✅ SUCCESS - Clients properly separated in Client collection!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
