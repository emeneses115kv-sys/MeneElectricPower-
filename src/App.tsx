import { CustomComponentDesignerModal } from './components/canvas/CustomComponentDesignerModal';
import { getCustomComponents } from './utils/customComponentsDb';
import { CustomComponent } from './types/electrical';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ElectricalNode,
  ElectricalEdge,
  ProjectConfig,
  ComponentProperties,
  SymbolCatalogItem,
} from './types/electrical';
import {
  loadSavedCircuit,
  saveCircuitToStorage,
  syncCircuitToCloud,
  loadCircuitFromCloud,
  INITIAL_CIRCUIT_NODES,
  INITIAL_CIRCUIT_EDGES,
  INITIAL_PROJECT_CONFIG,
} from './utils/storage';
import { validateCircuitRules } from './utils/electricalRulesValidator';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { signInWithGoogle, signOutUser, auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { TopNavBar } from './components/layout/TopNavBar';
import { ElectricalCanvas } from './components/canvas/ElectricalCanvas';
import { SymbolCatalogModal } from './components/symbols/SymbolCatalogModal';
import { TechnicalReportModal } from './components/reports/TechnicalReportModal';
import { MaterialComputationModal } from './components/reports/MaterialComputationModal';
import { ElectricalAIAssistant } from './components/ai/ElectricalAIAssistant';
import { AIStructureModifierModal } from './components/ai/AIStructureModifierModal';
import { ExportImageModal } from './components/export/ExportImageModal';
import { calculateForceDirectedLayout } from './utils/layoutEngine';
import { useAutoRecoveryAgent } from './hooks/useAutoRecoveryAgent';
import { useUndoRedo } from './hooks/useUndoRedo';
import { AutoRecoveryToasts } from './components/ui/AutoRecoveryToasts';

export type DiagramViewMode = 'unifilar' | 'multifilar' | 'funcional' | 'topografico' | 'escalera' | '3d_isometric' | 'realista';

export default function App() {
  const isOnline = useOnlineStatus();

  // Carga inicial persistente offline
  const [initialData] = useState(() => loadSavedCircuit());
  const [nodes, setNodes] = useState<ElectricalNode[]>(initialData.nodes);
  const [edges, setEdges] = useState<ElectricalEdge[]>(initialData.edges);
  const [config, setConfig] = useState<ProjectConfig>(initialData.config);

  const [hasCloudLoaded, setHasCloudLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Auto-Recovery Agent (Runs in background)
  const { recoveryLogs, dismissLog } = useAutoRecoveryAgent(nodes, edges, setNodes, setEdges);

  // Undo/Redo System
  const { undo, redo, canUndo, canRedo } = useUndoRedo(nodes, edges, setNodes, setEdges, 600);

  useEffect(() => {
    if (!localStorage.getItem("hasClearedInitialDemo_v2")) {
      setNodes([]);
      setEdges([]);
      localStorage.setItem("hasClearedInitialDemo_v2", "true");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && !hasCloudLoaded) {
        // Cargar desde la nube una vez que estemos autenticados
        const cloudData = await loadCircuitFromCloud();
        const customComps = await getCustomComponents();
        setCustomComponents(customComps);

        if (cloudData) {
          setNodes(cloudData.nodes);
          setEdges(cloudData.edges);
          setConfig(cloudData.config);
        }
        setHasCloudLoaded(true);
      } else if (!currentUser) {
        setHasCloudLoaded(false);
      }
    });

    return () => unsubscribe();
  }, [hasCloudLoaded]);

  // Estados de interfaz y ventanas modales
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSymbolsOpen, setIsSymbolsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isAIModifierOpen, setIsAIModifierOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(true);
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [customComponents, setCustomComponents] = useState<any[]>([]);
  const [diagramView, setDiagramView] = useState<DiagramViewMode>('unifilar');

  // Validación de reglas eléctricas en tiempo real
  const { alerts, updatedEdges } = useMemo(() => {
    return validateCircuitRules(nodes, edges, config);
  }, [nodes, edges, config]);

  // Guardado persistente automático en cada modificación
  useEffect(() => {
    saveCircuitToStorage(nodes, updatedEdges, config);
    if (hasCloudLoaded) {
      syncCircuitToCloud(nodes, updatedEdges, config);
    }
  }, [nodes, updatedEdges, config, hasCloudLoaded]);

  // Actualizar carga simulada (amperaje global que modula la velocidad del flujo)
  const handleUpdateSimulatedAmperage = useCallback((amps: number) => {
    setConfig(prev => ({ ...prev, simulatedAmperage: amps }));
    setNodes(prev =>
      prev.map(node => {
        if (node.type === 'acometida_aerea' || node.type === 'acometida_subterranea' || node.type === 'interruptor_principal') {
          return {
            ...node,
            properties: {
              ...node.properties,
              currentLoadAmps: amps,
            },
          };
        }
        return node;
      })
    );
  }, []);

  // Actualizar propiedades técnicas de un nodo específico
  const handleUpdateNodeProperties = useCallback(
    (nodeId: string, updatedProps: Partial<ComponentProperties>) => {
      setNodes(prev =>
        prev.map(n => {
          if (n.id === nodeId) {
            return {
              ...n,
              properties: {
                ...n.properties,
                ...updatedProps,
              },
            };
          }
          return n;
        })
      );
    },
    []
  );

  // Actualizar datos generales del nodo (label, etc)
  const handleUpdateNodeData = useCallback((nodeId: string, data: Partial<ElectricalNode>) => {
    setNodes(prev =>
      prev.map(n => {
        if (n.id === nodeId) {
          return { ...n, ...data };
        }
        return n;
      })
    );
  }, []);

  // Mover nodo en el canvas CAD
  const handleMoveNode = useCallback((nodeId: string, x: number, y: number) => {
    setNodes(prev =>
      prev.map(n => (n.id === nodeId ? { ...n, x, y } : n))
    );
  }, []);

  // Eliminar nodo y sus conexiones
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.fromNodeId !== nodeId && e.toNodeId !== nodeId));
    setSelectedNodeId(null);
  }, []);

  // Aplicar corrección sugerida por el motor de normas o IA con 1 solo clic
  const handleApplyFix = useCallback(
    (nodeId: string, propertyKey: keyof ComponentProperties, newValue: any) => {
      handleUpdateNodeProperties(nodeId, { [propertyKey]: newValue });
    },
    [handleUpdateNodeProperties]
  );

  // Inserción de múltiples componentes seleccionados desde el catálogo
  const handleAddSymbolsFromCatalog = useCallback((catalogItems: SymbolCatalogItem[]) => {
    if (catalogItems.length === 0) return;

    // Calcular posición óptima en el canvas para no solapar
    const lastX = nodes.length > 0 ? Math.max(...nodes.map(n => n.x)) : 100;
    const baseY = 120;

    const newNodes: ElectricalNode[] = [];
    const newEdges: ElectricalEdge[] = [];

    catalogItems.forEach((item, index) => {
      const newNodeId = `node-${item.type}-${Date.now()}-${index}`;
      const newX = lastX + 180 + (index % 3) * 160;
      const newY = baseY + Math.floor(index / 3) * 120;

      const newNode: ElectricalNode = {
        id: newNodeId,
        type: item.type,
        label: item.name,
        category: item.category,
        x: newX,
        y: newY,
        properties: {
          voltage: item.defaultProps.voltage ?? 240,
          ratedCurrent: item.defaultProps.ratedCurrent ?? 100,
          currentLoadAmps: item.defaultProps.currentLoadAmps ?? 20,
          phases: item.defaultProps.phases ?? 1,
          conductorGauge: item.defaultProps.conductorGauge ?? '#2 AWG',
          conductorMaterial: item.defaultProps.conductorMaterial ?? 'Cu',
          conduitSize: item.defaultProps.conduitSize ?? '1-1/2"',
          conduitType: item.defaultProps.conduitType ?? 'EMT',
          distanceMeters: item.defaultProps.distanceMeters ?? 10,
          loadPowerKW: item.defaultProps.loadPowerKW ?? 4.8,
          powerFactor: item.defaultProps.powerFactor ?? 0.95,
          isClosed: item.defaultProps.isClosed ?? true,
          tag: `${item.type.substring(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        },
      };

      newNodes.push(newNode);

      // Conectar automáticamente a la barra colectora si existe
      const busNode = nodes.find(n => n.type === 'barra_distribucion');
      if (busNode) {
        newEdges.push({
          id: `edge-${busNode.id}-${newNodeId}`,
          fromNodeId: busNode.id,
          toNodeId: newNodeId,
          status: 'active',
          amperage: item.defaultProps.currentLoadAmps || 20,
          hasFlow: true,
          phaseIdentifier: 'L1',
        });
      }
    });

    setNodes(prev => [...prev, ...newNodes]);
    setEdges(prev => [...prev, ...newEdges]);
    setIsSymbolsOpen(false);
  }, [nodes]);

  // Restablecer circuito al diseño maestro de 1200A y 4 medidores
  const handleResetToDemo = useCallback(() => {
    setNodes(INITIAL_CIRCUIT_NODES);
    setEdges(INITIAL_CIRCUIT_EDGES);
    setConfig(INITIAL_PROJECT_CONFIG);
    setSelectedNodeId(null);
  }, []);

  const handleClearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
  }, []);

  const handleSave = useCallback(() => {
    saveCircuitToStorage(nodes, updatedEdges, config);
    if (hasCloudLoaded) {
      syncCircuitToCloud(nodes, updatedEdges, config);
    }
  }, [nodes, updatedEdges, config, hasCloudLoaded]);

  const handleAutoArrange = useCallback(() => {
    setNodes(prevNodes => calculateForceDirectedLayout(prevNodes, edges));
  }, [edges]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#0F1115] font-sans text-[#E0E0E0]">
      {/* Barra superior de control e instalación */}
      <TopNavBar
        config={config}
        alerts={alerts}
        isOnline={isOnline}
        onUpdateSimulatedAmperage={handleUpdateSimulatedAmperage}
        onToggleSymbols={() => setIsSymbolsOpen(prev => !prev)}
        onToggleReports={() => setIsReportsOpen(prev => !prev)}
        onToggleMaterials={() => setIsMaterialsOpen(prev => !prev)}
        onToggleAI={() => setIsAIOpen(prev => !prev)}
        onToggleAIModifier={() => setIsAIModifierOpen(prev => !prev)}
        onToggleLayers={() => setIsLayersOpen(prev => !prev)}
        onExportImage={() => setIsExportModalOpen(true)}
        onResetToDemo={handleResetToDemo}
        onClearAll={handleClearAll}
        onSave={handleSave}
        onAutoArrange={handleAutoArrange}
        isSymbolsOpen={isSymbolsOpen}
        isReportsOpen={isReportsOpen}
        isMaterialsOpen={isMaterialsOpen}
        isAIOpen={isAIOpen}
        isAIModifierOpen={isAIModifierOpen}
        isExportModalOpen={isExportModalOpen}
        isLayersOpen={isLayersOpen}
        isDesignerOpen={isDesignerOpen}
        onToggleDesigner={() => setIsDesignerOpen(!isDesignerOpen)}
        diagramView={diagramView}
        onChangeView={setDiagramView}
        user={user}
        onLogin={signInWithGoogle}
        onLogout={signOutUser}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Modal para Exportar Imagen */}
      {isExportModalOpen && (
        <ExportImageModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          currentView={diagramView}
          onChangeView={setDiagramView}
        />
      )}

      {/* Lienzo CAD interactivo con animaciones de bordes y alertas */}
      <main className="flex-1 relative w-full h-full" style={{ perspective: '1200px' }}>
        <ElectricalCanvas
          nodes={nodes}
          edges={updatedEdges}
          alerts={alerts}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onUpdateNodeProperties={handleUpdateNodeProperties}
          onUpdateNodeData={handleUpdateNodeData}
          onDeleteNode={handleDeleteNode}
          onMoveNode={handleMoveNode}
          onApplyFix={handleApplyFix}
          viewMode={diagramView}
          isLayersOpen={isLayersOpen}
          onCloseLayers={() => setIsLayersOpen(false)}
        />
      </main>

      {/* Ventana de Catálogo de Simbología con Selección Múltiple y Minimizado */}
      <SymbolCatalogModal
        customComponents={customComponents}
        isOpen={isSymbolsOpen}
        onClose={() => setIsSymbolsOpen(false)}
        onAddSymbols={handleAddSymbolsFromCatalog}
      />

      {/* Ventana de Reporte Técnico y Descarga de Planos A4 */}
      <TechnicalReportModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        nodes={nodes}
        edges={updatedEdges}
        config={config}
        alerts={alerts}
      />

      {/* Ventana de Cómputo de Materiales */}
      <CustomComponentDesignerModal
        isOpen={isDesignerOpen}
        onClose={() => setIsDesignerOpen(false)}
        onComponentSaved={async () => {
          const comps = await getCustomComponents();
          setCustomComponents(comps);
        }}
      />

      <MaterialComputationModal
        isOpen={isMaterialsOpen}
        onClose={() => setIsMaterialsOpen(false)}
        nodes={nodes}
        edges={updatedEdges}
      />

      {/* Ventana del Asistente Ingeniero Eléctrico IA con Modo Offline */}
      <ElectricalAIAssistant
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        nodes={nodes}
        edges={updatedEdges}
        config={config}
        alerts={alerts}
        onApplyFix={handleApplyFix}
        isOnline={isOnline}
      />
      
      {/* Ventana de Sugerencias de Modificación de Estructura por IA */}
      <AIStructureModifierModal 
        isOpen={isAIModifierOpen}
        onClose={() => setIsAIModifierOpen(false)}
        onOpenAI={() => setIsAIOpen(true)}
        nodes={nodes}
      />

      <AutoRecoveryToasts logs={recoveryLogs} onDismiss={dismissLog} />
    </div>
  );
}
