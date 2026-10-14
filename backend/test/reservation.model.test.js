const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Reservation = require('../src/models/Reservation');
const Service = require('../src/models/Service');
const { listReservations, createReservation } = require('../src/controllers/reservationController');
const { listReservationsValidator, createReservationValidator } = require('../src/validators/reservation.validator');

const validateReservationInput = async (body) => {
  const request = { body };
  for (const validator of createReservationValidator) {
    await validator.run(request);
  }
  return validationResult(request).array();
};

const validateReservationListQuery = async (query) => {
  const request = { query };
  for (const validator of listReservationsValidator) {
    await validator.run(request);
  }
  return validationResult(request).array();
};

const createMockResponse = () => ({
  statusCode: 200,
  body: null,
  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

test('La validación de listado acepta filtros y paginación válidos', async () => {
  const errors = await validateReservationListQuery({
    user: new mongoose.Types.ObjectId().toString(),
    status: 'confirmed',
    page: '2',
    limit: '50'
  });

  assert.deepEqual(errors, []);
});

test('La validación de listado rechaza usuario, estado y límite inválidos', async () => {
  const errors = await validateReservationListQuery({ user: 'invalid', status: 'unknown', limit: '101' });

  assert.equal(errors.length, 3);
});

test('GET lista filtra por usuario y estado y popula campos públicos', async () => {
  const originalFind = Reservation.find;
  const originalCountDocuments = Reservation.countDocuments;
  const requestedUser = new mongoose.Types.ObjectId().toString();
  const reservations = [{ _id: new mongoose.Types.ObjectId() }];
  const populateFields = [];
  let capturedFilter;
  let capturedSkip;
  let capturedLimit;
  const query = {
    populate(path, fields) {
      populateFields.push([path, fields]);
      return this;
    },
    sort() {
      return this;
    },
    skip(value) {
      capturedSkip = value;
      return this;
    },
    limit(value) {
      capturedLimit = value;
      return this;
    },
    lean() {
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(reservations).then(resolve, reject);
    }
  };
  const response = createMockResponse();

  Reservation.find = (filter) => {
    capturedFilter = filter;
    return query;
  };
  Reservation.countDocuments = async () => 8;

  try {
    await listReservations({
      query: { user: requestedUser, status: 'confirmed', page: '2', limit: '5' },
      user: { _id: new mongoose.Types.ObjectId(), role: 'admin' }
    }, response);
  } finally {
    Reservation.find = originalFind;
    Reservation.countDocuments = originalCountDocuments;
  }

  assert.deepEqual(capturedFilter, { user: requestedUser, status: 'confirmed' });
  assert.deepEqual(populateFields, [
    ['user', 'name email phone'],
    ['service', 'name price duration category']
  ]);
  assert.equal(capturedSkip, 5);
  assert.equal(capturedLimit, 5);
  assert.equal(response.body.data, reservations);
  assert.deepEqual(response.body.pagination, { page: 2, limit: 5, total: 8, totalPages: 2 });
});

test('GET restringe usuarios normales a sus propias reservas', async () => {
  const originalFind = Reservation.find;
  const originalCountDocuments = Reservation.countDocuments;
  const ownUserId = new mongoose.Types.ObjectId();
  const query = new mongoose.Types.ObjectId().toString();
  let findCalled = false;
  const response = createMockResponse();

  Reservation.find = () => {
    findCalled = true;
    throw new Error('No debe consultar reservas de otros usuarios');
  };

  try {
    await listReservations({
      query: { user: query },
      user: { _id: ownUserId, role: 'user' }
    }, response);
  } finally {
    Reservation.find = originalFind;
    Reservation.countDocuments = originalCountDocuments;
  }

  assert.equal(response.statusCode, 403);
  assert.equal(findCalled, false);
});

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