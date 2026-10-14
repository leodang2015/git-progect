const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { validarCampos } = require('../middlewares/validarCampos');
const { createReservationValidator } = require('../validators/reservation.validator');
const { createReservation } = require('../controllers/reservationController');

const router = express.Router();

router.post('/', protect, createReservationValidator, validarCampos, createReservation);

module.exports = router;