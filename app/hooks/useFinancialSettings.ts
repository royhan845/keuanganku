import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface FinancialSettings {
  budgetLimit: number;
  savingsTitle: string;
  savingsTarget: number;
  savingsCollected: number;
}

export const useFinancialSettings = (user: User | null) => {
  const [settings, setSettings] = useState<FinancialSettings>({
    budgetLimit: 2500000,
    savingsTitle: 'Target Tabungan',
    savingsTarget: 500000,
    savingsCollected: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'users', user.uid, 'config', 'financial');
    
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as FinancialSettings);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const updateFinancialSettings = async (newSettings: Partial<FinancialSettings>) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid, 'config', 'financial');
    await setDoc(docRef, newSettings, { merge: true });
  };

  return { settings, updateFinancialSettings, loading };
};