const assert = require('node:assert/strict');
const test = require('node:test');
const Service = require('../src/models/Service');

test('Service admite los campos de tarjeta y usa estado activo por defecto', async () => {
  const service = new Service({
    name: 'Corte clásico',
    description: 'Corte tradicional',
    price: 25,
    duration: 30,
    image: '/images/corte.jpg',
    category: 'Peluquería'
  });

  assert.equal(service.isActive, true);
  await service.validate();
});

test('Service rechaza precio negativo, duración no positiva y duración fraccionaria', async () => {
  const service = new Service({
    name: 'Servicio inválido',
    price: -1,
    duration: 0,
    category: 'General'
  });
  const error = await service.validate().then(() => null, (validationError) => validationError);

  assert.ok(error);
  assert.ok(error.errors.price);
  assert.ok(error.errors.duration);

  service.price = 10;
  service.duration = 1.5;
  const fractionalDurationError = await service.validate().then(() => null, (validationError) => validationError);
  assert.ok(fractionalDurationError.errors.duration);
});