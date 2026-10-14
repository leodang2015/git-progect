const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Reservation = require('../src/models/Reservation');
const Service = require('../src/models/Service');
const { listReservations, createReservation, updateReservation } = require('../src/controllers/reservationController');
const {
  listReservationsValidator,
  createReservationValidator,
  updateReservationValidator
} = require('../src/validators/reservation.validator');

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

const validateReservationUpdateInput = async (params, body) => {
  const request = { params, body };
  for (const validator of updateReservationValidator) {
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

test('La validación de PUT acepta fecha futura con zona horaria e id válido', async () => {
  const errors = await validateReservationUpdateInput(
    { id: new mongoose.Types.ObjectId().toString() },
    { date: new Date(Date.now() + 60 * 60 * 1000).toISOString() }
  );

  assert.deepEqual(errors, []);
});

test('La validación de PUT rechaza id inválido, fecha sin zona y servicio inválido', async () => {
  const date = new Date(Date.now() + 60 * 60 * 1000).toISOString().replace(/Z$/, '');
  const errors = await validateReservationUpdateInput(
    { id: 'invalid' },
    { date, serviceId: 'invalid' }
  );

  assert.equal(errors.length, 3);
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

test('PUT actualiza fecha y fin, excluye la reserva actual y protege estados terminales en MongoDB', async () => {
  const originalFindById = Reservation.findById;
  const originalExists = Reservation.exists;
  const originalFindOneAndUpdate = Reservation.findOneAndUpdate;
  const originalServiceFindById = Service.findById;
  const reservationId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const serviceId = new mongoose.Types.ObjectId();
  const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const reservation = {
    _id: reservationId,
    user: userId,
    service: serviceId,
    date: new Date(Date.now() + 12 * 60 * 60 * 1000),
    status: 'confirmed'
  };
  const service = { _id: serviceId, duration: 60, isActive: true };
  let conflictFilter;
  let updateFilter;
  let updateData;
  let updateOptions;
  const response = createMockResponse();

  Reservation.findById = async () => reservation;
  Reservation.exists = async (filter) => {
    conflictFilter = filter;
    return null;
  };
  Service.findById = async () => service;
  Reservation.findOneAndUpdate = async (filter, update, options) => {
    updateFilter = filter;
    updateData = update.$set;
    updateOptions = options;
    return { ...reservation, ...update.$set };
  };

  try {
    await updateReservation({
      params: { id: reservationId.toString() },
      body: { date: startDate },
      user: { _id: userId, role: 'user' }
    }, response);
  } finally {
    Reservation.findById = originalFindById;
    Reservation.exists = originalExists;
    Reservation.findOneAndUpdate = originalFindOneAndUpdate;
    Service.findById = originalServiceFindById;
  }

  assert.equal(response.statusCode, 200);
  assert.equal(conflictFilter._id.$ne, reservationId);
  assert.equal(conflictFilter.date.$lt.getTime(), startDate.getTime() + 60 * 60 * 1000);
  assert.equal(conflictFilter.endDate.$gt.getTime(), startDate.getTime());
  assert.deepEqual(updateFilter.status, { $nin: ['cancelled', 'completed'] });
  assert.equal(updateFilter.user, userId);
  assert.equal(updateData.date, startDate);
  assert.equal(updateData.endDate.getTime(), startDate.getTime() + 60 * 60 * 1000);
  assert.deepEqual(updateOptions, { new: true, runValidators: true });
});

test('PUT no modifica reservas canceladas o finalizadas', async (context) => {
  const originalFindById = Reservation.findById;
  const originalFindOneAndUpdate = Reservation.findOneAndUpdate;
  const originalServiceFindById = Service.findById;
  const originalExists = Reservation.exists;
  const userId = new mongoose.Types.ObjectId();
  let updateCalled = false;
  let serviceLookupCalled = false;
  let conflictLookupCalled = false;

  Reservation.findOneAndUpdate = async () => {
    updateCalled = true;
  };
  Service.findById = async () => {
    serviceLookupCalled = true;
  };
  Reservation.exists = async () => {
    conflictLookupCalled = true;
  };

  try {
    for (const status of ['cancelled', 'completed']) {
      Reservation.findById = async () => ({
        _id: new mongoose.Types.ObjectId(),
        user: userId,
        service: new mongoose.Types.ObjectId(),
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status
      });
      const response = createMockResponse();

      await updateReservation({
        params: { id: new mongoose.Types.ObjectId().toString() },
        body: { date: new Date(Date.now() + 48 * 60 * 60 * 1000) },
        user: { _id: userId, role: 'user' }
      }, response);

      assert.equal(response.statusCode, 409);
    }
  } finally {
    Reservation.findById = originalFindById;
    Reservation.findOneAndUpdate = originalFindOneAndUpdate;
    Service.findById = originalServiceFindById;
    Reservation.exists = originalExists;
  }

  assert.equal(updateCalled, false);
  assert.equal(serviceLookupCalled, false);
  assert.equal(conflictLookupCalled, false);
});

test('PUT rechaza un nuevo horario ocupado antes de actualizar', async () => {
  const originalFindById = Reservation.findById;
  const originalExists = Reservation.exists;
  const originalFindOneAndUpdate = Reservation.findOneAndUpdate;
  const originalServiceFindById = Service.findById;
  const userId = new mongoose.Types.ObjectId();
  const serviceId = new mongoose.Types.ObjectId();
  let updateCalled = false;

  Reservation.findById = async () => ({
    _id: new mongoose.Types.ObjectId(),
    user: userId,
    service: serviceId,
    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: 'pending'
  });
  Service.findById = async () => ({ _id: serviceId, duration: 30, isActive: true });
  Reservation.exists = async () => ({ _id: new mongoose.Types.ObjectId() });
  Reservation.findOneAndUpdate = async () => {
    updateCalled = true;
  };
  const response = createMockResponse();

  try {
    await updateReservation({
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { date: new Date(Date.now() + 48 * 60 * 60 * 1000) },
      user: { _id: userId, role: 'user' }
    }, response);
  } finally {
    Reservation.findById = originalFindById;
    Reservation.exists = originalExists;
    Reservation.findOneAndUpdate = originalFindOneAndUpdate;
    Service.findById = originalServiceFindById;
  }

  assert.equal(response.statusCode, 409);
  assert.equal(updateCalled, false);
});