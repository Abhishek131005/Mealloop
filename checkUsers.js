const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    
    const User = require('./backend/models/User');
    const users = await User.find({});
    
    console.log('\nUsers in database:');
    console.log(JSON.stringify(users, null, 2));
    
    if (users.length > 0) {
      console.log('\nSample user password hash:');
      console.log(users[0].password);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
