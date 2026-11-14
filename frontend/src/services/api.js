const API_BASE = 'http://localhost:4000/api';

const handleResponse = async (res, defaultError = 'Error en la petición al servidor') => {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || defaultError);
  }
  return json;
};

export const api = {
  // Clientes
  getClientes: async (includeInactive = true) => {
    const res = await fetch(`${API_BASE}/clientes?includeInactive=${includeInactive}`);
    return handleResponse(res, 'Error al obtener clientes');
  },
  crearCliente: async (data) => {
    const res = await fetch(`${API_BASE}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Error al crear cliente');
  },
  actualizarCliente: async (id, data) => {
    const res = await fetch(`${API_BASE}/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Error al actualizar cliente');
  },
  toggleEstadoCliente: async (id) => {
    const res = await fetch(`${API_BASE}/clientes/${id}/toggle-estado`, {
      method: 'PATCH'
    });
    return handleResponse(res, 'Error al cambiar estado del cliente');
  },

  // Vehículos
  getVehiculos: async (includeInactive = true) => {
    const res = await fetch(`${API_BASE}/vehiculos?includeInactive=${includeInactive}`);
    return handleResponse(res, 'Error al obtener vehículos');
  },
  crearVehiculo: async (data) => {
    const res = await fetch(`${API_BASE}/vehiculos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Error al crear vehículo');
  },
  actualizarVehiculo: async (id, data) => {
    const res = await fetch(`${API_BASE}/vehiculos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Error al actualizar vehículo');
  },
  toggleEstadoVehiculo: async (id) => {
    const res = await fetch(`${API_BASE}/vehiculos/${id}/toggle-estado`, {
      method: 'PATCH'
    });
    return handleResponse(res, 'Error al cambiar estado del vehículo');
  },

  // Celdas / Espacios
  getCeldas: async (includeInactive = true) => {
    const res = await fetch(`${API_BASE}/celdas?includeInactive=${includeInactive}`);
    return handleResponse(res, 'Error al obtener celdas');
  },
  crearCelda: async (data) => {
    const res = await fetch(`${API_BASE}/celdas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Error al crear celda');
  },
  actualizarCelda: async (id, data) => {
    const res = await fetch(`${API_BASE}/celdas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Error al actualizar celda');
  },
  toggleEstadoCelda: async (id) => {
    const res = await fetch(`${API_BASE}/celdas/${id}/toggle-estado`, {
      method: 'PATCH'
    });
    return handleResponse(res, 'Error al cambiar estado de la celda');
  },

  // Control Entradas / Salidas
  getRegistros: async (estado = '') => {
    const url = estado ? `${API_BASE}/operativa/registros?estado=${encodeURIComponent(estado)}` : `${API_BASE}/operativa/registros`;
    const res = await fetch(url);
    return handleResponse(res, 'Error al obtener registros');
  },
  registrarEntrada: async (data) => {
    const res = await fetch(`${API_BASE}/operativa/entrada`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Error al registrar entrada');
  },
  calcularSalida: async (criterio) => {
    const res = await fetch(`${API_BASE}/operativa/calcular-salida/${encodeURIComponent(criterio)}`);
    return handleResponse(res, 'Registro no encontrado');
  },

  // Caja y Cobros
  pagarSalida: async (data) => {
    const res = await fetch(`${API_BASE}/caja/pagar-salida`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Error al procesar pago');
  },
  cobrarMensualidad: async (data) => {
    const res = await fetch(`${API_BASE}/caja/cobrar-mensualidad`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Error al cobrar mensualidad');
  },
  getHistorialCaja: async (includeInactive = true) => {
    const res = await fetch(`${API_BASE}/caja/historial?includeInactive=${includeInactive}`);
    return handleResponse(res, 'Error al obtener historial de caja');
  },
  toggleEstadoTransaccion: async (id) => {
    const res = await fetch(`${API_BASE}/caja/historial/${id}/toggle-estado`, {
      method: 'PATCH'
    });
    return handleResponse(res, 'Error al cambiar estado de transacción');
  },
  getResumenDashboard: async () => {
    const res = await fetch(`${API_BASE}/caja/resumen-dashboard`);
    return handleResponse(res, 'Error al obtener resumen');
  },
  getTarifas: async () => {
    const res = await fetch(`${API_BASE}/tarifas`);
    return handleResponse(res, 'Error al obtener tarifas');
  }
};
