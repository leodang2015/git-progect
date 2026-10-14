const Reservation = require('../models/Reservation');
const Service = require('../models/Service');

const listReservations = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const isAdmin = req.user.role === 'admin';
    const requestedUser = req.query.user;

    if (!isAdmin && requestedUser && requestedUser !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'No puedes consultar reservas de otro usuario' });
    }

    const filter = {};
    if (isAdmin && requestedUser) filter.user = requestedUser;
    if (!isAdmin) filter.user = req.user._id;
    if (req.query.status) filter.status = req.query.status;

    const [reservations, total] = await Promise.all([
      Reservation.find(filter)
        .populate('user', 'name email phone')
        .populate('service', 'name price duration category')
        .sort({ date: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Reservation.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: reservations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.error('Error in listReservations:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

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

module.exports = { listReservations, createReservation };