const { isPgConnected, pool, inMemoryData } = require('../database/db');

// Procesamiento de cobro y finalización de salida de vehículo
exports.procesarPagoSalida = async (req, res) => {
  try {
    const {
      registro_id,
      metodo_pago, // 'Efectivo', 'Simulación QR'
      monto,
      monto_recibido,
      cambio
    } = req.body;

    if (!registro_id || monto === undefined || !metodo_pago) {
      return res.status(400).json({ error: 'registro_id, monto y metodo_pago son requeridos' });
    }

    const fechaSalida = new Date().toISOString();
    const comprobanteNumero = `CMP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    let registro = null;
    let celdaId = null;
    let clienteId = null;

    if (isPgConnected()) {
      const regRes = await pool.query("SELECT * FROM registros WHERE id = $1 AND activo = true", [registro_id]);
      if (regRes.rows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });
      registro = regRes.rows[0];
      celdaId = registro.celda_id;
      clienteId = registro.cliente_id;

      // Calcular tiempo transcurrido exacto
      const diffMin = Math.max(1, Math.ceil((new Date(fechaSalida) - new Date(registro.fecha_entrada)) / (1000 * 60)));

      // 1. Actualizar el registro a 'Finalizado' y fecha de salida
      await pool.query(`
        UPDATE registros SET
          fecha_salida = $1,
          tiempo_minutos = $2,
          monto_total = $3,
          estado = 'Finalizado',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [fechaSalida, diffMin, monto, registro_id]);

      // 2. Liberar celda (Cambiar estado a 'Disponible')
      if (celdaId) {
        await pool.query("UPDATE celdas SET estado = 'Disponible', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [celdaId]);
      }

      // 3. Registrar transacción en caja
      const transQuery = `
        INSERT INTO transacciones_caja (
          registro_id, cliente_id, concepto, metodo_pago, monto,
          monto_recibido, cambio, comprobante_numero, fecha_pago, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
        RETURNING *;
      `;
      const transRes = await pool.query(transQuery, [
        registro_id,
        clienteId,
        `Cobro Estacionamiento - Ticket ${registro.ticket_numero} (Placa ${registro.placa})`,
        metodo_pago,
        monto,
        monto_recibido !== undefined ? monto_recibido : monto,
        cambio || 0,
        comprobanteNumero,
        fechaSalida
      ]);

      return res.status(201).json({
        mensaje: 'Salida y cobro procesados exitosamente',
        transaccion: transRes.rows[0],
        ticket_numero: registro.ticket_numero,
        placa: registro.placa,
        tiempo_minutos: diffMin,
        fecha_entrada: registro.fecha_entrada,
        fecha_salida: fechaSalida
      });
    }

    // Modo inMemoryData
    registro = inMemoryData.registros.find(r => r.id === parseInt(registro_id));
    if (!registro) return res.status(404).json({ error: 'Registro no encontrado' });
    celdaId = registro.celda_id;
    clienteId = registro.cliente_id;

    const diffMin = Math.max(1, Math.ceil((new Date(fechaSalida) - new Date(registro.fecha_entrada)) / (1000 * 60)));

    registro.fecha_salida = fechaSalida;
    registro.tiempo_minutos = diffMin;
    registro.monto_total = Number(monto);
    registro.estado = 'Finalizado';
    registro.updated_at = new Date().toISOString();

    // Liberar celda
    const celda = inMemoryData.celdas.find(c => c.id === celdaId);
    if (celda) {
      celda.estado = 'Disponible';
    }

    const nuevaTransaccion = {
      id: inMemoryData.transacciones_caja.length + 1,
      registro_id: parseInt(registro_id),
      cliente_id: clienteId,
      concepto: `Cobro Estacionamiento - Ticket ${registro.ticket_numero} (Placa ${registro.placa})`,
      metodo_pago,
      monto: Number(monto),
      monto_recibido: monto_recibido !== undefined ? Number(monto_recibido) : Number(monto),
      cambio: Number(cambio) || 0,
      comprobante_numero: comprobanteNumero,
      fecha_pago: fechaSalida,
      activo: true
    };
    inMemoryData.transacciones_caja.push(nuevaTransaccion);

    return res.status(201).json({
      mensaje: 'Salida y cobro procesados exitosamente',
      transaccion: nuevaTransaccion,
      ticket_numero: registro.ticket_numero,
      placa: registro.placa,
      tiempo_minutos: diffMin,
      fecha_entrada: registro.fecha_entrada,
      fecha_salida: fechaSalida
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cobro de mensualidades para clientes habituales
exports.cobrarMensualidad = async (req, res) => {
  try {
    const { cliente_id, monto, metodo_pago, meses = 1 } = req.body;

    if (!cliente_id || !monto || !metodo_pago) {
      return res.status(400).json({ error: 'cliente_id, monto y metodo_pago son obligatorios' });
    }

    const comprobanteNumero = `MEN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const fechaPago = new Date();
    const hoyStr = fechaPago.toISOString().slice(0, 10);

    const fechaFin = new Date(fechaPago);
    fechaFin.setMonth(fechaFin.getMonth() + parseInt(meses));
    const fechaFinStr = fechaFin.toISOString().slice(0, 10);

    if (isPgConnected()) {
      // 1. Actualizar estado del cliente
      await pool.query(`
        UPDATE clientes SET
          es_mensualidad = true,
          fecha_inicio_mensualidad = $1,
          fecha_fin_mensualidad = $2,
          monto_mensualidad = $3,
          estado_mensualidad = 'Al Día',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [hoyStr, fechaFinStr, monto, cliente_id]);

      // 2. Registrar transacción
      const transQuery = `
        INSERT INTO transacciones_caja (
          cliente_id, concepto, metodo_pago, monto, monto_recibido,
          cambio, comprobante_numero, fecha_pago, activo
        ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, true)
        RETURNING *;
      `;
      const trans = await pool.query(transQuery, [
        cliente_id,
        `Cobro de Mensualidad (${meses} mes(es))`,
        metodo_pago,
        monto,
        monto,
        comprobanteNumero,
        fechaPago.toISOString()
      ]);

      return res.status(201).json({
        mensaje: 'Mensualidad renovada y cobro procesado con éxito',
        transaccion: trans.rows[0],
        fecha_fin_mensualidad: fechaFinStr
      });
    }

    const cliente = inMemoryData.clientes.find(c => c.id === parseInt(cliente_id));
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    cliente.es_mensualidad = true;
    cliente.fecha_inicio_mensualidad = hoyStr;
    cliente.fecha_fin_mensualidad = fechaFinStr;
    cliente.monto_mensualidad = Number(monto);
    cliente.estado_mensualidad = 'Al Día';
    cliente.updated_at = new Date().toISOString();

    const nuevaTransaccion = {
      id: inMemoryData.transacciones_caja.length + 1,
      registro_id: null,
      cliente_id: parseInt(cliente_id),
      concepto: `Cobro de Mensualidad (${meses} mes(es)) - Cliente: ${cliente.nombre_completo}`,
      metodo_pago,
      monto: Number(monto),
      monto_recibido: Number(monto),
      cambio: 0,
      comprobante_numero: comprobanteNumero,
      fecha_pago: fechaPago.toISOString(),
      activo: true
    };
    inMemoryData.transacciones_caja.push(nuevaTransaccion);

    return res.status(201).json({
      mensaje: 'Mensualidad renovada y cobro procesado con éxito',
      transaccion: nuevaTransaccion,
      fecha_fin_mensualidad: fechaFinStr
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Historial de caja / transacciones
exports.getHistorialCaja = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    if (isPgConnected()) {
      const query = `
        SELECT t.*, c.nombre_completo as cliente_nombre, c.ci_nit as cliente_ci
        FROM transacciones_caja t
        LEFT JOIN clientes c ON t.cliente_id = c.id
        ${includeInactive === 'true' ? '' : 'WHERE t.activo = true'}
        ORDER BY t.id DESC;
      `;
      const result = await pool.query(query);
      return res.json(result.rows);
    }

    let items = inMemoryData.transacciones_caja;
    if (includeInactive !== 'true') {
      items = items.filter(t => t.activo !== false);
    }

    const conCliente = items.map(t => {
      const cliente = inMemoryData.clientes.find(c => c.id === t.cliente_id);
      return {
        ...t,
        cliente_nombre: cliente ? cliente.nombre_completo : 'General / No especificado',
        cliente_ci: cliente ? cliente.ci_nit : ''
      };
    });

    return res.json([...conCliente].reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Activar / Desactivar estado transacción de caja (Soft-delete)
exports.toggleEstadoTransaccion = async (req, res) => {
  try {
    const { id } = req.params;
    if (isPgConnected()) {
      const query = `
        UPDATE transacciones_caja 
        SET activo = NOT activo 
        WHERE id = $1 RETURNING *;
      `;
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Transacción no encontrada' });
      return res.json(result.rows[0]);
    }

    const tx = inMemoryData.transacciones_caja.find(t => t.id === parseInt(id));
    if (!tx) return res.status(404).json({ error: 'Transacción no encontrada' });

    tx.activo = !tx.activo;
    return res.json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Resumen del día para el dashboard y caja
exports.getResumenDashboard = async (req, res) => {
  try {
    let totalCeldas = 0;
    let celdasOcupadas = 0;
    let celdasDisponibles = 0;
    let ingresosHoy = 0;
    let vehiculosAdentro = 0;
    let transaccionesTotal = 0;

    if (isPgConnected()) {
      const celdasRes = await pool.query("SELECT estado, COUNT(*) as cant FROM celdas WHERE activo = true GROUP BY estado");
      celdasRes.rows.forEach(r => {
        if (r.estado === 'Ocupada') celdasOcupadas += parseInt(r.cant);
        if (r.estado === 'Disponible') celdasDisponibles += parseInt(r.cant);
        totalCeldas += parseInt(r.cant);
      });

      const adentroRes = await pool.query("SELECT COUNT(*) as cant FROM registros WHERE estado = 'En Curso' AND activo = true");
      vehiculosAdentro = parseInt(adentroRes.rows[0].cant);

      const cajaRes = await pool.query("SELECT COALESCE(SUM(monto), 0) as total, COUNT(*) as cant FROM transacciones_caja WHERE activo = true");
      ingresosHoy = parseFloat(cajaRes.rows[0].total);
      transaccionesTotal = parseInt(cajaRes.rows[0].cant);
    } else {
      const celdasActivas = inMemoryData.celdas.filter(c => c.activo !== false);
      totalCeldas = celdasActivas.length;
      celdasOcupadas = celdasActivas.filter(c => c.estado === 'Ocupada').length;
      celdasDisponibles = celdasActivas.filter(c => c.estado === 'Disponible').length;

      vehiculosAdentro = inMemoryData.registros.filter(r => r.estado === 'En Curso' && r.activo).length;

      const txActivas = inMemoryData.transacciones_caja.filter(t => t.activo !== false);
      transaccionesTotal = txActivas.length;
      ingresosHoy = txActivas.reduce((acc, curr) => acc + Number(curr.monto), 0);
    }

    return res.json({
      totalCeldas,
      celdasOcupadas,
      celdasDisponibles,
      porcentajeOcupacion: totalCeldas > 0 ? Math.round((celdasOcupadas / totalCeldas) * 100) : 0,
      vehiculosAdentro,
      ingresosHoy: Number(ingresosHoy.toFixed(2)),
      transaccionesTotal
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
