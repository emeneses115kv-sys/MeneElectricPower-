import React, { useMemo } from 'react';
import { ElectricalNode, ElectricalEdge } from '../../types/electrical';
import { DraggableWindow } from '../ui/DraggableWindow';
import { Calculator, Download, Table2 } from 'lucide-react';

interface MaterialComputationModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: ElectricalNode[];
  edges: ElectricalEdge[];
}

interface MaterialItem {
  category: string;
  description: string;
  quantity: number;
  unit: string;
}

export const MaterialComputationModal: React.FC<MaterialComputationModalProps> = ({
  isOpen,
  onClose,
  nodes,
  edges
}) => {
  const materials = useMemo(() => {
    const list: MaterialItem[] = [];
    const itemMap = new Map<string, MaterialItem>();

    const addItem = (category: string, description: string, quantity: number, unit: string) => {
      const key = `${category}-${description}-${unit}`;
      if (itemMap.has(key)) {
        itemMap.get(key)!.quantity += quantity;
      } else {
        itemMap.set(key, { category, description, quantity, unit });
      }
    };

    // Procesar Nodos (Equipos Principales y Accesorios)
    nodes.forEach(node => {
      // Equipo principal
      addItem('Equipos', node.label, 1, 'und');

      // Accesorios basados en tipo de nodo
      if (node.type === 'tablero_distribucion') {
        addItem('Ferretería', 'Tornillos de anclaje (Juego de 4)', 1, 'juego');
        addItem('Conexiones', 'Bornera de puesta a tierra', 1, 'und');
      } else if (node.type === 'transformador') {
        addItem('Ferretería', 'Pernos de sujeción para transformador', 4, 'und');
        addItem('Aislantes', 'Cinta de fibra de vidrio', 1, 'rollo');
      } else if (node.type === 'medidor') {
        addItem('Ferretería', 'Base socket para medidor', 1, 'und');
        addItem('Conexiones', 'Conector de compresión (Terminal)', 4, 'und');
      } else if (node.type === 'interruptor_principal' || node.type === 'breaker_termomagnetico') {
        addItem('Conexiones', 'Terminales tipo zapata', 2, 'und');
      }

      // Cables y Canalizaciones (calculados de las distancias del nodo)
      const dist = node.properties.distanceMeters || 0;
      if (dist > 0) {
        if (node.properties.conductorGauge) {
          addItem('Conductores', `Cable ${node.properties.conductorMaterial} Calibre ${node.properties.conductorGauge}`, dist, 'm');
        }
        if (node.properties.conduitSize && node.properties.conduitType) {
          addItem('Canalizaciones', `Tubería ${node.properties.conduitType} de ${node.properties.conduitSize}`, dist, 'm');
          
          // Calcular accesorios de canalización (aprox 1 abrazadera cada 1.5 metros, 1 unión cada 3 metros)
          const abrazaderas = Math.ceil(dist / 1.5);
          const uniones = Math.ceil(dist / 3);
          addItem('Ferretería', `Abrazadera para tubo ${node.properties.conduitSize}`, abrazaderas, 'und');
          addItem('Canalizaciones', `Unión recta ${node.properties.conduitType} de ${node.properties.conduitSize}`, uniones, 'und');
          addItem('Ferretería', 'Tornillos y Tacos (fijación abrazadera)', abrazaderas * 2, 'und');
        }
      }
    });

    // Añadir componentes de conexiones (edges) si aplicara
    edges.forEach(edge => {
      // Podríamos calcular conectores por cada enlace
      addItem('Conexiones', 'Terminales de empalme / ponchado', 2, 'und');
    });

    return Array.from(itemMap.values()).sort((a, b) => a.category.localeCompare(b.category));
  }, [nodes, edges]);

  const exportToCSV = () => {
    let csvContent = "Categoría,Descripción,Cantidad,Unidad\n";
    materials.forEach(item => {
      const description = `"${item.description.replace(/"/g, '""')}"`;
      csvContent += `${item.category},${description},${item.quantity},${item.unit}\n`;
    });
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'computo_materiales.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DraggableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="Cómputo de Materiales"
      icon={<Calculator className="w-4 h-4 text-emerald-400" />}
      defaultPosition={{ x: 100, y: 100 }}
      defaultSize={{ width: 600, height: 500 }}
    >
      <div className="flex flex-col h-full bg-[#121418] text-slate-200">
        <div className="p-3 border-b border-[#2A2D35] bg-[#0F1115] shrink-0 flex items-center justify-between">
          <p className="text-xs text-[#888] font-mono">
            Análisis dinámico del lienzo actual. Generación de listado de partes.
          </p>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {materials.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#666] font-mono text-xs">
              <Table2 className="w-8 h-8 mb-2 opacity-50" />
              <p>No hay componentes en el diagrama.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-[#2A2D35]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#1A1D23] border-b border-[#2A2D35]">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-[#AAA]">Categoría</th>
                    <th className="px-3 py-2 font-semibold text-[#AAA]">Descripción</th>
                    <th className="px-3 py-2 font-semibold text-[#AAA] text-right">Cantidad</th>
                    <th className="px-3 py-2 font-semibold text-[#AAA]">Unidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2D35]">
                  {materials.map((item, i) => (
                    <tr key={i} className="hover:bg-[#1A1D23]/50 transition">
                      <td className="px-3 py-2 text-emerald-400">{item.category}</td>
                      <td className="px-3 py-2 text-slate-300">{item.description}</td>
                      <td className="px-3 py-2 text-white font-bold text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-[#888]">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DraggableWindow>
  );
};
