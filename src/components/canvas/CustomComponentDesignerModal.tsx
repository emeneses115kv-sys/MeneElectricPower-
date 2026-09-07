import React, { useState, useRef, MouseEvent as ReactMouseEvent } from 'react';
import { CustomComponent } from '../../types/electrical';
import { saveCustomComponent } from '../../utils/customComponentsDb';
import { DraggableWindow } from '../ui/DraggableWindow';
import { PenTool, Eraser, Save, X } from 'lucide-react';


interface CustomComponentDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComponentSaved?: () => void;
}

export const CustomComponentDesignerModal: React.FC<CustomComponentDesignerModalProps> = ({ isOpen, onClose, onComponentSaved }) => {
  const [name, setName] = useState('');
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);

  const getCoordinates = (e: ReactMouseEvent | MouseEvent | TouchEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as ReactMouseEvent).clientX;
      clientY = (e as ReactMouseEvent).clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    setCurrentPath(`M ${x} ${y}`);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    setCurrentPath(prev => `${prev} L ${x} ${y}`);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath) {
      setPaths(prev => [...prev, currentPath]);
      setCurrentPath('');
    }
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  const handleClear = () => {
    setPaths([]);
    setCurrentPath('');
    setError(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Por favor, ingresa un nombre para el componente.');
      return;
    }
    if (paths.length === 0) {
      setError('Dibuja algo antes de guardar.');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const newComponent: CustomComponent = {
        id: crypto.randomUUID(),
        name: name.trim(),
        category: 'carga', // Default
        paths: paths,
        width: 150,
        height: 150,
        createdAt: new Date().toISOString()
      };
      
      await saveCustomComponent(newComponent);
      if (onComponentSaved) onComponentSaved();
      onClose();
      // Reset
      setName('');
      setPaths([]);
    } catch (err: any) {
      setError(err.message || 'Error al guardar el componente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DraggableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="Diseñador de Componentes"
      icon={<PenTool className="w-4 h-4 text-purple-400" />}
      defaultPosition={{ x: window.innerWidth / 2 - 200, y: Math.max(100, window.innerHeight / 2 - 250) }}
      defaultSize={{ width: 400, height: 480 }}
      className="z-[200]"
    >
      <div className="p-4 flex flex-col h-full bg-[#1A1D23] text-gray-200 text-sm">
        <p className="text-[#AAA] mb-3 text-xs leading-relaxed">
          Dibuja un nuevo símbolo personalizado. Se guardará en tu cuenta de la nube y estará disponible para todos tus proyectos.
        </p>
        
        <input 
          type="text" 
          placeholder="Nombre del componente (ej: Tablero Especial)"
          className="w-full bg-[#0F1115] border border-[#333] rounded px-3 py-2 text-white mb-3 text-sm focus:outline-none focus:border-purple-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        
        <div className="flex-1 bg-[#0F1115] border-2 border-dashed border-[#333] rounded-lg overflow-hidden flex items-center justify-center relative touch-none cursor-crosshair">
          <svg
            ref={svgRef}
            className="w-full h-full"
            viewBox="0 0 400 250"
            preserveAspectRatio="xMidYMid meet"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Grid de fondo */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#222" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Rutas guardadas */}
            {paths.map((p, i) => (
              <path key={i} d={p} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            
            {/* Ruta actual */}
            {currentPath && (
              <path d={currentPath} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </div>
        
        {error && (
          <div className="mt-3 text-red-400 text-xs font-semibold bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4 gap-2">
          <button 
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#2A2D35] hover:bg-[#3A3D45] text-white transition"
          >
            <Eraser className="w-4 h-4" />
            <span>Limpiar</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="px-3 py-1.5 rounded text-[#AAA] hover:text-white transition"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium shadow transition ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar en Librería'}</span>
            </button>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
