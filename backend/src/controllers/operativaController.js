const { isPgConnected, pool, inMemoryData } = require('../database/db');

// Obtener registros de entradas y salidas
exports.getRegistros = async (req, res) => {
  try {
    const { estado } = req.query; // 'En Curso' o 'Finalizado'
    if (isPgConnected()) {
      let query = `
        SELECT r.*, c.codigo AS celda_codigo, c.piso AS celda_piso, c.sector AS celda_sector,
               cl.nombre_completo AS cliente_nombre, cl.es_mensualidad
        FROM registros r
        LEFT JOIN celdas c ON r.celda_id = c.id
        LEFT JOIN clientes cl ON r.cliente_id = cl.id
        WHERE r.activo = true
      `;
      const params = [];
      if (estado) {
        params.push(estado);
        query += ` AND r.estado = $1`;
      }
      query += ` ORDER BY r.id DESC;`;
      const result = await pool.query(query, params);
      return res.json(result.rows);
    }

    let items = inMemoryData.registros.filter(r => r.activo !== false);
    if (estado) {
      items = items.filter(r => r.estado === estado);
    }

    const conDetalle = items.map(r => {
      const celda = inMemoryData.celdas.find(c => c.id === r.celda_id);
      const cliente = inMemoryData.clientes.find(c => c.id === r.cliente_id);
      return {
        ...r,
        celda_codigo: celda ? celda.codigo : 'N/A',
        celda_piso: celda ? celda.piso : '',
        celda_sector: celda ? celda.sector : '',
        cliente_nombre: cliente ? cliente.nombre_completo : 'Visitante',
        es_mensualidad: cliente ? cliente.es_mensualidad : false
      };
    });

    return res.json([...conDetalle].reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Registrar Entrada: asignación dinámica de celda y generación de ticket
exports.registrarEntrada = async (req, res) => {
  try {
    const { placa, tipo_vehiculo, celda_id, observaciones } = req.body;

    if (!placa || !tipo_vehiculo) {
      return res.status(400).json({ error: 'La placa y el tipo de vehículo son obligatorios' });
    }

    const placaClean = placa.trim().toUpperCase();

    // Validar si el vehículo ya está dentro
    if (isPgConnected()) {
      const yaAdentro = await pool.query(
        "SELECT id FROM registros WHERE placa = $1 AND estado = 'En Curso' AND activo = true",
        [placaClean]
      );
      if (yaAdentro.rows.length > 0) {
        return res.status(400).json({ error: `El vehículo con placa ${placaClean} ya tiene una entrada activa sin salida registrada.` });
      }
    } else {
      const yaAdentro = inMemoryData.registros.some(r => r.placa === placaClean && r.estado === 'En Curso' && r.activo);
      if (yaAdentro) {
        return res.status(400).json({ error: `El vehículo con placa ${placaClean} ya tiene una entrada activa sin salida registrada.` });
      }
    }

    // Buscar si la placa pertenece a un cliente registrado (y si tiene mensualidad)
    let clienteId = null;
    let clienteNombre = 'Visitante';
    let esMensual = false;

    if (isPgConnected()) {
      const vehiculoRes = await pool.query(
        "SELECT v.cliente_id, c.nombre_completo, c.es_mensualidad, c.fecha_fin_mensualidad FROM vehiculos v LEFT JOIN clientes c ON v.cliente_id = c.id WHERE v.placa = $1 AND v.activo = true",
        [placaClean]
      );
      if (vehiculoRes.rows.length > 0 && vehiculoRes.rows[0].cliente_id) {
        clienteId = vehiculoRes.rows[0].cliente_id;
        clienteNombre = vehiculoRes.rows[0].nombre_completo || 'Visitante';
        const hoy = new Date();
        const fin = vehiculoRes.rows[0].fecha_fin_mensualidad ? new Date(vehiculoRes.rows[0].fecha_fin_mensualidad) : null;
        esMensual = vehiculoRes.rows[0].es_mensualidad && fin && fin >= hoy;
      }
    } else {
      const v = inMemoryData.vehiculos.find(x => x.placa === placaClean && x.activo);
      if (v && v.cliente_id) {
        clienteId = v.cliente_id;
        const c = inMemoryData.clientes.find(cli => cli.id === v.cliente_id && cli.activo);
        if (c) {
          clienteNombre = c.nombre_completo;
          if (c.es_mensualidad) {
            const hoy = new Date();
            const fin = c.fecha_fin_mensualidad ? new Date(c.fecha_fin_mensualidad) : null;
            esMensual = fin && fin >= hoy;
          }
        }
      }
    }

    // Asignación de celda: manual o dinámica automática
    let celdaAsignadaId = celda_id ? parseInt(celda_id) : null;

    if (!celdaAsignadaId) {
      if (isPgConnected()) {
        const celdaLibre = await pool.query(
          "SELECT id FROM celdas WHERE estado = 'Disponible' AND activo = true AND (tipo_permitido = $1 OR tipo_permitido = 'Mixto') ORDER BY id ASC LIMIT 1",
          [tipo_vehiculo]
        );
        if (celdaLibre.rows.length === 0) {
          return res.status(400).json({ error: 'No hay celdas disponibles para este tipo de vehículo.' });
        }
        celdaAsignadaId = celdaLibre.rows[0].id;
      } else {
        const celdaLibre = inMemoryData.celdas.find(
          c => c.estado === 'Disponible' && c.activo && (c.tipo_permitido === tipo_vehiculo || c.tipo_permitido === 'Mixto')
        );
        if (!celdaLibre) {
          return res.status(400).json({ error: 'No hay celdas disponibles para este tipo de vehículo.' });
        }
        celdaAsignadaId = celdaLibre.id;
      }
    }

    // Marcar celda como Ocupada y obtener datos de la celda
    let celdaInfo = { codigo: 'N/A', piso: '', sector: '' };
    if (isPgConnected()) {
      const cRes = await pool.query(
        "UPDATE celdas SET estado = 'Ocupada', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING codigo, piso, sector",
        [celdaAsignadaId]
      );
      if (cRes.rows.length > 0) celdaInfo = cRes.rows[0];
    } else {
      const c = inMemoryData.celdas.find(cel => cel.id === celdaAsignadaId);
      if (c) {
        c.estado = 'Ocupada';
        celdaInfo = { codigo: c.codigo, piso: c.piso, sector: c.sector };
      }
    }

    // Generar número de ticket
    const ticketNumero = `TCK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const fechaEntrada = new Date().toISOString();

    if (isPgConnected()) {
      const query = `
        INSERT INTO registros (
          ticket_numero, placa, tipo_vehiculo, celda_id, cliente_id,
          fecha_entrada, estado, tarifa_tipo, observaciones, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, 'En Curso', $7, $8, true)
        RETURNING *;
      `;
      const result = await pool.query(query, [
        ticketNumero, placaClean, tipo_vehiculo, celdaAsignadaId, clienteId,
        fechaEntrada, esMensual ? 'Mensualidad' : 'Por Hora', observaciones || ''
      ]);
      return res.status(201).json({
        ...result.rows[0],
        celda_codigo: celdaInfo.codigo,
        celda_piso: celdaInfo.piso,
        celda_sector: celdaInfo.sector,
        cliente_nombre: clienteNombre
      });
    }

    const nuevoRegistro = {
      id: inMemoryData.registros.length + 1,
      ticket_numero: ticketNumero,
      placa: placaClean,
      tipo_vehiculo,
      celda_id: celdaAsignadaId,
      cliente_id: clienteId,
      fecha_entrada: fechaEntrada,
      fecha_salida: null,
      tiempo_minutos: 0,
      tarifa_tipo: esMensual ? 'Mensualidad' : 'Por Hora',
      monto_total: 0,
      estado: 'En Curso',
      observaciones: observaciones || '',
      activo: true,
      created_at: new Date().toISOString()
    };
    inMemoryData.registros.push(nuevoRegistro);
    return res.status(201).json({
      ...nuevoRegistro,
      celda_codigo: celdaInfo.codigo,
      celda_piso: celdaInfo.piso,
      celda_sector: celdaInfo.sector,
      cliente_nombre: clienteNombre
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Calcular Salida: búsqueda por ticket o placa y cálculo automático de tiempo y tarifa
exports.calcularSalida = async (req, res) => {
  try {
    const { criterio } = req.params; // ticket_numero o placa
    const criterioClean = criterio.trim().toUpperCase();

    let registro = null;
    let celda = null;
    let tarifa = null;
    let cliente = null;

    if (isPgConnected()) {
      const resReg = await pool.query(
        `SELECT r.*, c.codigo as celda_codigo, c.piso, c.sector 
         FROM registros r 
         LEFT JOIN celdas c ON r.celda_id = c.id
         WHERE (r.ticket_numero = $1 OR UPPER(r.placa) = $1) AND r.estado = 'En Curso' AND r.activo = true 
         ORDER BY r.id DESC LIMIT 1`,
        [criterioClean]
      );
      if (resReg.rows.length === 0) {
        return res.status(404).json({ error: 'No se encontró un registro activo para este ticket o placa' });
      }
      registro = resReg.rows[0];

      const resTarifa = await pool.query("SELECT * FROM tarifas WHERE tipo_vehiculo = $1", [registro.tipo_vehiculo]);
      tarifa = resTarifa.rows[0] || { precio_hora: 10, precio_minuto: 0.20, precio_mensualidad: 300 };

      if (registro.cliente_id) {
        const resCli = await pool.query("SELECT * FROM clientes WHERE id = $1", [registro.cliente_id]);
        cliente = resCli.rows[0];
      }
    } else {
      registro = inMemoryData.registros.slice().reverse().find(
        r => (r.ticket_numero.toUpperCase() === criterioClean || r.placa === criterioClean) && r.estado === 'En Curso' && r.activo
      );
      if (!registro) {
        return res.status(404).json({ error: 'No se encontró un registro activo para este ticket o placa' });
      }
      celda = inMemoryData.celdas.find(c => c.id === registro.celda_id);
      tarifa = inMemoryData.tarifas.find(t => t.tipo_vehiculo === registro.tipo_vehiculo) || { precio_hora: 10, precio_minuto: 0.20 };
      cliente = inMemoryData.clientes.find(c => c.id === registro.cliente_id);
    }

    const entrada = new Date(registro.fecha_entrada);
    const salida = new Date();
    const difMs = Math.max(0, salida.getTime() - entrada.getTime());
    const minutos = Math.max(1, Math.ceil(difMs / (1000 * 60))); // mínimo 1 minuto

    const horasCompletas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;

    let montoCalculado = 0;
    const esMensual = registro.tarifa_tipo === 'Mensualidad' || (cliente && cliente.es_mensualidad && cliente.estado_mensualidad === 'Al Día');

    // Cálculo por Hora o Fracción y también por Minuto para el selector de la interfaz
    let horasCobro = horasCompletas;
    if (minutosRestantes > 5) {
      horasCobro += 1;
    }
    if (horasCobro === 0) horasCobro = 1; // mínimo 1 hora básica

    const montoPorHoraFraccion = esMensual ? 0.00 : Number((horasCobro * Number(tarifa.precio_hora)).toFixed(2));
    const montoPorMinuto = esMensual ? 0.00 : Number((minutos * Number(tarifa.precio_minuto)).toFixed(2));

    montoCalculado = montoPorHoraFraccion;

    return res.json({
      registro_id: registro.id,
      ticket_numero: registro.ticket_numero,
      placa: registro.placa,
      tipo_vehiculo: registro.tipo_vehiculo,
      celda_id: registro.celda_id,
      celda_codigo: registro.celda_codigo || (celda ? celda.codigo : 'N/A'),
      cliente_nombre: cliente ? cliente.nombre_completo : 'Visitante',
      es_mensualidad: esMensual,
      fecha_entrada: registro.fecha_entrada,
      fecha_salida_estimada: salida.toISOString(),
      tiempo_minutos: minutos,
      tiempo_formateado: `${horasCompletas}h ${minutosRestantes}m`,
      precio_hora: Number(tarifa.precio_hora),
      precio_minuto: Number(tarifa.precio_minuto),
      monto_por_hora: montoPorHoraFraccion,
      monto_por_minuto: montoPorMinuto,
      monto_a_pagar: montoCalculado
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
