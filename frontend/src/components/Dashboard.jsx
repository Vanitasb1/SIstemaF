import React from 'react';
import { 
  CarFront, Layers, Wallet, Activity, FileDown, 
  ArrowUpRight, ShieldCheck, Clock, Sparkles, 
  CheckCircle2, AlertTriangle, Compass
} from 'lucide-react';

const Dashboard = ({ resumen, celdas, registros = [], setActiveTab, onExportarReporte }) => {
  const celdasActivas = celdas.filter((c) => c.activo !== false);
  const enCurso = registros.filter((r) => r.estado === 'En Curso').slice(0, 5);

  return (
    <div className="space-y-7 animate-view">
      {/* Executive Command Header */}
      <div className="relative rounded-3xl bg-[#090D16] text-white p-7 sm:p-8 shadow-2xl border border-slate-800 overflow-hidden">
        {/* Decorative background grid & glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-32 -bottom-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>FERCHICORP — Centro de Operaciones en Tiempo Real</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Plataforma de Control y Telemetría Vehicular
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Monitoreo sincronizado de bahías de estacionamiento, emisión instantánea de pases térmicos, liquidación automática de tarifas y auditoría de tesorería.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('operativa')}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all flex items-center space-x-2 active:scale-95"
            >
              <span>Abrir Terminal Operativa</span>
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={onExportarReporte}
              className="px-4 py-3 bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2"
            >
              <FileDown className="w-4 h-4 text-amber-400" />
              <span>Arqueo PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bento KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900"></div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Capacidad Instalada</span>
              <div className="font-mono-code text-3xl font-extrabold text-slate-900 mt-1.5">
                {resumen.totalCeldas || 0}
              </div>
              <div className="mt-2 inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                <span>Bahías habilitadas</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unidades en Planta</span>
              <div className="font-mono-code text-3xl font-extrabold text-slate-900 mt-1.5">
                {resumen.vehiculosAdentro || 0}
              </div>
              <div className="mt-2 inline-flex items-center space-x-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                <span>Ocupación: {resumen.porcentajeOcupacion || 0}%</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CarFront className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Disponibilidad Inmediata</span>
              <div className="font-mono-code text-3xl font-extrabold text-teal-600 mt-1.5">
                {resumen.celdasDisponibles || 0}
              </div>
              <div className="mt-2 inline-flex items-center space-x-1 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md">
                <span>Bahías libres ahora</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 border border-teal-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Recaudación en Bóveda</span>
              <div className="font-mono-code text-3xl font-extrabold text-slate-900 mt-1.5">
                <span className="text-base font-bold text-slate-400 mr-1">Bs.</span>
                {Number(resumen.ingresosHoy || 0).toFixed(2)}
              </div>
              <div className="mt-2 inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                <span>{resumen.transaccionesTotal || 0} operaciones válidas</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Asymmetric Split Layout: Left Live Telemetry Map (7 cols) + Right Active Vehicles Feed (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar de Bahías */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-5 mb-5 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600">Radar de Planta</span>
                <h3 className="font-display text-lg font-extrabold text-slate-900">Mapa de Ocupación por Bahías</h3>
              </div>
              <div className="flex items-center space-x-4 text-xs font-bold">
                <span className="flex items-center space-x-1.5 text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  <span>Libre</span>
                </span>
                <span className="flex items-center space-x-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Ocupada</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {celdasActivas.slice(0, 10).map((c) => {
                const isOcupada = c.estado === 'Ocupada';
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveTab('celdas')}
                    className={`cursor-pointer group rounded-2xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                      isOcupada
                        ? 'bg-rose-50/70 border-rose-200 hover:border-rose-400'
                        : 'bg-slate-50/70 border-slate-200/90 hover:border-teal-400 hover:bg-teal-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-code text-xs font-extrabold text-slate-900">{c.codigo}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOcupada ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]' : 'bg-teal-500'
                        }`}
                      ></span>
                    </div>
                    <div className="my-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {c.piso}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{c.tipo_permitido}</span>
                    </div>
                    <div
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md text-center ${
                        isOcupada ? 'bg-rose-500 text-white' : 'bg-teal-600/10 text-teal-800'
                      }`}
                    >
                      {c.estado}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Sincronización REST automática activa</span>
            <button
              onClick={() => setActiveTab('celdas')}
              className="font-bold text-slate-900 hover:text-amber-600 flex items-center space-x-1 transition-colors"
            >
              <span>Administrar todos los pisos</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Unidades Actualmente en Custodia */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-5 mb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600">Custodia Activa</span>
                <h3 className="font-display text-lg font-extrabold text-slate-900">Unidades en Estacionamiento</h3>
              </div>
              <span className="font-mono-code text-xs font-extrabold px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400">
                {enCurso.length} Activos
              </span>
            </div>

            {enCurso.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <CarFront className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-400">No hay vehículos estacionados en este momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {enCurso.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {/* License Plate Badge */}
                      <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-amber-400 font-mono-code text-xs font-extrabold tracking-wider border border-slate-700 shadow-sm">
                        {r.placa}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-800">
                          Bahía {r.celda_codigo} <span className="text-slate-400 font-normal">• {r.tipo_vehiculo}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Ingreso: {new Date(r.fecha_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('operativa')}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-500 hover:text-slate-950 text-slate-700 border border-slate-200 text-[11px] font-extrabold transition-all"
                    >
                      Liquidar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Tarifas por hora, fracción o minuto</span>
            <button
              onClick={() => setActiveTab('operativa')}
              className="font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
            >
              <span>Ir a Terminal de Salidas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
