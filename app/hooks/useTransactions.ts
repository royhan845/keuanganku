import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { User } from 'firebase/auth';

export const useTransactions = (user: User | null) => {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(data);
    });

    return () => unsubscribe();
  }, [user]);

  const addTransaction = async (data: any) => {
    if (!user) return;
    await addDoc(collection(db, 'transactions'), {
      ...data,
      amount: Number(data.amount),
      userId: user.uid,
      createdAt: new Date().toISOString()
    });
  };

  const deleteTransaction = async (id: string) => {
    await deleteDoc(doc(db, 'transactions', id));
  };

  const updateTransaction = async (id: string, data: any) => {
    await updateDoc(doc(db, 'transactions', id), data);
  };

  const restoreTransactions = async (dataArray: any[]) => {
    if (!user) return;
    
    const batch = writeBatch(db);
    
    dataArray.forEach(tx => {
      const docRef = doc(collection(db, 'transactions'));
      
      const { id, ...txData } = tx;
      
      batch.set(docRef, {
         ...txData,
         userId: user.uid 
      });
    });
    
    await batch.commit();
  };

  return { 
    transactions, 
    addTransaction, 
    deleteTransaction, 
    updateTransaction, 
    restoreTransactions 
  };
};