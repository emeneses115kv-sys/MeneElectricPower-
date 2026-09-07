import React, { memo } from 'react';
import { ElectricalNode, ComponentProperties, ElectricalAlert } from '../../types/electrical';
import { Power } from 'lucide-react';
import { AlertMarker } from './AlertMarker';

interface ElectricalNodeComponentProps {
  node: ElectricalNode;
  isSelected: boolean;
  isRealista: boolean;
  nodeAlerts: ElectricalAlert[];
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, node: ElectricalNode) => void;
  onUpdateNodeProperties: (nodeId: string, updatedProps: Partial<ComponentProperties>) => void;
  onApplyFix: (nodeId: string, propertyKey: keyof ComponentProperties, newValue: any) => void;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>, node: ElectricalNode) => void;
}

export const ElectricalNodeComponent = memo(({
  node,
  isSelected,
  isRealista,
  nodeAlerts,
  onPointerDown,
  onUpdateNodeProperties,
  onApplyFix,
  onContextMenu
}: ElectricalNodeComponentProps) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${node.x}px`,
        top: `${node.y}px`,
      }}
      onPointerDown={e => onPointerDown(e, node)}
      onContextMenu={e => onContextMenu?.(e, node)}
      className={`w-36 rounded border p-2 transition cursor-move select-none touch-none ${
        isRealista ? 'shadow-xl bg-gradient-to-br from-gray-300 to-gray-500 border-gray-400 text-gray-900' : 'shadow-sm'
      } ${
        isSelected
          ? (isRealista ? 'ring-2 ring-blue-500' : 'bg-[#161920] border-blue-500 ring-1 ring-blue-500/50')
          : (!isRealista ? 'bg-[#1A1D23] border-[#2A2D35] hover:border-[#444] hover:bg-[#161920]' : '')
      }`}
    >
      {/* Header del Nodo */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className={`text-[9px] font-mono px-1 py-0.2 rounded border font-semibold truncate ${
          isRealista ? 'bg-white text-gray-800 border-gray-300 shadow-inner' : 'bg-[#0F1115] text-[#AAA] border-[#2A2D35]'
        }`}>
          {node.properties.tag || node.id.substring(0, 8)}
        </span>
        {/* Botón de apertura/cierre de interruptor si es breaker */}
        {(node.type === 'interruptor_principal' ||
          node.type === 'breaker_termomagnetico' ||
          node.type === 'fusible') && (
          <button
            onClick={e => {
              e.stopPropagation();
              onUpdateNodeProperties(node.id, {
                isClosed: !node.properties.isClosed,
              });
            }}
            className={`p-0.5 rounded transition cursor-pointer ${
              node.properties.isClosed
                ? (isRealista ? 'text-green-700 hover:bg-green-200' : 'text-green-400 hover:bg-green-500/10')
                : (isRealista ? 'text-red-700 hover:bg-red-200' : 'text-red-400 hover:bg-red-500/10')
            }`}
            title={node.properties.isClosed ? 'Cerrado (ON)' : 'Abierto (OFF)'}
          >
            <Power className="w-3 h-3" />
          </button>
        )}
      </div>


      {node.type === 'custom_component' && node.properties.customPaths && (
        <div className="my-1.5 p-1 bg-[#0F1115] rounded border border-[#2A2D35] flex items-center justify-center">
          <svg viewBox="0 0 400 250" className="w-full h-12" preserveAspectRatio="xMidYMid meet">
            {node.properties.customPaths.map((p, i) => (
              <path key={i} d={p} fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </svg>
        </div>
      )}
      
      {/* Título del componente */}

      <div className={`text-[11px] font-bold line-clamp-1 leading-snug ${isRealista ? 'text-gray-900 drop-shadow-sm' : 'text-white'}`}>
        {node.label}
      </div>

      {/* Especificaciones técnicas compactas en fuente mono */}
      <div className={`mt-1 pt-1 border-t grid grid-cols-2 gap-x-1 gap-y-0.5 text-[9px] font-mono ${
        isRealista ? 'border-gray-400/50 text-gray-800' : 'border-[#2A2D35] text-[#AAA]'
      }`}>
        <div title="Corriente de Carga">
          ⚡ {node.properties.currentLoadAmps}A
        </div>
        <div title="Capacidad Nominal">
          🛡 {node.properties.ratedCurrent}A
        </div>
        <div title="Calibre de Conductor" className={`truncate ${isRealista ? 'text-blue-700 font-bold' : 'text-blue-400'}`}>
          〰 {node.properties.conductorGauge}
        </div>
        <div title="Canalización Conduit" className={`truncate ${isRealista ? 'text-gray-700' : 'text-[#666]'}`}>
          ⭕ {node.properties.conduitSize}
        </div>
      </div>

      {/* Render de los Emojis de Alerta simultáneos */}
      {nodeAlerts.map(alert => (
        <AlertMarker
          key={alert.id}
          alert={alert}
          x={0}
          y={0}
          onApplyFix={onApplyFix}
        />
      ))}
    </div>
  );
});

ElectricalNodeComponent.displayName = 'ElectricalNodeComponent';
