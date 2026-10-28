const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Obtener el token del header
      token = req.headers.authorization.split(' ')[1];

      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obtener el usuario del token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'No autorizado, token fallido' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'No autorizado, no hay token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'No autorizado como administrador' });
  }
};

const stylist = (req, res, next) => {
  if (req.user && req.user.role === 'stylist') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Esta opción es exclusiva para peluqueros' });
  }
};

module.exports = { protect, admin, stylist };
