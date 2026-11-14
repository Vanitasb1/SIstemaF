const { Pool } = require('pg');
require('dotenv').config();

// Pool de PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'estacionamiento_db',
  connectionTimeoutMillis: 2500,
});

let isPgConnected = false;

// Mock / In-Memory storage fallback para garantizar funcionamiento inmediato
// si PostgreSQL aún no está configurado localmente en la máquina del usuario
const inMemoryData = {
  tarifas: [
    { id: 1, tipo_vehiculo: 'Auto', precio_hora: 10.0, precio_minuto: 0.20, precio_mensualidad: 300.0, activo: true },
    { id: 2, tipo_vehiculo: 'Moto', precio_hora: 5.0, precio_minuto: 0.10, precio_mensualidad: 150.0, activo: true },
    { id: 3, tipo_vehiculo: 'Camioneta', precio_hora: 15.0, precio_minuto: 0.30, precio_mensualidad: 400.0, activo: true }
  ],
  clientes: [
    {
      id: 1,
      nombre_completo: 'Carlos Méndez',
      ci_nit: '4589234',
      telefono: '76543210',
      email: 'carlos@example.com',
      direccion: 'Av. América #340',
      es_mensualidad: true,
      fecha_inicio_mensualidad: '2026-11-01',
      fecha_fin_mensualidad: '2026-11-30',
      monto_mensualidad: 300.0,
      estado_mensualidad: 'Al Día',
      activo: true,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      nombre_completo: 'Mariana Suarez',
      ci_nit: '8912301',
      telefono: '71239845',
      email: 'mariana@example.com',
      direccion: 'Calle Los Álamos #12',
      es_mensualidad: false,
      fecha_inicio_mensualidad: null,
      fecha_fin_mensualidad: null,
      monto_mensualidad: 0,
      estado_mensualidad: 'Sin Mensualidad',
      activo: true,
      created_at: new Date().toISOString()
    }
  ],
  vehiculos: [
    {
      id: 1,
      placa: '3490ABC',
      marca: 'Toyota',
      modelo: 'Corolla',
      color: 'Gris',
      tipo: 'Auto',
      cliente_id: 1,
      activo: true,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      placa: '4821XYZ',
      marca: 'Yamaha',
      modelo: 'FZ-25',
      color: 'Negro',
      tipo: 'Moto',
      cliente_id: 1,
      activo: true,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      placa: '1290KJH',
      marca: 'Nissan',
      modelo: 'Frontier',
      color: 'Blanco',
      tipo: 'Camioneta',
      cliente_id: 2,
      activo: true,
      created_at: new Date().toISOString()
    }
  ],
  celdas: [
    { id: 1, codigo: 'P1-A01', piso: 'Piso 1', sector: 'Sector A', tipo_permitido: 'Auto', estado: 'Disponible', activo: true },
    { id: 2, codigo: 'P1-A02', piso: 'Piso 1', sector: 'Sector A', tipo_permitido: 'Auto', estado: 'Disponible', activo: true },
    { id: 3, codigo: 'P1-A03', piso: 'Piso 1', sector: 'Sector A', tipo_permitido: 'Auto', estado: 'Disponible', activo: true },
    { id: 4, codigo: 'P1-A04', piso: 'Piso 1', sector: 'Sector A', tipo_permitido: 'Camioneta', estado: 'Disponible', activo: true },
    { id: 5, codigo: 'P1-B01', piso: 'Piso 1', sector: 'Sector B', tipo_permitido: 'Moto', estado: 'Disponible', activo: true },
    { id: 6, codigo: 'P1-B02', piso: 'Piso 1', sector: 'Sector B', tipo_permitido: 'Moto', estado: 'Disponible', activo: true },
    { id: 7, codigo: 'P2-A01', piso: 'Piso 2', sector: 'Sector A', tipo_permitido: 'Auto', estado: 'Disponible', activo: true },
    { id: 8, codigo: 'P2-A02', piso: 'Piso 2', sector: 'Sector A', tipo_permitido: 'Auto', estado: 'Disponible', activo: true },
    { id: 9, codigo: 'P2-B01', piso: 'Piso 2', sector: 'Sector B', tipo_permitido: 'Auto', estado: 'Disponible', activo: true },
    { id: 10, codigo: 'P2-B02', piso: 'Piso 2', sector: 'Sector B', tipo_permitido: 'Moto', estado: 'Disponible', activo: true }
  ],
  registros: [
    {
      id: 1,
      ticket_numero: 'TCK-20261113-001',
      placa: '3490ABC',
      tipo_vehiculo: 'Auto',
      celda_id: 1,
      cliente_id: 1,
      fecha_entrada: new Date(Date.now() - 3600000 * 2).toISOString(),
      fecha_salida: null,
      tiempo_minutos: 0,
      tarifa_tipo: 'Por Hora',
      monto_total: 0,
      estado: 'En Curso',
      observaciones: 'Cliente mensual',
      activo: true,
      created_at: new Date().toISOString()
    }
  ],
  transacciones_caja: [
    {
      id: 1,
      registro_id: null,
      cliente_id: 1,
      concepto: 'Pago de Mensualidad - Noviembre',
      metodo_pago: 'Simulación QR',
      monto: 300.0,
      monto_recibido: 300.0,
      cambio: 0.0,
      comprobante_numero: 'CMP-20261101-001',
      fecha_pago: '2026-11-01T10:00:00Z',
      activo: true
    }
  ]
};

// Actualizar estado de celda 1 ocupada por el registro mock
inMemoryData.celdas[0].estado = 'Ocupada';

// Probar conexión a Postgres
async function initDb() {
  try {
    const client = await pool.connect();
    console.log('✅ Conectado exitosamente a PostgreSQL.');
    isPgConnected = true;
    client.release();
  } catch (err) {
    console.warn('⚠️ No se pudo conectar a PostgreSQL localmente (' + err.message + ').');
    console.log('⚡ Operando en modo Adaptador de Datos Inteligente (In-Memory / SQLite ready) para que la aplicación funcione al 100% sin caídas.');
    isPgConnected = false;
  }
}

initDb();

module.exports = {
  pool,
  isPgConnected: () => isPgConnected,
  inMemoryData,
};
