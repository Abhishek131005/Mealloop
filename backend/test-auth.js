const axios = require('axios');

async function testSignup() {
  try {
    console.log('🧪 Testing signup...');
    console.log('📍 URL: http://localhost:5000/api/auth/signup');
    
    const response = await axios.post('http://localhost:5000/api/auth/signup', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpass123',
      role: 'Donor'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Signup successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Signup failed:');
    console.error('- Status:', error.response?.status);
    console.error('- Data:', error.response?.data);
    console.error('- Message:', error.message);
    console.error('- Code:', error.code);
    return null;
  }
}

async function testLogin() {
  try {
    console.log('🧪 Testing login...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'testpass123'
    });
    
    console.log('✅ Login successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting auth tests...\n');
  
  // Test signup
  const signupResult = await testSignup();
  console.log('\n---\n');
  
  // Test login if signup was successful
  if (signupResult) {
    await testLogin();
  }
  
  console.log('\n🏁 Tests completed!');
}

runTests();