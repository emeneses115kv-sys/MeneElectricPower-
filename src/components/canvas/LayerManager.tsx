import React from 'react';
import { Layers, Zap, Cpu, Route, Type, ThermometerSun, Magnet } from 'lucide-react';
import { DraggableWindow } from '../ui/DraggableWindow';

export type LayerType = 'power' | 'control' | 'conduit' | 'labels' | 'heatmap' | 'gridSnap';
export type ActiveLayers = Record<LayerType, boolean>;

interface LayerManagerProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayers: ActiveLayers;
  onToggleLayer: (layer: LayerType) => void;
}

export const LayerManager: React.FC<LayerManagerProps> = ({ isOpen, onClose, activeLayers, onToggleLayer }) => {
  return (
    <DraggableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="Gestor de Capas"
      icon={<Layers className="w-4 h-4 text-blue-400" />}
      defaultPosition={{ x: window.innerWidth - 250, y: 80 }}
      defaultSize={{ width: 220, height: 'auto' }}
      className="z-[80]"
    >
      <div className="bg-[#121418] p-3 flex flex-col gap-2 w-full text-slate-200">
        <label className="flex items-center justify-between cursor-pointer group py-2 hover:bg-[#1A1D23] px-2 rounded transition">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-[#AAA] group-hover:text-white transition">Potencia</span>
          </div>
          <input 
            type="checkbox" 
            checked={activeLayers.power} 
            onChange={() => onToggleLayer('power')} 
            className="accent-blue-500 cursor-pointer w-4 h-4" 
          />
        </label>
        
        <label className="flex items-center justify-between cursor-pointer group py-2 hover:bg-[#1A1D23] px-2 rounded transition">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-green-400" />
            <span className="text-xs text-[#AAA] group-hover:text-white transition">Control</span>
          </div>
          <input 
            type="checkbox" 
            checked={activeLayers.control} 
            onChange={() => onToggleLayer('control')} 
            className="accent-blue-500 cursor-pointer w-4 h-4" 
          />
        </label>
        
        <label className="flex items-center justify-between cursor-pointer group py-2 hover:bg-[#1A1D23] px-2 rounded transition">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-[#AAA] group-hover:text-white transition">Canalización</span>
          </div>
          <input 
            type="checkbox" 
            checked={activeLayers.conduit} 
            onChange={() => onToggleLayer('conduit')} 
            className="accent-blue-500 cursor-pointer w-4 h-4" 
          />
        </label>
        
        <label className="flex items-center justify-between cursor-pointer group py-2 hover:bg-[#1A1D23] px-2 rounded transition">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-[#AAA] group-hover:text-white transition">Etiquetas</span>
          </div>
          <input 
            type="checkbox" 
            checked={activeLayers.labels} 
            onChange={() => onToggleLayer('labels')} 
            className="accent-indigo-500 cursor-pointer w-4 h-4" 
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer group py-2 hover:bg-[#1A1D23] px-2 rounded transition">
          <div className="flex items-center gap-2">
            <ThermometerSun className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-[#AAA] group-hover:text-white transition">Mapa de Carga Térmica</span>
          </div>
          <input 
            type="checkbox" 
            checked={activeLayers.heatmap} 
            onChange={() => onToggleLayer('heatmap')} 
            className="accent-orange-500 cursor-pointer w-4 h-4" 
          />
        </label>
        
        <div className="h-px bg-[#2A2D35] my-1 w-full" />
        
        <label className="flex items-center justify-between cursor-pointer group py-2 hover:bg-[#1A1D23] px-2 rounded transition">
          <div className="flex items-center gap-2">
            <Magnet className="w-4 h-4 text-pink-400" />
            <span className="text-xs text-[#AAA] group-hover:text-white transition">Ajuste a Cuadrícula (Snap)</span>
          </div>
          <input 
            type="checkbox" 
            checked={activeLayers.gridSnap} 
            onChange={() => onToggleLayer('gridSnap')} 
            className="accent-pink-500 cursor-pointer w-4 h-4" 
          />
        </label>
      </div>
    </DraggableWindow>
  );
};
