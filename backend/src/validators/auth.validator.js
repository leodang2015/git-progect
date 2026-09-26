const { body } = require('express-validator');

// Reglas para Iniciar Sesión
const authValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('El correo electrónico es obligatorio')
    .isEmail().withMessage('Por favor, añade un correo electrónico válido'),
  body('password')
    .trim()
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

module.exports = {
  authValidator
};
