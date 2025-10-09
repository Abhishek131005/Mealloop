require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

connectDB();

// Test basic endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// Test auth routes with detailed error logging
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

app.post('/api/auth/signup', async (req, res) => {
  console.log('📝 Signup request received:', req.body);
  
  try {
    const { name, email, password, role } = req.body;
    
    console.log('🔍 Processing signup for:', { name, email, role });
    
    // Validation
    if (!name || !email || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Name, email, and password are required' 
      });
    }

    if (password.length < 6) {
      console.log('❌ Password too short');
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    console.log('🔍 Checking for existing user...');
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log('❌ User already exists:', existing._id);
      return res.status(400).json({ 
        error: 'Email already registered' 
      });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hash = await bcrypt.hash(password, 12);
    
    // Create user
    console.log('👤 Creating new user...');
    const user = new User({ 
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hash,
      role: role || 'Donor'
    });
    
    console.log('💾 Saving user to database...');
    await user.save();
    
    console.log('✅ User created successfully:', user._id);
    res.status(201).json({ 
      message: 'Signup successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('💥 Signup error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Email already registered' 
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        error: messages.join('. ') 
      });
    }
    
    res.status(500).json({ 
      error: 'Server error during signup',
      details: error.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  console.log('🔑 Login request received:', { email: req.body.email });
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    console.log('🔍 Finding user...');
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    console.log('🔐 Checking password...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Invalid password for user:', user._id);
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    console.log('🎫 Generating JWT token...');
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('✅ Login successful for user:', user._id);
    res.json({ 
      token, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ 
      error: 'Server error during login',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Debug server running on port ${PORT}`);
  console.log(`📍 Test URL: http://localhost:${PORT}/api/test`);
  console.log(`📍 Signup URL: http://localhost:${PORT}/api/auth/signup`);
  console.log(`📍 Login URL: http://localhost:${PORT}/api/auth/login`);
});