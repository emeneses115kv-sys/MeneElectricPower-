import React, { useState, memo } from 'react';
import { ElectricalAlert, ComponentProperties } from '../../types/electrical';
import { Wrench, X, AlertTriangle } from 'lucide-react';

interface AlertMarkerProps {
  alert: ElectricalAlert;
  x: number;
  y: number;
  onApplyFix: (nodeId: string, propertyKey: keyof ComponentProperties, newValue: any) => void;
}

export const AlertMarker: React.FC<AlertMarkerProps> = memo(({
  alert,
  x,
  y,
  onApplyFix,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Posición del emoji: en la esquina superior derecha del nodo del equipo
  const markerX = x + 34;
  const markerY = y - 24;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${markerX}px`,
        top: `${markerY}px`,
        transform: 'translate(-50%, -50%)',
      }}
      className="z-30 pointer-events-auto"
    >
      {/* Botón de Emoji de Alerta Animado */}
      <button
        onClick={e => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="relative group cursor-pointer flex items-center justify-center transition active:scale-90"
        title={`${alert.title} - Clic para ver y corregir`}
      >
        {/* Onda expansiva de alerta pulsante */}
        <span className="absolute -inset-1 rounded-full bg-red-500/40 animate-ping duration-1000" />

        {/* Círculo contenedor del emoji con borde de advertencia */}
        <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 border-2 border-amber-400 shadow-lg text-sm select-none hover:scale-110 transition">
          {alert.emoji}
        </span>
      </button>

      {/* Popover con diagnóstico normativo y corrección inmediata */}
      {isOpen && (
        <div
          onClick={e => e.stopPropagation()}
          className="absolute left-6 top-0 w-72 bg-[#121418] border border-[#2A2D35] rounded-lg p-3 shadow-2xl z-40 text-xs text-[#E0E0E0] animate-in fade-in zoom-in-95 duration-150 backdrop-blur"
        >
          <div className="flex items-start justify-between gap-2 border-b border-[#2A2D35] pb-2 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
              <span className="text-sm">{alert.emoji}</span>
              <span className="leading-tight">{alert.title}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#888] hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-[#AAA] leading-relaxed mb-2">
            {alert.description}
          </p>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30 mb-3">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>Normativa: {alert.standardRule}</span>
          </div>

          {/* Botón de Corrección Inmediata */}
          <button
            onClick={() => {
              onApplyFix(alert.nodeId, alert.suggestedFix.propertyKey, alert.suggestedFix.newValue);
              setIsOpen(false);
            }}
            className="w-full py-1.5 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{alert.suggestedFix.label}</span>
          </button>
        </div>
      )}
    </div>
  );
});
