import { useState, useCallback } from 'react';
import { ElectricalNode, ElectricalEdge } from '../types/electrical';

interface HistoryState {
  nodes: ElectricalNode[];
  edges: ElectricalEdge[];
}

export function useHistory(initialNodes: ElectricalNode[], initialEdges: ElectricalEdge[]) {
  const [history, setHistory] = useState<HistoryState[]>([{ nodes: initialNodes, edges: initialEdges }]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const pushState = useCallback((newNodes: ElectricalNode[], newEdges: ElectricalEdge[]) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, currentIndex + 1);
      return [...newHistory, { nodes: newNodes, edges: newEdges }].slice(-50); // Keep last 50 states
    });
    setCurrentIndex((prev) => Math.min(prev + 1, 49));
  }, [currentIndex]);

  const undo = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const redo = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, history.length - 1));
  }, [history.length]);

  return {
    currentState: history[currentIndex],
    pushState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
}
