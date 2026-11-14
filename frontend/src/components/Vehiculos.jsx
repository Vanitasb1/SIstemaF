import React, { useState } from 'react';
import { CarFront, Plus, Power, Edit2, UserCheck, FileDown, Bike, Truck } from 'lucide-react';
import { api } from '../services/api';
import { exportarReporteVehiculosPDF } from '../utils/pdfExport';

const Vehiculos = ({ vehiculos, clientes, onActualizarDatos }) => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [color, setColor] = useState('');
  const [tipo, setTipo] = useState('Auto');
  const [clienteId, setClienteId] = useState('');
  const [loading, setLoading] = useState(false);

  const abrirModalCrear = () => {
    setEditandoId(null);
    setPlaca('');
    setMarca('');
    setModelo('');
    setColor('');
    setTipo('Auto');
    setClienteId('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (v) => {
    setEditandoId(v.id);
    setPlaca(v.placa);
    setMarca(v.marca || '');
    setModelo(v.modelo || '');
    setColor(v.color || '');
    setTipo(v.tipo);
    setClienteId(v.cliente_id ? v.cliente_id.toString() : '');
    setModalAbierto(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        placa: placa.toUpperCase(),
        marca,
        modelo,
        color,
        tipo,
        cliente_id: clienteId ? parseInt(clienteId) : null
      };

      if (editandoId) {
        await api.actualizarVehiculo(editandoId, payload);
      } else {
        await api.crearVehiculo(payload);
      }

      setModalAbierto(false);
      onActualizarDatos();
    } catch (err) {
      alert(`Error al guardar vehículo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstado = async (id) => {
    try {
      await api.toggleEstadoVehiculo(id);
      onActualizarDatos();
    } catch (err) {
      alert(`Error al cambiar estado: ${err.message}`);
    }
  };

  return (
    <div className="space-y-7 animate-view">
      {/* Header Flota */}
      <div className="bg-[#090D16] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-amber-400 text-[11px] font-extrabold uppercase tracking-widest">
            <CarFront className="w-3.5 h-3.5" />
            <span>Registro Técnico de Unidades</span>
          </div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            Parque Automotor y Vínculo de Propietarios
          </h2>
          <p className="text-xs text-slate-400">
            Control de matrículas, marcas, modelos, colores y asociación directa con clientes abonados o visitantes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => exportarReporteVehiculosPDF(vehiculos)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-extrabold flex items-center space-x-2 transition-all"
          >
            <FileDown className="w-4 h-4 text-amber-400" />
            <span>Inventario PDF</span>
          </button>

          <button
            onClick={abrirModalCrear}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-2xl text-xs font-extrabold shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Empadronar Unidad</span>
          </button>
        </div>
      </div>

      {/* Tabla de Parque Automotor */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 uppercase font-extrabold tracking-wider">
              <tr>
                <th className="py-4 px-5">Matrícula Oficial</th>
                <th className="py-4 px-5">Categoría</th>
                <th className="py-4 px-5">Marca y Línea / Modelo</th>
                <th className="py-4 px-5">Acabado / Color</th>
                <th className="py-4 px-5">Propietario Vinculado</th>
                <th className="py-4 px-5">Estatus Unidad</th>
                <th className="py-4 px-5 text-right">Operaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehiculos.map((v) => {
                const isActivo = v.activo !== false;
                return (
                  <tr
                    key={v.id}
                    className={`hover:bg-slate-50/90 transition-colors ${!isActivo ? 'bg-slate-100/60 opacity-60' : ''}`}
                  >
                    <td className="py-4 px-5">
                      <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-amber-400 font-mono-code text-xs font-extrabold tracking-widest border border-slate-700 shadow-sm">
                        {v.placa}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-extrabold text-[11px]">
                        <span>{v.tipo}</span>
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-extrabold text-slate-900">{v.marca || 'Sin especificar'}</div>
                      <div className="text-[11px] text-slate-400">{v.modelo || 'Modelo estándar'}</div>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-600">{v.color || '—'}</td>
                    <td className="py-4 px-5">
                      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80">
                        <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-bold text-slate-800">{v.propietario_nombre || 'Visitante Ocasional'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isActivo ? 'bg-teal-100 text-teal-900' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isActivo ? 'Habilitado' : 'Baja Lógica'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right space-x-1.5">
                      <button
                        onClick={() => abrirModalEditar(v)}
                        title="Modificar Unidad"
                        className="p-2 bg-slate-100 hover:bg-slate-900 hover:text-amber-400 text-slate-700 rounded-xl transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleEstado(v.id)}
                        title={isActivo ? 'Desactivar Unidad (Soft-Delete)' : 'Reactivar Unidad'}
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

      {/* Modal Crear / Editar Vehículo */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-view">
            <div className="bg-[#090D16] text-white px-6 py-5 border-b border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
                Ficha Técnica Automotriz
              </span>
              <h3 className="font-display text-lg font-extrabold">
                {editandoId ? 'Actualizar Datos de Unidad' : 'Empadronar Nuevo Vehículo'}
              </h3>
            </div>

            <form onSubmit={handleGuardar} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Matrícula / Placa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 3490ABC"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 text-amber-400 font-mono-code font-extrabold uppercase text-base tracking-[0.2em] text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Categoría *
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  >
                    <option value="Auto">Auto</option>
                    <option value="Moto">Moto</option>
                    <option value="Camioneta">Camioneta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Color
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Gris Metálico"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Marca
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Toyota"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Modelo / Línea
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Corolla Cross"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Titular / Propietario Asociado
                </label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                >
                  <option value="">— Sin Propietario Fijo (Visitante Ocasional) —</option>
                  {clientes.filter((c) => c.activo !== false).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_completo} (CI: {c.ci_nit}) {c.es_mensualidad ? '★ Abonado Mensual' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-extrabold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-md shadow-amber-500/20"
                >
                  {loading ? 'Guardando...' : 'Guardar Unidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehiculos;
