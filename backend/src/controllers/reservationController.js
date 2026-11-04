const crypto = require('crypto');
const Reservation = require('../models/Reservation');
const Service = require('../models/Service');
const User = require('../models/User');

const activeStatuses = ['pending', 'confirmed'];

const serializeReservation = (reservation) => {
  const service = reservation.service && typeof reservation.service === 'object' ? reservation.service : null;
  const stylist = reservation.stylist && typeof reservation.stylist === 'object' ? reservation.stylist : null;
  const user = reservation.user && typeof reservation.user === 'object' ? reservation.user : null;

  return {
    id: reservation.reservationCode || String(reservation._id),
    mongoId: String(reservation._id),
    serviceId: service ? String(service._id) : String(reservation.service),
    serviceName: service?.name || 'Servicio de belleza',
    stylistId: stylist ? String(stylist._id) : String(reservation.stylist),
    stylistName: stylist?.name || 'Peluquero',
    userId: user ? String(user._id) : String(reservation.user),
    userName: user?.name || 'Cliente',
    userEmail: user?.email || '',
    date: reservation.date.toISOString().slice(0, 10),
    time: reservation.time,
    hairLength: reservation.hairLength,
    notes: reservation.notes,
    price: reservation.price,
    status: reservation.status,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt
  };
};

const handleError = (res, error, operation) => {
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: 'Ya existe una cita para ese horario.' });
  }

  console.error(`Error in ${operation}:`, error);
  return res.status(500).json({ success: false, message: 'Error interno al gestionar las citas.' });
};

const populateReservation = (query) => query
  .populate('user', 'name email')
  .populate('service', 'name')
  .populate('stylist', 'name');

const listReservations = async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? {}
      : req.user.role === 'stylist'
        ? { stylist: req.user._id }
        : { user: req.user._id };

    const reservations = await populateReservation(
      Reservation.find(filter).sort({ date: 1, time: 1, createdAt: -1 })
    );

    return res.json({
      success: true,
      data: reservations.map(serializeReservation)
    });
  } catch (error) {
    return handleError(res, error, 'listReservations');
  }
};

const createReservation = async (req, res) => {
  try {
    const service = await Service.findOne({ name: req.body.serviceName.trim(), isActive: true });
    if (!service) {
      return res.status(404).json({ success: false, message: 'El servicio no está disponible en MongoDB.' });
    }

    const stylist = await User.findOne({
      _id: req.body.stylistId,
      role: 'stylist',
      status: 'active',
      serviceIds: service._id,
      workAreas: req.body.hairLength.trim()
    }).select('_id');
    if (!stylist) {
      return res.status(404).json({ success: false, message: 'El peluquero no está disponible para ese servicio y zona.' });
    }

    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
    if (req.body.date < today) {
      return res.status(400).json({ success: false, message: 'La fecha de atención no puede estar en el pasado.' });
    }

    const appointmentDate = new Date(`${req.body.date}T12:00:00.000Z`);
    const conflict = await Reservation.exists({
      stylist: stylist._id,
      date: appointmentDate,
      time: req.body.time,
      status: { $in: activeStatuses }
    });
    if (conflict) {
      return res.status(409).json({ success: false, message: 'Ese peluquero ya tiene una cita reservada en ese horario.' });
    }

    const reservation = await Reservation.create({
      reservationCode: `RES-${req.body.date.slice(0, 4)}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      user: req.user._id,
      service: service._id,
      stylist: stylist._id,
      date: appointmentDate,
      time: req.body.time,
      hairLength: req.body.hairLength.trim(),
      notes: req.body.notes?.trim() || 'Sin especificaciones',
      price: service.price,
      status: 'pending'
    });

    const populatedReservation = await populateReservation(Reservation.findById(reservation._id));
    return res.status(201).json({ success: true, data: serializeReservation(populatedReservation) });
  } catch (error) {
    return handleError(res, error, 'createReservation');
  }
};

const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'La cita no existe.' });
    }

    const isOwner = String(reservation.user) === String(req.user._id);
    const isAssignedStylist = req.user.role === 'stylist' && String(reservation.stylist) === String(req.user._id);
    if (!isOwner && !isAssignedStylist && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'No tienes permiso para cancelar esta cita.' });
    }
    if (!activeStatuses.includes(reservation.status)) {
      return res.status(409).json({ success: false, message: 'Solo se pueden cancelar citas pendientes o confirmadas.' });
    }

    reservation.status = 'cancelled';
    await reservation.save();
    const populatedReservation = await populateReservation(Reservation.findById(reservation._id));
    return res.json({ success: true, data: serializeReservation(populatedReservation) });
  } catch (error) {
    return handleError(res, error, 'cancelReservation');
  }
};

module.exports = { listReservations, createReservation, cancelReservation };
