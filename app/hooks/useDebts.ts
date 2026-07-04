import { useState, useEffect } from 'react';
import { debtRepo } from '../repositories/debtRepo';
import { User } from 'firebase/auth';

export const useDebts = (user: User | null) => {
  const [debts, setDebts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setDebts([]);
      return;
    }

    const unsubscribe = debtRepo.subscribe(
      user.uid,
      (data) => setDebts(data),
      (error) => console.error("Gagal memuat hutang", error)
    );

    return () => unsubscribe();
  }, [user]);

  const addDebt = async (debtData: any) => {
    if (user) await debtRepo.add(user.uid, debtData);
  };

  const toggleDebtStatus = async (id: string, currentStatus: boolean) => {
    if (user) await debtRepo.toggleStatus(user.uid, id, currentStatus);
  };

  const deleteDebt = async (id: string) => {
    if (user) await debtRepo.delete(user.uid, id);
  };

  return { debts, addDebt, toggleDebtStatus, deleteDebt };
};