import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Operativa from './components/Operativa';
import Celdas from './components/Celdas';
import Clientes from './components/Clientes';
import Vehiculos from './components/Vehiculos';
import Caja from './components/Caja';
import { api } from './services/api';
import { exportarReporteCajaPDF } from './utils/pdfExport';
import { RefreshCw, AlertTriangle, ShieldCheck, Clock, ArrowLeftRight } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [errorConexion, setErrorConexion] = useState(null);
  const [clientePreseleccionado, setClientePreseleccionado] = useState(null);
  const [horaActual, setHoraActual] = useState(new Date());

  // Estados globales de datos
  const [resumen, setResumen] = useState({});
  const [celdas, setCeldas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [transacciones, setTransacciones] = useState([]);

  // Nombres descriptivos para la barra superior
  const titulosVista = {
    dashboard: { titulo: 'Monitor Ejecutivo de Operaciones', subtitulo: 'Telemetría general y estado de planta' },
    operativa: { titulo: 'Terminal de Accesos y Liquidación', subtitulo: 'Emisión de pases térmicos y cobro automatizado' },
    celdas: { titulo: 'Mapa Arquitectónico de Bahías', subtitulo: 'Configuración de niveles, sectores y disponibilidad' },
    clientes: { titulo: 'Directorio de Abonados y Convenios', subtitulo: 'Administración de suscripciones mensuales' },
    vehiculos: { titulo: 'Parque Automotor Registrado', subtitulo: 'Inventario de unidades y vínculo con titulares' },
    caja: { titulo: 'Bóveda Central y Tesorería', subtitulo: 'Libro mayor de ingresos y exportación de auditoría PDF' },
  };

  // Carga inicial y sincronización en vivo
  const cargarDatos = async () => {
    try {
      const [resResumen, resCeldas, resClientes, resVehiculos, resRegs, resTx] = await Promise.all([
        api.getResumenDashboard(),
        api.getCeldas(true),
        api.getClientes(true),
        api.getVehiculos(true),
        api.getRegistros(),
        api.getHistorialCaja(true)
      ]);

      setResumen(resResumen);
      setCeldas(resCeldas);
      setClientes(resClientes);
      setVehiculos(resVehiculos);
      setRegistros(resRegs);
      setTransacciones(resTx);
      setErrorConexion(null);
    } catch (err) {
      console.error('Error al sincronizar datos:', err);
      setErrorConexion('Sin enlace con el motor Backend de FERCHICORP (http://localhost:4000).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const syncInterval = setInterval(cargarDatos, 10000);
    const clockInterval = setInterval(() => setHoraActual(new Date()), 1000);
    return () => {
      clearInterval(syncInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const handleAbrirCobroMensualidad = (cliente) => {
    setClientePreseleccionado(cliente);
    setActiveTab('caja');
  };

  const infoActual = titulosVista[activeTab] || titulosVista.dashboard;

  return (
    <div className="flex min-h-screen bg-[#EEF2F6] text-slate-900">
      {/* Sidebar Corporativo FERCHICORP */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} resumen={resumen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Command Bar */}
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-40">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-900 text-amber-400">
                FERCHICORP
              </span>
              <span className="text-xs text-slate-400 font-bold">/</span>
              <span className="text-xs font-bold text-slate-500">{infoActual.subtitulo}</span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {infoActual.titulo}
            </h2>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Quick Access Terminal Button */}
            {activeTab !== 'operativa' && (
              <button
                onClick={() => setActiveTab('operativa')}
                className="hidden md:inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-900 hover:text-slate-950 border border-amber-500/30 text-xs font-extrabold transition-all"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Terminal Rápida</span>
              </button>
            )}

            {/* Digital Clock */}
            <div className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-mono-code font-bold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{horaActual.toLocaleTimeString()}</span>
            </div>

            {/* Sync Button */}
            <button
              onClick={cargarDatos}
              title="Sincronizar telemetría ahora"
              className="p-2.5 text-slate-500 hover:text-slate-900 rounded-xl bg-slate-100 hover:bg-amber-400 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Operator Badge */}
            <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-xl bg-[#090D16] text-amber-400 font-display font-black flex items-center justify-center text-xs shadow-sm border border-slate-800">
                FC
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <span className="block text-xs font-extrabold text-slate-900">Supervisor Planta</span>
                <span className={`block text-[10px] font-bold ${errorConexion ? 'text-rose-600' : 'text-teal-600'}`}>
                  {errorConexion ? '● Sin conexión' : '● Enlace Activo'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Workspace */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {errorConexion && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{errorConexion}</span>
              </div>
              <button
                onClick={cargarDatos}
                className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-extrabold hover:bg-rose-700"
              >
                Reconectar
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#090D16] text-amber-400 flex items-center justify-center shadow-lg">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <p className="font-display text-sm font-extrabold text-slate-700">
                Iniciando consola ejecutiva FERCHICORP...
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  resumen={resumen}
                  celdas={celdas}
                  registros={registros}
                  setActiveTab={setActiveTab}
                  onExportarReporte={() => exportarReporteCajaPDF(transacciones, resumen)}
                />
              )}

              {activeTab === 'operativa' && (
                <Operativa
                  celdas={celdas}
                  registros={registros}
                  onActualizarDatos={cargarDatos}
                />
              )}

              {activeTab === 'celdas' && (
                <Celdas
                  celdas={celdas}
                  onActualizarDatos={cargarDatos}
                />
              )}

              {activeTab === 'clientes' && (
                <Clientes
                  clientes={clientes}
                  onActualizarDatos={cargarDatos}
                  onAbrirCobroMensualidad={handleAbrirCobroMensualidad}
                />
              )}

              {activeTab === 'vehiculos' && (
                <Vehiculos
                  vehiculos={vehiculos}
                  clientes={clientes}
                  onActualizarDatos={cargarDatos}
                />
              )}

              {activeTab === 'caja' && (
                <Caja
                  transacciones={transacciones}
                  resumen={resumen}
                  clientes={clientes}
                  onActualizarDatos={cargarDatos}
                  clientePreseleccionado={clientePreseleccionado}
                  onLimpiarPreseleccion={() => setClientePreseleccionado(null)}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
