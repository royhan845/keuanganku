import { collection, doc, setDoc, deleteDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, customAppId } from '../config/firebase';

export interface TransactionInput {
  type: string;
  amount: string | number;
  category: string;
  description: string;
  date: string;
}

export interface Transaction extends TransactionInput {
  id: string;
  amount: number;
}

export const transactionRepo = {
  subscribe: (userId: string, onData: (data: Transaction[]) => void, onError: (err: Error) => void): Unsubscribe => {
    const txRef = collection(db, 'artifacts', customAppId, 'users', userId, 'transactions');
    return onSnapshot(txRef, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      
      data.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        if (dateA !== dateB) {
          return dateB - dateA;
        } 
        
        return b.id.localeCompare(a.id);
      });

      onData(data);
    }, onError);
  },

  add: async (userId: string, transactionData: TransactionInput) => {
    const newId = Date.now().toString();
    const newTx = { 
      ...transactionData, 
      amount: typeof transactionData.amount === 'string' ? parseFloat(transactionData.amount) : transactionData.amount 
    };
    
    const docRef = doc(db, 'artifacts', customAppId, 'users', userId, 'transactions', newId);
    await setDoc(docRef, newTx);
    return newTx;
  },

  delete: async (userId: string, transactionId: string) => {
    const docRef = doc(db, 'artifacts', customAppId, 'users', userId, 'transactions', transactionId);
    await deleteDoc(docRef);
  }
};