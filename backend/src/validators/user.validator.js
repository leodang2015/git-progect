const { body, param, query } = require('express-validator');

const listUsersValidator = [
  query('q').optional().trim().isLength({ max: 100 }).withMessage('La búsqueda no puede superar 100 caracteres'),
  query('role').optional().isIn(['user', 'admin']).withMessage('El rol no es válido'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('El estado no es válido'),
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un entero mayor que 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un entero entre 1 y 100')
];

const createUserValidator = [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 100 }).withMessage('El nombre no puede superar 100 caracteres'),
  body('email').trim().isEmail().withMessage('El correo no tiene un formato válido'),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)
    .withMessage('La contraseña debe contener mayúscula, minúscula, número y símbolo'),
  body('role').optional().isIn(['user', 'admin']).withMessage('El rol no es válido'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('El estado no es válido')
];

const updateUserValidator = [
  param('id').isMongoId().withMessage('El id de usuario no es válido'),
  body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ max: 100 }).withMessage('El nombre no puede superar 100 caracteres'),
  body('email').optional().trim().isEmail().withMessage('El correo no tiene un formato válido'),
  body('password').optional().isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)
    .withMessage('La contraseña debe contener mayúscula, minúscula, número y símbolo'),
  body('role').optional().isIn(['user', 'admin']).withMessage('El rol no es válido'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('El estado no es válido')
];

const userIdValidator = [
  param('id').isMongoId().withMessage('El id de usuario no es válido')
];

module.exports = {
  listUsersValidator,
  createUserValidator,
  updateUserValidator,
  userIdValidator
};