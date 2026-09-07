import { useState, useCallback, useEffect, useRef } from 'react';
import { ElectricalNode, ElectricalEdge } from '../types/electrical';

interface Snapshot {
  nodes: ElectricalNode[];
  edges: ElectricalEdge[];
}

export function useUndoRedo(
  nodes: ElectricalNode[],
  edges: ElectricalEdge[],
  setNodes: (n: ElectricalNode[]) => void,
  setEdges: (e: ElectricalEdge[]) => void,
  debounceMs: number = 800
) {
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  const isUndoRedoAction = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize
  useEffect(() => {
    if (history.length === 0 && nodes.length > 0) {
      setHistory([{ nodes, edges }]);
      setCurrentIndex(0);
    }
  }, [nodes, edges, history]);

  // Debounced snapshot saving
  useEffect(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    if (history.length === 0) return; // Wait for initial snapshot

    const currentSnapshot = history[currentIndex];
    
    // Check if anything actually changed (simple length/position check is usually enough, or deep equal)
    // To keep it simple, we just save unconditionally on debounced changes.
    // If you drag a node, it will save the final position.

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setHistory(prev => {
        const newHistory = prev.slice(0, currentIndex + 1);
        return [...newHistory, { nodes, edges }].slice(-50); // Keep 50
      });
      setCurrentIndex(prev => Math.min(prev + 1, 49));
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [nodes, edges]); // Removed history & currentIndex from deps to avoid loop

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUndoRedoAction.current = true;
      const prev = history[currentIndex - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex, history, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const next = history[currentIndex + 1];
      setNodes(next.nodes);
      setEdges(next.edges);
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, history, setNodes, setEdges]);

  return {
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1 && history.length > 0
  };
}
