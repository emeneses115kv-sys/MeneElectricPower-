import React, { useState } from 'react';
import { ElectricalNode, ElectricalEdge, ProjectConfig, ElectricalAlert } from '../../types/electrical';
import { exportFullProjectPDF, exportA4BlueprintCAD, exportMaterialsListPDF } from '../../utils/pdfExport';
import { exportProfessionalJSONReport } from '../../utils/jsonExport';
import { calculateVoltageDrop, getAmpacity } from '../../utils/electricalCalculations';
import {
  FileText,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Zap,
  Code2
} from 'lucide-react';
import { DraggableWindow } from '../ui/DraggableWindow';

interface TechnicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: ElectricalNode[];
  edges: ElectricalEdge[];
  config: ProjectConfig;
  alerts: ElectricalAlert[];
}

export const TechnicalReportModal: React.FC<TechnicalReportModalProps> = ({
  isOpen,
  onClose,
  nodes,
  edges,
  config,
  alerts,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnostico' | 'materiales'>('diagnostico');

  const totalKW = nodes.reduce((acc, n) => acc + (n.properties.loadPowerKW || 0), 0);
  const totalAmps = config.simulatedAmperage || 820;

  // Cálculos de materiales
  let totalConduitEMT = 0;
  let totalConduitPVC = 0;
  let totalConduitRMC = 0;
  let totalWire = 0;

  nodes.forEach(node => {
    const dist = node.properties.distanceMeters || 0;
    if (node.properties.conduitType === 'EMT') totalConduitEMT += dist;
    else if (node.properties.conduitType === 'PVC') totalConduitPVC += dist;
    else if (node.properties.conduitType === 'RMC') totalConduitRMC += dist;
    else totalConduitPVC += dist; // Default to PVC if not specified

    totalWire += dist * 3; // Basic estimation 3 wires per conduit
  });

  return (
    <DraggableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="Reporte Técnico y Plano Normativo A4"
      icon={<FileText className="w-4 h-4 text-blue-400" />}
      defaultPosition={{ x: window.innerWidth / 2 - 350, y: window.innerHeight / 2 - 250 }}
      defaultSize={{ width: 700, height: 500 }}
    >
      <div className="flex flex-col h-full bg-[#121418]">
        {/* Cabecera de Tabs */}
        <div className="flex items-center border-b border-[#2A2D35] bg-[#121418] px-3.5 pt-2 text-xs font-medium shrink-0">
          <button
            onClick={() => setActiveTab('diagnostico')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'diagnostico' ? 'border-blue-500 text-blue-400' : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            Diagnóstico y Planos
          </button>
          <button
            onClick={() => setActiveTab('materiales')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'materiales' ? 'border-blue-500 text-blue-400' : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            Cómputo de Materiales
          </button>
        </div>

        {/* Acciones de Exportación Rápidas */}
        <div className="p-3 bg-[#0F1115] border-b border-[#2A2D35] grid grid-cols-1 sm:grid-cols-4 gap-2.5 shrink-0">
          <button
            onClick={() => exportFullProjectPDF(nodes, edges, config, alerts)}
            className="flex items-center justify-center gap-2 p-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Reporte Integral PDF</span>
          </button>

          <button
            onClick={() => exportA4BlueprintCAD(nodes, edges, config)}
            className="flex items-center justify-center gap-2 p-2.5 rounded bg-[#1A1D23] hover:bg-[#2A2D35] text-[#AAA] hover:text-white border border-[#2A2D35] font-medium text-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            <span>Plano CAD</span>
          </button>

          <button
            onClick={() => exportMaterialsListPDF(nodes, config)}
            className="flex items-center justify-center gap-2 p-2.5 rounded bg-[#1A1D23] hover:bg-[#2A2D35] text-[#AAA] hover:text-white border border-[#2A2D35] font-medium text-xs transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-green-400" />
            <span>Materiales</span>
          </button>
          
          <button
            onClick={() => exportProfessionalJSONReport(nodes, edges, config, alerts)}
            className="flex items-center justify-center gap-2 p-2.5 rounded bg-[#161920] hover:bg-[#252830] text-[#AAA] hover:text-green-400 border border-[#2A2D35] font-medium text-xs transition cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Reporte JSON</span>
          </button>
        </div>

        {/* Contenido del Reporte */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs text-[#E0E0E0]">
          {activeTab === 'diagnostico' && (
            <>
              {/* Ficha Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono shrink-0">
                <div className="p-2 rounded bg-[#1A1D23] border border-[#2A2D35]">
                  <span className="text-[10px] text-[#888] block">Capacidad Instalada</span>
                  <span className="text-sm font-bold text-blue-400">{config.mainBreakerAmps} A</span>
                </div>
                <div className="p-2 rounded bg-[#1A1D23] border border-[#2A2D35]">
                  <span className="text-[10px] text-[#888] block">Demanda Simulada</span>
                  <span className="text-sm font-bold text-white">{totalAmps} A</span>
                </div>
                <div className="p-2 rounded bg-[#1A1D23] border border-[#2A2D35]">
                  <span className="text-[10px] text-[#888] block">Potencia Activa</span>
                  <span className="text-sm font-bold text-white">{totalKW.toFixed(1)} kW</span>
                </div>
                <div className="p-2 rounded bg-[#1A1D23] border border-[#2A2D35]">
                  <span className="text-[10px] text-[#888] block">Estado Normativo</span>
                  <span className={`text-xs font-bold flex items-center gap-1 ${alerts.length === 0 ? 'text-green-400' : 'text-amber-400'}`}>
                    {alerts.length === 0 ? '100% CUMPLE' : `${alerts.length} ALERTAS`}
                  </span>
                </div>
              </div>

              {/* Tabla Detallada de Alimentadores y Medidores */}
              <div className="border border-[#2A2D35] rounded overflow-hidden shrink-0">
                <div className="bg-[#0F1115] px-3 py-1.5 text-[11px] font-bold text-white flex items-center justify-between border-b border-[#2A2D35]">
                  <span>Cuadro de Equipos y Caídas de Tensión</span>
                  <span className="text-[10px] font-mono text-[#888]">Norma: NEC 210.19 (&lt; 3%)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#0F1115] text-[#888] font-mono border-b border-[#2A2D35]">
                      <tr>
                        <th className="p-2 font-normal">Equipo</th>
                        <th className="p-2 font-normal">Carga</th>
                        <th className="p-2 font-normal">Conductor</th>
                        <th className="p-2 font-normal">Conduit</th>
                        <th className="p-2 font-normal">Dist.</th>
                        <th className="p-2 font-normal">Caída V</th>
                        <th className="p-2 font-normal">Conformidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2D35]/50 font-mono">
                      {nodes.map(n => {
                        const vd = calculateVoltageDrop({
                          lengthMeters: n.properties.distanceMeters || 10,
                          currentAmps: n.properties.currentLoadAmps || 0,
                          gauge: n.properties.conductorGauge || '#12 AWG',
                          material: n.properties.conductorMaterial || 'Cu',
                          nominalVoltage: n.properties.voltage || 240,
                          phases: n.properties.phases || 1,
                        });
                        return (
                          <tr key={n.id} className="hover:bg-[#1A1D23]/50">
                            <td className="p-2 font-sans font-medium text-white">{n.label}</td>
                            <td className="p-2 text-blue-400">{n.properties.currentLoadAmps}A</td>
                            <td className="p-2 text-[#AAA]">{n.properties.conductorGauge}</td>
                            <td className="p-2 text-[#888]">{n.properties.conduitSize}</td>
                            <td className="p-2 text-[#888]">{n.properties.distanceMeters}m</td>
                            <td className="p-2">
                              <span className={vd.compliesWithCode ? 'text-green-400' : 'text-red-400'}>
                                {vd.dropPercentage}% ({vd.dropVolts}V)
                              </span>
                            </td>
                            <td className="p-2">
                              {vd.compliesWithCode ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-green-500/10 text-green-400 border border-green-500/30">
                                  Aprobado
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/30">
                                  Subdimensionado
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'materiales' && (
            <div className="space-y-4 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                <div className="p-2 rounded bg-[#1A1D23] border border-[#2A2D35]">
                  <span className="text-[10px] text-[#888] block">Conduit EMT</span>
                  <span className="text-sm font-bold text-white">{totalConduitEMT.toFixed(1)} m</span>
                </div>
                <div className="p-2 rounded bg-[#1A1D23] border border-[#2A2D35]">
                  <span className="text-[10px] text-[#888] block">Conduit PVC</span>
                  <span className="text-sm font-bold text-white">{totalConduitPVC.toFixed(1)} m</span>
                </div>
                <div className="p-2 rounded bg-[#1A1D23] border border-[#2A2D35]">
                  <span className="text-[10px] text-[#888] block">Conduit RMC</span>
                  <span className="text-sm font-bold text-white">{totalConduitRMC.toFixed(1)} m</span>
                </div>
                <div className="p-2 rounded bg-[#1A1D23] border border-[#2A2D35]">
                  <span className="text-[10px] text-[#888] block">Cable Estimado</span>
                  <span className="text-sm font-bold text-blue-400">{totalWire.toFixed(1)} m</span>
                </div>
              </div>

              <div className="border border-[#2A2D35] rounded overflow-hidden">
                <div className="bg-[#0F1115] px-3 py-1.5 text-[11px] font-bold text-white flex items-center justify-between border-b border-[#2A2D35]">
                  <span>Desglose de Equipos y Protección</span>
                  <span className="text-[10px] font-mono text-[#888]">Cantidades Unitarias</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#0F1115] text-[#888] font-mono border-b border-[#2A2D35]">
                      <tr>
                        <th className="p-2 font-normal">Componente</th>
                        <th className="p-2 font-normal">Tipo</th>
                        <th className="p-2 font-normal">Capacidad</th>
                        <th className="p-2 font-normal">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2D35]/50 font-mono">
                      {nodes.map(n => (
                        <tr key={n.id} className="hover:bg-[#1A1D23]/50">
                          <td className="p-2 font-sans font-medium text-white">{n.label}</td>
                          <td className="p-2 text-[#AAA] capitalize">{n.type.replace(/_/g, ' ')}</td>
                          <td className="p-2 text-blue-400">{n.properties.ratedCurrent ? `${n.properties.ratedCurrent}A` : '-'}</td>
                          <td className="p-2 text-[#888]">1 ud</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DraggableWindow>
  );
};
