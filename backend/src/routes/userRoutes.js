const express = require('express');
const { protect, admin } = require('../middlewares/authMiddleware');
const { validarCampos } = require('../middlewares/validarCampos');
const {
  listUsersValidator,
  createUserValidator,
  updateUserValidator,
  userIdValidator
} = require('../validators/user.validator');
const {
  listUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

router.use(protect, admin);
router.route('/')
  .get(listUsersValidator, validarCampos, listUsers)
  .post(createUserValidator, validarCampos, createUser);
router.route('/:id')
  .put(updateUserValidator, validarCampos, updateUser)
  .delete(userIdValidator, validarCampos, deleteUser);

module.exports = router;