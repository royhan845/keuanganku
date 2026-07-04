import { collection, doc, setDoc, deleteDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, customAppId } from '../config/firebase';

// Definisikan bentuk data hutang/piutang
export interface DebtInput {
  type: string;
  person: string;
  amount: string | number;
  description: string;
  dueDate: string;
}

export interface Debt extends DebtInput {
  id: string;
  amount: number;
  isPaid: boolean;
}

export const debtRepo = {
  subscribe: (userId: string, onData: (data: Debt[]) => void, onError: (err: Error) => void): Unsubscribe => {
    const debtRef = collection(db, 'artifacts', customAppId, 'users', userId, 'debts');
    return onSnapshot(debtRef, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Debt));
      
      data.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      onData(data);
    }, onError);
  },

  add: async (userId: string, debtData: DebtInput) => {
    const newId = Date.now().toString();
    const newDebt = { 
      ...debtData, 
      amount: typeof debtData.amount === 'string' ? parseFloat(debtData.amount) : debtData.amount, 
      isPaid: false 
    };
    
    const docRef = doc(db, 'artifacts', customAppId, 'users', userId, 'debts', newId);
    await setDoc(docRef, newDebt);
    return newDebt;
  },

  toggleStatus: async (userId: string, debtId: string, currentStatus: boolean) => {
    const docRef = doc(db, 'artifacts', customAppId, 'users', userId, 'debts', debtId);
    await setDoc(docRef, { isPaid: !currentStatus }, { merge: true });
  },

  delete: async (userId: string, debtId: string) => {
    const docRef = doc(db, 'artifacts', customAppId, 'users', userId, 'debts', debtId);
    await deleteDoc(docRef);
  }
};