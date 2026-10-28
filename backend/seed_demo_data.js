require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./src/models/Service');

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

  console.log('Servicios de demostración listos en MongoDB.');
};

seedDemoData()
  .catch((error) => {
    console.error('No se pudieron cargar los datos de demostración:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());