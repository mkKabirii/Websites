const mongoose = require('mongoose');
const User = require('./model/userModel');
const UserRole = require('./model/userRole');
const dotenv = require('dotenv');

dotenv.config({ path: './config.dev.env' });

(async () => {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.DATABASE_URL);
    
    console.log('\n👤 Checking admin user...');
    const admin = await User.findOne({ email: 'admin@wgtech.com' })
      .populate('designation', 'roleName assignedPages');
    
    console.log('Admin user object:');
    console.log('  - email:', admin.email);
    console.log('  - fullname:', admin.fullname);
    console.log('  - role:', admin.role);
    console.log('  - designation:', admin.designation);
    console.log('  - designation._id:', admin.designation?._id);
    console.log('  - designation.roleName:', admin.designation?.roleName);
    
    // Get the raw designation ID
    console.log('\n📋 Raw designation ID from user:', admin.designation);
    
    // Check all user roles
    console.log('\n📋 All UserRole records:');
    const roles = await UserRole.find().select('_id roleName');
    roles.forEach(r => {
      console.log(`   - ${r._id} : ${r.roleName}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
