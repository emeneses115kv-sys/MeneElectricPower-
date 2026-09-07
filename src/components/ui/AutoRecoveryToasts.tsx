import React, { useEffect } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { RecoveryLog } from '../../hooks/useAutoRecoveryAgent';

interface AutoRecoveryToastsProps {
  logs: RecoveryLog[];
  onDismiss: (id: string) => void;
}

export const AutoRecoveryToasts: React.FC<AutoRecoveryToastsProps> = ({ logs, onDismiss }) => {
  // Auto-dismiss logs after 5 seconds
  useEffect(() => {
    if (logs.length > 0) {
      const timers = logs.map(log => {
        return setTimeout(() => {
          onDismiss(log.id);
        }, 5000);
      });
      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [logs, onDismiss]);

  if (logs.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
      {logs.map((log) => (
        <div 
          key={log.id} 
          className="flex items-start gap-2 bg-[#121418]/95 backdrop-blur-md border border-green-500/30 p-3 rounded-lg shadow-2xl animate-in slide-in-from-left-4 fade-in duration-300 pointer-events-auto max-w-xs"
        >
          <ShieldAlert className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-[11px] font-bold text-green-400 uppercase tracking-wider mb-0.5">Agente de Auto-Recuperación</h4>
            <p className="text-xs text-[#E0E0E0] leading-snug font-mono">{log.message}</p>
          </div>
          <button 
            onClick={() => onDismiss(log.id)}
            className="text-[#888] hover:text-white transition p-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
