const http = require('http');
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Service = require('./src/models/Service');
require('dotenv').config();

const request = (method, path, data, token = null) => {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', (e) => reject(e));
    
    if (data) req.write(postData);
    req.end();
  });
};

const runIntegrationTests = async () => {
  console.log('--- PREPARING DB FOR INTEGRATION TESTS ---');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/reservasDB');
  
  const adminEmail = `admin_test_${Date.now()}@example.com`;
  const adminPassword = 'adminPassword123!';
  
  await User.create({ name: 'Admin Test', email: adminEmail, password: adminPassword, role: 'admin', status: 'active' });
  
  console.log('--- LOGGING IN AS ADMIN ---');
  const loginRes = await request('POST', '/api/auth/login', { email: adminEmail, password: adminPassword });
  const token = loginRes.body.token;
  if (!token) {
    console.error('Failed to log in as admin', loginRes.body);
    process.exit(1);
  }
  
  console.log('\n--- TESTING USER ENDPOINTS ---');
  // 1. Create User
  console.log('1. Create User');
  const userPayload = { name: 'Test User', email: `user_${Date.now()}@test.com`, password: 'testPassword123!', role: 'user', status: 'active' };
  const createRes = await request('POST', '/api/users', userPayload, token);
  console.log('Status:', createRes.status, 'Body:', createRes.body);
  const userId = createRes.body.data.id;
  
  // 2. List Users
  console.log('2. List Users');
  const listRes = await request('GET', '/api/users', null, token);
  console.log('Status:', listRes.status, 'Total Users:', listRes.body.pagination.total);
  
  // 3. Update User
  console.log('3. Update User');
  const updateRes = await request('PUT', `/api/users/${userId}`, { name: 'Updated Test User' }, token);
  console.log('Status:', updateRes.status, 'Body:', updateRes.body);
  
  // 4. Delete User
  console.log('4. Delete User');
  const deleteRes = await request('DELETE', `/api/users/${userId}`, null, token);
  console.log('Status:', deleteRes.status, 'Body:', deleteRes.body);


  console.log('\n--- TESTING SERVICE ENDPOINTS ---');
  // 5. Create Service
  console.log('5. Create Service');
  const servicePayload = { name: 'Test Service', description: 'Testing', price: 100, duration: 60, category: 'Test', isActive: true };
  const createSvcRes = await request('POST', '/api/services', servicePayload, token);
  console.log('Status:', createSvcRes.status, 'Body:', createSvcRes.body);
  const serviceId = createSvcRes.body.data.id;

  // 6. List Services
  console.log('6. List Services');
  const listSvcRes = await request('GET', '/api/services', null, token);
  console.log('Status:', listSvcRes.status, 'Total Services:', listSvcRes.body.pagination.total);

  // 7. Update Service
  console.log('7. Update Service');
  const updateSvcRes = await request('PUT', `/api/services/${serviceId}`, { price: 150 }, token);
  console.log('Status:', updateSvcRes.status, 'Body:', updateSvcRes.body);

  // 8. Delete Service
  console.log('8. Delete Service');
  const deleteSvcRes = await request('DELETE', `/api/services/${serviceId}`, null, token);
  console.log('Status:', deleteSvcRes.status, 'Body:', deleteSvcRes.body);

  console.log('\n--- FINISHED INTEGRATION TESTS ---');
  await mongoose.disconnect();
};

runIntegrationTests();
