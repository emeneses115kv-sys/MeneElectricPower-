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
  INITIAL_CIRCUIT_NODES,
  INITIAL_CIRCUIT_EDGES,
  INITIAL_PROJECT_CONFIG,
} from './utils/storage';
import { syncCircuitToSupabase, loadCircuitFromSupabase } from './utils/supabaseStorage';
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
    if (!localStorage.getItem('hasClearedInitialDemo_v2')) {
      setNodes([]);
      setEdges([]);
      localStorage.setItem('hasClearedInitialDemo_v2', 'true');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (currentUser && !hasCloudLoaded) {
        const cloudData = await loadCircuitFromSupabase();
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
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);
  const [diagramView, setDiagramView] = useState<DiagramViewMode>('unifilar');

  // Validación de reglas eléctricas en tiempo real
  const { alerts, updatedEdges } = useMemo(() => validateCircuitRules(nodes, edges, config), [nodes, edges, config]);

  // Guardado persistente automático en cada modificación
  useEffect(() => {
    saveCircuitToStorage(nodes, updatedEdges, config);
    if (hasCloudLoaded) {
      void syncCircuitToSupabase(nodes, updatedEdges, config);
    }
  }, [nodes, updatedEdges, config, hasCloudLoaded]);

  const handleUpdateSimulatedAmperage = useCallback((amps: number) => {
    setConfig(prev => ({ ...prev, simulatedAmperage: amps }));
    setNodes(prev => prev.map(node => {
      if (node.type === 'acometida_aerea' || node.type === 'acometida_subterranea' || node.type === 'interruptor_principal') {
        return { ...node, properties: { ...node.properties, currentLoadAmps: amps } };
      }
      return node;
    }));
  }, []);

  const handleUpdateNodeProperties = useCallback((nodeId: string, updatedProps: Partial<ComponentProperties>) => {
    setNodes(prev => prev.map(node => node.id === nodeId
      ? { ...node, properties: { ...node.properties, ...updatedProps } }
      : node));
  }, []);

  const handleUpdateNodeData = useCallback((nodeId: string, data: Partial<ElectricalNode>) => {
    setNodes(prev => prev.map(node => node.id === nodeId ? { ...node, ...data } : node));
  }, []);

  const handleMoveNode = useCallback((nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(node => node.id === nodeId ? { ...node, x, y } : node));
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setEdges(prev => prev.filter(edge => edge.fromNodeId !== nodeId && edge.toNodeId !== nodeId));
    setSelectedNodeId(null);
  }, []);

  const handleApplyFix = useCallback((nodeId: string, propertyKey: keyof ComponentProperties, newValue: any) => {
    handleUpdateNodeProperties(nodeId, { [propertyKey]: newValue });
  }, [handleUpdateNodeProperties]);

  const handleAddSymbolsFromCatalog = useCallback((catalogItems: SymbolCatalogItem[]) => {
    if (catalogItems.length === 0) return;

    const lastX = nodes.length > 0 ? Math.max(...nodes.map(node => node.x)) : 100;
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

      const busNode = nodes.find(node => node.type === 'barra_distribucion');
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
    if (hasCloudLoaded) void syncCircuitToSupabase(nodes, updatedEdges, config);
  }, [nodes, updatedEdges, config, hasCloudLoaded]);

  const handleAutoArrange = useCallback(() => {
    setNodes(prevNodes => calculateForceDirectedLayout(prevNodes, edges));
  }, [edges]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#0F1115] font-sans text-[#E0E0E0]">
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

      {isExportModalOpen && (
        <ExportImageModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} currentView={diagramView} onChangeView={setDiagramView} />
      )}

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

      <SymbolCatalogModal customComponents={customComponents} isOpen={isSymbolsOpen} onClose={() => setIsSymbolsOpen(false)} onAddSymbols={handleAddSymbolsFromCatalog} />
      <TechnicalReportModal isOpen={isReportsOpen} onClose={() => setIsReportsOpen(false)} nodes={nodes} edges={updatedEdges} config={config} alerts={alerts} />
      <CustomComponentDesignerModal
        isOpen={isDesignerOpen}
        onClose={() => setIsDesignerOpen(false)}
        onComponentSaved={async () => setCustomComponents(await getCustomComponents())}
      />
      <MaterialComputationModal isOpen={isMaterialsOpen} onClose={() => setIsMaterialsOpen(false)} nodes={nodes} edges={updatedEdges} />
      <ElectricalAIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} nodes={nodes} edges={updatedEdges} config={config} alerts={alerts} onApplyFix={handleApplyFix} isOnline={isOnline} />
      <AIStructureModifierModal isOpen={isAIModifierOpen} onClose={() => setIsAIModifierOpen(false)} onOpenAI={() => setIsAIOpen(true)} nodes={nodes} />
      <AutoRecoveryToasts logs={recoveryLogs} onDismiss={dismissLog} />
    </div>
  );
}
