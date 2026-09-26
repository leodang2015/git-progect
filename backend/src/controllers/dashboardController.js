const User = require('../models/User');
const Service = require('../models/Service');
const Reservation = require('../models/Reservation');

// @desc    Obtener estadísticas del dashboard
// @route   GET /api/dashboard/stats
// @access  Privado
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalReservations = await Reservation.countDocuments();

    // Consultar las 5 reservas más recientes
    const recentReservations = await Reservation.find()
      .populate('user', 'name email')
      .populate('service', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Obtener información basada en el rol
    let personalizedInfo = {};
    if (req.user.role === 'admin') {
      personalizedInfo = {
        message: 'Bienvenido, Administrador. Aquí tienes el resumen completo del sistema.'
      };
    } else {
      // Para usuarios normales, tal vez queramos mostrar solo sus reservas, 
      // pero como el dashboard pide un resumen, podemos enviar sus propias reservas
      const userReservations = await Reservation.countDocuments({ user: req.user._id });
      personalizedInfo = {
        message: `Bienvenido, ${req.user.name}.`,
        userReservations
      };
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalServices,
          totalReservations
        },
        recentReservations,
        personalizedInfo,
        user: {
          id: req.user._id,
          name: req.user.name,
          role: req.user.role
        }
      }
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar las estadísticas del dashboard'
    });
  }
};

module.exports = {
  getDashboardStats
};
