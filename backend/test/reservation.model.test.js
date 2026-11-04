const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');
const Reservation = require('../src/models/Reservation');

test('Reservation guarda cliente, servicio, peluquero y datos del turno', async () => {
  const reservation = new Reservation({
    user: new mongoose.Types.ObjectId(),
    service: new mongoose.Types.ObjectId(),
    stylist: new mongoose.Types.ObjectId(),
    date: new Date('2026-11-10T12:00:00.000Z'),
    time: '10:30 AM',
    hairLength: 'Cabello largo',
    notes: 'Corte en capas',
    price: 30000
  });

  assert.equal(reservation.status, 'pending');
  await reservation.validate();
});

test('Reservation exige peluquero, fecha, hora y precio válidos', async () => {
  const reservation = new Reservation({
    user: new mongoose.Types.ObjectId(),
    service: new mongoose.Types.ObjectId(),
    stylist: new mongoose.Types.ObjectId(),
    date: new Date('2026-11-10T12:00:00.000Z'),
    time: '10:30 AM',
    hairLength: 'Cabello largo',
    price: -1,
    status: 'scheduled'
  });
  const error = await reservation.validate().then(() => null, validationError => validationError);

  assert.ok(error);
  assert.ok(error.errors.price);
  assert.ok(error.errors.status);

  reservation.price = 30000;
  reservation.stylist = undefined;
  const missingStylistError = await reservation.validate().then(() => null, validationError => validationError);
  assert.ok(missingStylistError.errors.stylist);
});
