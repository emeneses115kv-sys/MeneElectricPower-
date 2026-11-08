import { auth } from '../lib/firebase';
import { supabaseRequest } from '../lib/supabase';
import { CustomComponent } from '../types/electrical';

interface CustomComponentRow {
  component_id: string;
  data: CustomComponent;
}

export async function saveCustomComponent(component: CustomComponent): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Debe iniciar sesión para guardar componentes.');

  await supabaseRequest<undefined>('custom_components?on_conflict=user_id,component_id', {
    method: 'POST',
    body: JSON.stringify({ user_id: user.uid, component_id: component.id, data: component }),
  });
}

export async function getCustomComponents(): Promise<CustomComponent[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const rows = await supabaseRequest<CustomComponentRow[]>(
    `custom_components?user_id=eq.${encodeURIComponent(user.uid)}&select=component_id,data&order=component_id.asc`,
  );
  return rows.map(row => row.data);
}

export async function deleteCustomComponent(id: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Debe iniciar sesión para eliminar componentes.');

  await supabaseRequest<undefined>(
    `custom_components?user_id=eq.${encodeURIComponent(user.uid)}&component_id=eq.${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}
