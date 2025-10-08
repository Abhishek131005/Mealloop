// MongoDB initialization script for MealLoop
// This script creates the database and initial collections with proper indexes

// Switch to the mealloop_dev database
db = db.getSiblingDB('mealloop_dev');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'role'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
          description: 'must be a valid email address and is required'
        },
        role: {
          enum: ['Donor', 'Volunteer', 'Admin'],
          description: 'must be one of the enum values'
        }
      }
    }
  }
});

db.createCollection('donations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'quantity', 'donor'],
      properties: {
        title: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        quantity: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        status: {
          enum: ['Pending', 'Claimed', 'Picked Up', 'Delivered', 'Cancelled'],
          description: 'must be one of the enum values'
        }
      }
    }
  }
});

db.createCollection('chatmessages');

// Create indexes for better performance
// Users collection indexes
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'role': 1 });
db.users.createIndex({ 'createdAt': -1 });

// Donations collection indexes
db.donations.createIndex({ 'donor': 1 });
db.donations.createIndex({ 'claimedBy': 1 });
db.donations.createIndex({ 'status': 1 });
db.donations.createIndex({ 'createdAt': -1 });
db.donations.createIndex({ 'lat': 1, 'lng': 1 });
db.donations.createIndex({ 'shelterLat': 1, 'shelterLng': 1 });

// Chat messages collection indexes
db.chatmessages.createIndex({ 'donation': 1 });
db.chatmessages.createIndex({ 'sender': 1 });
db.chatmessages.createIndex({ 'receiver': 1 });
db.chatmessages.createIndex({ 'timestamp': -1 });
db.chatmessages.createIndex({ 'delivered': 1 });
db.chatmessages.createIndex({ 'read': 1 });

// Create compound indexes for common queries
db.donations.createIndex({ 'status': 1, 'createdAt': -1 });
db.donations.createIndex({ 'donor': 1, 'status': 1 });
db.donations.createIndex({ 'claimedBy': 1, 'status': 1 });

db.chatmessages.createIndex({ 'donation': 1, 'timestamp': -1 });
db.chatmessages.createIndex({ 'sender': 1, 'receiver': 1, 'timestamp': -1 });

// Create a test admin user (development only)
db.users.insertOne({
  name: 'Admin User',
  email: 'admin@mealloop.com',
  password: '$2a$10$example.hash.for.development.only',
  role: 'Admin',
  phone: '+1234567890',
  createdAt: new Date()
});

print('MealLoop database initialized successfully with collections and indexes!');
