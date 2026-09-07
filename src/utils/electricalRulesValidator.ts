import { ElectricalNode, ElectricalEdge, ElectricalAlert, ProjectConfig } from '../types/electrical';
import {
  getAmpacity,
  findMinimumGaugeForCurrent,
  findRecommendedBreaker,
  calculateVoltageDrop,
  calculateConduitFill,
} from './electricalCalculations';

export function validateCircuitRules(
  nodes: ElectricalNode[],
  edges: ElectricalEdge[],
  _config?: ProjectConfig
): {
  alerts: ElectricalAlert[];
  updatedEdges: ElectricalEdge[];
} {
  const alerts: ElectricalAlert[] = [];

  // Mapear nodos para acceso rápido
  const nodeMap = new Map<string, ElectricalNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  // Rastrear si la corriente fluye a través del circuito
  // Un interruptor abierto o fallo crítico corta el flujo aguas abajo
  const hasOpenBreakerInPath = new Set<string>();

  for (const node of nodes) {
    // 1. Verificación de Interruptores y Breakers (Apertura o Sobrecarga)
    if (
      node.type === 'interruptor_principal' ||
      node.type === 'breaker_termomagnetico' ||
      node.type === 'fusible'
    ) {
      if (!node.properties.isClosed) {
        hasOpenBreakerInPath.add(node.id);
        alerts.push({
          id: `alert-open-${node.id}`,
          nodeId: node.id,
          severity: 'warning',
          emoji: '⚠️',
          title: 'Interruptor Abierto / Desconectado',
          description: `${node.label} se encuentra abierto. El flujo de corriente está interrumpido en esta rama.`,
          standardRule: 'Operación / NEC 240.21',
          suggestedFix: {
            propertyKey: 'isClosed',
            newValue: true,
            label: 'Cerrar Interruptor para energizar',
          },
        });
      }

      // Sobrecarga de corriente respecto a la capacidad del Breaker
      if (node.properties.currentLoadAmps > node.properties.ratedCurrent) {
        const suggestedBreaker = findRecommendedBreaker(node.properties.currentLoadAmps);
        alerts.push({
          id: `alert-overcurrent-${node.id}`,
          nodeId: node.id,
          severity: 'critical',
          emoji: '🛑',
          title: 'Sobrecarga en Dispositivo de Protección',
          description: `La carga de ${node.properties.currentLoadAmps}A supera la capacidad nominal de ${node.properties.ratedCurrent}A de ${node.label}. Riesgo de disparo o sobrecalentamiento.`,
          standardRule: 'NEC 240.4 / Regla 125% Carga Continua',
          suggestedFix: {
            propertyKey: 'ratedCurrent',
            newValue: suggestedBreaker,
            label: `Aumentar capacidad a ${suggestedBreaker}A`,
          },
        });
      }
    }

    // 2. Verificación de Conductores y Calibres (Ampacidad y Temperatura)
    if (node.properties.conductorGauge) {
      const conductorAmpacity = getAmpacity(
        node.properties.conductorGauge,
        node.properties.conductorMaterial || 'Cu'
      );

      // Carga mayor que la ampacidad del cable
      if (node.properties.currentLoadAmps > conductorAmpacity) {
        const minGauge = findMinimumGaugeForCurrent(
          node.properties.currentLoadAmps,
          node.properties.conductorMaterial || 'Cu'
        );
        alerts.push({
          id: `alert-gauge-amp-${node.id}`,
          nodeId: node.id,
          severity: 'critical',
          emoji: '⚡',
          title: 'Calibre de Conductor Subdimensionado',
          description: `El conductor ${node.properties.conductorGauge} (${node.properties.conductorMaterial}) soporta ${conductorAmpacity}A, pero la corriente circulante es ${node.properties.currentLoadAmps}A. Peligro de incendio o pérdida de aislamiento.`,
          standardRule: 'NEC Tabla 310.16 / ENSA Cap. 3',
          suggestedFix: {
            propertyKey: 'conductorGauge',
            newValue: minGauge,
            label: `Corregir calibre a ${minGauge}`,
          },
        });
      }

      // Si hay un breaker aguas arriba y su capacidad es mayor a la ampacidad del conductor protegido
      if (
        (node.type === 'interruptor_principal' || node.type === 'breaker_termomagnetico') &&
        node.properties.ratedCurrent > conductorAmpacity
      ) {
        const minGauge = findMinimumGaugeForCurrent(
          node.properties.ratedCurrent * 0.8,
          node.properties.conductorMaterial || 'Cu'
        );
        alerts.push({
          id: `alert-breaker-coord-${node.id}`,
          nodeId: node.id,
          severity: 'error',
          emoji: '⚠️',
          title: 'Descoordinación Cable / Protección',
          description: `El interruptor de ${node.properties.ratedCurrent}A no protege adecuadamente al conductor ${node.properties.conductorGauge} (${conductorAmpacity}A máx).`,
          standardRule: 'NEC 240.4(D) Conductores Pequeños',
          suggestedFix: {
            propertyKey: 'conductorGauge',
            newValue: minGauge,
            label: `Aumentar calibre a ${minGauge}`,
          },
        });
      }

      // 3. Verificación de Caída de Tensión (Distancia)
      if (node.properties.distanceMeters > 0 && node.properties.currentLoadAmps > 0) {
        const vd = calculateVoltageDrop({
          lengthMeters: node.properties.distanceMeters,
          currentAmps: node.properties.currentLoadAmps,
          gauge: node.properties.conductorGauge,
          material: node.properties.conductorMaterial || 'Cu',
          nominalVoltage: node.properties.voltage || 240,
          phases: node.properties.phases || 1,
        });

        if (!vd.compliesWithCode) {
          const recommendedGauge = findMinimumGaugeForCurrent(
            node.properties.currentLoadAmps * 1.5,
            node.properties.conductorMaterial || 'Cu'
          );
          alerts.push({
            id: `alert-vd-${node.id}`,
            nodeId: node.id,
            severity: 'warning',
            emoji: '⚠️',
            title: `Caída de Tensión Excesiva: ${vd.dropPercentage}%`,
            description: `A ${node.properties.distanceMeters}m de distancia, la caída de tensión es de ${vd.dropVolts}V (${vd.dropPercentage}%), superando el límite normativo del 3.0%.`,
            standardRule: 'NEC 210.19(A) Nota informativa / Naturgy',
            suggestedFix: {
              propertyKey: 'conductorGauge',
              newValue: recommendedGauge,
              label: `Subir calibre a ${recommendedGauge}`,
            },
          });
        }
      }

      // 4. Verificación de Llenado de Tubería Conduit
      if (node.properties.conduitSize) {
        const conduitCheck = calculateConduitFill({
          conduitSize: node.properties.conduitSize,
          conductorGauge: node.properties.conductorGauge,
          numberOfConductors: node.properties.phases + 1, // fases + neutro
        });

        if (!conduitCheck.complies) {
          alerts.push({
            id: `alert-conduit-${node.id}`,
            nodeId: node.id,
            severity: 'warning',
            emoji: '⚠️',
            title: `Saturación de Tubería Conduit (${conduitCheck.fillPercentage}%)`,
            description: `Tubería de ${node.properties.conduitSize} sobrepasa el límite máximo del 40% de llenado para los conductores seleccionados.`,
            standardRule: 'NEC Capítulo 9, Tabla 1 / Art. 358',
            suggestedFix: {
              propertyKey: 'conduitSize',
              newValue: conduitCheck.recommendedConduit,
              label: `Ampliar tubería a ${conduitCheck.recommendedConduit}`,
            },
          });
        }
      }
    }

    // 5. Transformadores (Capacidad kVA)
    if (node.type === 'transformador') {
      const loadKVA = (node.properties.currentLoadAmps * (node.properties.voltage || 240)) / 1000;
      const ratedKVA = node.properties.kvaRating || 50;
      if (loadKVA > ratedKVA) {
        alerts.push({
          id: `alert-transfo-${node.id}`,
          nodeId: node.id,
          severity: 'critical',
          emoji: '🚨',
          title: 'Sobrecarga de Transformador',
          description: `La demanda proyectada de ${loadKVA.toFixed(1)} kVA sobrepasa la capacidad nominal de ${ratedKVA} kVA del transformador.`,
          standardRule: 'NEC Art. 450 / Normas Distribución ENSA',
          suggestedFix: {
            propertyKey: 'kvaRating',
            newValue: Math.ceil(loadKVA / 25) * 25,
            label: `Aumentar a ${Math.ceil(loadKVA / 25) * 25} kVA`,
          },
        });
      }
    }

    // 6. Motores Eléctricos (Factor de potencia y protección)
    if (node.type === 'motor_electrico') {
      if (node.properties.powerFactor < 0.8) {
        alerts.push({
          id: `alert-motor-fp-${node.id}`,
          nodeId: node.id,
          severity: 'warning',
          emoji: '⚡',
          title: 'Bajo Factor de Potencia (FP < 0.85)',
          description: `El motor opera con un factor de potencia de ${node.properties.powerFactor}. Puede causar penalizaciones de la distribuidora y calentamiento de líneas.`,
          standardRule: 'Reglamento Técnico ASEP / Naturgy',
          suggestedFix: {
            propertyKey: 'powerFactor',
            newValue: 0.92,
            label: 'Integrar compensación capacitiva (FP 0.92)',
          },
        });
      }
    }
  }

  // Actualizar estado de las aristas (flujo activo o interrumpido)
  const updatedEdges = edges.map(edge => {
    const fromNode = nodeMap.get(edge.fromNodeId);
    const toNode = nodeMap.get(edge.toNodeId);

    const isCutOff =
      (fromNode && !fromNode.properties.isClosed && (fromNode.type === 'interruptor_principal' || fromNode.type === 'breaker_termomagnetico')) ||
      (toNode && !toNode.properties.isClosed && (toNode.type === 'interruptor_principal' || toNode.type === 'breaker_termomagnetico'));

    const hasFault = alerts.some(
      a => (a.nodeId === edge.fromNodeId || a.nodeId === edge.toNodeId) && (a.severity === 'critical' || a.severity === 'error')
    );

    if (isCutOff) {
      return {
        ...edge,
        status: 'disconnected' as const,
        hasFlow: false,
      };
    }

    if (hasFault) {
      return {
        ...edge,
        status: 'fault' as const,
        hasFlow: true, // Fluye con señal de falla
      };
    }

    return {
      ...edge,
      status: 'active' as const,
      hasFlow: true,
    };
  });

  return { alerts, updatedEdges };
}
