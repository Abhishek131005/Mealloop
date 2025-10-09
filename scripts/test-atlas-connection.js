const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from backend directory
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function testAtlasConnection() {
  try {
    console.log('🔄 Testing MongoDB Atlas connection...');
    
    const atlasUri = process.env.MONGO_URI;
    
    if (!atlasUri) {
      throw new Error('MONGO_URI environment variable is not defined in .env file');
    }
    
    console.log('🔗 Connection string found');
    console.log('📡 Attempting to connect to Atlas...');
    
    await mongoose.connect(atlasUri, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log(`📂 Database name: ${mongoose.connection.name}`);
    console.log(`🏠 Host: ${mongoose.connection.host}`);
    console.log(`🔌 Ready state: ${mongoose.connection.readyState}`);
    
    // Test database operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Collections found: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('📚 Existing collections:');
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }
    
    // Test creating a simple document
    const testCollection = mongoose.connection.db.collection('connection_test');
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: 'Atlas connection successful'
    };
    
    await testCollection.insertOne(testDoc);
    console.log('✅ Test document created successfully');
    
    // Clean up test document
    await testCollection.deleteOne({ test: true });
    console.log('🗑️ Test document cleaned up');
    
    await mongoose.connection.close();
    console.log('🎉 Atlas connection test completed successfully!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Atlas connection test failed:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 Possible issues:');
      console.error('   - Check your internet connection');
      console.error('   - Verify the MongoDB Atlas connection string');
      console.error('   - Ensure your IP is whitelisted in Atlas');
      console.error('   - Check if the database user credentials are correct');
    }
    
    if (error.message.includes('Authentication failed')) {
      console.error('💡 Authentication issue:');
      console.error('   - Check your database username and password');
      console.error('   - Make sure the user has proper permissions');
    }
    
    process.exit(1);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testAtlasConnection();
}

module.exports = testAtlasConnection;