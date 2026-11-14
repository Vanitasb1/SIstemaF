const { isPgConnected, pool, inMemoryData } = require('../database/db');

// Obtener todos los vehículos con datos de su propietario
exports.getVehiculos = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    if (isPgConnected()) {
      const query = `
        SELECT v.*, c.nombre_completo AS propietario_nombre, c.ci_nit AS propietario_ci, c.es_mensualidad
        FROM vehiculos v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        ${includeInactive === 'true' ? '' : 'WHERE v.activo = true'}
        ORDER BY v.id DESC;
      `;
      const result = await pool.query(query);
      return res.json(result.rows);
    }

    let items = inMemoryData.vehiculos;
    if (includeInactive !== 'true') {
      items = items.filter(v => v.activo !== false);
    }

    const conPropietario = items.map(v => {
      const cliente = inMemoryData.clientes.find(c => c.id === v.cliente_id);
      return {
        ...v,
        propietario_nombre: cliente ? cliente.nombre_completo : 'Visitante Ocasional',
        propietario_ci: cliente ? cliente.ci_nit : '',
        es_mensualidad: cliente ? cliente.es_mensualidad : false
      };
    });

    return res.json([...conPropietario].reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear vehículo
exports.crearVehiculo = async (req, res) => {
  try {
    const { placa, marca, modelo, color, tipo, cliente_id } = req.body;

    if (!placa || !tipo) {
      return res.status(400).json({ error: 'Placa y Tipo de vehículo son obligatorios' });
    }

    const placaClean = placa.trim().toUpperCase();

    if (isPgConnected()) {
      const query = `
        INSERT INTO vehiculos (placa, marca, modelo, color, tipo, cliente_id, activo)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING *;
      `;
      const values = [placaClean, marca || '', modelo || '', color || '', tipo, cliente_id || null];
      const result = await pool.query(query, values);
      return res.status(201).json(result.rows[0]);
    }

    const existe = inMemoryData.vehiculos.some(v => v.placa === placaClean);
    if (existe) {
      return res.status(400).json({ error: 'Ya existe un vehículo registrado con esta placa' });
    }

    const nuevoVehiculo = {
      id: inMemoryData.vehiculos.length + 1,
      placa: placaClean,
      marca: marca || '',
      modelo: modelo || '',
      color: color || '',
      tipo,
      cliente_id: cliente_id ? parseInt(cliente_id) : null,
      activo: true,
      created_at: new Date().toISOString()
    };
    inMemoryData.vehiculos.push(nuevoVehiculo);
    return res.status(201).json(nuevoVehiculo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar vehículo
exports.actualizarVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const { placa, marca, modelo, color, tipo, cliente_id } = req.body;

    if (isPgConnected()) {
      const query = `
        UPDATE vehiculos SET
          placa = COALESCE($1, placa),
          marca = COALESCE($2, marca),
          modelo = COALESCE($3, modelo),
          color = COALESCE($4, color),
          tipo = COALESCE($5, tipo),
          cliente_id = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7 RETURNING *;
      `;
      const values = [
        placa ? placa.trim().toUpperCase() : null,
        marca, modelo, color, tipo,
        cliente_id !== undefined ? (cliente_id || null) : null,
        id
      ];
      const result = await pool.query(query, values);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Vehículo no encontrado' });
      return res.json(result.rows[0]);
    }

    const vehiculo = inMemoryData.vehiculos.find(v => v.id === parseInt(id));
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });

    if (placa !== undefined) vehiculo.placa = placa.trim().toUpperCase();
    if (marca !== undefined) vehiculo.marca = marca;
    if (modelo !== undefined) vehiculo.modelo = modelo;
    if (color !== undefined) vehiculo.color = color;
    if (tipo !== undefined) vehiculo.tipo = tipo;
    if (cliente_id !== undefined) vehiculo.cliente_id = cliente_id ? parseInt(cliente_id) : null;
    vehiculo.updated_at = new Date().toISOString();

    return res.json(vehiculo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Activar / Desactivar estado (Soft-delete)
exports.toggleEstadoVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    if (isPgConnected()) {
      const query = `
        UPDATE vehiculos 
        SET activo = NOT activo, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1 RETURNING *;
      `;
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Vehículo no encontrado' });
      return res.json(result.rows[0]);
    }

    const vehiculo = inMemoryData.vehiculos.find(v => v.id === parseInt(id));
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });

    vehiculo.activo = !vehiculo.activo;
    vehiculo.updated_at = new Date().toISOString();
    return res.json(vehiculo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
