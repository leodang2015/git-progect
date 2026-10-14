const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator(value) {
        return !this.date || value > this.date;
      },
      message: 'La fecha de finalización debe ser posterior a la fecha de inicio'
  },
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

reservationSchema.index({ status: 1, date: 1, endDate: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
