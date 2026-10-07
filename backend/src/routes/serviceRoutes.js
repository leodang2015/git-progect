const express = require('express');
const { protect, admin } = require('../middlewares/authMiddleware');
const { validarCampos } = require('../middlewares/validarCampos');
const {
  listServicesValidator,
  createServiceValidator,
  updateServiceValidator,
  serviceIdValidator
} = require('../validators/service.validator');
const {
  listServices,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');

const router = express.Router();

router.get('/', protect, listServicesValidator, validarCampos, listServices);
router.post('/', protect, admin, createServiceValidator, validarCampos, createService);
router.put('/:id', protect, admin, updateServiceValidator, validarCampos, updateService);
router.delete('/:id', protect, admin, serviceIdValidator, validarCampos, deleteService);

module.exports = router;