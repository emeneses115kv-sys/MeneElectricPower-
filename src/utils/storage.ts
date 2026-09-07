import { ElectricalNode, ElectricalEdge, ProjectConfig } from '../types/electrical';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const STORAGE_KEY_NODES = 'unifilar_circuit_nodes_v1';
const STORAGE_KEY_EDGES = 'unifilar_circuit_edges_v1';
const STORAGE_KEY_CONFIG = 'unifilar_project_config_v1';

export const INITIAL_PROJECT_CONFIG: ProjectConfig = {
  projectName: 'Instalación Monofásica 1200A - 4 Medidores',
  designerName: 'Ing. Especialista Eléctrico',
  location: 'Panamá, Sector Comercial / Residencial',
  utilityProvider: 'ENSA',
  nominalVoltage: 240,
  serviceType: 'aerea',
  mainBreakerAmps: 1200,
  feederLengthMeters: 25,
  globalPowerFactor: 0.95,
  simulatedAmperage: 820,
};

export const INITIAL_CIRCUIT_NODES: ElectricalNode[] = [
  // 1. Acometida
  {
    id: 'node-acometida',
    type: 'acometida_aerea',
    label: 'Acometida Aérea 120/240V',
    category: 'acometida',
    x: 60,
    y: 220,
    properties: {
      voltage: 240,
      ratedCurrent: 1200,
      currentLoadAmps: 820,
      phases: 1,
      conductorGauge: '500 kcmil',
      conductorMaterial: 'Cu',
      conduitSize: '4"',
      conduitType: 'RMC',
      distanceMeters: 25,
      loadPowerKW: 196.8,
      powerFactor: 0.95,
      isClosed: true,
      tag: 'ACOM-1200A',
    },
  },
  // 2. Interruptor Principal IP 1200A
  {
    id: 'node-ip-principal',
    type: 'interruptor_principal',
    label: 'Interruptor Principal 1200A (IP)',
    category: 'proteccion',
    x: 240,
    y: 220,
    properties: {
      voltage: 240,
      ratedCurrent: 1200,
      currentLoadAmps: 820,
      phases: 1,
      conductorGauge: '500 kcmil',
      conductorMaterial: 'Cu',
      conduitSize: '4"',
      conduitType: 'RMC',
      distanceMeters: 3,
      loadPowerKW: 196.8,
      powerFactor: 0.95,
      isClosed: true,
      tag: 'IP-1200A',
    },
  },
  // 3. Barra Colectora Central (Busbar)
  {
    id: 'node-busbar',
    type: 'barra_distribucion',
    label: 'Barra Colectora Principal 1200A',
    category: 'conductor',
    x: 420,
    y: 220,
    properties: {
      voltage: 240,
      ratedCurrent: 1200,
      currentLoadAmps: 820,
      phases: 1,
      conductorGauge: '500 kcmil',
      conductorMaterial: 'Cu',
      conduitSize: '4"',
      conduitType: 'RMC',
      distanceMeters: 1,
      loadPowerKW: 196.8,
      powerFactor: 0.98,
      isClosed: true,
      tag: 'BUS-CENTRAL',
    },
  },
  // 4. Puesta a Tierra
  {
    id: 'node-tierra',
    type: 'tierra_fisica',
    label: 'Electrodo Copperweld 5/8" x 8ft',
    category: 'conductor',
    x: 420,
    y: 400,
    properties: {
      voltage: 0,
      ratedCurrent: 200,
      currentLoadAmps: 0,
      phases: 1,
      conductorGauge: '#2 AWG',
      conductorMaterial: 'Cu',
      conduitSize: '3/4"',
      conduitType: 'PVC',
      distanceMeters: 8,
      loadPowerKW: 0,
      powerFactor: 1.0,
      isClosed: true,
      tag: 'GND-ROD',
    },
  },

  // 5. Los 4 Medidores según requerimiento
  {
    id: 'node-meter-1',
    type: 'medidor',
    label: 'Medidor #1 (Local A)',
    category: 'acometida',
    x: 600,
    y: 80,
    properties: {
      voltage: 240,
      ratedCurrent: 200,
      currentLoadAmps: 160,
      phases: 1,
      conductorGauge: '#3/0 AWG',
      conductorMaterial: 'Cu',
      conduitSize: '2"',
      conduitType: 'EMT',
      distanceMeters: 8,
      loadPowerKW: 38.4,
      powerFactor: 0.95,
      isClosed: true,
      meterNumber: 'MTR-001',
      tag: 'MED-1',
    },
  },
  {
    id: 'node-meter-2',
    type: 'medidor',
    label: 'Medidor #2 (Local B)',
    category: 'acometida',
    x: 600,
    y: 180,
    properties: {
      voltage: 240,
      ratedCurrent: 200,
      currentLoadAmps: 145,
      phases: 1,
      conductorGauge: '#2/0 AWG',
      conductorMaterial: 'Cu',
      conduitSize: '2"',
      conduitType: 'EMT',
      distanceMeters: 12,
      loadPowerKW: 34.8,
      powerFactor: 0.95,
      isClosed: true,
      meterNumber: 'MTR-002',
      tag: 'MED-2',
    },
  },
  {
    id: 'node-meter-3',
    type: 'medidor',
    label: 'Medidor #3 (Local C)',
    category: 'acometida',
    x: 600,
    y: 280,
    properties: {
      voltage: 240,
      ratedCurrent: 200,
      currentLoadAmps: 175,
      phases: 1,
      conductorGauge: '#3/0 AWG',
      conductorMaterial: 'Cu',
      conduitSize: '2"',
      conduitType: 'EMT',
      distanceMeters: 15,
      loadPowerKW: 42.0,
      powerFactor: 0.95,
      isClosed: true,
      meterNumber: 'MTR-003',
      tag: 'MED-3',
    },
  },
  {
    id: 'node-meter-4',
    type: 'medidor',
    label: 'Medidor #4 (Local D / Bomba)',
    category: 'acometida',
    x: 600,
    y: 380,
    properties: {
      voltage: 240,
      ratedCurrent: 200,
      currentLoadAmps: 185,
      phases: 1,
      conductorGauge: '#12 AWG', // Calibre subdimensionado intencional para mostrar la alerta viva
      conductorMaterial: 'Cu',
      conduitSize: '1/2"', // Tubería subdimensionada intencional
      conduitType: 'EMT',
      distanceMeters: 28,
      loadPowerKW: 44.4,
      powerFactor: 0.92,
      isClosed: true,
      meterNumber: 'MTR-004',
      tag: 'MED-4',
    },
  },

  // 6. Subtableros y Cargas de cada medidor
  {
    id: 'node-panel-1',
    type: 'tablero_distribucion',
    label: 'Tablero TD-A (Alumbrado y Tomas)',
    category: 'carga',
    x: 820,
    y: 80,
    properties: {
      voltage: 120,
      ratedCurrent: 200,
      currentLoadAmps: 160,
      phases: 1,
      conductorGauge: '#3/0 AWG',
      conductorMaterial: 'Cu',
      conduitSize: '2"',
      conduitType: 'EMT',
      distanceMeters: 10,
      loadPowerKW: 38.4,
      powerFactor: 0.95,
      isClosed: true,
      tag: 'TD-A',
    },
  },
  {
    id: 'node-motor-bomba',
    type: 'motor_electrico',
    label: 'Bomba Contra Incendios 25 HP',
    category: 'transformacion',
    x: 820,
    y: 380,
    properties: {
      voltage: 240,
      ratedCurrent: 100,
      currentLoadAmps: 85,
      phases: 1,
      conductorGauge: '#3 AWG',
      conductorMaterial: 'Cu',
      conduitSize: '1-1/2"',
      conduitType: 'EMT',
      distanceMeters: 14,
      loadPowerKW: 18.6,
      powerFactor: 0.84,
      isClosed: true,
      tag: 'MOT-BOMBA',
    },
  },
];

