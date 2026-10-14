const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Reservation = require('../src/models/Reservation');
const Service = require('../src/models/Service');
const { createReservation } = require('../src/controllers/reservationController');
const { createReservationValidator } = require('../src/validators/reservation.validator');

const validateReservationInput = async (body) => {
  const request = { body };
  for (const validator of createReservationValidator) {
    await validator.run(request);
  }
  return validationResult(request).array();
};

test('La validación acepta fecha futura con zona horaria explícita', async () => {
  const date = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const errors = await validateReservationInput({
    serviceId: new mongoose.Types.ObjectId().toString(),
    date
  });

  assert.deepEqual(errors, []);
});

test('La validación rechaza fecha sin zona horaria', async () => {
  const date = new Date(Date.now() + 60 * 60 * 1000).toISOString().replace(/Z$/, '');
  const errors = await validateReservationInput({
    serviceId: new mongoose.Types.ObjectId().toString(),
    date
  });

  assert.ok(errors.some((error) => error.msg === 'La fecha debe incluir una zona horaria'));
});

test('Reservation valida referencias, intervalo y estado pendiente por defecto', async () => {
  const startDate = new Date('2026-10-15T14:30:00.000Z');
  const reservation = new Reservation({
    user: new mongoose.Types.ObjectId(),
    service: new mongoose.Types.ObjectId(),
    date: startDate,
    endDate: new Date(startDate.getTime() + 30 * 60 * 1000)
  });

  assert.equal(reservation.status, 'pending');
  await reservation.validate();
});

test('Reservation rechaza un final anterior o igual al inicio', async () => {
  const startDate = new Date('2026-10-15T14:30:00.000Z');
  const reservation = new Reservation({
    user: new mongoose.Types.ObjectId(),
    service: new mongoose.Types.ObjectId(),
    date: startDate,
    endDate: startDate
  });
  const error = await reservation.validate().then(() => null, (validationError) => validationError);

  assert.ok(error);
  assert.ok(error.errors.endDate);
});

test('POST reserva calcula el final a partir de la duración y el usuario autenticado', async () => {
  const originalFindById = Service.findById;
  const originalExists = Reservation.exists;
  const originalCreate = Reservation.create;
  const service = { _id: new mongoose.Types.ObjectId(), duration: 45, isActive: true };
  const userId = new mongoose.Types.ObjectId();
  const startDate = new Date('2026-10-15T14:30:00.000Z');
  let createdReservation;
  let responseStatus;
  let responseBody;

  Service.findById = async () => service;
  Reservation.exists = async () => null;
  Reservation.create = async (data) => {
    createdReservation = data;
    return data;
  };

  try {
    await createReservation(
      { body: { serviceId: service._id, date: startDate }, user: { _id: userId } },
      {
        status(status) {
          responseStatus = status;
          return this;
        },
        json(body) {
          responseBody = body;
          return this;
        }
      }
    );
  } finally {
    Service.findById = originalFindById;
    Reservation.exists = originalExists;
    Reservation.create = originalCreate;
  }

  assert.equal(responseStatus, 201);
  assert.equal(responseBody.success, true);
  assert.equal(createdReservation.user, userId);
  assert.equal(createdReservation.endDate.getTime(), startDate.getTime() + 45 * 60 * 1000);
});

test('POST reserva responde conflicto y no inserta cuando el horario se cruza', async () => {
  const originalFindById = Service.findById;
  const originalExists = Reservation.exists;
  const originalCreate = Reservation.create;
  const service = { _id: new mongoose.Types.ObjectId(), duration: 30, isActive: true };
  let responseStatus;
  let createCalled = false;

  Service.findById = async () => service;
  Reservation.exists = async () => ({ _id: new mongoose.Types.ObjectId() });
  Reservation.create = async () => {
    createCalled = true;
  };

  try {
    await createReservation(
      { body: { serviceId: service._id, date: new Date('2026-10-15T14:30:00.000Z') }, user: { _id: new mongoose.Types.ObjectId() } },
      {
        status(status) {
          responseStatus = status;
          return this;
        },
        json() {
          return this;
        }
      }
    );
  } finally {
    Service.findById = originalFindById;
    Reservation.exists = originalExists;
    Reservation.create = originalCreate;
  }

  assert.equal(responseStatus, 409);
  assert.equal(createCalled, false);
});