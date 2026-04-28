const mongoose = require('mongoose');
require('dotenv').config({ path: './config.dev.env' });
const User = require('./model/userModel');

(async () => {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('✅ Connected\n');

    // Check all users
    const allUsers = await User.find({});
    console.log('📊 ALL USERS IN DATABASE:');
    allUsers.forEach(u => {
      console.log(`  - ${u.email} | role: "${u.role}" | fullname: ${u.fullname}`);
    });

    // Check clients specifically
    const clients = await User.find({ role: 'client' });
    console.log(`\n✅ Users with role 'client': ${clients.length}`);
    clients.forEach(c => {
      console.log(`  - ${c.fullname} (${c.email}) | project: ${c.projectName}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
