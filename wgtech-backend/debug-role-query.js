const mongoose = require('mongoose');
const User = require('./model/userModel');
const dotenv = require('dotenv');

dotenv.config({ path: './config.dev.env' });

(async () => {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.DATABASE_URL);
    
    console.log('\n📊 Checking User collection...');
    
    // Query all users
    const allUsers = await User.find().select('email fullname role');
    console.log(`\n📋 Total users: ${allUsers.length}`);
    allUsers.forEach(u => {
      console.log(`   - ${u.email} | role: "${u.role}" | name: ${u.fullname}`);
    });
    
    // Specifically query for role: "client"
    console.log('\n🔍 Querying with { role: "client" }...');
    const clients = await User.find({ role: "client" }).select('email fullname role');
    console.log(`✅ Found: ${clients.length} clients with role:"client"`);
    clients.forEach(c => {
      console.log(`   - ${c.email} | ${c.fullname}`);
    });
    
    // Try alternative queries
    console.log('\n🔍 Querying with { role: "Client" } (capital C)...');
    const clientsCap = await User.find({ role: "Client" }).select('email fullname role');
    console.log(`   Found: ${clientsCap.length}`);
    
    // Get raw documents from database
    console.log('\n🔍 Getting raw role values...');
    const roleValues = await User.distinct('role');
    console.log('   Distinct role values in database:', roleValues);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