export const INITIAL_CIRCUIT_EDGES: ElectricalEdge[] = [
  {
    id: 'edge-1',
    fromNodeId: 'node-acometida',
    toNodeId: 'node-ip-principal',
    status: 'active',
    amperage: 820,
    hasFlow: true,
    phaseIdentifier: 'L1',
  },
  {
    id: 'edge-2',
    fromNodeId: 'node-ip-principal',
    toNodeId: 'node-busbar',
    status: 'active',
    amperage: 820,
    hasFlow: true,
    phaseIdentifier: 'L1',
  },
  {
    id: 'edge-3',
    fromNodeId: 'node-busbar',
    toNodeId: 'node-tierra',
    status: 'active',
    amperage: 0,
    hasFlow: true,
    phaseIdentifier: 'PE',
  },
  {
    id: 'edge-4',
    fromNodeId: 'node-busbar',
    toNodeId: 'node-meter-1',
    status: 'active',
    amperage: 160,
    hasFlow: true,
    phaseIdentifier: 'L1',
  },
  {
    id: 'edge-5',
    fromNodeId: 'node-busbar',
    toNodeId: 'node-meter-2',
    status: 'active',
    amperage: 145,
    hasFlow: true,
    phaseIdentifier: 'L1',
  },
  {
    id: 'edge-6',
    fromNodeId: 'node-busbar',
    toNodeId: 'node-meter-3',
    status: 'active',
    amperage: 175,
    hasFlow: true,
    phaseIdentifier: 'L1',
  },
  {
    id: 'edge-7',
    fromNodeId: 'node-busbar',
    toNodeId: 'node-meter-4',
    status: 'fault', // Presenta falla por conductor subdimensionado
    amperage: 185,
    hasFlow: true,
    phaseIdentifier: 'L1',
  },
  {
    id: 'edge-8',
    fromNodeId: 'node-meter-1',
    toNodeId: 'node-panel-1',
    status: 'active',
    amperage: 160,
    hasFlow: true,
    phaseIdentifier: 'L1',
  },
  {
    id: 'edge-9',
    fromNodeId: 'node-meter-4',
    toNodeId: 'node-motor-bomba',
    status: 'active',
    amperage: 85,
    hasFlow: true,
    phaseIdentifier: 'L1',
  },
];

