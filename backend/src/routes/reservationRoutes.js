const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { validarCampos } = require('../middlewares/validarCampos');
const {
	listReservationsValidator,
	createReservationValidator,
	updateReservationValidator
} = require('../validators/reservation.validator');
const { listReservations, createReservation, updateReservation } = require('../controllers/reservationController');

const router = express.Router();

router.get('/', protect, listReservationsValidator, validarCampos, listReservations);
router.post('/', protect, createReservationValidator, validarCampos, createReservation);
router.put('/:id', protect, updateReservationValidator, validarCampos, updateReservation);

module.exports = router;