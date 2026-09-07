/**
 * Librería de Cálculos y Tablas Normativas Eléctricas
 * Basado en NEC (NFPA 70), Tabla 310.16 (75°C THHN/THWN)
 * y especificaciones ENSA / Naturgy.
 */

export interface ConductorData {
  gauge: string;
  cuAmpacity75: number;
  alAmpacity75: number;
  areaMm2: number;
  resistanceOhmKmCu: number; // Ohm/km a 75°C
  resistanceOhmKmAl: number;
  diameterMm: number;
}

export const CONDUCTOR_TABLE: ConductorData[] = [
  { gauge: '#14 AWG', cuAmpacity75: 20, alAmpacity75: 0, areaMm2: 2.08, resistanceOhmKmCu: 10.1, resistanceOhmKmAl: 16.5, diameterMm: 1.63 },
  { gauge: '#12 AWG', cuAmpacity75: 25, alAmpacity75: 20, areaMm2: 3.31, resistanceOhmKmCu: 6.36, resistanceOhmKmAl: 10.4, diameterMm: 2.05 },
  { gauge: '#10 AWG', cuAmpacity75: 35, alAmpacity75: 30, areaMm2: 5.26, resistanceOhmKmCu: 3.99, resistanceOhmKmAl: 6.56, diameterMm: 2.59 },
  { gauge: '#8 AWG', cuAmpacity75: 50, alAmpacity75: 40, areaMm2: 8.37, resistanceOhmKmCu: 2.56, resistanceOhmKmAl: 4.19, diameterMm: 3.26 },
  { gauge: '#6 AWG', cuAmpacity75: 65, alAmpacity75: 50, areaMm2: 13.3, resistanceOhmKmCu: 1.61, resistanceOhmKmAl: 2.65, diameterMm: 4.11 },
  { gauge: '#4 AWG', cuAmpacity75: 85, alAmpacity75: 65, areaMm2: 21.2, resistanceOhmKmCu: 1.01, resistanceOhmKmAl: 1.67, diameterMm: 5.19 },
  { gauge: '#3 AWG', cuAmpacity75: 100, alAmpacity75: 75, areaMm2: 26.7, resistanceOhmKmCu: 0.803, resistanceOhmKmAl: 1.32, diameterMm: 5.83 },
  { gauge: '#2 AWG', cuAmpacity75: 115, alAmpacity75: 90, areaMm2: 33.6, resistanceOhmKmCu: 0.636, resistanceOhmKmAl: 1.05, diameterMm: 6.54 },
  { gauge: '#1 AWG', cuAmpacity75: 130, alAmpacity75: 100, areaMm2: 42.4, resistanceOhmKmCu: 0.505, resistanceOhmKmAl: 0.83, diameterMm: 7.35 },
  { gauge: '#1/0 AWG', cuAmpacity75: 150, alAmpacity75: 120, areaMm2: 53.5, resistanceOhmKmCu: 0.400, resistanceOhmKmAl: 0.658, diameterMm: 8.25 },
  { gauge: '#2/0 AWG', cuAmpacity75: 175, alAmpacity75: 135, areaMm2: 67.4, resistanceOhmKmCu: 0.317, resistanceOhmKmAl: 0.522, diameterMm: 9.27 },
  { gauge: '#3/0 AWG', cuAmpacity75: 200, alAmpacity75: 155, areaMm2: 85.0, resistanceOhmKmCu: 0.252, resistanceOhmKmAl: 0.414, diameterMm: 10.4 },
  { gauge: '#4/0 AWG', cuAmpacity75: 230, alAmpacity75: 180, areaMm2: 107.0, resistanceOhmKmCu: 0.200, resistanceOhmKmAl: 0.328, diameterMm: 11.7 },
  { gauge: '250 kcmil', cuAmpacity75: 255, alAmpacity75: 205, areaMm2: 127.0, resistanceOhmKmCu: 0.170, resistanceOhmKmAl: 0.279, diameterMm: 14.6 },
  { gauge: '300 kcmil', cuAmpacity75: 285, alAmpacity75: 230, areaMm2: 152.0, resistanceOhmKmCu: 0.141, resistanceOhmKmAl: 0.233, diameterMm: 16.0 },
  { gauge: '350 kcmil', cuAmpacity75: 310, alAmpacity75: 250, areaMm2: 177.0, resistanceOhmKmCu: 0.121, resistanceOhmKmAl: 0.199, diameterMm: 17.3 },
  { gauge: '400 kcmil', cuAmpacity75: 335, alAmpacity75: 270, areaMm2: 203.0, resistanceOhmKmCu: 0.106, resistanceOhmKmAl: 0.174, diameterMm: 18.5 },
  { gauge: '500 kcmil', cuAmpacity75: 380, alAmpacity75: 310, areaMm2: 253.0, resistanceOhmKmCu: 0.0848, resistanceOhmKmAl: 0.140, diameterMm: 20.7 },
];

export const STANDARD_BREAKERS = [15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200, 225, 250, 300, 400, 500, 600, 800, 1000, 1200, 1600];

