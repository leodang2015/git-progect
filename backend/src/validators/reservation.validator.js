const { body } = require('express-validator');

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

module.exports = { createReservationValidator };