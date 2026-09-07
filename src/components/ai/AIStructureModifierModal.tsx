import React from 'react';
import { X, Sparkles, Database, Layers, Bot, MessageSquare, Activity, ShieldCheck } from 'lucide-react';
import { ElectricalNode } from '../../types/electrical';
import { DraggableWindow } from '../ui/DraggableWindow';

interface AIStructureModifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAI: () => void; // Para redirigir al panel principal de IA si es necesario
  nodes: ElectricalNode[];
}

export const AIStructureModifierModal: React.FC<AIStructureModifierModalProps> = ({ isOpen, onClose, onOpenAI, nodes }) => {
  const generateBalancingPrompt = () => {
    const loads = nodes
      .filter(n => n.properties.currentLoadAmps && n.properties.currentLoadAmps > 0)
      .map(n => `- ${n.label || n.type}: ${n.properties.currentLoadAmps}A (Fases: ${n.properties.phases || 1})`)
      .join('\n');
    
    return `Por favor, analiza el siguiente circuito eléctrico y sugiere automáticamente una configuración de balanceo de cargas trifásicas (L1, L2, L3), optimizando el uso de conductores basado en normativas locales (NEC):\n\nCargas actuales en el sistema:\n${loads}\n\nDetalla qué cargas asignar a cada fase, el desequilibrio resultante, y recomienda el calibre de conductor óptimo para el alimentador principal para soportar este balanceo. Muestra los cálculos.`;
  };

  const suggestions = [
    {
      icon: <ShieldCheck className="w-4 h-4 text-green-500" />,
      title: 'Agente de Diagnóstico (Auto-Reparador)',
      desc: 'Activa un agente de fondo que buscará códigos o configuraciones eléctricas erróneas (caída de tensión, sobrecarga) y te presentará enlaces o botones para aplicar los arreglos correctivos automáticamente.',
      prompt: 'Crea un Agente de Diagnóstico y Reparación en la UI. Este debe ser un panel donde el agente muestre todas las Alertas Eléctricas (del validationEngine) y ofrezca un botón de "Auto-Reparar Todo" (aplicar suggestedFix a todos los nodos con fallas). También permite renderizar un enlace para verificar el funcionamiento.'
    },
    {
      icon: <Activity className="w-4 h-4 text-orange-400" />,
      title: 'Balanceo de Cargas Trifásico',
      desc: 'Analiza el consumo de todos los equipos en el lienzo y solicita a la IA que distribuya las cargas óptimamente (L1, L2, L3) para evitar sobrecargas del neutro.',
      prompt: generateBalancingPrompt()
    },
    {
      icon: <Database className="w-4 h-4 text-emerald-400" />,
      title: 'Integrar Base de Datos Real',
      desc: 'Pídele a la IA que reemplace el almacenamiento local con Firebase Firestore o Cloud SQL para guardar proyectos en la nube.',
      prompt: 'Implementa Firebase Firestore para guardar y cargar los proyectos, nodos y conexiones en la nube. Añade una lista de proyectos.'
    },
    {
      icon: <Layers className="w-4 h-4 text-blue-400" />,
      title: 'Agregar Panel de Propiedades Avanzado',
      desc: 'Solicita una barra lateral (Sidebar) dedicada para editar todos los atributos técnicos y visuales del nodo seleccionado.',
      prompt: 'Crea un Sidebar a la derecha del lienzo para editar las propiedades del nodo seleccionado (amperaje, tipo, nombre, etc) en lugar de usar un tooltip flotante.'
    },
    {
      icon: <Bot className="w-4 h-4 text-purple-400" />,
      title: 'Generación Automática de Nodos por IA',
      desc: 'Integra Gemini para que el usuario pueda escribir "Generar tablero con 10 medidores" y la app construya el diagrama sola.',
      prompt: 'Integra la API de Gemini para que procese instrucciones en lenguaje natural del usuario y genere automáticamente los nodos y conexiones (ej: "Genera un ramal con 5 breakers").'
    }
  ];

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    alert('Prompt copiado al portapapeles. Ahora abre el Asistente IA (💬) y pégalo allí para que la IA realice los cambios en la estructura de la aplicación.');
    onOpenAI();
    onClose();
  };

  return (
    <DraggableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="Modificación de Estructura IA"
      icon={<Sparkles className="w-4 h-4 text-purple-400" />}
      defaultPosition={{ x: window.innerWidth / 2 - 250, y: window.innerHeight / 2 - 200 }}
      defaultSize={{ width: 500, height: 400 }}
    >
      <div className="p-5 bg-[#121418] h-full overflow-auto">
        <p className="text-xs text-[#AAA] mb-4 leading-relaxed">
          Esta herramienta está diseñada en Google AI Studio. Como usuario, puedes instruir al Agente IA para que programe modificaciones estructurales profundas en la aplicación. Selecciona una sugerencia o copia la instrucción para el chat.
        </p>

        <div className="space-y-3">
          {suggestions.map((sug, idx) => (
            <div key={idx} className="p-3 bg-[#1A1D23] border border-[#2A2D35] rounded-lg hover:border-[#444] transition group">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 bg-[#0F1115] rounded-md border border-[#2A2D35]">
                  {sug.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-white">{sug.title}</h4>
                  <p className="text-[10px] text-[#888] mt-1 mb-3 leading-relaxed">{sug.desc}</p>
                  <button
                    onClick={() => handleCopyPrompt(sug.prompt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2D35] hover:bg-purple-600 hover:text-white text-xs text-[#AAA] font-medium rounded transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Usar esta opción
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DraggableWindow>
  );
};

