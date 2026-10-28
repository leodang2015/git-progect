const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');
const User = require('../src/models/User');

test('User usa el estado activo por defecto y admite datos válidos', async () => {
  const user = new User({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'StrongPass1!'
  });

  assert.equal(user.status, 'active');
  assert.equal(user.role, 'user');
  await user.validate();
});

test('User admite peluqueros con oficio y servicios asignados', async () => {
  const user = new User({
    name: 'Sofía Mendoza',
    email: 'sofia@example.com',
    password: 'StrongPass1!',
    role: 'stylist',
    specialty: 'Colorista',
    serviceIds: [new mongoose.Types.ObjectId()],
    workAreas: ['Cabello largo', 'Barba']
  });

  await user.validate();
  assert.deepEqual(user.workAreas, ['Cabello largo', 'Barba']);
});

test('User exige oficio y al menos un servicio para el rol peluquero', async () => {
  const user = new User({
    name: 'Sofía Mendoza',
    email: 'sofia@example.com',
    password: 'StrongPass1!',
    role: 'stylist'
  });
  const error = await user.validate().then(() => null, (validationError) => validationError);

  assert.ok(error);
  assert.ok(error.errors.specialty);
  assert.ok(error.errors.serviceIds);
});

test('User limita las zonas de trabajo a 20 y rechaza valores vacíos', async () => {
  const user = new User({
    name: 'Sofía Mendoza',
    email: 'sofia@example.com',
    password: 'StrongPass1!',
    role: 'stylist',
    specialty: 'Colorista',
    serviceIds: [new mongoose.Types.ObjectId()],
    workAreas: Array(21).fill('Cabello')
  });
  const error = await user.validate().then(() => null, (validationError) => validationError);

  assert.ok(error);
  assert.ok(error.errors.workAreas);

  user.workAreas = [''];
  const emptyAreaError = await user.validate().then(() => null, (validationError) => validationError);
  assert.ok(emptyAreaError);
  assert.ok(emptyAreaError.errors.workAreas);
});

test('User rechaza estados y roles fuera de las opciones permitidas', async () => {
  const user = new User({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'StrongPass1!',
    role: 'owner',
    status: 'pending'
  });
  const error = await user.validate().then(() => null, (validationError) => validationError);

  assert.ok(error);
  assert.ok(error.errors.role);
  assert.ok(error.errors.status);
});