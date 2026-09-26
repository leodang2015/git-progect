const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Función auxiliar para generar JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

// @desc    Autenticar usuario y obtener token
// @route   POST /api/auth/login
// @access  Público
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por correo electrónico
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas (correo o contraseña incorrectos)'
      });
    }

    // Comprobar si la cuenta está bloqueada
    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta bloqueada por demasiados intentos fallidos. Inténtelo más tarde.'
      });
    }

    // Comprobar si la contraseña coincide
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // Incrementar intentos de inicio de sesión
      user.loginAttempts += 1;
      
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = Date.now() + LOCK_TIME;
      }
      
      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas (correo o contraseña incorrectos)'
      });
    }

    // Inicio de sesión exitoso, restablecer intentos y lockUntil
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    // Enviar respuesta con token
    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor al intentar iniciar sesión'
    });
  }
};

module.exports = {
  login
};
