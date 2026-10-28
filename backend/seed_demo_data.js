require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Service = require('./src/models/Service');
const Reservation = require('./src/models/Reservation');
const Activity = require('./src/models/Activity');

const demoUsers = [
  { name: 'Administrador Demo', email: 'admin@example.com', password: 'Demo123!', role: 'admin' },
  { name: 'Camila Torres', email: 'usuario@ejemplo.com', password: 'Demo123!', role: 'user' },
  { name: 'Diego Ramírez', email: 'diego@example.com', password: 'Demo123!', role: 'user' },
  { name: 'Valentina Cruz', email: 'valentina@example.com', password: 'Demo123!', role: 'user' },
  { name: 'Mateo Herrera', email: 'mateo@example.com', password: 'Demo123!', role: 'user' },
  { name: 'Laura Martínez', email: 'laura@example.com', password: 'Demo123!', role: 'user' },
  {
    name: 'Sofía Mendoza',
    email: 'sofia.mendoza@example.com',
    password: 'Demo123!',
    role: 'stylist',
    specialty: 'Colorista y especialista en mechas',
    serviceNames: ['Tinte / Colorimetría']
  },
  {
    name: 'Mateo Silva',
    email: 'mateo.silva@example.com',
    password: 'Demo123!',
    role: 'stylist',
    specialty: 'Corte, visagismo y estilo',
    serviceNames: ['Corte de cabello y peinado']
  },
  {
    name: 'Valentina Ruiz',
    email: 'valentina.ruiz@example.com',
    password: 'Demo123!',
    role: 'stylist',
    specialty: 'Manicura y pedicura spa',
    serviceNames: ['Manicura y pedicura spa']
  },
  {
    name: 'Camila Gómez',
    email: 'camila.gomez@example.com',
    password: 'Demo123!',
    role: 'stylist',
    specialty: 'Tratamientos capilares y blower',
    serviceNames: ['Cepillado y blower']
  },
  {
    name: 'Andrés Pardo',
    email: 'andres.pardo@example.com',
    password: 'Demo123!',
    role: 'stylist',
    specialty: 'Barbería y corte clásico',
    serviceNames: ['Corte de cabello y peinado']
  }
];

const demoServices = [
  {
    name: 'Corte de cabello y peinado',
    description: 'Asesoría de visagismo personalizada, lavado nutritivo y peinado profesional.',
    price: 30000,
    duration: 45,
    category: 'Cabello & Peinado'
  },
  {
    name: 'Cepillado y blower',
    description: 'Lavado capilar, protector térmico y secado profesional.',
    price: 25000,
    duration: 40,
    category: 'Peinados & Brillo'
  },
  {
    name: 'Tinte / Colorimetría',
    description: 'Diagnóstico de tono, aplicación de tinte y tratamiento sellador de color.',
    price: 90000,
    duration: 90,
    category: 'Color & Brillo'
  },
  {
    name: 'Manicura y pedicura spa',
    description: 'Exfoliación, hidratación, arreglo de cutículas y esmaltado.',
    price: 35000,
    duration: 50,
    category: 'Uñas & Spa'
  }
];

const seedDemoData = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/reservasDB');

  const services = [];
  for (const serviceData of demoServices) {
    let service = await Service.findOne({ name: serviceData.name });
    if (!service) service = await Service.create(serviceData);
    services.push(service);
  }

  const users = [];
  for (const userData of demoUsers) {
    const userPayload = { ...userData };
    if (userPayload.serviceNames) {
      userPayload.serviceIds = userPayload.serviceNames.map((name) => {
        const service = services.find((item) => item.name === name);
        if (!service) throw new Error(`No se encontró el servicio asignado: ${name}`);
        return service._id;
      });
      delete userPayload.serviceNames;
    }

    let user = await User.findOne({ email: userData.email });
    if (!user) {
      user = await User.create(userPayload);
    } else {
      for (const [field, value] of Object.entries(userPayload)) {
        if (field !== 'password') user[field] = value;
      }
      await user.save();
    }
    users.push(user);
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