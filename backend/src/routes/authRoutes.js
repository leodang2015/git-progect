const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authController');
const { authValidator, registerValidator } = require('../validators/auth.validator');
const { validarCampos } = require('../middlewares/validarCampos');

// Ruta de inicio de sesión
router.post('/login', authValidator, validarCampos, login);

// Ruta de registro
router.post('/register', registerValidator, validarCampos, register);

module.exports = router;
