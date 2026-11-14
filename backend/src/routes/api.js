const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const vehiculosController = require('../controllers/vehiculosController');
const celdasController = require('../controllers/celdasController');
const operativaController = require('../controllers/operativaController');
const cajaController = require('../controllers/cajaController');
const { inMemoryData, isPgConnected, pool } = require('../database/db');

// --- 1. MÓDULO CLIENTES ---
router.get('/clientes', clientesController.getClientes);
router.post('/clientes', clientesController.crearCliente);
router.put('/clientes/:id', clientesController.actualizarCliente);
router.patch('/clientes/:id/toggle-estado', clientesController.toggleEstadoCliente);

// --- 2. MÓDULO VEHÍCULOS ---
router.get('/vehiculos', vehiculosController.getVehiculos);
router.post('/vehiculos', vehiculosController.crearVehiculo);
router.put('/vehiculos/:id', vehiculosController.actualizarVehiculo);
router.patch('/vehiculos/:id/toggle-estado', vehiculosController.toggleEstadoVehiculo);

// --- 3. MÓDULO CELDAS / ESPACIOS ---
router.get('/celdas', celdasController.getCeldas);
router.post('/celdas', celdasController.crearCelda);
router.put('/celdas/:id', celdasController.actualizarCelda);
router.patch('/celdas/:id/toggle-estado', celdasController.toggleEstadoCelda);

// --- 4. MÓDULO CONTROL DE ENTRADAS Y SALIDAS ---
router.get('/operativa/registros', operativaController.getRegistros);
router.post('/operativa/entrada', operativaController.registrarEntrada);
router.get('/operativa/calcular-salida/:criterio', operativaController.calcularSalida);

// --- 5. MÓDULO DE CAJA Y COBROS ---
router.post('/caja/pagar-salida', cajaController.procesarPagoSalida);
router.post('/caja/cobrar-mensualidad', cajaController.cobrarMensualidad);
router.get('/caja/historial', cajaController.getHistorialCaja);
router.patch('/caja/historial/:id/toggle-estado', cajaController.toggleEstadoTransaccion);
router.get('/caja/resumen-dashboard', cajaController.getResumenDashboard);

// --- TARIFAS ---
router.get('/tarifas', async (req, res) => {
  try {
    if (isPgConnected()) {
      const result = await pool.query('SELECT * FROM tarifas ORDER BY id ASC');
      return res.json(result.rows);
    }
    return res.json(inMemoryData.tarifas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
