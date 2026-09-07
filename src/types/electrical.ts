export type ComponentCategory =
  | 'acometida'
  | 'proteccion'
  | 'conductor'
  | 'transformacion'
  | 'carga'
  | 'control'
  | 'canalizacion';

export type ElectricalSymbolType =
  | 'acometida_aerea'
  | 'acometida_subterranea'
  | 'medidor'
  | 'interruptor_principal'
  | 'breaker_termomagnetico'
  | 'fusible'
  | 'barra_distribucion'
  | 'conductor_fase'
  | 'conductor_neutro'
  | 'tierra_fisica'
  | 'transformador'
  | 'motor_electrico'
  | 'tablero_distribucion'
  | 'tuberia_conduit'
  | 'banco_capacitores'
  | 'carga_general'
  | 'contactor'
  | 'rele_termico'
  | 'pulsador'
  | 'luz_piloto'
  | 'plc'
  | 'canaleta'
  | 'caja_ct'
  | 'custom_component';

export interface ComponentProperties {
  voltage: number; // Voltios (e.g. 120, 240, 480)
  ratedCurrent: number; // Amperios nominales (e.g. 15, 20, 50, 100, 200, 1200)
  currentLoadAmps: number; // Amperios reales en operación
  phases: 1 | 2 | 3;
  conductorGauge: string; // '#12 AWG', '#10 AWG', '#8 AWG', '#6 AWG', '#4 AWG', '#2 AWG', '#1/0 AWG', '#2/0 AWG', '#3/0 AWG', '#4/0 AWG', '250 kcmil', '350 kcmil', '500 kcmil'
  conductorMaterial: 'Cu' | 'Al';
  conduitSize: string; // '1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '4"'
  conduitType: 'EMT' | 'PVC' | 'RMC' | 'Canaleta' | 'Bandeja';
  distanceMeters: number;
  loadPowerKW: number;
  powerFactor: number;
  isClosed: boolean; // Estado para breakers / seccionadores
  efficiency?: number; // Para motores (0.85 - 0.95)
  kvaRating?: number; // Para transformadores
  meterNumber?: string; // Para medidores
  tag?: string;
  customComponentId?: string;
  customPaths?: string[];
}

export interface ElectricalNode {
  id: string;
  type: ElectricalSymbolType;
  label: string;
  category: ComponentCategory;
  x: number;
  y: number;
  properties: ComponentProperties;
}

export interface ElectricalEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  status: 'active' | 'warning' | 'fault' | 'disconnected';
  amperage: number; // Corriente circulante
  hasFlow: boolean; // Si la corriente fluye o se detiene por falla/circuito abierto
  phaseIdentifier?: 'L1' | 'L2' | 'L3' | 'N' | 'PE';
}

export interface ElectricalAlert {
  id: string;
  nodeId: string;
  edgeId?: string;
  severity: 'warning' | 'error' | 'critical';
  emoji: '⚠️' | '⚡' | '🛑' | '🚨';
  title: string;
  description: string;
  standardRule: string; // e.g. "NEC 310.16 / Art. 240.4"
  suggestedFix: {
    propertyKey: keyof ComponentProperties;
    newValue: any;
    label: string;
  };
}

export interface ProjectConfig {
  projectName: string;
  designerName: string;
  location: string;
  utilityProvider: 'ENSA' | 'Naturgy' | 'NEC Estándar';
  nominalVoltage: number;
  serviceType: 'aerea' | 'subterranea';
  mainBreakerAmps: number;
  feederLengthMeters: number;
  globalPowerFactor: number;
  simulatedAmperage: number; // Amperaje global para regular animación
}

export interface SymbolCatalogItem {
  type: ElectricalSymbolType;
  name: string;
  category: ComponentCategory;
  categoryLabel: string;
  description: string;
  defaultProps: Partial<ComponentProperties>;
  iconName: string;
  symbolBadge: string;
}

export interface CustomComponent {
  id: string;
  name: string;
  category: string;
  paths: string[];
  width: number;
  height: number;
  createdAt: string;
}

