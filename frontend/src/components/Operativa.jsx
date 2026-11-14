import React, { useState } from 'react';
import { 
  LogIn, LogOut, Search, FileText, CheckCircle2, 
  Clock, Banknote, QrCode, AlertTriangle, CarFront, 
  Sparkles, Printer, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { exportarTicketPDF, exportarComprobanteCobroPDF } from '../utils/pdfExport';

const Operativa = ({ celdas, onActualizarDatos, registros }) => {
  // Estado para Entrada
  const [placaEntrada, setPlacaEntrada] = useState('');
  const [tipoVehiculo, setTipoVehiculo] = useState('Auto');
  const [celdaSeleccionada, setCeldaSeleccionada] = useState('');
  const [observacionesEntrada, setObservacionesEntrada] = useState('');
  const [loadingEntrada, setLoadingEntrada] = useState(false);
  const [mensajeEntrada, setMensajeEntrada] = useState(null);

  // Estado para Salida
  const [criterioSalida, setCriterioSalida] = useState('');
  const [calculoSalida, setCalculoSalida] = useState(null);
  const [modalidadTarifa, setModalidadTarifa] = useState('hora'); // 'hora' | 'minuto'
  const [loadingSalida, setLoadingSalida] = useState(false);
  const [errorSalida, setErrorSalida] = useState(null);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [procesandoCobro, setProcesandoCobro] = useState(false);
  const [comprobanteGenerado, setComprobanteGenerado] = useState(null);

  // Celdas disponibles para el tipo seleccionado
  const celdasDisponibles = celdas.filter(
    (c) => c.estado === 'Disponible' && c.activo !== false && (c.tipo_permitido === tipoVehiculo || c.tipo_permitido === 'Mixto')
  );

  const getMontoAPagar = () => {
    if (!calculoSalida) return 0;
    if (calculoSalida.es_mensualidad) return 0;
    return modalidadTarifa === 'minuto'
      ? Number(calculoSalida.monto_por_minuto || 0)
      : Number(calculoSalida.monto_por_hora || calculoSalida.monto_a_pagar || 0);
  };

  // 1. Manejador de Registro de Entrada
  const handleRegistrarEntrada = async (e) => {
    e.preventDefault();
    if (!placaEntrada) return;
    setLoadingEntrada(true);
    setMensajeEntrada(null);
    try {
      const data = await api.registrarEntrada({
        placa: placaEntrada,
        tipo_vehiculo: tipoVehiculo,
        celda_id: celdaSeleccionada || undefined,
        observaciones: observacionesEntrada
      });

      setMensajeEntrada({
        tipo: 'success',
        texto: `Acceso autorizado — Pase ${data.ticket_numero} asignado a Bahía ${data.celda_codigo}`,
        ticket: data
      });

      exportarTicketPDF(data);

      setPlacaEntrada('');
      setCeldaSeleccionada('');
      setObservacionesEntrada('');
      onActualizarDatos();
    } catch (err) {
      setMensajeEntrada({ tipo: 'error', texto: err.message });
    } finally {
      setLoadingEntrada(false);
    }
  };

  // 2. Manejador de Búsqueda y Cálculo de Salida
  const handleCalcularSalida = async (e) => {
    e.preventDefault();
    if (!criterioSalida) return;
    setLoadingSalida(true);
    setErrorSalida(null);
    setCalculoSalida(null);
    setComprobanteGenerado(null);
    try {
      const data = await api.calcularSalida(criterioSalida);
      setCalculoSalida(data);
      setModalidadTarifa('hora');
      setMontoRecibido(data.monto_a_pagar.toString());
    } catch (err) {
      setErrorSalida(err.message);
    } finally {
      setLoadingSalida(false);
    }
  };

  const handleCambiarModalidad = (modo) => {
    setModalidadTarifa(modo);
    if (calculoSalida) {
      const nuevoMonto = calculoSalida.es_mensualidad
        ? 0
        : modo === 'minuto'
        ? calculoSalida.monto_por_minuto
        : calculoSalida.monto_por_hora;
      setMontoRecibido(nuevoMonto.toString());
    }
  };

  // 3. Manejador de Cobro y Salida
  const handleProcesarCobro = async () => {
    if (!calculoSalida) return;
    setProcesandoCobro(true);
    try {
      const montoFinal = getMontoAPagar();
      const recibido = montoRecibido !== '' ? parseFloat(montoRecibido) : montoFinal;
      const cambio = Math.max(0, recibido - montoFinal);

      const res = await api.pagarSalida({
        registro_id: calculoSalida.registro_id,
        metodo_pago: metodoPago,
        monto: montoFinal,
        monto_recibido: recibido,
        cambio: cambio
      });

      const dataParaPDF = {
        comprobante_numero: res.transaccion.comprobante_numero,
        placa: calculoSalida.placa,
        tiempo_minutos: calculoSalida.tiempo_minutos,
        metodo_pago: metodoPago,
        monto: montoFinal,
        monto_recibido: recibido,
        cambio: cambio
      };

      setComprobanteGenerado(dataParaPDF);
      exportarComprobanteCobroPDF(dataParaPDF);

      setCalculoSalida(null);
      setCriterioSalida('');
      onActualizarDatos();
    } catch (err) {
      setErrorSalida(`Error al procesar cobro: ${err.message}`);
    } finally {
      setProcesandoCobro(false);
    }
  };

  const montoActual = getMontoAPagar();

  return (
    <div className="space-y-7 animate-view">
      {/* Dual Gate Control Consoles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CONSOLA DE INGRESO (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Console Header */}
            <div className="bg-[#090D16] text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20">
                  <LogIn className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
                    Barrera #01 — Ingreso
                  </span>
                  <h3 className="font-display text-lg font-extrabold tracking-tight">Emisión de Pase Vehicular</h3>
                </div>
              </div>
              <span className="font-mono-code text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-teal-400 border border-slate-700">
                {celdasDisponibles.length} Libres
              </span>
            </div>

            <div className="p-6 space-y-5">
              {mensajeEntrada && (
                <div
                  className={`p-4 rounded-2xl text-xs flex items-start space-x-3 border ${
                    mensajeEntrada.tipo === 'success'
                      ? 'bg-teal-50/90 text-teal-900 border-teal-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  {mensajeEntrada.tipo === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold">{mensajeEntrada.texto}</p>
                    {mensajeEntrada.ticket && (
                      <button
                        onClick={() => exportarTicketPDF(mensajeEntrada.ticket)}
                        className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-teal-700 text-white font-bold text-[11px] hover:bg-teal-800 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Reimprimir Pase PDF</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleRegistrarEntrada} className="space-y-4">
                {/* License Plate Input Styled like a Physical Plate */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Matrícula / Placa de la Unidad *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="3490ABC"
                      value={placaEntrada}
                      onChange={(e) => setPlacaEntrada(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 text-amber-400 placeholder-slate-600 font-mono-code text-xl font-extrabold uppercase tracking-[0.2em] border-2 border-slate-800 focus:border-amber-500 focus:outline-none text-center shadow-inner"
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                      BOL
                    </span>
                  </div>
                </div>

                {/* Vehicle Type Selector Pills */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Categoría de Vehículo
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Auto', 'Moto', 'Camioneta'].map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => {
                          setTipoVehiculo(tipo);
                          setCeldaSeleccionada('');
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all ${
                          tipoVehiculo === tipo
                            ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Asignación de Bahía / Celda
                  </label>
                  <select
                    value={celdaSeleccionada}
                    onChange={(e) => setCeldaSeleccionada(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-bold text-slate-800"
                  >
                    <option value="">⚡ Asignación Inteligente Automática ({celdasDisponibles.length} disponibles)</option>
                    {celdasDisponibles.map((c) => (
                      <option key={c.id} value={c.id}>
                        Bahía {c.codigo} — {c.piso} ({c.sector})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Nota de Inspección / Observación
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Dejó llaves en recepción / Equipaje en carrocería"
                    value={observacionesEntrada}
                    onChange={(e) => setObservacionesEntrada(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingEntrada || celdasDisponibles.length === 0}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-slate-300 disabled:to-slate-300 text-slate-950 font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center space-x-2"
                >
                  <Printer className="w-4 h-4 stroke-[2.5]" />
                  <span>{loadingEntrada ? 'Procesando Ingreso...' : 'Autorizar Ingreso & Emitir Ticket PDF'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* CONSOLA DE SALIDA Y LIQUIDACIÓN (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Console Header */}
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center shadow-md shadow-teal-500/20">
                  <LogOut className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400 block">
                    Barrera #02 — Salida & Caja
                  </span>
                  <h3 className="font-display text-lg font-extrabold tracking-tight">Liquidación de Permanencia y Cobro</h3>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Cálculo Automático</span>
            </div>

            <div className="p-6 space-y-5">
              {/* Search Bar */}
              <form onSubmit={handleCalcularSalida} className="flex gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Escanee código de Ticket o digite Matrícula (Ej: 3490ABC)..."
                    value={criterioSalida}
                    onChange={(e) => setCriterioSalida(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-extrabold uppercase tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingSalida || !criterioSalida}
                  className="px-6 py-3 bg-[#090D16] hover:bg-slate-800 text-amber-400 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {loadingSalida ? 'Calculando...' : 'Localizar'}
                </button>
              </form>

              {errorSalida && (
                <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-800 text-xs font-bold flex items-center space-x-2.5 border border-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorSalida}</span>
                </div>
              )}

              {comprobanteGenerado && !calculoSalida && (
                <div className="p-5 rounded-2xl bg-teal-50/90 text-teal-950 border border-teal-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-7 h-7 text-teal-600 shrink-0" />
                    <div>
                      <p className="text-sm font-extrabold">¡Salida Liquidada y Barrera Abierta!</p>
                      <p className="text-xs text-teal-700 font-medium mt-0.5">
                        Unidad: <span className="font-mono-code font-bold">{comprobanteGenerado.placa}</span> • Recibo: {comprobanteGenerado.comprobante_numero}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => exportarComprobanteCobroPDF(comprobanteGenerado)}
                    className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold flex items-center space-x-1.5 shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Recibo PDF</span>
                  </button>
                </div>
              )}

              {!calculoSalida && !comprobanteGenerado && (
                <div className="py-10 px-4 rounded-2xl border border-dashed border-slate-200 text-center space-y-2 bg-slate-50/50">
                  <CarFront className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">
                    Busque una matrícula activa o seleccione <span className="text-slate-800">"Liquidar Salida"</span> en la tabla inferior.
                  </p>
                </div>
              )}

              {/* Checkout Details Card */}
              {calculoSalida && (
                <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-5 space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-200">
                    <div className="flex items-center space-x-3.5">
                      <div className="px-3.5 py-2 rounded-xl bg-[#090D16] text-amber-400 font-mono-code text-lg font-extrabold tracking-widest border border-slate-700">
                        {calculoSalida.placa}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">
                          {calculoSalida.tipo_vehiculo} • Bahía <span className="text-amber-600">{calculoSalida.celda_codigo}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          Titular: {calculoSalida.cliente_nombre}{' '}
                          {calculoSalida.es_mensualidad && (
                            <span className="ml-1 px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-extrabold">
                              ABONADO MENSUAL
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right bg-white px-3.5 py-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tiempo en Planta</span>
                      <div className="font-mono-code text-sm font-extrabold text-slate-900 flex items-center justify-end space-x-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{calculoSalida.tiempo_formateado}</span>
                        <span className="text-[11px] text-slate-400 font-normal">({calculoSalida.tiempo_minutos}m)</span>
                      </div>
                    </div>
                  </div>

                  {/* Selector de Modalidad de Tarifa */}
                  {!calculoSalida.es_mensualidad && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleCambiarModalidad('hora')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border text-left transition-all flex items-center justify-between ${
                          modalidadTarifa === 'hora'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>Hora o Fracción</span>
                        <span className="font-mono-code text-amber-400">Bs. {calculoSalida.precio_hora}/h</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCambiarModalidad('minuto')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border text-left transition-all flex items-center justify-between ${
                          modalidadTarifa === 'minuto'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>Tarifa Por Minuto</span>
                        <span className="font-mono-code text-amber-400">Bs. {calculoSalida.precio_minuto}/m</span>
                      </button>
                    </div>
                  )}

                  {/* Total Display */}
                  <div className="bg-[#090D16] text-white p-4 rounded-2xl flex items-center justify-between border border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                        Importe Total a Liquidar
                      </span>
                      <span className="text-xs text-slate-300">Incluye custodia e impuestos de ley</span>
                    </div>
                    <div className="font-mono-code text-2xl font-extrabold text-amber-400">
                      Bs. {montoActual.toFixed(2)}
                    </div>
                  </div>

                  {/* Payment Channel */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Canal de Cobro
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setMetodoPago('Efectivo')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border flex items-center justify-center space-x-1.5 ${
                            metodoPago === 'Efectivo'
                              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          <Banknote className="w-4 h-4" />
                          <span>Efectivo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMetodoPago('Simulación QR')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border flex items-center justify-center space-x-1.5 ${
                            metodoPago === 'Simulación QR'
                              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Pago QR</span>
                        </button>
                      </div>
                    </div>

                    {metodoPago === 'Efectivo' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                            Recibido (Bs.)
                          </label>
                          <input
                            type="number"
                            step="0.50"
                            value={montoRecibido}
                            onChange={(e) => setMontoRecibido(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono-code text-xs font-extrabold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                            Cambio (Bs.)
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={`Bs. ${Math.max(0, (parseFloat(montoRecibido) || 0) - montoActual).toFixed(2)}`}
                            className="w-full px-3 py-2 rounded-xl bg-teal-50 border border-teal-200 font-mono-code text-xs font-extrabold text-teal-800"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-slate-200">
                        <div className="w-11 h-11 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
                          <QrCode className="w-7 h-7" />
                        </div>
                        <div className="text-[11px] leading-tight">
                          <span className="font-extrabold text-slate-900 block">QR Simple Interbancario</span>
                          <span className="text-slate-500">Orden lista por Bs. {montoActual.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleProcesarCobro}
                    disabled={procesandoCobro}
                    className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>{procesandoCobro ? 'Liquidando...' : 'Confirmar Transacción, Liberar Bahía y Emitir Recibo PDF'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BITÁCORA OPERATIVA DE MOVIMIENTOS */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600">Bitácora en Vivo</span>
            <h3 className="font-display text-lg font-extrabold text-slate-900">Flujo Reciente de Accesos y Salidas</h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">Mostrando últimos movimientos registrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 uppercase font-extrabold tracking-wider">
              <tr>
                <th className="py-3.5 px-5">N° Pase / Ticket</th>
                <th className="py-3.5 px-5">Matrícula</th>
                <th className="py-3.5 px-5">Categoría</th>
                <th className="py-3.5 px-5">Bahía Asignada</th>
                <th className="py-3.5 px-5">Marca de Ingreso</th>
                <th className="py-3.5 px-5">Marca de Salida</th>
                <th className="py-3.5 px-5">Estado Operativo</th>
                <th className="py-3.5 px-5 text-right">Operaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registros.slice(0, 12).map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/90 transition-colors">
                  <td className="py-3.5 px-5 font-mono-code font-bold text-slate-900">{r.ticket_numero}</td>
                  <td className="py-3.5 px-5">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400 font-mono-code font-extrabold tracking-wider">
                      {r.placa}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-bold text-slate-700">{r.tipo_vehiculo}</td>
                  <td className="py-3.5 px-5 font-mono-code font-extrabold text-teal-700">{r.celda_codigo}</td>
                  <td className="py-3.5 px-5 text-slate-500 font-medium">{new Date(r.fecha_entrada).toLocaleString()}</td>
                  <td className="py-3.5 px-5 text-slate-500 font-medium">
                    {r.fecha_salida ? new Date(r.fecha_salida).toLocaleString() : '— En custodia —'}
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        r.estado === 'En Curso'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-teal-100 text-teal-900 border border-teal-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${r.estado === 'En Curso' ? 'bg-amber-600 animate-pulse' : 'bg-teal-600'}`}></span>
                      <span>{r.estado}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right space-x-2">
                    {r.estado === 'En Curso' && (
                      <button
                        onClick={() => {
                          setCriterioSalida(r.placa);
                          api.calcularSalida(r.placa).then((data) => {
                            setCalculoSalida(data);
                            setModalidadTarifa('hora');
                            setMontoRecibido(data.monto_a_pagar.toString());
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          });
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-[11px] font-extrabold transition-all shadow-sm"
                      >
                        Liquidar Salida
                      </button>
                    )}
                    <button
                      onClick={() => exportarTicketPDF(r)}
                      title="Descargar Pase PDF"
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold inline-flex items-center space-x-1 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Pase PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Operativa;
