import { auth } from '../lib/firebase';
import { supabaseRequest } from '../lib/supabase';
import { ElectricalEdge, ElectricalNode, ProjectConfig } from '../types/electrical';

interface CircuitRow {
  nodes: ElectricalNode[];
  edges: ElectricalEdge[];
  config: ProjectConfig;
}

export async function syncCircuitToSupabase(
  nodes: ElectricalNode[],
  edges: ElectricalEdge[],
  config: ProjectConfig,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await supabaseRequest<undefined>('circuits?on_conflict=user_id', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.uid,
        nodes,
        edges,
        config,
        updated_at: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Error sincronizando con Supabase:', error instanceof Error ? error.message : 'Error desconocido');
  }
}

export async function loadCircuitFromSupabase(): Promise<{
  nodes: ElectricalNode[];
  edges: ElectricalEdge[];
  config: ProjectConfig;
} | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const rows = await supabaseRequest<CircuitRow[]>(
      `circuits?user_id=eq.${encodeURIComponent(user.uid)}&select=nodes,edges,config&limit=1`,
    );
    const row = rows[0];
    if (!row) return null;
    return { nodes: row.nodes, edges: row.edges, config: row.config };
  } catch (error) {
    console.error('Error recuperando de Supabase:', error instanceof Error ? error.message : 'Error desconocido');
    return null;
  }
}
