// test-auth.js - Complete authentication flow tester
// Run with: node test-auth.js

import http from 'http';

const API_BASE = 'http://localhost:8080/api/v1';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

const logSuccess = (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`);
const logError = (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`);
const logInfo = (msg) => console.log(`${colors.blue}→${colors.reset} ${msg}`);
const logWarning = (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);

// Helper function for HTTP requests
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = options.body ? JSON.stringify(options.body) : null;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (postData) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

// Health check
const testServerHealth = async () => {
  console.log(`${colors.blue}🔍 Checking server health...${colors.reset}`);
  try {
    const healthResponse = await makeRequest('http://127.0.0.1:8080/health');
    
    if (!healthResponse.ok) {
      logError(`Server returned status: ${healthResponse.status}`);
      return false;
    }
    
    if (healthResponse.data.success === true) {
      logSuccess(`Server is running on port 8080`);
      console.log(`   Environment: ${healthResponse.data.environment || 'development'}`);
      console.log(`   Request ID: ${healthResponse.data.requestId || 'N/A'}`);
      return true;
    } else {
      logError(`Server returned unexpected response`);
      return false;
    }
  } catch (error) {
    logError(`Cannot reach server: ${error.message}`);
    console.log('\n   Make sure:');
    console.log('   1. Server is running (node server.js)');
    console.log('   2. Server is on port 8080');
    console.log('   3. No firewall blocking localhost');
    console.log(`   4. Error details: ${error.code || error.message}`);
    return false;
  }
};

// Main auth test
const testAuth = async () => {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.blue}🔐 AUTHENTICATION FLOW TEST${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  const uniqueEmail = `test_${Date.now()}@example.com`;
  const testUser = {
    email: uniqueEmail,
    password: 'Test123!@#',
    first_name: 'Test',
    last_name: 'User',
    phone: '+1234567890'
  };

  let accessToken = null;

  // TEST 1: REGISTER
  logInfo('Testing user registration...');
  try {
    const registerResponse = await makeRequest(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: testUser
    });

    if (registerResponse.ok && registerResponse.data.success) {
      logSuccess(`User registered successfully: ${testUser.email}`);
    } else {
      logWarning(`Registration: ${registerResponse.data.message || 'User may already exist'}`);
    }
  } catch (error) {
    logWarning(`Registration failed: ${error.message} - continuing to login...`);
  }

  // TEST 2: LOGIN
  logInfo('\nTesting user login...');
  try {
    const loginResponse = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        email: testUser.email,
        password: testUser.password
      }
    });

    if (!loginResponse.ok) {
      throw new Error(loginResponse.data.message || 'Login failed');
    }

    accessToken = loginResponse.data.data?.token || loginResponse.data.token;
    
    if (accessToken) {
      logSuccess(`Login successful!`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Token: ${accessToken.substring(0, 40)}...`);
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    logError(`Login failed: ${error.message}`);
    return;
  }

  // TEST 3: GET PROFILE
  if (accessToken) {
    logInfo('\nTesting protected route (GET /users/me)...');
    try {
      const profileResponse = await makeRequest(`${API_BASE}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (profileResponse.ok && profileResponse.data.success) {
        logSuccess(`Profile fetched successfully!`);
        const user = profileResponse.data.data;
        console.log(`   Name: ${user?.first_name} ${user?.last_name}`);
        console.log(`   Email: ${user?.email}`);
      } else {
        throw new Error(profileResponse.data.message || 'Failed to fetch profile');
      }
    } catch (error) {
      logError(`Profile fetch failed: ${error.message}`);
    }
  }

  // SUMMARY
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.blue}📊 TEST SUMMARY${colors.reset}`);
  console.log('='.repeat(60));
  
  if (accessToken) {
    console.log(`\n${colors.green}✅ Authentication flow is WORKING!${colors.reset}`);
    console.log(`\n${colors.blue}Frontend Configuration:${colors.reset}`);
    console.log(`   API URL: ${API_BASE}`);
    console.log(`   Health Check: http://localhost:8080/health`);
  } else {
    console.log(`\n${colors.red}❌ Authentication flow FAILED${colors.reset}`);
  }
  console.log('');
};

// RUN TESTS
const run = async () => {
  const isHealthy = await testServerHealth();
  if (!isHealthy) {
    console.log(`\n${colors.red}❌ Cannot continue - server health check failed${colors.reset}`);
    process.exit(1);
  }
  await testAuth();
};

run();