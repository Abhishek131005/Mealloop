// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('mealloop');

// Create collections
db.createCollection('users');
db.createCollection('donations');
db.createCollection('chatmessages');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

db.donations.createIndex({ "donor": 1 });
db.donations.createIndex({ "claimedBy": 1 });
db.donations.createIndex({ "status": 1 });
db.donations.createIndex({ "location": "2dsphere" });
db.donations.createIndex({ "createdAt": 1 });

db.chatmessages.createIndex({ "donation": 1, "timestamp": 1 });
db.chatmessages.createIndex({ "sender": 1 });
db.chatmessages.createIndex({ "receiver": 1 });

print('Database initialized successfully');
print('Collections created: users, donations, chatmessages');
print('Indexes created for optimal performance');