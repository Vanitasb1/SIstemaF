const { isPgConnected, pool, inMemoryData } = require('../database/db');

// Obtener todos los clientes (con soporte de soft-delete y filtro)
exports.getClientes = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    if (isPgConnected()) {
      const query = includeInactive === 'true' 
        ? 'SELECT * FROM clientes ORDER BY id DESC' 
        : 'SELECT * FROM clientes WHERE activo = true ORDER BY id DESC';
      const result = await pool.query(query);
      return res.json(result.rows);
    }

    let items = inMemoryData.clientes;
    if (includeInactive !== 'true') {
      items = items.filter(c => c.activo !== false);
    }
    return res.json([...items].reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear nuevo cliente
exports.crearCliente = async (req, res) => {
  try {
    const {
      nombre_completo,
      ci_nit,
      telefono,
      email,
      direccion,
      es_mensualidad,
      fecha_inicio_mensualidad,
      fecha_fin_mensualidad,
      monto_mensualidad
    } = req.body;

    if (!nombre_completo || !ci_nit) {
      return res.status(400).json({ error: 'Nombre completo y CI/NIT son obligatorios' });
    }

    let estado_mensualidad = 'Sin Mensualidad';
    if (es_mensualidad) {
      const hoy = new Date();
      const fin = fecha_fin_mensualidad ? new Date(fecha_fin_mensualidad) : null;
      estado_mensualidad = fin && fin >= hoy ? 'Al Día' : 'Vencido';
    }

    if (isPgConnected()) {
      const query = `
        INSERT INTO clientes (
          nombre_completo, ci_nit, telefono, email, direccion,
          es_mensualidad, fecha_inicio_mensualidad, fecha_fin_mensualidad,
          monto_mensualidad, estado_mensualidad, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
        RETURNING *;
      `;
      const values = [
        nombre_completo, ci_nit, telefono, email, direccion,
        !!es_mensualidad, fecha_inicio_mensualidad || null, fecha_fin_mensualidad || null,
        monto_mensualidad || 0, estado_mensualidad
      ];
      const result = await pool.query(query, values);
      return res.status(201).json(result.rows[0]);
    }

    const nuevoCliente = {
      id: inMemoryData.clientes.length + 1,
      nombre_completo,
      ci_nit,
      telefono: telefono || '',
      email: email || '',
      direccion: direccion || '',
      es_mensualidad: !!es_mensualidad,
      fecha_inicio_mensualidad: fecha_inicio_mensualidad || null,
      fecha_fin_mensualidad: fecha_fin_mensualidad || null,
      monto_mensualidad: Number(monto_mensualidad) || 0,
      estado_mensualidad,
      activo: true,
      created_at: new Date().toISOString()
    };
    inMemoryData.clientes.push(nuevoCliente);
    return res.status(201).json(nuevoCliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar cliente
exports.actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre_completo,
      ci_nit,
      telefono,
      email,
      direccion,
      es_mensualidad,
      fecha_inicio_mensualidad,
      fecha_fin_mensualidad,
      monto_mensualidad
    } = req.body;

    let estado_mensualidad = 'Sin Mensualidad';
    if (es_mensualidad) {
      const hoy = new Date();
      const fin = fecha_fin_mensualidad ? new Date(fecha_fin_mensualidad) : null;
      estado_mensualidad = fin && fin >= hoy ? 'Al Día' : 'Vencido';
    }

    if (isPgConnected()) {
      const query = `
        UPDATE clientes SET
          nombre_completo = COALESCE($1, nombre_completo),
          ci_nit = COALESCE($2, ci_nit),
          telefono = COALESCE($3, telefono),
          email = COALESCE($4, email),
          direccion = COALESCE($5, direccion),
          es_mensualidad = COALESCE($6, es_mensualidad),
          fecha_inicio_mensualidad = COALESCE($7, fecha_inicio_mensualidad),
          fecha_fin_mensualidad = COALESCE($8, fecha_fin_mensualidad),
          monto_mensualidad = COALESCE($9, monto_mensualidad),
          estado_mensualidad = $10,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $11 RETURNING *;
      `;
      const values = [
        nombre_completo, ci_nit, telefono, email, direccion,
        es_mensualidad, fecha_inicio_mensualidad, fecha_fin_mensualidad,
        monto_mensualidad, estado_mensualidad, id
      ];
      const result = await pool.query(query, values);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
      return res.json(result.rows[0]);
    }

    const cliente = inMemoryData.clientes.find(c => c.id === parseInt(id));
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    if (nombre_completo !== undefined) cliente.nombre_completo = nombre_completo;
    if (ci_nit !== undefined) cliente.ci_nit = ci_nit;
    if (telefono !== undefined) cliente.telefono = telefono;
    if (email !== undefined) cliente.email = email;
    if (direccion !== undefined) cliente.direccion = direccion;
    if (es_mensualidad !== undefined) cliente.es_mensualidad = !!es_mensualidad;
    if (fecha_inicio_mensualidad !== undefined) cliente.fecha_inicio_mensualidad = fecha_inicio_mensualidad;
    if (fecha_fin_mensualidad !== undefined) cliente.fecha_fin_mensualidad = fecha_fin_mensualidad;
    if (monto_mensualidad !== undefined) cliente.monto_mensualidad = Number(monto_mensualidad);
    cliente.estado_mensualidad = estado_mensualidad;
    cliente.updated_at = new Date().toISOString();

    return res.json(cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Requerimiento clave: "El sistema no deberá eliminar solo desactivar o activar estado"
exports.toggleEstadoCliente = async (req, res) => {
  try {
    const { id } = req.params;
    if (isPgConnected()) {
      const query = `
        UPDATE clientes 
        SET activo = NOT activo, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1 RETURNING *;
      `;
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
      return res.json(result.rows[0]);
    }

    const cliente = inMemoryData.clientes.find(c => c.id === parseInt(id));
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    cliente.activo = !cliente.activo;
    cliente.updated_at = new Date().toISOString();
    return res.json(cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
