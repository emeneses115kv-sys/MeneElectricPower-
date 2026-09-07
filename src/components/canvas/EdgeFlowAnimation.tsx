import React, { memo } from 'react';
import { ElectricalEdge } from '../../types/electrical';
import { calculateAnimationDuration } from '../../utils/electricalCalculations';

interface EdgeFlowAnimationProps {
  edge: ElectricalEdge;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  heatmapActive?: boolean;
  labelsActive?: boolean;
  capacityAmps?: number;
  labelTitle?: string;
  obstacles?: {x: number, y: number, w: number, h: number}[];
}

function calculateRoutedPath(fromX: number, fromY: number, toX: number, toY: number, obstacles?: {x: number, y: number, w: number, h: number}[]) {
  if (!obstacles || obstacles.length === 0) {
    const midX = fromX + (toX - fromX) / 2;
    return `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
  }

  const isLineInObstacle = (x1: number, y1: number, x2: number, y2: number, pad = 30) => {
    return obstacles.some(o => {
      if (y1 === y2) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        if (y1 >= o.y - pad && y1 <= o.y + o.h + pad) {
          if (minX <= o.x + o.w + pad && maxX >= o.x - pad) return true;
        }
      } else {
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        if (x1 >= o.x - pad && x1 <= o.x + o.w + pad) {
          if (minY <= o.y + o.h + pad && maxY >= o.y - pad) return true;
        }
      }
      return false;
    });
  };

  const midX = fromX + (toX - fromX) / 2;
  const route1 = [
    {x: fromX, y: fromY},
    {x: midX, y: fromY},
    {x: midX, y: toY},
    {x: toX, y: toY}
  ];
  
  const midY = fromY + (toY - fromY) / 2;
  const route2 = [
    {x: fromX, y: fromY},
    {x: fromX, y: midY},
    {x: toX, y: midY},
    {x: toX, y: toY}
  ];
  
  const maxY = Math.max(fromY, toY) + 120;
  const route3 = [
    {x: fromX, y: fromY},
    {x: fromX, y: maxY},
    {x: toX, y: maxY},
    {x: toX, y: toY}
  ];
  
  const minY = Math.min(fromY, toY) - 120;
  const route4 = [
    {x: fromX, y: fromY},
    {x: fromX, y: minY},
    {x: toX, y: minY},
    {x: toX, y: toY}
  ];
  
  const midX2 = Math.min(fromX, toX) - 120;
  const route5 = [
    {x: fromX, y: fromY},
    {x: midX2, y: fromY},
    {x: midX2, y: toY},
    {x: toX, y: toY}
  ];

  const validateRoute = (pts: {x:number, y:number}[]) => {
     for(let i=0; i<pts.length-1; i++) {
        if (isLineInObstacle(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, 25)) return false;
     }
     return true;
  }

  let finalRoute = route1;
  if (!validateRoute(route1)) {
    if (validateRoute(route2)) finalRoute = route2;
    else if (validateRoute(route3)) finalRoute = route3;
    else if (validateRoute(route4)) finalRoute = route4;
    else if (validateRoute(route5)) finalRoute = route5;
  }
  
  return `M ${finalRoute[0].x} ${finalRoute[0].y} ` + finalRoute.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
}

export const EdgeFlowAnimation: React.FC<EdgeFlowAnimationProps> = memo(({
  edge,
  fromX,
  fromY,
  toX,
  toY,
  heatmapActive = false,
  labelsActive = true,
  capacityAmps = 0,
  labelTitle = '',
  obstacles = []
}) => {
  const pathData = calculateRoutedPath(fromX, fromY, toX, toY, obstacles);
  
  // Punto medio para la etiqueta (aproximación rápida)
  let midX = fromX + (toX - fromX) / 2;
  let midY = fromY + (toY - fromY) / 2;
  // Mejor punto medio sacado del string pathData
  const points = pathData.replace('M ', '').split(' L ').map(p => {
    const [x, y] = p.split(' ').map(Number);
    return {x, y};
  });
  if (points.length >= 3) {
    midX = points[1].x + (points[2].x - points[1].x) / 2;
    midY = points[1].y + (points[2].y - points[1].y) / 2;
  }

  const durationSec = calculateAnimationDuration(edge.amperage);
  const baseWidth = edge.hasFlow ? Math.max(2, Math.min(6, edge.amperage / 20)) : 2.5;

  let strokeColor = '#0284c7'; // cyan-600 por defecto
  let glowColor = '#38bdf8'; // cyan-400
  let isDashed = false;

  if (edge.status === 'disconnected' || !edge.hasFlow) {
    strokeColor = '#64748b'; // slate-500
    glowColor = '#94a3b8';
    isDashed = true;
  } else if (edge.status === 'fault') {
    strokeColor = '#ea580c'; // orange-600
    glowColor = '#fb923c'; // orange-400
  } else if (heatmapActive) {
    const loadPercentage = capacityAmps > 0 ? (edge.amperage / capacityAmps) : 0;
    if (loadPercentage > 0.9) {
      strokeColor = '#dc2626'; // red-600
      glowColor = '#f87171'; // red-400
    } else if (loadPercentage > 0.7) {
      strokeColor = '#ea580c'; // orange-600
      glowColor = '#fb923c'; // orange-400
    } else if (loadPercentage > 0.4) {
      strokeColor = '#eab308'; // yellow-500
      glowColor = '#facc15'; // yellow-400
    } else {
      strokeColor = '#16a34a'; // green-600
      glowColor = '#4ade80'; // green-400
    }
  }

  const particlesCount = edge.hasFlow ? Math.max(1, Math.min(15, Math.floor(edge.amperage / 10))) : 0;
  const particleDuration = Math.max(0.5, durationSec * 2);

  return (
    <g className="cursor-pointer group">
      {/* Línea base estática del conductor */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={baseWidth + 1}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={edge.hasFlow ? 0.8 : 0.35}
        strokeDasharray={isDashed ? '6 4' : 'none'}
      />

      {/* Puntos de luz en movimiento basados en SVG SMIL animation */}
      {edge.hasFlow && Array.from({ length: particlesCount }).map((_, i) => (
        <circle 
           key={i} 
           r={baseWidth * 0.75} 
           fill="#ffffff" 
           filter="drop-shadow(0 0 3px rgba(255,255,255,0.8))"
        >
          <animateMotion
            dur={`${particleDuration}s`}
            repeatCount="indefinite"
            begin={`${-(particleDuration / particlesCount) * i}s`}
            path={pathData}
          />
        </circle>
      ))}

      {/* Animación del flujo de corriente en los bordes (edges) */}
      {edge.hasFlow && durationSec > 0 && (
        <path
          d={pathData}
          fill="none"
          stroke={glowColor}
          strokeWidth={baseWidth}
          strokeLinecap="round"
          strokeDasharray={`${baseWidth * 3} ${baseWidth * 5}`}
          style={{
            animation: `electricCurrentFlow ${durationSec}s linear infinite`,
          }}
        />
      )}

      {/* Puntos de conexión en los extremos */}
      <circle cx={fromX} cy={fromY} r="3" fill="#38bdf8" />
      <circle cx={toX} cy={toY} r="3" fill="#38bdf8" />

      {/* Etiqueta flotante de amperaje en el punto medio */}
      {labelsActive && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x={labelTitle ? "-45" : "-35"}
            y="-12"
            width={labelTitle ? "90" : "70"}
            height="20"
            rx="6"
            fill="#0f172a"
            stroke={edge.status === 'fault' ? '#f97316' : '#334155'}
            strokeWidth="1.5"
            opacity="0.95"
          />
          <text
            x="0"
            y="-1.5"
            textAnchor="middle"
            fontSize="8"
            fill="#94a3b8"
            fontWeight="normal"
          >
            {labelTitle}
          </text>
          <text
            x="0"
            y="6.5"
            textAnchor="middle"
            fontSize="9"
            fill={edge.status === 'fault' ? '#fb923c' : '#38bdf8'}
            fontWeight="bold"
            fontFamily="monospace"
          >
            {edge.hasFlow ? `⚡ ${edge.amperage}A` : '0A (OFF)'}
          </text>
        </g>
      )}
    </g>
  );
});
