import React, { useState } from 'react';
import { Users2, Plus, Power, Edit2, FileDown, Calendar, Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { exportarReporteClientesPDF } from '../utils/pdfExport';

const Clientes = ({ clientes, onActualizarDatos, onAbrirCobroMensualidad }) => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [ciNit, setCiNit] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [esMensualidad, setEsMensualidad] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [montoMensualidad, setMontoMensualidad] = useState('300');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [loading, setLoading] = useState(false);

  const clientesFiltrados = clientes.filter((c) => {
    if (filtroTipo === 'Mensual') return c.es_mensualidad;
    if (filtroTipo === 'Regular') return !c.es_mensualidad;
    return true;
  });

  const abrirModalCrear = () => {
    setEditandoId(null);
    setNombreCompleto('');
    setCiNit('');
    setTelefono('');
    setEmail('');
    setDireccion('');
    setEsMensualidad(false);
    setFechaInicio(new Date().toISOString().slice(0, 10));
    const mesSig = new Date();
    mesSig.setMonth(mesSig.getMonth() + 1);
    setFechaFin(mesSig.toISOString().slice(0, 10));
    setMontoMensualidad('300');
    setModalAbierto(true);
  };

  const abrirModalEditar = (c) => {
    setEditandoId(c.id);
    setNombreCompleto(c.nombre_completo);
    setCiNit(c.ci_nit);
    setTelefono(c.telefono || '');
    setEmail(c.email || '');
    setDireccion(c.direccion || '');
    setEsMensualidad(!!c.es_mensualidad);
    setFechaInicio(c.fecha_inicio_mensualidad ? String(c.fecha_inicio_mensualidad).slice(0, 10) : '');
    setFechaFin(c.fecha_fin_mensualidad ? String(c.fecha_fin_mensualidad).slice(0, 10) : '');
    setMontoMensualidad(c.monto_mensualidad || '300');
    setModalAbierto(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        nombre_completo: nombreCompleto,
        ci_nit: ciNit,
        telefono,
        email,
        direccion,
        es_mensualidad: esMensualidad,
        fecha_inicio_mensualidad: esMensualidad ? fechaInicio : null,
        fecha_fin_mensualidad: esMensualidad ? fechaFin : null,
        monto_mensualidad: esMensualidad ? parseFloat(montoMensualidad) : 0
      };

      if (editandoId) {
        await api.actualizarCliente(editandoId, payload);
      } else {
        await api.crearCliente(payload);
      }

      setModalAbierto(false);
      onActualizarDatos();
    } catch (err) {
      alert(`Error al guardar cliente: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstado = async (id) => {
    try {
      await api.toggleEstadoCliente(id);
      onActualizarDatos();
    } catch (err) {
      alert(`Error al cambiar estado: ${err.message}`);
    }
  };

  return (
    <div className="space-y-7 animate-view">
      {/* Header Corporativo */}
      <div className="bg-[#090D16] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-amber-400 text-[11px] font-extrabold uppercase tracking-widest">
            <Users2 className="w-3.5 h-3.5" />
            <span>Padrón de Abonados y Convenios</span>
          </div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            Directorio de Clientes y Control de Mensualidades
          </h2>
          <p className="text-xs text-slate-400">
            Gestión de titulares habituales, vigencia de planes mensuales y suspensión lógica sin pérdida de historial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            {['Todos', 'Mensual', 'Regular'].map((f) => (
              <button
                key={f}
                onClick={() => setFiltroTipo(f)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  filtroTipo === f
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={() => exportarReporteClientesPDF(clientes)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-extrabold flex items-center space-x-2 transition-all"
          >
            <FileDown className="w-4 h-4 text-amber-400" />
            <span>Padrón PDF</span>
          </button>

          <button
            onClick={abrirModalCrear}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-2xl text-xs font-extrabold shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Alta de Cliente</span>
          </button>
        </div>
      </div>

      {/* Tabla Moderna de Clientes */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 uppercase font-extrabold tracking-wider">
              <tr>
                <th className="py-4 px-5">Titular Registrado</th>
                <th className="py-4 px-5">Documento CI / NIT</th>
                <th className="py-4 px-5">Contacto & Convenio</th>
                <th className="py-4 px-5">Régimen</th>
                <th className="py-4 px-5">Estado de Plan</th>
                <th className="py-4 px-5">Vencimiento</th>
                <th className="py-4 px-5">Estatus Cuenta</th>
                <th className="py-4 px-5 text-right">Operaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientesFiltrados.map((c) => {
                const isActivo = c.activo !== false;
                const isMensual = c.es_mensualidad;
                const isAlDia = c.estado_mensualidad === 'Al Día';

                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50/90 transition-colors ${!isActivo ? 'bg-slate-100/60 opacity-60' : ''}`}
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 font-display font-extrabold text-xs flex items-center justify-center shrink-0">
                          {c.nombre_completo.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs">{c.nombre_completo}</div>
                          <div className="text-[11px] text-slate-400">ID #{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-mono-code font-bold text-slate-700">{c.ci_nit}</td>
                    <td className="py-4 px-5 text-slate-600 space-y-0.5">
                      <div className="font-bold text-slate-800">{c.telefono || 'Sin teléfono'}</div>
                      <div className="text-[11px] text-slate-400">{c.email || c.direccion || 'Sin convenio especificado'}</div>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                          isMensual
                            ? 'bg-amber-500/15 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isMensual ? '★ Abonado Mensual' : 'Regular / Visitante'}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      {isMensual ? (
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isAlDia ? 'bg-teal-100 text-teal-900 border border-teal-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isAlDia ? 'bg-teal-600' : 'bg-rose-600'}`}></span>
                          <span>{c.estado_mensualidad}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">—</span>
                      )}
                    </td>
                    <td className="py-4 px-5 font-mono-code font-bold text-slate-600">
                      {c.fecha_fin_mensualidad ? String(c.fecha_fin_mensualidad).slice(0, 10) : '—'}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isActivo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isActivo ? 'Habilitado' : 'Suspendido'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right space-x-1.5">
                      <button
                        onClick={() => onAbrirCobroMensualidad(c)}
                        title="Cobrar / Renovar Mensualidad"
                        className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-800 rounded-xl text-[11px] font-extrabold inline-flex items-center space-x-1 transition-all"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Renovar</span>
                      </button>
                      <button
                        onClick={() => abrirModalEditar(c)}
                        title="Editar Ficha"
                        className="p-2 bg-slate-100 hover:bg-slate-900 hover:text-amber-400 text-slate-700 rounded-xl transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleEstado(c.id)}
                        title={isActivo ? 'Suspender Cliente (Soft-Delete)' : 'Reactivar Cliente'}
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

      {/* Modal Crear / Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-view">
            <div className="bg-[#090D16] text-white px-6 py-5 border-b border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
                Ficha Corporativa de Cliente
              </span>
              <h3 className="font-display text-lg font-extrabold">
                {editandoId ? 'Actualizar Titular Registrado' : 'Alta de Nuevo Cliente / Convenio'}
              </h3>
            </div>

            <form onSubmit={handleGuardar} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nombre Completo / Razón Social *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Fernando Quiroga"
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Documento CI / NIT *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 5938491"
                    value={ciNit}
                    onChange={(e) => setCiNit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono-code text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Teléfono Móvil
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 78945612"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@ferchicorp.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Dirección / Convenio Corporativo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Edificio Torre Empresarial Piso 4 / Convenio Ferchicorp"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Mensualidad Toggle Box */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={esMensualidad}
                    onChange={(e) => setEsMensualidad(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                    Habilitar Suscripción Mensual Preferencial
                  </span>
                </label>

                {esMensualidad && (
                  <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-800">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Inicio</label>
                      <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vencimiento</label>
                      <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Canon Mes (Bs.)</label>
                      <input
                        type="number"
                        value={montoMensualidad}
                        onChange={(e) => setMontoMensualidad(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-mono-code text-xs font-extrabold text-amber-400"
                      />
                    </div>
                  </div>
                )}
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
                  {loading ? 'Guardando...' : 'Guardar Titular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
