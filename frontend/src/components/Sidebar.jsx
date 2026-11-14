import React from 'react';
import { 
  LayoutDashboard, ArrowLeftRight, Layers, Users2, 
  CarFront, WalletCards, ShieldAlert, Sparkles, 
  Radio, ChevronRight, Building2
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, resumen }) => {
  const sections = [
    {
      title: 'CENTRO DE COMANDO',
      items: [
        { id: 'dashboard', label: 'Monitor Ejecutivo', subtitle: 'Métricas & Telemetría', icon: LayoutDashboard, badge: null },
        { id: 'operativa', label: 'Terminal de Accesos', subtitle: 'Entradas, Salidas & Cobro', icon: ArrowLeftRight, badge: 'LIVE' },
      ]
    },
    {
      title: 'INFRAESTRUCTURA & FLOTA',
      items: [
        { id: 'celdas', label: 'Mapa de Bahías', subtitle: 'Pisos, Sectores & Celdas', icon: Layers, badge: `${resumen?.celdasDisponibles ?? 0} Libres` },
        { id: 'vehiculos', label: 'Parque Automotor', subtitle: 'Registro de Unidades', icon: CarFront, badge: null },
        { id: 'clientes', label: 'Directorio & Convenios', subtitle: 'Clientes & Mensualidades', icon: Users2, badge: null },
      ]
    },
    {
      title: 'FINANZAS & AUDITORÍA',
      items: [
        { id: 'caja', label: 'Bóveda y Tesorería', subtitle: 'Arqueo, QR & Reportes PDF', icon: WalletCards, badge: null },
      ]
    }
  ];

  const porcentaje = resumen?.porcentajeOcupacion || 0;

  return (
    <aside className="w-72 bg-[#090D16] text-slate-200 flex flex-col justify-between shrink-0 border-r border-slate-800/80 select-none relative overflow-hidden">
      {/* Ambient top glow */}
      <div className="absolute -top-24 -left-24 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div>
        {/* Corporate Brand Header */}
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25 border border-amber-300/30">
              <Building2 className="w-6 h-6 text-slate-950 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-display text-xl font-black tracking-wider text-white">
                  FERCHI<span className="text-amber-400">CORP</span>
                </span>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Smart Parking OS 4.0
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="px-4 py-5 space-y-6">
          {sections.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="px-3 text-[10px] font-bold tracking-[0.16em] uppercase text-slate-500">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`group w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 relative ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent text-white border border-amber-500/30 shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-amber-400 rounded-r-full shadow-[0_0_8px_#f59e0b]"></span>
                      )}
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`p-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                              : 'bg-slate-800/70 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <div className="truncate">
                          <div className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      {item.badge ? (
                        <span
                          className={`ml-2 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md shrink-0 ${
                            item.badge === 'LIVE'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : (
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isActive ? 'text-amber-400 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Live Telemetry Widget */}
      <div className="p-4 m-4 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-3 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">Capacidad Planta</span>
          </div>
          <span className="font-mono-code text-xs font-bold text-amber-400">{porcentaje}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 via-amber-400 to-orange-500 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(4, porcentaje))}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
          <div className="bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800/70">
            <span className="text-slate-500 block">Disponibles</span>
            <span className="font-mono-code text-xs font-bold text-emerald-400">{resumen?.celdasDisponibles ?? 0} bahías</span>
          </div>
          <div className="bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800/70">
            <span className="text-slate-500 block">En Planta</span>
            <span className="font-mono-code text-xs font-bold text-amber-400">{resumen?.vehiculosAdentro ?? 0} unid.</span>
          </div>
        </div>

        <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span>Modo Borrado Lógico</span>
          <span className="text-emerald-400 font-bold">Protegido</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
