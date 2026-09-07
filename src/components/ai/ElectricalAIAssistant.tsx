import React, { useState, useRef, useEffect } from 'react';
import { ElectricalNode, ElectricalEdge, ProjectConfig, ElectricalAlert } from '../../types/electrical';
import {
  Bot,
  Send,
  Sparkles,
  Wrench,
  WifiOff,
  Cpu,
} from 'lucide-react';
import { findMinimumGaugeForCurrent, findRecommendedBreaker, calculateVoltageDrop } from '../../utils/electricalCalculations';
import { DraggableWindow } from '../ui/DraggableWindow';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  isOffline?: boolean;
  actionableFix?: {
    nodeId: string;
    property: string;
    value: any;
    label: string;
  };
}

interface ElectricalAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: ElectricalNode[];
  edges: ElectricalEdge[];
  config: ProjectConfig;
  alerts: ElectricalAlert[];
  onApplyFix: (nodeId: string, propertyKey: any, newValue: any) => void;
  isOnline: boolean;
}

export const ElectricalAIAssistant: React.FC<ElectricalAIAssistantProps> = ({
  isOpen,
  onClose,
  nodes,
  edges,
  config,
  alerts,
  onApplyFix,
  isOnline,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: '¡Hola! Soy tu Agente Consultor de Ingeniería Eléctrica (NEC / ENSA / Naturgy). Puedo analizar tu diagrama unifilar de 1200A, verificar ampacidades, sugerir calibres, corregir caídas de tensión y optimizar la distribución de los 4 medidores.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Motor de respuesta experto offline cuando no hay internet
  const generateOfflineResponse = (userQuery: string): { text: string; actionableFix?: any } => {
    const q = userQuery.toLowerCase();

    if (q.includes('acometida') || q.includes('1200') || q.includes('calibre')) {
      return {
        text: `Para una acometida de 1200A a 120/240V monofásica según la Tabla NEC 310.16:\n- Se requieren 4 conductores en paralelo de 500 kcmil Cu THHN (380A x 4 = 1520A de capacidad, cumpliendo holgadamente el factor de servicio continuo de 125% = 1500A).\n- Tubería conduit: 4 ductos de 4" RMC o PVC Schedule 40 con un conductor de 500 kcmil por fase en cada tubo.`,
      };
    }

    if (q.includes('medidor') || q.includes('4') || q.includes('falla') || q.includes('alerta')) {
      const faultNode = nodes.find(n => n.id === 'node-meter-4');
      if (faultNode && faultNode.properties.conductorGauge === '#12 AWG') {
        const correctGauge = findMinimumGaugeForCurrent(faultNode.properties.currentLoadAmps);
        return {
          text: `He detectado una anomalía crítica en el Medidor #4 (${faultNode.properties.currentLoadAmps}A):\nEl conductor actual es #12 AWG (máx 20A), lo cual representa un grave riesgo térmico. Según la norma, debes instalar al menos conductor ${correctGauge} Cu.`,
          actionableFix: {
            nodeId: faultNode.id,
            property: 'conductorGauge',
            value: correctGauge,
            label: `Actualizar Medidor #4 a ${correctGauge}`,
          },
        };
      }
    }

    if (q.includes('caida') || q.includes('tensión') || q.includes('voltaje')) {
      return {
        text: `La caída de tensión admisible según NEC 210.19(A) es del 3% en alimentadores. A 28 metros con 185A, cambiar a calibre #3/0 AWG o superior reduce la caída al 1.2%, garantizando voltajes estables en bornes de los medidores.`,
      };
    }

    if (alerts.length > 0) {
      const firstAlert = alerts[0];
      return {
        text: `Se han detectado ${alerts.length} observaciones normativas en el circuito.\nPrincipal hallazgo: ${firstAlert.title}.\nDetalle: ${firstAlert.description} (${firstAlert.standardRule}).`,
        actionableFix: {
          nodeId: firstAlert.nodeId,
          property: firstAlert.suggestedFix.propertyKey,
          value: firstAlert.suggestedFix.newValue,
          label: firstAlert.suggestedFix.label,
        },
      };
    }

    return {
      text: `El diagrama presenta ${nodes.length} equipos conectados con una carga total de ${config.simulatedAmperage || 820}A.\nTodos los parámetros de cálculo y simulación de flujo están operativos localmente en modo fuera de línea.`,
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    if (!isOnline) {
      // Modo fuera de línea
      setTimeout(() => {
        const offlineReply = generateOfflineResponse(query);
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            text: offlineReply.text,
            isOffline: true,
            actionableFix: offlineReply.actionableFix,
          },
        ]);
        setLoading(false);
      }, 350);
      return;
    }

    try {
      const circuitState = {
        projectName: config.projectName,
        voltage: config.nominalVoltage,
        simulatedAmperage: config.simulatedAmperage,
        utilityProvider: config.utilityProvider,
        nodesCount: nodes.length,
        activeAlerts: alerts.map(a => ({ title: a.title, rule: a.standardRule, desc: a.description })),
        meters: nodes.filter(n => n.type === 'medidor').map(m => ({
          label: m.label,
          amps: m.properties.currentLoadAmps,
          gauge: m.properties.conductorGauge,
        })),
      };

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, circuitState }),
      });

      if (!response.ok) {
        throw new Error('Servicio de IA temporalmente inaccesible');
      }

      const data = await response.json();
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: data.reply || 'Respuesta generada con éxito.',
        },
      ]);
    } catch (err) {
      // En caso de fallo de red o API, responder con el motor inteligente offline sin interrupciones
      const offlineFallback = generateOfflineResponse(query);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `${offlineFallback.text}`,
          isOffline: true,
          actionableFix: offlineFallback.actionableFix,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DraggableWindow
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>Ingeniero Eléctrico IA</span>
          {!isOnline && (
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-normal">
              <WifiOff className="w-2.5 h-2.5" /> Offline
            </span>
          )}
        </div>
      }
      icon={<Bot className="w-4 h-4 text-blue-400" />}
      defaultPosition={{ x: 20, y: window.innerHeight - 520 }}
      defaultSize={{ width: 400, height: 500 }}
    >
      <div className="flex flex-col h-full bg-[#121418]">
        {/* Sugerencias Rápidas */}
        <div className="px-3 py-1.5 bg-[#0F1115] border-b border-[#2A2D35] flex items-center gap-1 overflow-x-auto text-[10px] font-mono shrink-0">
          <button
            onClick={() => handleSendMessage('¿Cómo dimensionar la acometida de 1200A?')}
            className="px-2 py-0.5 rounded bg-[#1A1D23] hover:bg-[#2A2D35] text-[#AAA] hover:text-white whitespace-nowrap transition cursor-pointer border border-[#2A2D35]"
          >
            ⚡ Acometida 1200A
          </button>
          <button
            onClick={() => handleSendMessage('¿Hay fallas o sobrecargas en los 4 medidores?')}
            className="px-2 py-0.5 rounded bg-[#1A1D23] hover:bg-[#2A2D35] text-[#AAA] hover:text-white whitespace-nowrap transition cursor-pointer border border-[#2A2D35]"
          >
            🔍 Validar Medidores
          </button>
          <button
            onClick={() => handleSendMessage('¿Cumple con la norma de caída de tensión < 3%?')}
            className="px-2 py-0.5 rounded bg-[#1A1D23] hover:bg-[#2A2D35] text-[#AAA] hover:text-white whitespace-nowrap transition cursor-pointer border border-[#2A2D35]"
          >
            📉 Caída de Tensión
          </button>
        </div>

        {/* Historial de Mensajes */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs shrink-0">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] rounded p-2.5 leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1A1D23] text-[#E0E0E0] border border-[#2A2D35]'
                }`}
              >
                {msg.isOffline && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono mb-1">
                    <Cpu className="w-3 h-3" />
                    <span>Motor Local Offline</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Botón de acción si la IA sugiere una mejora directa */}
                {msg.actionableFix && (
                  <button
                    onClick={() => {
                      onApplyFix(
                        msg.actionableFix!.nodeId,
                        msg.actionableFix!.property,
                        msg.actionableFix!.value
                      );
                    }}
                    className="mt-2 w-full py-1 px-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>{msg.actionableFix.label}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-blue-400 p-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Consultando ingeniería y normativas...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Formulario de Input */}
        <div className="p-2.5 border-t border-[#2A2D35] bg-[#0F1115] flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="Pregunta sobre breakers, calibres, tuberías o normas..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            className="flex-1 px-2.5 py-1.5 bg-[#0F1115] border border-[#2A2D35] rounded text-xs text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || loading}
            className="p-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};
