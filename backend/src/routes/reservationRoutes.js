const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { validarCampos } = require('../middlewares/validarCampos');
const {
  listReservations,
  createReservation,
  cancelReservation
} = require('../controllers/reservationController');
const {
  createReservationValidator,
  reservationIdValidator
} = require('../validators/reservation.validator');

const router = express.Router();

router.use(protect);
router.get('/', listReservations);
router.post('/', createReservationValidator, validarCampos, createReservation);
router.patch('/:id/cancel', reservationIdValidator, validarCampos, cancelReservation);

module.exports = router;
