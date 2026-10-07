require('dotenv').config(); 
const express = require('express'); 
const cors = require('cors'); 
const connectDB = require('./config/db'); 

const authRoutes = require('./routes/authRoutes'); 
const dashboardRoutes = require('./routes/dashboardRoutes'); 
const userRoutes = require('./routes/userRoutes'); 
const serviceRoutes = require('./routes/serviceRoutes'); 

// Conectar a la base de datos 
connectDB(); 

const app = express(); 

// Configuración de CORS para permitir tu frontend
const allowedOrigins = [
  'https://git-progect-frontend.vercel.app',
  'https://git-progect-frontend-muebles.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite peticiones sin origen (como Postman o curl) o si están en la lista
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  },
  credentials: true
}));

app.use(express.json()); // Middleware integrado para parsear JSON 

// Rutas 
app.use('/api/auth', authRoutes); 
app.use('/api/dashboard', dashboardRoutes); 
app.use('/api/users', userRoutes); 
app.use('/api/services', serviceRoutes); 

// Ruta básica 
app.get('/', (req, res) => {
  res.send('API is running...'); 
}); 

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`); 
});
