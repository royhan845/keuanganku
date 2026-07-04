import { useState, useEffect } from 'react';
import { transactionRepo } from '../repositories/transactionRepo';
import { User } from 'firebase/auth';

export const useTransactions = (user: User | null) => {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    const unsubscribe = transactionRepo.subscribe(
      user.uid,
      (data) => setTransactions(data),
      (error) => console.error("Gagal memuat transaksi", error)
    );

    return () => unsubscribe();
  }, [user]);

  const addTransaction = async (txData: any) => {
    if (user) await transactionRepo.add(user.uid, txData);
  };

  const deleteTransaction = async (txId: string) => {
    if (user) await transactionRepo.delete(user.uid, txId);
  };

  return { transactions, addTransaction, deleteTransaction };
};