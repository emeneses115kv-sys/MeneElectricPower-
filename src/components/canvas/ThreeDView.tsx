import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { ElectricalNode, ElectricalEdge, ElectricalAlert } from '../../types/electrical';

interface ThreeDViewProps {
  nodes: ElectricalNode[];
  edges: ElectricalEdge[];
  alerts: ElectricalAlert[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}

const NodeBox = ({ node, isSelected, hasAlert, onClick }: { node: ElectricalNode, isSelected: boolean, hasAlert: boolean, onClick: () => void }) => {
  // Escalar las coordenadas del lienzo 2D al espacio 3D
  const scale = 0.05;
  const position: [number, number, number] = [node.x * scale, 0, node.y * scale];

  let color = '#475569'; // default slate-600
  if (isSelected) color = '#3b82f6'; // blue-500
  if (hasAlert) color = '#ef4444'; // red-500

  // Determinar tamaño según el tipo
  let dims: [number, number, number] = [3, 2, 3];
  if (node.type === 'barra_distribucion') dims = [8, 0.5, 2];
  else if (node.type === 'interruptor_principal') dims = [4, 4, 3];
  else if (node.type === 'acometida_aerea' || node.type === 'acometida_subterranea') dims = [2, 10, 2];
  else if (node.type === 'medidor') dims = [3, 3, 1];

  return (
    <group position={position}>
      <mesh onClick={(e) => { e.stopPropagation(); onClick(); }} castShadow receiveShadow>
        <boxGeometry args={dims} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
      </mesh>
      <Text
        position={[0, dims[1] / 2 + 0.5, 0]}
        fontSize={0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="black"
      >
        {node.label || node.type}
      </Text>
    </group>
  );
};

const EdgeLine = ({ fromNode, toNode }: { fromNode: ElectricalNode, toNode: ElectricalNode }) => {
  const scale = 0.05;
  const start = new THREE.Vector3(fromNode.x * scale, 1, fromNode.y * scale);
  const end = new THREE.Vector3(toNode.x * scale, 1, toNode.y * scale);
  const mid = new THREE.Vector3(start.x, 1, end.z); // Enrutamiento ortogonal simple

  return (
    <Line
      points={[start, mid, end]}
      color="#94a3b8"
      lineWidth={0.2}
      dashed={false}
    />
  );
};

export const ThreeDView: React.FC<ThreeDViewProps> = ({ nodes, edges, alerts, selectedNodeId, onSelectNode }) => {
  const nodeMap = useMemo(() => {
    const map = new Map<string, ElectricalNode>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Encontrar el centro de todos los nodos para enfocar la cámara
  const center = useMemo(() => {
    if (nodes.length === 0) return [0, 0, 0] as [number, number, number];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    nodes.forEach(n => {
      const x = n.x * 0.05;
      const z = n.y * 0.05;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    });
    return [(minX + maxX) / 2, 0, (minZ + maxZ) / 2] as [number, number, number];
  }, [nodes]);

  return (
    <div className="absolute inset-0 bg-slate-900 w-full h-full" onPointerDown={() => onSelectNode(null)}>
      <Canvas shadows camera={{ position: [center[0], 20, center[2] + 20], fov: 45 }}>
        <color attach="background" args={['#0f172a']} />
        
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        <gridHelper args={[200, 200, '#334155', '#1e293b']} position={[0, -0.1, 0]} />

        <group>
          {edges.map(edge => {
            const fromNode = nodeMap.get(edge.fromNodeId);
            const toNode = nodeMap.get(edge.toNodeId);
            if (!fromNode || !toNode) return null;
            return <EdgeLine key={edge.id} fromNode={fromNode} toNode={toNode} />;
          })}

          {nodes.map(node => (
            <NodeBox
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              hasAlert={alerts.some(a => a.nodeId === node.id)}
              onClick={() => onSelectNode(node.id)}
            />
          ))}
        </group>

        <OrbitControls
          target={center}
          maxPolarAngle={Math.PI / 2 - 0.05} // No permitir que la cámara baje del suelo
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
};
