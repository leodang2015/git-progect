const { body, param, query } = require('express-validator');

const serviceIdValidator = [
  param('id').isMongoId().withMessage('El id del servicio no es válido')
];

const listServicesValidator = [
  query('q').optional().trim().isLength({ max: 100 }).withMessage('La búsqueda no puede superar 100 caracteres'),
  query('category').optional().trim().isLength({ max: 100 }).withMessage('La categoría no puede superar 100 caracteres'),
  query('isActive').optional().isIn(['true', 'false']).withMessage('El estado debe ser true o false'),
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un entero mayor que 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un entero entre 1 y 100')
];

const createServiceValidator = [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 100 }).withMessage('El nombre no puede superar 100 caracteres'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('La descripción no puede superar 1000 caracteres'),
  body('price').exists().withMessage('El precio es obligatorio').bail()
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0').toFloat(),
  body('duration').exists().withMessage('La duración es obligatoria').bail()
    .isInt({ min: 1 }).withMessage('La duración debe ser un número entero de minutos mayor que 0').toInt(),
  body('image').optional().isString().withMessage('La imagen debe ser texto').bail()
    .trim().isLength({ max: 2048 }).withMessage('La imagen no puede superar 2048 caracteres'),
  body('category').trim().notEmpty().withMessage('La categoría es obligatoria')
    .isLength({ max: 100 }).withMessage('La categoría no puede superar 100 caracteres'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('El estado debe ser true o false').toBoolean()
];

const updateServiceValidator = [
  ...serviceIdValidator,
  body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ max: 100 }).withMessage('El nombre no puede superar 100 caracteres'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('La descripción no puede superar 1000 caracteres'),
  body('price').optional().isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0').toFloat(),
  body('duration').optional().isInt({ min: 1 }).withMessage('La duración debe ser un número entero de minutos mayor que 0').toInt(),
  body('image').optional().isString().withMessage('La imagen debe ser texto').bail()
    .trim().isLength({ max: 2048 }).withMessage('La imagen no puede superar 2048 caracteres'),
  body('category').optional().trim().notEmpty().withMessage('La categoría no puede estar vacía')
    .isLength({ max: 100 }).withMessage('La categoría no puede superar 100 caracteres'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('El estado debe ser true o false').toBoolean()
];

module.exports = {
  listServicesValidator,
  createServiceValidator,
  updateServiceValidator,
  serviceIdValidator
};