import { ElectricalNode, ElectricalEdge } from '../types/electrical';

export function calculateForceDirectedLayout(nodes: ElectricalNode[], edges: ElectricalEdge[]): ElectricalNode[] {
  if (nodes.length === 0) return nodes;

  // 1. Identify hierarchical levels using Breadth-First Search (BFS)
  const adjList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach(n => {
    adjList.set(n.id, []);
    inDegree.set(n.id, 0);
  });

  edges.forEach(e => {
    if (adjList.has(e.fromNodeId)) {
      adjList.get(e.fromNodeId)!.push(e.toNodeId);
    }
    if (inDegree.has(e.toNodeId)) {
      inDegree.set(e.toNodeId, inDegree.get(e.toNodeId)! + 1);
    }
  });

  // Assign hierarchy levels
  const levels = new Map<string, number>();
  const queue: string[] = [];
  
  // Roots (usually power sources or main breakers)
  nodes.forEach(n => {
    if (inDegree.get(n.id) === 0) {
      queue.push(n.id);
      levels.set(n.id, 0);
    }
  });

  // Fallback for cyclic graphs
  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0].id);
    levels.set(nodes[0].id, 0);
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currLevel = levels.get(curr)!;

    const neighbors = adjList.get(curr) || [];
    neighbors.forEach(nxt => {
      if (!levels.has(nxt)) {
        levels.set(nxt, currLevel + 1);
        queue.push(nxt);
      }
    });
  }

  // 2. Physics Engine (Force-Directed Graph Simulation)
  const maxLevel = Math.max(...Array.from(levels.values()), 1);
  
  // Clone nodes for mutable physics simulation
  let simNodes = nodes.map(n => ({
    id: n.id,
    x: n.x || Math.random() * 600,
    y: n.y || Math.random() * 400,
    vx: 0,
    vy: 0,
    level: levels.has(n.id) ? levels.get(n.id)! : maxLevel + 1
  }));

  const ITERATIONS = 150; // Iterations to settle the layout
  const k = 160; // Ideal distance between nodes
  const damping = 0.85;

  for (let i = 0; i < ITERATIONS; i++) {
    // a. Coulomb Repulsion (push all nodes apart)
    for (let a = 0; a < simNodes.length; a++) {
      for (let b = a + 1; b < simNodes.length; b++) {
        const nodeA = simNodes[a];
        const nodeB = simNodes[b];
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > 0.1) {
          const dist = Math.sqrt(distSq);
          const force = (k * k) / dist;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodeA.vx += fx;
          nodeA.vy += fy;
          nodeB.vx -= fx;
          nodeB.vy -= fy;
        }
      }
    }

    // b. Hooke's Law Attraction (pull connected edges together)
    edges.forEach(edge => {
      const nodeA = simNodes.find(n => n.id === edge.fromNodeId);
      const nodeB = simNodes.find(n => n.id === edge.toNodeId);
      if (nodeA && nodeB) {
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.1);
        const force = (dist * dist) / k;
        const fx = (dx / dist) * force * 0.05; // Spring stiffness
        const fy = (dy / dist) * force * 0.05;
        nodeA.vx -= fx;
        nodeA.vy -= fy;
        nodeB.vx += fx;
        nodeB.vy += fy;
      }
    });

    // c. Hierarchical Directional Gravity
    simNodes.forEach(node => {
      const targetY = 80 + node.level * 200; // Vertical spacing based on hierarchy
      const targetX = 500; // Pull to center horizontally
      
      node.vy += (targetY - node.y) * 0.12; // Vertical gravity
      node.vx += (targetX - node.x) * 0.015; // Weak horizontal gravity
    });

    // d. Integrate velocities (Euler)
    simNodes.forEach(node => {
      // Speed limit
      const vMagnitude = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      const maxV = 40;
      if (vMagnitude > maxV) {
        node.vx = (node.vx / vMagnitude) * maxV;
        node.vy = (node.vy / vMagnitude) * maxV;
      }

      node.x += node.vx;
      node.y += node.vy;
      node.vx *= damping;
      node.vy *= damping;
    });
  }

  // 3. Normalize coordinates (prevent off-screen positioning)
  const minX = Math.min(...simNodes.map(n => n.x));
  const minY = Math.min(...simNodes.map(n => n.y));

  const offsetX = minX < 50 ? 50 - minX : 0;
  const offsetY = minY < 50 ? 50 - minY : 0;

  // 4. Return new immutable state
  return nodes.map(n => {
    const simNode = simNodes.find(sn => sn.id === n.id);
    return {
      ...n,
      x: Math.round(simNode ? simNode.x + offsetX : n.x),
      y: Math.round(simNode ? simNode.y + offsetY : n.y)
    };
  });
}
