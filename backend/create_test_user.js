const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const createTestUser = async () => {
  try {
    console.log('Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/reservasDB');

    const email = 'admin@example.com';
    const password = 'password123';

    // Eliminar si ya existe para evitar errores
    await User.deleteOne({ email });

    // Crear el usuario
    const user = await User.create({ email, password });
    
    console.log(`\n¡Usuario creado con éxito!`);
    console.log(`-------------------------`);
    console.log(`Correo: ${email}`);
    console.log(`Contraseña: ${password}`);
    console.log(`-------------------------\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    process.exit(1);
  }
};

createTestUser();
