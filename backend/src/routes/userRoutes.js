const express = require('express');
const { protect, admin, stylist } = require('../middlewares/authMiddleware');
const { validarCampos } = require('../middlewares/validarCampos');
const {
  listUsersValidator,
  stylistsByServiceValidator,
  updateWorkAreasValidator,
  createUserValidator,
  updateUserValidator,
  userIdValidator
} = require('../validators/user.validator');
const {
  listUsers,
  getStylistsByService,
  getMyStylistProfile,
  updateMyWorkAreas,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

router.get('/stylists', protect, stylistsByServiceValidator, validarCampos, getStylistsByService);
router.get('/me', protect, stylist, getMyStylistProfile);
router.put('/me/work-areas', protect, stylist, updateWorkAreasValidator, validarCampos, updateMyWorkAreas);

router.use(protect, admin);
router.route('/')
  .get(listUsersValidator, validarCampos, listUsers)
  .post(createUserValidator, validarCampos, createUser);
router.route('/:id')
  .put(updateUserValidator, validarCampos, updateUser)
  .delete(userIdValidator, validarCampos, deleteUser);

module.exports = router;