

const http = require('http');
const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const request = (method, path, data) => {
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

const runTests = async () => {
  console.log('--- PREPARANDO ENTORNO ---');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/reservasDB');
  
  const testEmail = `test_${Date.now()}@example.com`;
  
  // 1. Crear usuario directamente en DB para poder probar el login
  console.log('Creando usuario de prueba directamente en la base de datos...');
  await User.create({ name: 'Usuario Prueba', email: testEmail, password: 'password123' });
  
  console.log('\n--- INICIANDO PRUEBAS DE ENDPOINTS DE LOGIN ---');
  
  // 1. Probar inicio de sesión válido
  console.log('\n1. Probando login con credenciales CORRECTAS...');
  const loginSuccessRes = await request('POST', '/api/auth/login', { email: testEmail, password: 'password123' });
  console.log(`Status: ${loginSuccessRes.status}`);
  console.log('Response:', loginSuccessRes.body);

  // 2. Probar inicio de sesión inválido (contraseña incorrecta)
  console.log('\n2. Probando login con credenciales INCORRECTAS (contraseña mala)...');
  const loginFailRes = await request('POST', '/api/auth/login', { email: testEmail, password: 'wrongpassword' });
  console.log(`Status: ${loginFailRes.status}`);
  console.log('Response:', loginFailRes.body);

  // 3. Probar campos faltantes
  console.log('\n3. Probando login con campos FALTANTES...');
  const loginMissingRes = await request('POST', '/api/auth/login', { email: testEmail });
  console.log(`Status: ${loginMissingRes.status}`);
  console.log('Response:', loginMissingRes.body);

  // 4. Probar bloqueo de cuenta
  console.log('\n4. Probando bloqueo por intentos fallidos (haciendo 5 intentos más fallidos con el mismo correo)...');
  for (let i = 0; i < 5; i++) {
    await request('POST', '/api/auth/login', { email: testEmail, password: 'wrongpassword' });
  }
  const lockoutRes = await request('POST', '/api/auth/login', { email: testEmail, password: 'wrongpassword' });
  console.log(`Status: ${lockoutRes.status}`);
  console.log('Response:', lockoutRes.body);
  
  console.log('\n--- INICIANDO PRUEBAS DE ENDPOINTS DE REGISTRO ---');
  
  const testEmailReg = `new_${Date.now()}@example.com`;

  // 5. Probar registro válido
  console.log('\n5. Probando registro válido...');
  const regSuccessRes = await request('POST', '/api/auth/register', { 
    name: 'Nuevo Usuario', 
    email: testEmailReg, 
    password: 'Password123!', 
    confirmPassword: 'Password123!' 
  });
  console.log(`Status: ${regSuccessRes.status}`);
  console.log('Response:', regSuccessRes.body);

  // 6. Probar registro con correo duplicado
  console.log('\n6. Probando registro con correo duplicado...');
  const regDuplicateRes = await request('POST', '/api/auth/register', { 
    name: 'Otro Usuario', 
    email: testEmailReg, 
    password: 'Password123!', 
    confirmPassword: 'Password123!' 
  });
  console.log(`Status: ${regDuplicateRes.status}`);
  console.log('Response:', regDuplicateRes.body);

  // 7. Probar validación de contraseña
  console.log('\n7. Probando registro con contraseña débil (sin número ni símbolo)...');
  const regWeakPassRes = await request('POST', '/api/auth/register', { 
    name: 'Usuario Débil', 
    email: `weak_${Date.now()}@example.com`, 
    password: 'weakpassword', 
    confirmPassword: 'weakpassword' 
  });
  console.log(`Status: ${regWeakPassRes.status}`);
  console.log('Response:', regWeakPassRes.body);

  console.log('\n--- PRUEBAS FINALIZADAS ---');
  
  await mongoose.disconnect();
};

runTests();
