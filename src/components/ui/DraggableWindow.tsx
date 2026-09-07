import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';

interface DraggableWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number | string; height: number | string };
  className?: string;
  icon?: React.ReactNode;
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
  isOpen,
  onClose,
  title,
  children,
  defaultPosition = { x: 50, y: 50 },
  defaultSize = { width: 400, height: 'auto' },
  className = '',
  icon
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaxPosition, setPreMaxPosition] = useState(defaultPosition);

  const windowRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMaximized) return; // No drag if maximized
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: Math.max(0, e.clientY - dragOffset.y) // Don't drag above screen
      });
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    } else {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  const toggleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
      setPosition(preMaxPosition);
    } else {
      setPreMaxPosition(position);
      setIsMaximized(true);
      setPosition({ x: 0, y: 0 });
    }
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMaximized && !isMinimized) {
      setIsMaximized(false);
      setPosition(preMaxPosition);
    }
  };

  const style: React.CSSProperties = isMaximized ? {
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 50
  } : {
    top: position.y,
    left: position.x,
    width: defaultSize.width,
    height: isMinimized ? 'auto' : defaultSize.height,
    zIndex: 40
  };

  return (
    <div 
      ref={windowRef}
      className={`fixed flex flex-col bg-[#1A1D23]/95 backdrop-blur-md border border-[#2A2D35] rounded-xl shadow-2xl overflow-hidden transition-all duration-200 ${isDragging ? 'duration-0 opacity-90' : ''} ${className}`}
      style={style}
    >
      {/* Header (Draggable) */}
      <div 
        className="h-10 bg-[#0F1115] border-b border-[#2A2D35] flex items-center justify-between px-3 cursor-move select-none touch-none"
        onPointerDown={handlePointerDown}
        onDoubleClick={toggleMaximize}
      >
        <div className="flex items-center gap-2 overflow-hidden pointer-events-none">
          {icon}
          <span className="text-sm font-semibold text-slate-200 truncate">{title}</span>
        </div>

        {/* Window Controls using Emojis and text */}
        <div className="flex items-center gap-1.5 ml-2">
          <button 
            onClick={toggleMinimize} 
            className="flex flex-col items-center justify-center p-1 min-w-[36px] rounded hover:bg-yellow-500/20 hover:shadow-[0_0_8px_rgba(234,179,8,0.5)] transition cursor-pointer group border border-transparent hover:border-yellow-500/50" 
            title="Minimizar"
          >
            <span className="text-[10px] leading-none mb-0.5">➖</span>
            <span className="text-[7px] leading-none text-slate-400 group-hover:text-yellow-400">Min</span>
          </button>
          <button 
            onClick={toggleMaximize} 
            className="flex flex-col items-center justify-center p-1 min-w-[36px] rounded hover:bg-emerald-500/20 hover:shadow-[0_0_8px_rgba(16,185,129,0.5)] transition cursor-pointer group border border-transparent hover:border-emerald-500/50" 
            title="Maximizar"
          >
            <span className="text-[10px] leading-none mb-0.5">🔲</span>
            <span className="text-[7px] leading-none text-slate-400 group-hover:text-emerald-400">Max</span>
          </button>
          <button 
            onClick={onClose} 
            className="flex flex-col items-center justify-center p-1 min-w-[36px] rounded hover:bg-red-500/20 hover:shadow-[0_0_8px_rgba(239,68,68,0.5)] transition cursor-pointer group border border-transparent hover:border-red-500/50" 
            title="Cerrar"
          >
            <span className="text-[10px] leading-none mb-0.5">❌</span>
            <span className="text-[7px] leading-none text-slate-400 group-hover:text-red-400">Cerrar</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-auto flex flex-col relative h-full">
          {children}
        </div>
      )}
    </div>
  );
};
