import React from 'react';
import { SingleInstallButton } from '../install/SingleInstallButton';
import { DiagramViewMode } from '../../App';
import { ProjectConfig, ElectricalAlert } from '../../types/electrical';
import {
  Zap,
  Layers,
  FileText,
  Bot,
  Wifi,
  WifiOff,
  AlertTriangle,
  RotateCcw,
  UserCircle,
  LogOut,
  Maximize,
  Minimize,
  Undo2,
  Redo2
} from 'lucide-react';
import { User } from 'firebase/auth';

interface TopNavBarProps {
  config: ProjectConfig;
  alerts: ElectricalAlert[];
  isOnline: boolean;
  onUpdateSimulatedAmperage: (amps: number) => void;
  onToggleSymbols: () => void;
  onToggleReports: () => void;
  onToggleMaterials: () => void;
  onToggleAI: () => void;
  onToggleAIModifier: () => void;
  onToggleLayers: () => void;
  onExportImage: () => void;
  onResetToDemo: () => void;
  onClearAll: () => void;
  onSave: () => void;
  onAutoArrange: () => void;
  isSymbolsOpen: boolean;
  isReportsOpen: boolean;
  isMaterialsOpen: boolean;
  isDesignerOpen: boolean;
  onToggleDesigner: () => void;
  isAIOpen: boolean;
  isAIModifierOpen: boolean;
  isExportModalOpen: boolean;
  isLayersOpen: boolean;
  diagramView: DiagramViewMode;
  onChangeView: (view: DiagramViewMode) => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  config,
  alerts,
  isOnline,
  onUpdateSimulatedAmperage,
  onToggleSymbols,
  onToggleReports,
  onToggleMaterials,
  onToggleAI,
  onToggleAIModifier,
  onToggleLayers,
  onExportImage,
  onResetToDemo,
  onClearAll,
  onSave,
  onAutoArrange,
  isSymbolsOpen,
  isReportsOpen,
  isMaterialsOpen,
  isDesignerOpen,
  onToggleDesigner,
  isAIOpen,
  isAIModifierOpen,
  isExportModalOpen,
  isLayersOpen,
  diagramView,
  onChangeView,
  user,
  onLogin,
  onLogout,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error("Error attempting to enable fullscreen:", err);
    }
  };

  return (
    <header className="h-14 bg-[#0F1115] border-b border-[#2A2D35] px-3 md:px-4 flex items-center justify-between gap-4 z-30 select-none overflow-x-auto no-scrollbar">
      {/* Lado izquierdo: Título y Estados del Sistema (Estilo High Density) */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#1A1D23] border border-[#2A2D35] flex items-center justify-center text-blue-400">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight leading-none">
                MeneElectricPower⚡
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1A1D23] text-[#AAA] border border-[#2A2D35]">
                1200A
              </span>
            </div>
            <p className="text-[9px] text-[#888] font-mono hidden sm:block">
              Monofásica • 4 Medidores • Normas NEC/ENSA
            </p>
          </div>
        </div>

        {/* Indicador de conexión Online/Offline */}
        <div
          className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A1D23] border border-[#2A2D35]"
          title={isOnline ? 'Conectado a la nube' : 'Modo fuera de línea activo (100% funcional)'}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`} />
          <span className={isOnline ? 'text-[#AAA]' : 'text-orange-400'}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {/* Alerta global si existen fallas en el diagrama */}
        {alerts.length > 0 && (
          <div
            className="flex items-center gap-1.5 text-[12px] font-mono px-2 py-0.5 rounded bg-orange-400/10 text-orange-400 border border-orange-400/30 cursor-pointer animate-pulse"
            title={`${alerts.length} alertas normativas en el circuito`}
            onClick={onToggleReports}
          >
            <span className="text-sm">⚠️</span>
            <span>{alerts.length} {alerts.length === 1 ? 'ALERTA' : 'ALERTAS'}</span>
          </div>
        )}
      </div>

      {/* Centro: Regulador dinámico y Vista */}
      <div className="hidden lg:flex items-center gap-2">
        <select
          value={diagramView}
          onChange={(e) => onChangeView(e.target.value as DiagramViewMode)}
          className="bg-[#1A1D23] border border-[#2A2D35] text-xs font-mono text-[#AAA] px-2 py-1 rounded outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="unifilar">Diagrama Unifilar</option>
          <option value="multifilar">Esquema Multifilar</option>
          <option value="funcional">Esquema Funcional</option>
          <option value="topografico">Esquema Topográfico</option>
          <option value="escalera">Esquema Tipo Escalera</option>
          <option value="3d_isometric">Vista 3D Isométrica</option>
          <option value="realista">Vista de Materiales Realista</option>
        </select>

        <div className="flex items-center gap-2.5 bg-[#1A1D23] border border-[#2A2D35] px-3 py-1 rounded">
          <span className="text-[10px] uppercase text-[#666] font-bold tracking-wider">
            Carga
          </span>
          <input
            type="range"
            min="100"
            max="1400"
            step="20"
            value={config.simulatedAmperage || 820}
            onChange={e => onUpdateSimulatedAmperage(Number(e.target.value))}
            className="w-20 accent-blue-500 cursor-pointer h-1 bg-[#2A2D35] rounded"
          />
          <span className="text-xs font-mono font-bold text-white min-w-[40px]">
            {config.simulatedAmperage || 820}A
          </span>
        </div>
      </div>

      {/* Lado derecho: Botones de ventanas de edición y el botón único de instalación */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Deshacer / Rehacer */}
        <div className="flex items-center gap-0.5 mr-1 bg-[#1A1D23] rounded p-0.5 border border-[#2A2D35] hidden sm:flex">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1 rounded transition ${canUndo ? 'text-[#AAA] hover:text-white hover:bg-[#2A2D35] cursor-pointer' : 'text-[#444] cursor-not-allowed'}`}
            title="Deshacer"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1 rounded transition ${canRedo ? 'text-[#AAA] hover:text-white hover:bg-[#2A2D35] cursor-pointer' : 'text-[#444] cursor-not-allowed'}`}
            title="Rehacer"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={toggleFullscreen}
          className="flex flex-col items-center justify-center p-1 min-w-[48px] rounded bg-[#2A2D35] hover:bg-[#3A3D45] text-[#AAA] hover:text-white border border-[#444] hover:shadow-[0_0_8px_rgba(255,255,255,0.3)] transition cursor-pointer"
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          {isFullscreen ? <Minimize className="w-4 h-4 mb-0.5" /> : <Maximize className="w-4 h-4 mb-0.5" />}
          <span className="text-[8px] leading-none uppercase">Full</span>
        </button>

        <button
          onClick={onClearAll}
          className="flex flex-col items-center justify-center p-1 min-w-[48px] rounded bg-[#2A2D35] hover:bg-[#3A3D45] text-[#AAA] hover:text-white border border-[#444] hover:shadow-[0_0_8px_rgba(255,255,255,0.3)] transition cursor-pointer"
          title="Página en blanco / Nuevo Proyecto"
        >
          <span className="text-sm mb-0.5 leading-none">🆕</span>
          <span className="text-[8px] leading-none uppercase">Nuevo</span>
        </button>

        <button
          onClick={onSave}
          className="flex flex-col items-center justify-center p-1 min-w-[48px] rounded bg-[#2A2D35] hover:bg-[#3A3D45] text-[#AAA] hover:text-white border border-[#444] hover:shadow-[0_0_8px_rgba(255,255,255,0.3)] transition cursor-pointer"
          title="Guardar progreso"
        >
          <span className="text-sm mb-0.5 leading-none">💾</span>
          <span className="text-[8px] leading-none uppercase">Guardar</span>
        </button>
        
        <button
          onClick={onExportImage}
          className={`flex flex-col items-center justify-center p-1 min-w-[48px] rounded transition-all cursor-pointer border ${
            isExportModalOpen
              ? 'bg-emerald-600/20 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
              : 'bg-[#2A2D35] text-[#AAA] border-[#444] hover:bg-[#3A3D45] hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.3)]'
          }`}
          title="Exportar imagen del diagrama"
        >
          <span className="text-sm mb-0.5 leading-none">📸</span>
          <span className="text-[8px] leading-none uppercase">Foto</span>
        </button>

        <button
          onClick={onToggleSymbols}
          className={`flex flex-col items-center justify-center p-1 min-w-[48px] rounded transition-all cursor-pointer border ${
            isSymbolsOpen
              ? 'bg-blue-600/20 border-blue-400 text-blue-300 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
              : 'bg-[#2A2D35] text-[#AAA] border-[#444] hover:bg-[#3A3D45] hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.3)]'
          }`}
          title="Simbología"
        >
          <span className="text-sm mb-0.5 leading-none">📦</span>
          <span className="text-[8px] leading-none uppercase">Símbolos</span>
        </button>

        <button
          onClick={onToggleReports}
          className={`flex flex-col items-center justify-center p-1 min-w-[48px] rounded transition-all cursor-pointer border ${
            isReportsOpen
              ? 'bg-blue-600/20 border-blue-400 text-blue-300 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
              : 'bg-[#2A2D35] text-[#AAA] border-[#444] hover:bg-[#3A3D45] hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.3)]'
          }`}
          title="Reporte Técnico / Plano A4"
        >
          <span className="text-sm mb-0.5 leading-none">📝</span>
          <span className="text-[8px] leading-none uppercase">Reporte</span>
        </button>

        <button
          onClick={onToggleLayers}
          className={`flex flex-col items-center justify-center p-1 min-w-[48px] rounded transition-all cursor-pointer border ${
            isLayersOpen
              ? 'bg-amber-600/20 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
              : 'bg-[#2A2D35] text-[#AAA] border-[#444] hover:bg-[#3A3D45] hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.3)]'
          }`}
          title="Gestor de Capas"
        >
          <span className="text-sm mb-0.5 leading-none">🥪</span>
          <span className="text-[8px] leading-none uppercase">Capas</span>
        </button>
        <button
          onClick={onToggleDesigner}
          className={`flex flex-col items-center justify-center p-1 min-w-[48px] rounded transition-all cursor-pointer border ${
            isDesignerOpen
              ? "bg-purple-600/20 border-purple-400 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.6)]"
              : "bg-[#2A2D35] text-[#AAA] border-[#444] hover:bg-[#3A3D45] hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.3)]"
          }`}
          title="Diseñador de Componentes"
        >
          <span className="text-sm mb-0.5 leading-none">🎨</span>
          <span className="text-[8px] leading-none uppercase">Editor</span>
        </button>

          <button
            onClick={onToggleDesigner}
            className={`p-1.5 rounded transition flex items-center justify-center ${isDesignerOpen ? "bg-purple-600/20 text-purple-400 border border-purple-500/50" : "text-[#AAA] hover:text-white hover:bg-[#2A2D35] bg-[#1A1D23] border border-[#2A2D35]"}`}
            title="Diseñador de Símbolos"
        >
          <span className="text-sm mb-0.5 leading-none">🥪</span>
          <span className="text-[8px] leading-none uppercase">Capas</span>
        </button>

        <button
          onClick={onToggleMaterials}
          className={`flex flex-col items-center justify-center p-1 min-w-[48px] rounded transition-all cursor-pointer border ${
            isMaterialsOpen
              ? 'bg-blue-600/20 border-blue-400 text-blue-300 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
              : 'bg-[#2A2D35] text-[#AAA] border-[#444] hover:bg-[#3A3D45] hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.3)]'
          }`}
          title="Cómputo de Materiales"
        >
          <span className="text-sm mb-0.5 leading-none">🧮</span>
          <span className="text-[8px] leading-none uppercase">Cómputo</span>
        </button>

        <button
          onClick={onToggleAI}
          className={`flex flex-col items-center justify-center p-1 min-w-[48px] rounded transition-all cursor-pointer border ${
            isAIOpen
              ? 'bg-blue-600/20 border-blue-400 text-blue-300 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
              : 'bg-[#2A2D35] text-[#AAA] border-[#444] hover:bg-[#3A3D45] hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.3)]'
          }`}
          title="Asistente IA"
        >
          <span className="text-sm mb-0.5 leading-none">🤖</span>
          <span className="text-[8px] leading-none uppercase">IA</span>
        </button>

        <button
          onClick={onToggleAIModifier}
          className={`flex flex-col items-center justify-center p-1 min-w-[48px] rounded transition-all cursor-pointer border ${
            isAIModifierOpen
              ? 'bg-purple-600/20 border-purple-400 text-purple-300 shadow-[0_0_8px_rgba(192,132,252,0.6)]'
              : 'bg-gradient-to-r from-purple-900/40 to-blue-900/40 text-purple-400 border-purple-500/30 hover:border-purple-400/80 hover:shadow-[0_0_8px_rgba(192,132,252,0.6)]'
          }`}
          title="Ajustes de IA"
        >
          <span className="text-sm mb-0.5 leading-none">⚙️</span>
          <span className="text-[8px] leading-none uppercase">Ajustes</span>
        </button>

        {/* Único botón de instalación con emoji según requerimiento explícito */}
        <SingleInstallButton />

        {/* User login/logout */}
        {user ? (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer border bg-[#2A2D35] text-[#AAA] hover:text-white border-[#444] hover:bg-[#3A3D45]"
            title="Cerrar sesión"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-4 h-4 rounded-full" />
            ) : (
              <UserCircle className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline truncate max-w-[80px]">{user.displayName || 'Usuario'}</span>
            <LogOut className="w-3.5 h-3.5 ml-1" />
          </button>
        ) : (
          <button
            onClick={onLogin}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer border bg-white text-gray-900 border-gray-300 hover:bg-gray-100"
            title="Iniciar sesión con Google"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="hidden sm:inline">Google</span>
          </button>
        )}
      </div>
    </header>
  );
};
