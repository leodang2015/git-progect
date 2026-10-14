const { body, query } = require('express-validator');

const listReservationsValidator = [
  query('user').optional().isMongoId().withMessage('El id del usuario no es válido'),
  query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed'])
    .withMessage('El estado de la reserva no es válido'),
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un entero mayor que 0'),
  query('limit').optional().isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un entero entre 1 y 100')
];

const createReservationValidator = [
  body('serviceId').exists().withMessage('El servicio es obligatorio').bail()
    .isMongoId().withMessage('El id del servicio no es válido'),
  body('date').exists().withMessage('La fecha y hora son obligatorias').bail()
    .isISO8601({ strict: true, strictSeparator: true }).withMessage('La fecha debe estar en formato ISO 8601').bail()
    .custom((value) => value.includes('T')).withMessage('La fecha debe incluir la hora').bail()
    .matches(/(?:Z|[+-]\d{2}:\d{2})$/).withMessage('La fecha debe incluir una zona horaria').bail()
    .toDate()
    .custom((value) => value > new Date()).withMessage('La fecha de la reserva debe ser futura')
];

module.exports = { listReservationsValidator, createReservationValidator };