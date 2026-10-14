const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { validarCampos } = require('../middlewares/validarCampos');
const { listReservationsValidator, createReservationValidator } = require('../validators/reservation.validator');
const { listReservations, createReservation } = require('../controllers/reservationController');

const router = express.Router();

router.get('/', protect, listReservationsValidator, validarCampos, listReservations);
router.post('/', protect, createReservationValidator, validarCampos, createReservation);

module.exports = router;