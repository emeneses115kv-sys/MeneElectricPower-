import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ElectricalNode,
  ElectricalEdge,
  ElectricalAlert,
  ComponentProperties,
} from '../../types/electrical';
import { EdgeFlowAnimation } from './EdgeFlowAnimation';
import { AlertMarker } from './AlertMarker';
import { ElectricalNodeComponent } from './ElectricalNodeComponent';
import { ThreeDView } from './ThreeDView';
import { LayerManager, ActiveLayers, LayerType } from './LayerManager';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Power,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { DiagramViewMode } from '../../App';
import { CONDUCTOR_TABLE, CONDUIT_SIZES, STANDARD_BREAKERS } from '../../utils/electricalCalculations';

const EMPTY_ALERTS: ElectricalAlert[] = [];

interface ElectricalCanvasProps {
  nodes: ElectricalNode[];
  edges: ElectricalEdge[];
  alerts: ElectricalAlert[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNodeProperties: (nodeId: string, updatedProps: Partial<ComponentProperties>) => void;
  onUpdateNodeData: (nodeId: string, data: Partial<ElectricalNode>) => void;
  onDeleteNode: (nodeId: string) => void;
  onMoveNode: (nodeId: string, x: number, y: number) => void;
  onApplyFix: (nodeId: string, propertyKey: keyof ComponentProperties, newValue: any) => void;
  viewMode?: DiagramViewMode;
  isLayersOpen?: boolean;
  onCloseLayers?: () => void;
}

export const ElectricalCanvas: React.FC<ElectricalCanvasProps> = ({
  nodes,
  edges,
  alerts,
  selectedNodeId,
  onSelectNode,
  onUpdateNodeProperties,
  onUpdateNodeData,
  onDeleteNode,
  onMoveNode,
  onApplyFix,
  viewMode = 'unifilar',
  isLayersOpen = true,
  onCloseLayers = () => {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Rotación 3D
  const [rotation, setRotation] = useState({ x: 60, z: -45 });
  const [isRotating, setIsRotating] = useState(false);
  const [rotateStart, setRotateStart] = useState({ x: 0, y: 0, rotX: 60, rotZ: -45 });

  // Capas (Layers)
  const [activeLayers, setActiveLayers] = useState<ActiveLayers>({
    power: true,
    control: true,
    conduit: true,
    labels: true,
    heatmap: false,
    gridSnap: true,
  });

  const handleToggleLayer = (layer: LayerType) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const getLayerForNode = (category: string): LayerType => {
    if (['control'].includes(category)) return 'control';
    if (['canalizacion', 'conductor'].includes(category)) return 'conduit';
    return 'power';
  };

  const visibleNodes = nodes.filter(node => activeLayers[getLayerForNode(node.category)]);
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = edges.filter(edge => visibleNodeIds.has(edge.fromNodeId) && visibleNodeIds.has(edge.toNodeId));

  // Selección Múltiple y Drag Box
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  const nodeAlertsMap = React.useMemo(() => {
    const map = new Map<string, ElectricalAlert[]>();
    alerts.forEach(alert => {
      if (!map.has(alert.nodeId)) map.set(alert.nodeId, []);
      map.get(alert.nodeId)!.push(alert);
    });
    return map;
  }, [alerts]);

  // Arrastre de nodos individuales / múltiples
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Map de nodos para dibujar aristas
  const nodeMap = new Map<string, ElectricalNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  // Manejo de zoom con rueda de ratón
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.1), 5.0));
  };

  // Context Menu for nodes
  const [nodeContextMenu, setNodeContextMenu] = useState<{ nodeId: string, x: number, y: number } | null>(null);

  // Inicio de pan en canvas
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    setNodeContextMenu(null);
    if (e.button === 0 && ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'canvas-background')) {
      if (e.shiftKey) {
        // Iniciar recuadro de selección múltiple
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const startX = (e.clientX - rect.left - pan.x) / zoom;
          const startY = (e.clientY - rect.top - pan.y) / zoom;
          setSelectionBox({ startX, startY, currentX: startX, currentY: startY });
          if (!e.ctrlKey && !e.metaKey) {
            setSelectedNodeIds(new Set());
            onSelectNode(null);
          }
        }
      } else {
        // Paneo normal
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        setSelectedNodeIds(new Set());
        onSelectNode(null);
      }
    } else if (e.button === 2 && viewMode === '3d_isometric') {
      e.preventDefault();
      setIsRotating(true);
      setRotateStart({ x: e.clientX, y: e.clientY, rotX: rotation.x, rotZ: rotation.z });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (viewMode === '3d_isometric') {
      e.preventDefault();
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isRotating) {
      const dx = e.clientX - rotateStart.x;
      const dy = e.clientY - rotateStart.y;
      setRotation({
        x: Math.max(0, Math.min(90, rotateStart.rotX - dy * 0.5)),
        z: rotateStart.rotZ + dx * 0.5,
      });
    } else if (selectionBox) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const currentX = (e.clientX - rect.left - pan.x) / zoom;
        const currentY = (e.clientY - rect.top - pan.y) / zoom;
        setSelectionBox(prev => prev ? { ...prev, currentX, currentY } : null);
      }
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingNodeId) {
      let newX = Math.round((e.clientX - pan.x) / zoom - dragOffset.x);
      let newY = Math.round((e.clientY - pan.y) / zoom - dragOffset.y);
      
      if (activeLayers.gridSnap) {
        const GRID_SIZE = 20;
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
      }
      
      const draggedNode = nodeMap.get(draggingNodeId);
      if (draggedNode) {
        const dx = newX - draggedNode.x;
        const dy = newY - draggedNode.y;

        if (selectedNodeIds.has(draggingNodeId)) {
          // Mover todos los seleccionados
          selectedNodeIds.forEach(id => {
            const n = nodeMap.get(id);
            if (n) onMoveNode(n.id, Math.max(10, n.x + dx), Math.max(10, n.y + dy));
          });
        } else {
          // Mover solo el arrastrado
          onMoveNode(draggingNodeId, Math.max(10, newX), Math.max(10, newY));
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (selectionBox) {
      const { startX, startY, currentX, currentY } = selectionBox;
      const minX = Math.min(startX, currentX);
      const maxX = Math.max(startX, currentX);
      const minY = Math.min(startY, currentY);
      const maxY = Math.max(startY, currentY);

      const newSelection = new Set(selectedNodeIds);
      nodes.forEach(node => {
        // Asumimos un tamaño de nodo aprox de 144x80 (w-36 h-20)
        if (node.x + 144 > minX && node.x < maxX && node.y + 80 > minY && node.y < maxY) {
          newSelection.add(node.id);
        }
      });
      setSelectedNodeIds(newSelection);
      if (newSelection.size === 1) {
        onSelectNode(Array.from(newSelection)[0]);
      } else {
        onSelectNode(null);
      }
      setSelectionBox(null);
    }
    setIsPanning(false);
    setIsRotating(false);
    setDraggingNodeId(null);
  };

  const handleNodeMouseDown = useCallback((e: React.PointerEvent<HTMLDivElement>, node: ElectricalNode) => {
    e.stopPropagation();
    if (!selectedNodeIds.has(node.id)) {
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        const newSel = new Set(selectedNodeIds);
        newSel.add(node.id);
        setSelectedNodeIds(newSel);
      } else {
        setSelectedNodeIds(new Set([node.id]));
        onSelectNode(node.id);
      }
    }
    setDraggingNodeId(node.id);
    setDragOffset({
      x: (e.clientX - pan.x) / zoom - node.x,
      y: (e.clientY - pan.y) / zoom - node.y,
    });
  }, [selectedNodeIds, onSelectNode, pan.x, pan.y, zoom]);

  const handleNodeContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>, node: ElectricalNode) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectNode(node.id);
    setSelectedNodeIds(new Set([node.id]));
    setNodeContextMenu({ nodeId: node.id, x: e.clientX, y: e.clientY });
  }, [onSelectNode]);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 40, y: 30 });
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div
      ref={containerRef}
      id="canvas-background"
      onWheel={handleWheel}
      onPointerDown={handleMouseDownCanvas}
      onPointerMove={handleMouseMove}
      onPointerUp={handleMouseUp}
      onPointerLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      className={`relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none ${viewMode === 'realista' ? 'bg-[#e2e8f0]' : 'bg-[#0F1115]'}`}
      style={{
        backgroundImage: viewMode === 'realista' 
          ? `linear-gradient(45deg, #cbd5e1 25%, transparent 25%, transparent 75%, #cbd5e1 75%, #cbd5e1), linear-gradient(45deg, #cbd5e1 25%, transparent 25%, transparent 75%, #cbd5e1 75%, #cbd5e1)`
          : `radial-gradient(circle, rgba(42, 45, 53, 0.7) 1px, transparent 1px)`,
        backgroundSize: viewMode === 'realista' ? '40px 40px' : '20px 20px',
        backgroundPosition: viewMode === 'realista' ? '0 0, 20px 20px' : '0 0',
      }}
    >
      {viewMode === '3d_isometric' ? (
        <ThreeDView
          nodes={visibleNodes}
          edges={visibleEdges}
          alerts={alerts}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
        />
      ) : (
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '2600px',
          height: '1800px',
          transition: 'transform 0.3s ease-out',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Capa de Aristas y Flujo de Corriente (SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="currentFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {(() => {
            const obstacles = visibleNodes.map(n => ({x: n.x, y: n.y, w: 144, h: 72}));
            return visibleEdges.map(edge => {
            const fromNode = nodeMap.get(edge.fromNodeId);
            const toNode = nodeMap.get(edge.toNodeId);
            if (!fromNode || !toNode) return null;

            return (
              <EdgeFlowAnimation
                key={edge.id}
                edge={edge}
                fromX={fromNode.x + 45}
                fromY={fromNode.y + 35}
                heatmapActive={activeLayers.heatmap}
                labelsActive={activeLayers.labels}
                capacityAmps={fromNode.properties.ratedCurrent || 20}
                labelTitle={fromNode.properties.tag || "Cto. " + fromNode.id.substring(0,4)}
                toX={toNode.x + 45}
                obstacles={obstacles}
                toY={toNode.y + 35}
              />
            );
          });
          })()}
        </svg>

        {/* Capa de Nodos / Equipos Eléctricos */}
        {visibleNodes.map(node => {
          const isSelected = selectedNodeIds.has(node.id);
          const nodeAlerts = nodeAlertsMap.get(node.id) || EMPTY_ALERTS;
          
          const isRealista = viewMode === 'realista';
          return (
            <ElectricalNodeComponent
              key={node.id}
              node={node}
              isSelected={isSelected}
              isRealista={isRealista}
              nodeAlerts={nodeAlerts}
              onPointerDown={handleNodeMouseDown}
              onUpdateNodeProperties={onUpdateNodeProperties}
              onApplyFix={onApplyFix}
              onContextMenu={handleNodeContextMenu}
            />
          );
        })}

        {/* Selection Box Visual */}
        {selectionBox && (
          <div
            className="absolute border border-blue-500 bg-blue-500/20 pointer-events-none"
            style={{
              left: Math.min(selectionBox.startX, selectionBox.currentX),
              top: Math.min(selectionBox.startY, selectionBox.currentY),
              width: Math.abs(selectionBox.currentX - selectionBox.startX),
              height: Math.abs(selectionBox.currentY - selectionBox.startY),
              zIndex: 9999,
            }}
          />
        )}
      </div>
      )}

      {/* Context Menu para Nodos */}
      {nodeContextMenu && (() => {
        const node = nodeMap.get(nodeContextMenu.nodeId);
        if (!node) return null;
        return (
          <div 
            className="fixed z-[9999] bg-[#1A1D23] border border-[#333] shadow-2xl rounded py-1 w-48 text-xs text-gray-200"
            style={{ left: nodeContextMenu.x, top: nodeContextMenu.y }}
            onMouseLeave={() => setNodeContextMenu(null)}
          >
            <div className="px-3 py-1 font-bold text-gray-400 border-b border-[#333] mb-1 truncate">
              Cambiar: {node.label}
            </div>
            {(node.type === 'breaker_termomagnetico' || node.type === 'interruptor_principal') && (
              <div className="max-h-48 overflow-y-auto">
                {STANDARD_BREAKERS.slice(0, 15).map(breaker => (
                  <button
                    key={breaker}
                    className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateNodeData(node.id, { 
                        label: `Breaker ${breaker}A`,
                        properties: { ...node.properties, ratedCurrent: breaker } 
                      });
                      setNodeContextMenu(null);
                    }}
                  >
                    Módulo a {breaker}A
                  </button>
                ))}
              </div>
            )}
            {(node.type === 'motor_electrico' || node.type === 'carga_general') && (
              <div className="max-h-48 overflow-y-auto">
                <button
                  className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateNodeData(node.id, { 
                      type: node.type === 'motor_electrico' ? 'carga_general' : 'motor_electrico',
                      label: node.type === 'motor_electrico' ? 'Carga Genérica' : 'Motor Trifásico'
                    });
                    setNodeContextMenu(null);
                  }}
                >
                  Convertir a {node.type === 'motor_electrico' ? 'Carga Genérica' : 'Motor'}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Gestor de Capas */}
      <LayerManager 
        isOpen={isLayersOpen}
        onClose={onCloseLayers}
        activeLayers={activeLayers} 
        onToggleLayer={handleToggleLayer} 
      />

      {viewMode === '3d_isometric' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-blue-900/40 border border-blue-500/50 text-blue-200 text-[10px] px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 pointer-events-none">
          <Sparkles className="w-3 h-3" />
          <span>Vista 3D Isométrica: Click derecho y arrastrar para rotar la cámara.</span>
        </div>
      )}

      {/* Controles de Zoom y Ajuste en la esquina inferior izquierda (High Density) */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 bg-[#1A1D23] border border-[#2A2D35] p-1 rounded shadow-lg">
        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.15, 5.0))}
          className="p-1 rounded text-[#AAA] hover:text-white hover:bg-[#2A2D35] transition cursor-pointer"
          title="Acercar (Zoom In)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono text-[#888] px-1 select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.1))}
          className="p-1 rounded text-[#AAA] hover:text-white hover:bg-[#2A2D35] transition cursor-pointer"
          title="Alejar (Zoom Out)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={resetView}
          className="p-1 rounded text-[#AAA] hover:text-white hover:bg-[#2A2D35] transition cursor-pointer"
          title="Ajustar vista"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Panel flotante de edición rápida del nodo seleccionado (High Density) */}
      {selectedNode && (
        <div className="absolute bottom-3 right-3 z-20 w-80 bg-[#121418] border border-[#2A2D35] rounded-lg p-3 shadow-2xl text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#2A2D35] pb-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Propiedades de {selectedNode.label}</span>
            </div>
            <button
              onClick={() => onDeleteNode(selectedNode.id)}
              className="p-1 rounded text-red-400 hover:bg-red-500/10 transition cursor-pointer"
              title="Eliminar equipo del diagrama"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="col-span-2">
              <label className="text-[10px] uppercase text-[#666] font-bold tracking-wider block mb-1">
                Etiqueta / Nombre Principal
              </label>
              <input
                type="text"
                value={selectedNode.label}
                onChange={e => onUpdateNodeData(selectedNode.id, { label: e.target.value })}
                className="w-full px-2 py-1 bg-[#0F1115] border border-[#2A2D35] rounded text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="col-span-2">
              <label className="text-[10px] uppercase text-[#666] font-bold tracking-wider block mb-1">
                Tag / Código
              </label>
              <input
                type="text"
                value={selectedNode.properties.tag || ''}
                onChange={e => onUpdateNodeProperties(selectedNode.id, { tag: e.target.value })}
                placeholder="Ej. DP-01, M-1"
                className="w-full px-2 py-1 bg-[#0F1115] border border-[#2A2D35] rounded text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase text-[#666] font-bold tracking-wider block mb-1">
                Carga Real (A)
              </label>
              <input
                type="number"
                value={selectedNode.properties.currentLoadAmps}
                onChange={e =>
                  onUpdateNodeProperties(selectedNode.id, {
                    currentLoadAmps: Number(e.target.value) || 0,
                  })
                }
                className="w-full px-2 py-1 bg-[#0F1115] border border-[#2A2D35] rounded text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase text-[#666] font-bold tracking-wider block mb-1">
                Capacidad Breaker (A)
              </label>
              <select
                value={selectedNode.properties.ratedCurrent}
                onChange={e =>
                  onUpdateNodeProperties(selectedNode.id, {
                    ratedCurrent: Number(e.target.value),
                  })
                }
                className="w-full px-2 py-1 bg-[#0F1115] border border-[#2A2D35] rounded text-white text-xs focus:outline-none focus:border-blue-500"
              >
                {STANDARD_BREAKERS.map(b => (
                  <option key={b} value={b}>
                    {b} A
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase text-[#666] font-bold tracking-wider block mb-1">
                Calibre Conductor
              </label>
              <select
                value={selectedNode.properties.conductorGauge}
                onChange={e =>
                  onUpdateNodeProperties(selectedNode.id, {
                    conductorGauge: e.target.value,
                  })
                }
                className="w-full px-2 py-1 bg-[#0F1115] border border-[#2A2D35] rounded text-white text-xs focus:outline-none focus:border-blue-500"
              >
                {CONDUCTOR_TABLE.map(c => (
                  <option key={c.gauge} value={c.gauge}>
                    {c.gauge} ({c.cuAmpacity75}A)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase text-[#666] font-bold tracking-wider block mb-1">
                Tubería Conduit
              </label>
              <select
                value={selectedNode.properties.conduitSize}
                onChange={e =>
                  onUpdateNodeProperties(selectedNode.id, {
                    conduitSize: e.target.value,
                  })
                }
                className="w-full px-2 py-1 bg-[#0F1115] border border-[#2A2D35] rounded text-white text-xs focus:outline-none focus:border-blue-500"
              >
                {CONDUIT_SIZES.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase text-[#666] font-bold tracking-wider block mb-1">
                Distancia (m)
              </label>
              <input
                type="number"
                value={selectedNode.properties.distanceMeters}
                onChange={e =>
                  onUpdateNodeProperties(selectedNode.id, {
                    distanceMeters: Number(e.target.value) || 0,
                  })
                }
                className="w-full px-2 py-1 bg-[#0F1115] border border-[#2A2D35] rounded text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase text-[#666] font-bold tracking-wider block mb-1">
                Tensión (V)
              </label>
              <input
                type="number"
                value={selectedNode.properties.voltage}
                onChange={e =>
                  onUpdateNodeProperties(selectedNode.id, {
                    voltage: Number(e.target.value) || 120,
                  })
                }
                className="w-full px-2 py-1 bg-[#0F1115] border border-[#2A2D35] rounded text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
