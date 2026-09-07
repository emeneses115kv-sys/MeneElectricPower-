import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { CustomComponent } from '../types/electrical';

export async function saveCustomComponent(component: CustomComponent): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Debe iniciar sesión para guardar componentes.");
  
  const componentRef = doc(db, 'users', user.uid, 'custom_components', component.id);
  await setDoc(componentRef, component);
}

export async function getCustomComponents(): Promise<CustomComponent[]> {
  const user = auth.currentUser;
  if (!user) return [];
  
  const componentsRef = collection(db, 'users', user.uid, 'custom_components');
  const snapshot = await getDocs(componentsRef);
  
  return snapshot.docs.map(doc => doc.data() as CustomComponent);
}

export async function deleteCustomComponent(id: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Debe iniciar sesión para eliminar componentes.");
  
  const componentRef = doc(db, 'users', user.uid, 'custom_components', id);
  await deleteDoc(componentRef);
}
