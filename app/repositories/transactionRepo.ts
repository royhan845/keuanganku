import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, Unsubscribe, writeBatch } from 'firebase/firestore';
import { db, customAppId } from '../config/firebase';

export interface TransactionInput {
  type: string;
  amount: string | number;
  category: string;
  description: string;
  date: string;
  status?: string;
  dueDate?: string;
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
        if (dateA !== dateB) return dateB - dateA;
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

  update: async (userId: string, transactionId: string, updateData: Partial<TransactionInput>) => {
    const docRef = doc(db, 'artifacts', customAppId, 'users', userId, 'transactions', transactionId);
    await updateDoc(docRef, updateData);
  },

  delete: async (userId: string, transactionId: string) => {
    const docRef = doc(db, 'artifacts', customAppId, 'users', userId, 'transactions', transactionId);
    await deleteDoc(docRef);
  },

  restore: async (userId: string, backupData: any[]) => {
    const batch = writeBatch(db);
    
    backupData.forEach(tx => {
      const id = tx.id || Date.now().toString() + Math.floor(Math.random() * 1000);
      const docRef = doc(db, 'artifacts', customAppId, 'users', userId, 'transactions', id);
      
      batch.set(docRef, {
        type: tx.type,
        amount: typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount,
        category: tx.category || '',
        description: tx.description || '',
        date: tx.date,
        status: tx.status || 'lunas',
        dueDate: tx.dueDate || ''
      });
    });

    await batch.commit();
  }
};