export function loadSavedCircuit(): {
  nodes: ElectricalNode[];
  edges: ElectricalEdge[];
  config: ProjectConfig;
} {
  try {
    const rawNodes = localStorage.getItem(STORAGE_KEY_NODES);
    const rawEdges = localStorage.getItem(STORAGE_KEY_EDGES);
    const rawConfig = localStorage.getItem(STORAGE_KEY_CONFIG);

    const nodes = rawNodes ? JSON.parse(rawNodes) : [];
    const edges = rawEdges ? JSON.parse(rawEdges) : [];
    const config = rawConfig ? JSON.parse(rawConfig) : {
      projectName: 'Nuevo Proyecto',
      designerName: '',
      location: '',
      utilityProvider: 'NEC Estándar',
      nominalVoltage: 120,
      serviceType: 'aerea',
      mainBreakerAmps: 100,
      feederLengthMeters: 10,
      globalPowerFactor: 0.9,
      simulatedAmperage: 0,
    };

    return { nodes, edges, config };
  } catch (e) {
    console.warn('Error leyendo localStorage, usando configuración inicial:', e);
    return {
      nodes: INITIAL_CIRCUIT_NODES,
      edges: INITIAL_CIRCUIT_EDGES,
      config: INITIAL_PROJECT_CONFIG,
    };
  }
}

export function saveCircuitToStorage(
  nodes: ElectricalNode[],
  edges: ElectricalEdge[],
  config: ProjectConfig
): void {
  try {
    localStorage.setItem(STORAGE_KEY_NODES, JSON.stringify(nodes));
    localStorage.setItem(STORAGE_KEY_EDGES, JSON.stringify(edges));
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error guardando en almacenamiento offline:', e);
  }
}

// ==========================================
// Integración con Firebase Firestore
// ==========================================

export async function syncCircuitToCloud(
  nodes: ElectricalNode[],
  edges: ElectricalEdge[],
  config: ProjectConfig
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return; // Si no hay usuario, se guarda en local únicamente.

  try {
    const circuitRef = doc(db, 'users', user.uid, 'circuitData', 'current');
    await setDoc(circuitRef, {
      nodes,
      edges,
      config,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('Error sincronizando con Firebase:', e);
  }
}

export async function loadCircuitFromCloud(): Promise<{
  nodes: ElectricalNode[];
  edges: ElectricalEdge[];
  config: ProjectConfig;
} | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const circuitRef = doc(db, 'users', user.uid, 'circuitData', 'current');
    const docSnap = await getDoc(circuitRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        nodes: data.nodes as ElectricalNode[],
        edges: data.edges as ElectricalEdge[],
        config: data.config as ProjectConfig
      };
    }
  } catch (e) {
    console.error('Error recuperando de Firebase:', e);
  }
  return null;
}
