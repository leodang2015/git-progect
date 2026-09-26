const { validationResult } = require('express-validator');

// Revisa si las reglas del validator (que corrieron antes en la cadena) encontraron errores.
// Si hay errores, corta la petición aquí con 400. Si no hay errores, deja pasar con next().
const validarCampos = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      mensaje: 'Error de validación',
      errores: errores.array().map((err) => ({
        campo: err.path,
        mensaje: err.msg,
      })),
    });
  }
  next();
};

module.exports = {
  validarCampos
};
