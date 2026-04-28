const axios = require('axios');
const User = require('./model/userModel');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config({ path: './config.dev.env' });

(async () => {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect('mongodb://localhost:27017/wgtech_db');
    
    console.log('👤 Finding admin user...');
    const adminUser = await User.findOne({ email: 'admin@wgtech.com' });
    if (!adminUser) {
      console.log('❌ Admin not found');
      process.exit(1);
    }
    
    console.log('🔐 Generating token using JWT_SECRET...');
    const secret = process.env.JWT_SECRET || 'test-secret-key';
    const token = jwt.sign({ id: adminUser._id }, secret, { expiresIn: '7d' });
    console.log('✅ Generated token:', token.substring(0, 30) + '...');
    
    console.log('\n📡 Testing /api/v1/clients endpoint...');
    const response = await axios.get('http://localhost:8003/api/v1/clients', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ success:', response.data.success);
    console.log('📊 Number of items returned:', response.data.data ? response.data.data.length : 0);
    console.log('\n📦 Returned items:');
    if (response.data.data && Array.isArray(response.data.data)) {
      response.data.data.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.fullname || item.name} (${item.email}) - role: ${item.role}`);
      });
    }
    
    console.log('\n✅ SUCCESS - Clients endpoint working correctly!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
})();
