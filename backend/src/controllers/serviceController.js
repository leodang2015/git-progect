const Reservation = require('../models/Reservation');
const Service = require('../models/Service');

const editableFields = ['name', 'description', 'price', 'duration', 'image', 'category', 'isActive'];
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const serializeService = (service) => ({
  id: service._id,
  name: service.name,
  description: service.description,
  price: service.price,
  duration: service.duration,
  image: service.image,
  isActive: service.isActive,
  category: service.category,
  createdAt: service.createdAt,
  updatedAt: service.updatedAt
});

const handleError = (res, error, operation) => {
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ success: false, message: error.message });
  }

  console.error(`Error in ${operation}:`, error);
  return res.status(500).json({ success: false, message: 'Error interno del servidor' });
};

const listServices = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const filter = {};

    if (req.query.q) {
      const search = new RegExp(escapeRegExp(req.query.q.trim()), 'i');
      filter.$or = [{ name: search }, { description: search }, { category: search }];
    }
    if (req.query.category) filter.category = req.query.category.trim();
    if (req.user.role === 'admin') {
      if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    } else {
      filter.isActive = true;
    }

    const [services, total] = await Promise.all([
      Service.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Service.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: services.map(serializeService),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return handleError(res, error, 'listServices');
  }
};

const createService = async (req, res) => {
  try {
    const serviceData = {};
    for (const field of editableFields) {
      if (req.body[field] !== undefined) serviceData[field] = req.body[field];
    }

    const service = await Service.create(serviceData);
    return res.status(201).json({ success: true, data: serializeService(service) });
  } catch (error) {
    return handleError(res, error, 'createService');
  }
};

const updateService = async (req, res) => {
  try {
    const serviceData = {};
    for (const field of editableFields) {
      if (req.body[field] !== undefined) serviceData[field] = req.body[field];
    }

    if (Object.keys(serviceData).length === 0) {
      return res.status(400).json({ success: false, message: 'Debe enviar al menos un campo editable' });
    }

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }

    Object.assign(service, serviceData);
    await service.save();
    return res.json({ success: true, data: serializeService(service) });
  } catch (error) {
    return handleError(res, error, 'updateService');
  }
};

const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }

    if (await Reservation.exists({ service: service._id })) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar un servicio asociado a reservas; puede desactivarlo'
      });
    }

    await service.deleteOne();
    return res.json({ success: true, message: 'Servicio eliminado' });
  } catch (error) {
    return handleError(res, error, 'deleteService');
  }
};

module.exports = { listServices, createService, updateService, deleteService };