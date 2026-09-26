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

// Reglas para Registro
const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre completo es obligatorio'),
  body('email')
    .trim()
    .notEmpty().withMessage('El correo electrónico es obligatorio')
    .isEmail().withMessage('Por favor, añade un correo electrónico válido'),
  body('password')
    .trim()
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un símbolo'),
  body('confirmPassword')
    .trim()
    .notEmpty().withMessage('La confirmación de la contraseña es obligatoria')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
  body('termsAccepted')
    .optional()
    .isBoolean().withMessage('El formato de términos debe ser un valor booleano')
    .custom((value) => {
      if (value !== true && value !== 'true') {
        throw new Error('Debe aceptar los términos y condiciones');
      }
      return true;
    })
];

module.exports = {
  authValidator,
  registerValidator
};
