const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables from backend directory
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Import models
const User = require('../backend/models/User');
const Donation = require('../backend/models/Donation');
const ChatMessage = require('../backend/models/ChatMessage');

async function exportData() {
  try {
    console.log('🔄 Starting data export from local MongoDB...');
    
    // Connect to local database
    await mongoose.connect('mongodb://localhost:27017/mealloop', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to local MongoDB');

    // Export collections
    const users = await User.find({});
    const donations = await Donation.find({});
    const chatMessages = await ChatMessage.find({});

    // Create data directory
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    // Save to JSON files
    fs.writeFileSync(
      path.join(dataDir, 'users.json'), 
      JSON.stringify(users, null, 2)
    );
    
    fs.writeFileSync(
      path.join(dataDir, 'donations.json'), 
      JSON.stringify(donations, null, 2)
    );
    
    fs.writeFileSync(
      path.join(dataDir, 'chatMessages.json'), 
      JSON.stringify(chatMessages, null, 2)
    );

    console.log('🎉 Data exported successfully!');
    console.log(`📊 Export Summary:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Donations: ${donations.length}`);
    console.log(`   - Chat Messages: ${chatMessages.length}`);
    console.log(`📁 Data saved to: ${dataDir}`);

    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 Make sure your local MongoDB is running');
    }
    
    process.exit(1);
  }
}

// Run export if this file is executed directly
if (require.main === module) {
  exportData();
}

module.exports = exportData;