const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Logger simple de solicitudes
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Rutas de la API
app.use('/api', apiRoutes);

// Ruta de comprobación de salud (Health check)
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    servicio: 'Sistema de Estacionamiento de Vehículos API',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en http://localhost:${PORT}`);
  console.log(`📡 Rutas API disponibles en http://localhost:${PORT}/api`);
});
