import { ElectricalNode, ElectricalEdge, ProjectConfig, ElectricalAlert } from '../types/electrical';

export function exportProfessionalJSONReport(
  nodes: ElectricalNode[],
  edges: ElectricalEdge[],
  config: ProjectConfig,
  alerts: ElectricalAlert[]
) {
  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      projectName: config.projectName,
      designerName: config.designerName,
      location: config.location,
      simulatedAmperage: config.simulatedAmperage,
      applicationType: 'AI Studio Remix Diagrama Eléctrico Pro',
      version: '1.0.0',
    },
    systemSummary: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      totalAlerts: alerts.length,
      systemStatus: alerts.length === 0 ? 'COMPLIANT' : 'WARNING_STATE'
    },
    diagnostics: alerts.map(alert => ({
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      standardRule: alert.standardRule,
      componentId: alert.nodeId
    })),
    components: nodes.map(node => ({
      id: node.id,
      label: node.label,
      type: node.type,
      category: node.category,
      position: { x: node.x, y: node.y },
      specifications: {
        ...node.properties
      }
    })),
    connections: edges.map(edge => ({
      id: edge.id,
      fromComponent: edge.fromNodeId,
      toComponent: edge.toNodeId,
      status: edge.status,
      currentFlowAmps: edge.amperage,
      phase: edge.phaseIdentifier
    }))
  };

  const jsonStr = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.projectName.replace(/\s+/g, '_')}_Reporte_Tecnico.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
