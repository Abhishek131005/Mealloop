const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables from backend directory
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Import models
const User = require('../backend/models/User');
const Donation = require('../backend/models/Donation');
const ChatMessage = require('../backend/models/ChatMessage');

async function importData() {
  try {
    console.log('🔄 Starting data import to MongoDB Atlas...');
    
    // Connect to Atlas database
    const atlasUri = process.env.MONGO_URI;
    
    if (!atlasUri) {
      throw new Error('MONGO_URI environment variable is not defined');
    }
    
    await mongoose.connect(atlasUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📂 Database: ${mongoose.connection.name}`);

    // Read exported data
    const dataDir = path.join(__dirname, 'data');
    
    if (!fs.existsSync(dataDir)) {
      console.log('⚠️ No data directory found. Run export-data.js first.');
      process.exit(1);
    }

    const usersFile = path.join(dataDir, 'users.json');
    const donationsFile = path.join(dataDir, 'donations.json');
    const chatMessagesFile = path.join(dataDir, 'chatMessages.json');

    let users = [];
    let donations = [];
    let chatMessages = [];

    // Read data files if they exist
    if (fs.existsSync(usersFile)) {
      users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    }
    
    if (fs.existsSync(donationsFile)) {
      donations = JSON.parse(fs.readFileSync(donationsFile, 'utf8'));
    }
    
    if (fs.existsSync(chatMessagesFile)) {
      chatMessages = JSON.parse(fs.readFileSync(chatMessagesFile, 'utf8'));
    }

    console.log('📊 Data to import:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Donations: ${donations.length}`);
    console.log(`   - Chat Messages: ${chatMessages.length}`);

    // Ask for confirmation to clear existing data
    console.log('⚠️ This will clear existing data in Atlas database!');
    
    // Clear existing collections
    await User.deleteMany({});
    await Donation.deleteMany({});
    await ChatMessage.deleteMany({});
    
    console.log('🗑️ Existing data cleared');

    // Import data
    let importCount = 0;
    
    if (users.length > 0) {
      await User.insertMany(users);
      console.log(`✅ Imported ${users.length} users`);
      importCount += users.length;
    }

    if (donations.length > 0) {
      await Donation.insertMany(donations);
      console.log(`✅ Imported ${donations.length} donations`);
      importCount += donations.length;
    }

    if (chatMessages.length > 0) {
      await ChatMessage.insertMany(chatMessages);
      console.log(`✅ Imported ${chatMessages.length} chat messages`);
      importCount += chatMessages.length;
    }

    console.log('🎉 Data migration completed successfully!');
    console.log(`📈 Total records imported: ${importCount}`);

    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 Check your MongoDB Atlas connection string');
    }
    
    process.exit(1);
  }
}

// Run import if this file is executed directly
if (require.main === module) {
  importData();
}

module.exports = importData;