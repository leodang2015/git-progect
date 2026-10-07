const assert = require('node:assert/strict');
const test = require('node:test');
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