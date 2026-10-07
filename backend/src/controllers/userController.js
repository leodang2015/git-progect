const User = require('../models/User');

const publicUserFields = 'name email role status createdAt updatedAt';
const editableFields = ['name', 'email', 'password', 'role', 'status'];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const handleError = (res, error, operation) => {
  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: 'Ya existe un usuario con ese correo' });
  }

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ success: false, message: error.message });
  }

  console.error(`Error in ${operation}:`, error);
  return res.status(500).json({ success: false, message: 'Error interno del servidor' });
};

const listUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const filter = {};

    if (req.query.q) {
      const search = new RegExp(escapeRegExp(req.query.q.trim()), 'i');
      filter.$or = [{ name: search }, { email: search }];
    }
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.status = req.query.status;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(publicUserFields)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: users.map(serializeUser),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return handleError(res, error, 'listUsers');
  }
};

const createUser = async (req, res) => {
  try {
    const userData = {};
    for (const field of editableFields) {
      if (req.body[field] !== undefined) userData[field] = req.body[field];
    }

    const user = await User.create(userData);
    return res.status(201).json({ success: true, data: serializeUser(user) });
  } catch (error) {
    return handleError(res, error, 'createUser');
  }
};

const updateUser = async (req, res) => {
  try {
    const userData = {};
    for (const field of editableFields) {
      if (req.body[field] !== undefined) userData[field] = req.body[field];
    }

    if (Object.keys(userData).length === 0) {
      return res.status(400).json({ success: false, message: 'Debe enviar al menos un campo editable' });
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    Object.assign(user, userData);
    await user.save();
    return res.json({ success: true, data: serializeUser(user) });
  } catch (error) {
    return handleError(res, error, 'updateUser');
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    return res.json({ success: true, message: 'Usuario eliminado' });
  } catch (error) {
    return handleError(res, error, 'deleteUser');
  }
};

module.exports = { listUsers, createUser, updateUser, deleteUser };