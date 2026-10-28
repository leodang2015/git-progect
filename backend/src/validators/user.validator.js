const { body, param, query } = require('express-validator');

const listUsersValidator = [
  query('q').optional().trim().isLength({ max: 100 }).withMessage('La búsqueda no puede superar 100 caracteres'),
  query('role').optional().isIn(['user', 'admin', 'stylist']).withMessage('El rol no es válido'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('El estado no es válido'),
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un entero mayor que 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un entero entre 1 y 100')
];

const stylistsByServiceValidator = [
  query('serviceName').trim().notEmpty().withMessage('El servicio es obligatorio')
    .isLength({ max: 100 }).withMessage('El servicio no puede superar 100 caracteres')
];

const updateWorkAreasValidator = [
  body('workAreas').isArray({ max: 20 }).withMessage('Registra hasta 20 zonas de trabajo'),
  body('workAreas.*').isString().trim().notEmpty()
    .withMessage('Cada zona de trabajo debe tener un nombre')
    .isLength({ max: 80 }).withMessage('Cada zona no puede superar 80 caracteres')
];

const createUserValidator = [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 100 }).withMessage('El nombre no puede superar 100 caracteres'),
  body('email').trim().isEmail().withMessage('El correo no tiene un formato válido'),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)
    .withMessage('La contraseña debe contener mayúscula, minúscula, número y símbolo'),
  body('role').optional().isIn(['user', 'admin', 'stylist']).withMessage('El rol no es válido'),
  body('specialty').optional().trim().isLength({ max: 120 }).withMessage('El oficio no puede superar 120 caracteres'),
  body('specialty').if(body('role').equals('stylist')).trim().notEmpty().withMessage('El oficio del peluquero es obligatorio'),
  body('serviceIds').if(body('role').equals('stylist')).isArray({ min: 1 }).withMessage('Asigna al menos un servicio al peluquero'),
  body('serviceIds').optional().isArray().withMessage('Los servicios deben enviarse como una lista'),
  body('serviceIds.*').isMongoId().withMessage('El id de servicio no es válido'),
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
  body('role').optional().isIn(['user', 'admin', 'stylist']).withMessage('El rol no es válido'),
  body('specialty').optional().trim().isLength({ max: 120 }).withMessage('El oficio no puede superar 120 caracteres'),
  body('specialty').if(body('role').equals('stylist')).trim().notEmpty().withMessage('El oficio del peluquero es obligatorio'),
  body('serviceIds').if(body('role').equals('stylist')).isArray({ min: 1 }).withMessage('Asigna al menos un servicio al peluquero'),
  body('serviceIds').optional().isArray().withMessage('Los servicios deben enviarse como una lista'),
  body('serviceIds.*').isMongoId().withMessage('El id de servicio no es válido'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('El estado no es válido')
];

const userIdValidator = [
  param('id').isMongoId().withMessage('El id de usuario no es válido')
];

module.exports = {
  listUsersValidator,
  stylistsByServiceValidator,
  updateWorkAreasValidator,
  createUserValidator,
  updateUserValidator,
  userIdValidator
};