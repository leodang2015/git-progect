const { body, param } = require('express-validator');

const createReservationValidator = [
  body('serviceName').isString().trim().notEmpty().withMessage('El servicio es obligatorio')
    .isLength({ max: 100 }).withMessage('El nombre del servicio no puede superar 100 caracteres'),
  body('stylistId').isMongoId().withMessage('El peluquero no es válido'),
  body('date').isISO8601({ strict: true, strictSeparator: true }).withMessage('La fecha no es válida'),
  body('time').matches(/^(0[1-9]|1[0-2]):[0-5]\d (AM|PM)$/).withMessage('La hora no es válida'),
  body('hairLength').isString().trim().notEmpty().withMessage('La zona de trabajo es obligatoria')
    .isLength({ max: 80 }).withMessage('La zona no puede superar 80 caracteres'),
  body('notes').optional().isString().trim().isLength({ max: 1000 })
    .withMessage('Las observaciones no pueden superar 1000 caracteres')
];

const reservationIdValidator = [
  param('id').isMongoId().withMessage('El id de la cita no es válido')
];

module.exports = { createReservationValidator, reservationIdValidator };
