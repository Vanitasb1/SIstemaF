import React, { useState, useEffect } from 'react';
import { WalletCards, FileDown, QrCode, Banknote, Calendar, Power, TrendingUp, ShieldCheck } from 'lucide-react';
import { exportarReporteCajaPDF, exportarComprobanteCobroPDF } from '../utils/pdfExport';
import { api } from '../services/api';

const Caja = ({ transacciones, resumen, clientes, onActualizarDatos, clientePreseleccionado, onLimpiarPreseleccion }) => {
  const [modalMensualidad, setModalMensualidad] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [meses, setMeses] = useState('1');
  const [monto, setMonto] = useState('300');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [loadingCobro, setLoadingCobro] = useState(false);

  useEffect(() => {
    if (clientePreseleccionado) {
      setClienteSeleccionado(clientePreseleccionado.id.toString());
      setMonto((clientePreseleccionado.monto_mensualidad || 300).toString());
      setModalMensualidad(true);
      if (onLimpiarPreseleccion) onLimpiarPreseleccion();
    }
  }, [clientePreseleccionado, onLimpiarPreseleccion]);

  const handleCobroMensualidad = async (e) => {
    e.preventDefault();
    if (!clienteSeleccionado) return;
    setLoadingCobro(true);
    try {
      const res = await api.cobrarMensualidad({
        cliente_id: clienteSeleccionado,
        meses: parseInt(meses),
        monto: parseFloat(monto),
        metodo_pago: metodoPago
      });

      const cli = clientes.find((c) => c.id === parseInt(clienteSeleccionado));
      exportarComprobanteCobroPDF({
        comprobante_numero: res.transaccion.comprobante_numero,
        placa: cli ? `MENSUAL (${cli.nombre_completo})` : 'PLAN MENSUAL',
        tiempo_minutos: `${meses} mes(es)`,
        metodo_pago: metodoPago,
        monto: parseFloat(monto),
        monto_recibido: parseFloat(monto),
        cambio: 0
      });

      setModalMensualidad(false);
      onActualizarDatos();
    } catch (err) {
      alert(`Error al cobrar mensualidad: ${err.message}`);
    } finally {
      setLoadingCobro(false);
    }
  };

  const handleToggleEstadoTx = async (id) => {
    try {
      await api.toggleEstadoTransaccion(id);
      onActualizarDatos();
    } catch (err) {
      alert(`Error al cambiar estado de la transacción: ${err.message}`);
    }
  };

  return (
    <div className="space-y-7 animate-view">
      {/* Bóveda y Tesorería Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-[#090D16] text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-44 h-44 bg-amber-500/15 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
              Bóveda Central FERCHICORP
            </span>
            <h2 className="font-display text-xl font-extrabold mt-0.5">Arqueo y Liquidez Diaria</h2>
          </div>

          <div className="my-5">
            <span className="text-xs text-slate-400 block">Recaudación Neta Consolidada</span>
            <div className="font-mono-code text-4xl font-black text-amber-400 mt-1">
              <span className="text-lg font-bold text-slate-500 mr-1.5">Bs.</span>
              {Number(resumen.ingresosHoy || 0).toFixed(2)}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/90 text-slate-400">
            <span className="inline-flex items-center space-x-1.5 text-teal-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Balance auditado en línea</span>
            </span>
            <span className="font-mono-code font-bold text-white">{resumen.transaccionesTotal || 0} ops.</span>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600 block">
                Operaciones de Tesorería
              </span>
              <h3 className="font-display text-xl font-extrabold text-slate-900 mt-0.5">
                Facturación de Suscripciones y Reportes Oficiales
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-lg">
                Procese pagos en efectivo o transferencia QR para planes mensuales y exporte el libro mayor de caja en formato PDF.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 mt-5 border-t border-slate-100">
            <button
              onClick={() => setModalMensualidad(true)}
              className="py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-2xl text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all"
            >
              <Calendar className="w-4 h-4 stroke-[2.5]" />
              <span>Liquidar / Renovar Mensualidad</span>
            </button>
            <button
              onClick={() => exportarReporteCajaPDF(transacciones, resumen)}
              className="py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all"
            >
              <FileDown className="w-4 h-4 text-amber-400" />
              <span>Descargar Libro Diario PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Libro Mayor de Transacciones */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600">Auditoría Financiera</span>
            <h3 className="font-display text-lg font-extrabold text-slate-900">Libro Mayor de Movimientos de Caja</h3>
          </div>
          <span className="text-xs font-bold text-slate-400">Anulación protegida por Borrado Lógico</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 uppercase font-extrabold tracking-wider">
              <tr>
                <th className="py-4 px-5">N° Comprobante</th>
                <th className="py-4 px-5">Concepto de Operación</th>
                <th className="py-4 px-5">Titular / Conductor</th>
                <th className="py-4 px-5">Canal de Pago</th>
                <th className="py-4 px-5">Importe (Bs.)</th>
                <th className="py-4 px-5">Fecha y Hora</th>
                <th className="py-4 px-5">Estatus</th>
                <th className="py-4 px-5 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transacciones.map((t) => {
                const isActivo = t.activo !== false;
                const isQR = t.metodo_pago.includes('QR');
                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-50/90 transition-colors ${!isActivo ? 'bg-slate-100/60 opacity-60' : ''}`}
                  >
                    <td className="py-4 px-5 font-mono-code font-extrabold text-slate-900">
                      {t.comprobante_numero || `CMP-${t.id}`}
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-800">{t.concepto}</td>
                    <td className="py-4 px-5 font-semibold text-slate-600">{t.cliente_nombre || 'Visitante en Caja'}</td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                          isQR
                            ? 'bg-slate-900 text-amber-400'
                            : 'bg-teal-50 text-teal-800 border border-teal-200'
                        }`}
                      >
                        {isQR ? <QrCode className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                        <span>{t.metodo_pago}</span>
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono-code text-sm font-black text-slate-900">
                      Bs. {Number(t.monto).toFixed(2)}
                    </td>
                    <td className="py-4 px-5 text-slate-500 font-medium">{new Date(t.fecha_pago).toLocaleString()}</td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isActivo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isActivo ? 'Válido' : 'Anulado'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleToggleEstadoTx(t.id)}
                        title={isActivo ? 'Anular Transacción (Soft-Delete)' : 'Restaurar Transacción'}
                        className={`p-2 rounded-xl transition-colors ${
                          isActivo
                            ? 'bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600'
                            : 'bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-600'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cobro Mensualidad */}
      {modalMensualidad && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-view">
            <div className="bg-[#090D16] text-white px-6 py-5 border-b border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
                Tesorería — Suscripciones
              </span>
              <h3 className="font-display text-lg font-extrabold">
                Renovación de Plan Mensual y Emisión de Recibo
              </h3>
            </div>

            <form onSubmit={handleCobroMensualidad} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Titular Abonado *
                </label>
                <select
                  required
                  value={clienteSeleccionado}
                  onChange={(e) => setClienteSeleccionado(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                >
                  <option value="">— Seleccione un Cliente Registrado —</option>
                  {clientes.filter((c) => c.activo !== false).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_completo} (CI: {c.ci_nit}) {c.es_mensualidad ? '★ Abonado' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Periodo a Renovar
                  </label>
                  <select
                    value={meses}
                    onChange={(e) => {
                      setMeses(e.target.value);
                      setMonto((parseInt(e.target.value) * 300).toString());
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  >
                    <option value="1">1 Mes</option>
                    <option value="2">2 Meses</option>
                    <option value="3">3 Meses (Trimestral)</option>
                    <option value="6">6 Meses (Semestral)</option>
                    <option value="12">12 Meses (Anual)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Importe Total (Bs.) *
                  </label>
                  <input
                    type="number"
                    required
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 text-amber-400 font-mono-code font-extrabold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Canal de Pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodoPago('Efectivo')}
                    className={`py-2.5 rounded-xl text-xs font-extrabold border ${
                      metodoPago === 'Efectivo'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Efectivo en Bóveda
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPago('Simulación QR')}
                    className={`py-2.5 rounded-xl text-xs font-extrabold border ${
                      metodoPago === 'Simulación QR'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Transferencia QR
                  </button>
                </div>
              </div>

              {metodoPago === 'Simulación QR' && (
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl text-center flex items-center space-x-3">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shrink-0">
                    <QrCode className="w-10 h-10 text-slate-900" />
                  </div>
                  <div className="text-left text-xs">
                    <span className="font-extrabold text-amber-400 block">Código QR Interbancario Activo</span>
                    <span className="text-slate-400 text-[11px]">Verificación instantánea por Bs. {Number(monto).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMensualidad(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-extrabold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingCobro}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-teal-600/20"
                >
                  {loadingCobro ? 'Procesando...' : 'Confirmar y Descargar Recibo PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Caja;
