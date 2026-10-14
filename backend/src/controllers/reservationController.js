const Reservation = require('../models/Reservation');
const Service = require('../models/Service');

const createReservation = async (req, res) => {
  try {
    const service = await Service.findById(req.body.serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado o inactivo' });
    }

    const startDate = req.body.date;
    const endDate = new Date(startDate.getTime() + service.duration * 60 * 1000);
    const conflictingReservation = await Reservation.exists({
      status: { $in: ['pending', 'confirmed'] },
      date: { $lt: endDate },
      endDate: { $gt: startDate }
    });

    if (conflictingReservation) {
      return res.status(409).json({ success: false, message: 'El horario seleccionado no está disponible' });
    }

    const reservation = await Reservation.create({
      user: req.user._id,
      service: service._id,
      date: startDate,
      endDate
    });

    return res.status(201).json({ success: true, data: reservation });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.error('Error in createReservation:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = { createReservation };