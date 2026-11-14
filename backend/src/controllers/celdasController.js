const { isPgConnected, pool, inMemoryData } = require('../database/db');

// Obtener todas las celdas (organizadas por pisos y sectores)
exports.getCeldas = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    if (isPgConnected()) {
      const query = `
        SELECT * FROM celdas 
        ${includeInactive === 'true' ? '' : 'WHERE activo = true'}
        ORDER BY piso ASC, sector ASC, codigo ASC;
      `;
      const result = await pool.query(query);
      return res.json(result.rows);
    }

    let items = inMemoryData.celdas;
    if (includeInactive !== 'true') {
      items = items.filter(c => c.activo !== false);
    }

    return res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear celda
exports.crearCelda = async (req, res) => {
  try {
    const { codigo, piso, sector, tipo_permitido } = req.body;

    if (!codigo || !piso || !sector) {
      return res.status(400).json({ error: 'Código, Piso y Sector son obligatorios' });
    }

    const codClean = codigo.trim().toUpperCase();

    if (isPgConnected()) {
      const query = `
        INSERT INTO celdas (codigo, piso, sector, tipo_permitido, estado, activo)
        VALUES ($1, $2, $3, $4, 'Disponible', true)
        RETURNING *;
      `;
      const values = [codClean, piso, sector, tipo_permitido || 'Auto'];
      const result = await pool.query(query, values);
      return res.status(201).json(result.rows[0]);
    }

    const existe = inMemoryData.celdas.some(c => c.codigo === codClean);
    if (existe) {
      return res.status(400).json({ error: 'Ya existe una celda con ese código' });
    }

    const nuevaCelda = {
      id: inMemoryData.celdas.length + 1,
      codigo: codClean,
      piso,
      sector,
      tipo_permitido: tipo_permitido || 'Auto',
      estado: 'Disponible',
      activo: true,
      created_at: new Date().toISOString()
    };
    inMemoryData.celdas.push(nuevaCelda);
    return res.status(201).json(nuevaCelda);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar celda
exports.actualizarCelda = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, piso, sector, tipo_permitido, estado } = req.body;

    if (isPgConnected()) {
      const query = `
        UPDATE celdas SET
          codigo = COALESCE($1, codigo),
          piso = COALESCE($2, piso),
          sector = COALESCE($3, sector),
          tipo_permitido = COALESCE($4, tipo_permitido),
          estado = COALESCE($5, estado),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 RETURNING *;
      `;
      const values = [
        codigo ? codigo.trim().toUpperCase() : null,
        piso, sector, tipo_permitido, estado, id
      ];
      const result = await pool.query(query, values);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Celda no encontrada' });
      return res.json(result.rows[0]);
    }

    const celda = inMemoryData.celdas.find(c => c.id === parseInt(id));
    if (!celda) return res.status(404).json({ error: 'Celda no encontrada' });

    if (codigo !== undefined) celda.codigo = codigo.trim().toUpperCase();
    if (piso !== undefined) celda.piso = piso;
    if (sector !== undefined) celda.sector = sector;
    if (tipo_permitido !== undefined) celda.tipo_permitido = tipo_permitido;
    if (estado !== undefined) celda.estado = estado;
    celda.updated_at = new Date().toISOString();

    return res.json(celda);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Activar / Desactivar estado celda
exports.toggleEstadoCelda = async (req, res) => {
  try {
    const { id } = req.params;
    if (isPgConnected()) {
      const query = `
        UPDATE celdas 
        SET activo = NOT activo, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1 RETURNING *;
      `;
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Celda no encontrada' });
      return res.json(result.rows[0]);
    }

    const celda = inMemoryData.celdas.find(c => c.id === parseInt(id));
    if (!celda) return res.status(404).json({ error: 'Celda no encontrada' });

    celda.activo = !celda.activo;
    celda.updated_at = new Date().toISOString();
    return res.json(celda);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
