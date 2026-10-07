require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Service = require('./src/models/Service');
const Reservation = require('./src/models/Reservation');
const Activity = require('./src/models/Activity');

const demoUsers = [
  { name: 'Administrador Demo', email: 'admin@example.com', password: 'Demo123!', role: 'admin' },
  { name: 'Camila Torres', email: 'camila@example.com', password: 'Demo123!', role: 'user' },
  { name: 'Diego Ramírez', email: 'diego@example.com', password: 'Demo123!', role: 'user' },
  { name: 'Valentina Cruz', email: 'valentina@example.com', password: 'Demo123!', role: 'user' },
  { name: 'Mateo Herrera', email: 'mateo@example.com', password: 'Demo123!', role: 'user' }
];

const demoServices = [
  { name: 'Sala Norte', description: 'Espacio para reuniones y eventos', price: 120000 },
  { name: 'Catering empresarial', description: 'Servicio de alimentos para eventos', price: 85000 },
  { name: 'Sala de juntas', description: 'Sala equipada para reuniones', price: 95000 },
  { name: 'Equipo audiovisual', description: 'Proyector y sistema de sonido', price: 60000 }
];

const seedDemoData = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/reservasDB');

  const users = [];
  for (const userData of demoUsers) {
    let user = await User.findOne({ email: userData.email });
    if (!user) user = await User.create(userData);
    users.push(user);
  }

  const services = [];
  for (const serviceData of demoServices) {
    let service = await Service.findOne({ name: serviceData.name });
    if (!service) service = await Service.create(serviceData);
    services.push(service);
  }

  if (await Reservation.countDocuments() === 0) {
    const minutesAgo = [8, 24, 60, 120];
    const statuses = ['pending', 'confirmed', 'pending', 'completed'];
    const reservations = minutesAgo.map((minutes, index) => {
      const createdAt = new Date(Date.now() - minutes * 60000);
      return {
        user: users[index + 1]._id,
        service: services[index]._id,
        date: new Date(Date.now() + (index + 1) * 86400000),
        status: statuses[index],
        createdAt,
        updatedAt: createdAt
      };
    });
    await Reservation.create(reservations);
  }

  if (await Activity.countDocuments() === 0) {
    const activityTime = new Date();
    const activities = [
      { user: users[1]._id, description: `Creó una reserva para ${services[0].name}` },
      { user: users[2]._id, description: `Solicitó el servicio ${services[1].name}` },
      { user: users[3]._id, description: `Confirmó una reserva para ${services[2].name}` },
      { user: users[4]._id, description: 'Actualizó sus datos de perfil' }
    ].map((activity) => ({ ...activity, createdAt: activityTime, updatedAt: activityTime }));
    await Activity.insertMany(activities);
  }

  console.log('Datos de demostración listos en MongoDB.');
  console.log('Acceso administrador: admin@example.com / Demo123!');
};

seedDemoData()
  .catch((error) => {
    console.error('No se pudieron cargar los datos de demostración:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());