export const CONDUIT_SIZES = ['1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '3-1/2"', '4"'];

// Área interna aproximada en mm2 al 40% de llenado para EMT
export const CONDUIT_40_PERCENT_AREA_MM2: Record<string, number> = {
  '1/2"': 122,
  '3/4"': 214,
  '1"': 346,
  '1-1/4"': 598,
  '1-1/2"': 814,
  '2"': 1335,
  '2-1/2"': 2341,
  '3"': 3591,
  '3-1/2"': 4700,
  '4"': 5985,
};

export function getConductorByGauge(gauge: string): ConductorData {
  const found = CONDUCTOR_TABLE.find(c => c.gauge.toLowerCase() === gauge.toLowerCase());
  return found || CONDUCTOR_TABLE[1]; // #12 AWG default
}

export function getAmpacity(gauge: string, material: 'Cu' | 'Al' = 'Cu'): number {
  const c = getConductorByGauge(gauge);
  return material === 'Cu' ? c.cuAmpacity75 : c.alAmpacity75;
}

export function findMinimumGaugeForCurrent(currentAmps: number, material: 'Cu' | 'Al' = 'Cu'): string {
  // Aplicar factor de servicio continuo 125% segun NEC 215.2 / 210.19
  const requiredAmpacity = currentAmps * 1.25;
  for (const c of CONDUCTOR_TABLE) {
    const amp = material === 'Cu' ? c.cuAmpacity75 : c.alAmpacity75;
    if (amp >= requiredAmpacity) {
      return c.gauge;
    }
  }
  return '500 kcmil';
}

export function findRecommendedBreaker(currentAmps: number): number {
  const requiredRating = currentAmps * 1.25;
  const breaker = STANDARD_BREAKERS.find(b => b >= requiredRating);
  return breaker || STANDARD_BREAKERS[STANDARD_BREAKERS.length - 1];
}

/**
 * Calcula la caída de tensión porcentual.
 * Monofásico: 2 * L(km) * I * R
 * Trifásico: √3 * L(km) * I * R
 */
export function calculateVoltageDrop(params: {
  lengthMeters: number;
  currentAmps: number;
  gauge: string;
  material: 'Cu' | 'Al';
  nominalVoltage: number;
  phases: 1 | 2 | 3;
}): { dropVolts: number; dropPercentage: number; compliesWithCode: boolean } {
  const { lengthMeters, currentAmps, gauge, material, nominalVoltage, phases } = params;
  const c = getConductorByGauge(gauge);
  const resistancePerKm = material === 'Cu' ? c.resistanceOhmKmCu : c.resistanceOhmKmAl;
  const lengthKm = lengthMeters / 1000;

  const multiplier = phases === 3 ? Math.sqrt(3) : 2;
  const dropVolts = multiplier * lengthKm * currentAmps * resistancePerKm;
  const dropPercentage = (dropVolts / Math.max(nominalVoltage, 1)) * 100;
  // Norma NEC 210.19: Máximo 3% en alimentadores, 5% total
  const compliesWithCode = dropPercentage <= 3.0;

  return {
    dropVolts: Number(dropVolts.toFixed(2)),
    dropPercentage: Number(dropPercentage.toFixed(2)),
    compliesWithCode,
  };
}

/**
 * Verifica si el tamaño de tubería conduit cumple con el 40% de llenado para los conductores
 */
export function calculateConduitFill(params: {
  conduitSize: string;
  conductorGauge: string;
  numberOfConductors: number;
}): { fillPercentage: number; recommendedConduit: string; complies: boolean } {
  const { conduitSize, conductorGauge, numberOfConductors } = params;
  const cond = getConductorByGauge(conductorGauge);
  const totalConductorArea = cond.areaMm2 * numberOfConductors;

  const maxAllowedArea = CONDUIT_40_PERCENT_AREA_MM2[conduitSize] || 346;
  const fillPercentage = (totalConductorArea / maxAllowedArea) * 40;
  const complies = fillPercentage <= 40;

  // Encontrar tubería mínima recomendada
  let recommendedConduit = CONDUIT_SIZES[0];
  for (const size of CONDUIT_SIZES) {
    if (CONDUIT_40_PERCENT_AREA_MM2[size] >= totalConductorArea) {
      recommendedConduit = size;
      break;
    }
  }

  return {
    fillPercentage: Number(fillPercentage.toFixed(1)),
    recommendedConduit,
    complies,
  };
}

/**
 * Calcula la velocidad de animación para el flujo de corriente en el borde (edge)
 * Retorna la duración en segundos: entre 0.3s (carga alta) y 2.5s (carga baja)
 */
export function calculateAnimationDuration(amperage: number): number {
  if (amperage <= 0) return 0; // Detenido
  if (amperage >= 1200) return 0.35;
  if (amperage >= 800) return 0.5;
  if (amperage >= 400) return 0.7;
  if (amperage >= 200) return 0.9;
  if (amperage >= 100) return 1.2;
  if (amperage >= 50) return 1.6;
  if (amperage >= 20) return 2.0;
  return 2.5;
}
