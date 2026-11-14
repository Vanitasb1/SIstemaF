import React, { useState } from 'react';
import { Layers, Plus, Power, Edit2, FileDown, CarFront, Bike, Truck, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { exportarReporteCeldasPDF } from '../utils/pdfExport';

const Celdas = ({ celdas, onActualizarDatos }) => {
  const [pisoFiltro, setPisoFiltro] = useState('Todos');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [piso, setPiso] = useState('Piso 1');
  const [sector, setSector] = useState('Sector A');
  const [tipoPermitido, setTipoPermitido] = useState('Auto');
  const [estadoCelda, setEstadoCelda] = useState('Disponible');
  const [loading, setLoading] = useState(false);

  const pisosUnicos = ['Todos', ...Array.from(new Set(celdas.map((c) => c.piso)))];

  const celdasFiltradas = celdas.filter((c) => {
    if (pisoFiltro === 'Todos') return true;
    return c.piso === pisoFiltro;
  });

  const abrirModalCrear = () => {
    setEditandoId(null);
    setCodigo('');
    setPiso('Piso 1');
    setSector('Sector A');
    setTipoPermitido('Auto');
    setEstadoCelda('Disponible');
    setModalAbierto(true);
  };

  const abrirModalEditar = (c) => {
    setEditandoId(c.id);
    setCodigo(c.codigo);
    setPiso(c.piso);
    setSector(c.sector);
    setTipoPermitido(c.tipo_permitido);
    setEstadoCelda(c.estado);
    setModalAbierto(true);
  };

  const handleGuardarCelda = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        codigo,
        piso,
        sector,
        tipo_permitido: tipoPermitido,
        estado: estadoCelda
      };

      if (editandoId) {
        await api.actualizarCelda(editandoId, payload);
      } else {
        await api.crearCelda(payload);
      }

      setModalAbierto(false);
      setCodigo('');
      onActualizarDatos();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstado = async (id) => {
    try {
      await api.toggleEstadoCelda(id);
      onActualizarDatos();
    } catch (err) {
      alert(`Error al cambiar estado: ${err.message}`);
    }
  };

  const getIconoTipo = (tipo) => {
    if (tipo === 'Moto') return <Bike className="w-4 h-4" />;
    if (tipo === 'Camioneta') return <Truck className="w-4 h-4" />;
    return <CarFront className="w-4 h-4" />;
  };

  return (
    <div className="space-y-7 animate-view">
      {/* Architectural Control Header */}
      <div className="bg-[#090D16] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-amber-400 text-[11px] font-extrabold uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5" />
            <span>Infraestructura Física y Distribución</span>
          </div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            Mapa Arquitectónico de Bahías y Sectores
          </h2>
          <p className="text-xs text-slate-400">
            Supervisión en vivo por niveles, edición de nomenclatura y clausura preventiva (Soft-Delete sin borrado físico).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Floor Filter */}
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            {pisosUnicos.map((p) => (
              <button
                key={p}
                onClick={() => setPisoFiltro(p)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  pisoFiltro === p
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => exportarReporteCeldasPDF(celdas)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-extrabold flex items-center space-x-2 transition-all"
          >
            <FileDown className="w-4 h-4 text-amber-400" />
            <span>Plano PDF</span>
          </button>

          <button
            onClick={abrirModalCrear}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-2xl text-xs font-extrabold shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Habilitar Bahía</span>
          </button>
        </div>
      </div>

      {/* Interactive Bay Blueprint Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {celdasFiltradas.map((c) => {
          const isOcupada = c.estado === 'Ocupada';
          const isActivo = c.activo !== false;

          return (
            <div
              key={c.id}
              className={`group rounded-3xl border p-5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                !isActivo
                  ? 'bg-slate-200/70 border-slate-300 opacity-65'
                  : isOcupada
                  ? 'bg-white border-rose-300 shadow-sm hover:shadow-md'
                  : 'bg-white border-slate-200/90 shadow-sm hover:border-teal-400 hover:shadow-md'
              }`}
            >
              {/* Top Indicator Strip */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  !isActivo ? 'bg-slate-400' : isOcupada ? 'bg-rose-500' : 'bg-teal-500'
                }`}
              ></div>

              <div>
                <div className="flex items-center justify-between mb-3 pt-1">
                  <span className="font-mono-code text-xl font-black tracking-tight text-slate-900">
                    {c.codigo}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      !isActivo
                        ? 'bg-slate-300 text-slate-700'
                        : isOcupada
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-teal-50 text-teal-800 border border-teal-200'
                    }`}
                  >
                    {!isActivo ? 'Clausurada' : c.estado}
                  </span>
                </div>

                <div className="space-y-1.5 my-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Ubicación:</span>
                    <span className="font-bold text-slate-800">{c.piso} • {c.sector}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Categoría:</span>
                    <span className="inline-flex items-center space-x-1 font-extrabold text-amber-600">
                      {getIconoTipo(c.tipo_permitido)}
                      <span>{c.tipo_permitido}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {isActivo ? '● Operativa' : '○ Inactiva'}
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => abrirModalEditar(c)}
                    title="Configurar Bahía"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-amber-400 text-slate-700 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleEstado(c.id)}
                    title={isActivo ? 'Desactivar Bahía (Soft-Delete)' : 'Reactivar Bahía'}
                    className={`p-2 rounded-xl transition-colors ${
                      isActivo
                        ? 'bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600'
                        : 'bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-600'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear / Editar Celda */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-view">
            <div className="bg-[#090D16] text-white px-6 py-5 border-b border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
                Configuración de Infraestructura
              </span>
              <h3 className="font-display text-lg font-extrabold">
                {editandoId ? 'Modificar Parámetros de Bahía' : 'Habilitar Nueva Bahía de Estacionamiento'}
              </h3>
            </div>

            <form onSubmit={handleGuardarCelda} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Código Identificador *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: P1-A05"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono-code font-extrabold uppercase text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nivel / Piso *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Piso 1"
                    value={piso}
                    onChange={(e) => setPiso(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Zona / Sector *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Sector A"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Clase Permitida
                  </label>
                  <select
                    value={tipoPermitido}
                    onChange={(e) => setTipoPermitido(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  >
                    <option value="Auto">Auto</option>
                    <option value="Moto">Moto</option>
                    <option value="Camioneta">Camioneta</option>
                    <option value="Mixto">Mixto (Universal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Estado Operativo
                  </label>
                  <select
                    value={estadoCelda}
                    onChange={(e) => setEstadoCelda(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Ocupada">Ocupada</option>
                  </select>
                </div>
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
                  {loading ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Celdas;
