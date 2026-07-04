import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from '../config/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
  const register = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
  const logout = () => signOut(auth);

  return { user, isAuthReady, login, register, logout };
};