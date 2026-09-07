import { useEffect, useState, useRef } from 'react';
import { ElectricalNode, ElectricalEdge, ComponentProperties } from '../types/electrical';

export interface RecoveryLog {
  id: string;
  message: string;
  timestamp: number;
}

export const useAutoRecoveryAgent = (
  nodes: ElectricalNode[],
  edges: ElectricalEdge[],
  setNodes: (n: ElectricalNode[]) => void,
  setEdges: (e: ElectricalEdge[]) => void
) => {
  const [recoveryLogs, setRecoveryLogs] = useState<RecoveryLog[]>([]);
  const isFixingRef = useRef(false);

  useEffect(() => {
    // Evitar ciclos infinitos si ya estamos aplicando un fix
    if (isFixingRef.current) {
      isFixingRef.current = false;
      return;
    }

    let hasChanges = false;
    let newNodes = [...nodes];
    let newEdges = [...edges];
    let logs: RecoveryLog[] = [];

    const addLog = (msg: string) => {
      logs.push({
        id: Math.random().toString(36).substring(7),
        message: msg,
        timestamp: Date.now()
      });
    };

    // 1. Limpieza de Enlaces (Aristas huérfanas o duplicadas)
    const nodeIds = new Set(newNodes.map(n => n.id));
    const validEdges = newEdges.filter(e => {
      const isFromValid = nodeIds.has(e.fromNodeId);
      const isToValid = nodeIds.has(e.toNodeId);
      
      if (!isFromValid || !isToValid) {
        addLog(`Enlace huérfano eliminado: ${e.id}`);
        hasChanges = true;
        return false;
      }
      return true;
    });
    
    if (validEdges.length !== newEdges.length) {
      newEdges = validEdges;
    }

    // 2. Integridad de Datos de Nodos (Nulls, NaNs, missing properties)
    newNodes = newNodes.map(node => {
      let fixed = false;
      const n = { ...node };

      if (isNaN(n.x) || n.x === null || n.x === undefined) { n.x = window.innerWidth / 2 || 500; fixed = true; }
      if (isNaN(n.y) || n.y === null || n.y === undefined) { n.y = window.innerHeight / 2 || 300; fixed = true; }
      
      if (!n.properties) {
        n.properties = {
          voltage: 120,
          ratedCurrent: 20,
          currentLoadAmps: 0,
          phases: 1,
          conductorGauge: '#12 AWG',
          conductorMaterial: 'Cu',
          conduitSize: '1/2"',
          conduitType: 'EMT',
          distanceMeters: 5,
          loadPowerKW: 1,
          powerFactor: 0.9,
          isClosed: true
        } as ComponentProperties;
        fixed = true;
      }

      if (n.properties.voltage === undefined || isNaN(n.properties.voltage)) {
        n.properties.voltage = 120;
        fixed = true;
      }
      
      if (fixed) {
        addLog(`Integridad restaurada en nodo: ${n.label || n.id}`);
        hasChanges = true;
      }
      
      return n;
    });

    if (hasChanges) {
      isFixingRef.current = true;
      setNodes(newNodes);
      setEdges(newEdges);
      setRecoveryLogs(prev => [...prev, ...logs].slice(-6));
    }
  }, [nodes, edges, setNodes, setEdges]);

  const dismissLog = (id: string) => {
    setRecoveryLogs(prev => prev.filter(log => log.id !== id));
  };

  return { recoveryLogs, dismissLog };
};
