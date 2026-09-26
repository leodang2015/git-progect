const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { authValidator } = require('../validators/auth.validator');
const { validarCampos } = require('../middlewares/validarCampos');

// Ruta de inicio de sesión
router.post('/login', authValidator, validarCampos, login);

module.exports = router;
