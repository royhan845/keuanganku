import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface AuthViewProps {
  showNotification: (msg: string) => void;
}

export const AuthView = ({ showNotification }: AuthViewProps) => {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;
    
    try {
      if (authMode === 'register') {
        await register(authEmail, authPassword);
        showNotification('Registrasi berhasil! Selamat datang.');
      } else {
        await login(authEmail, authPassword);
        showNotification('Berhasil masuk!');
      }
    } catch (error: any) {
      let errorMsg = 'Terjadi kesalahan.';
      if (error.code === 'auth/email-already-in-use') errorMsg = 'Email sudah terdaftar.';
      else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') errorMsg = 'Email atau Kata sandi salah.';
      else if (error.code === 'auth/user-not-found') errorMsg = 'Pengguna tidak ditemukan.';
      else if (error.code === 'auth/weak-password') errorMsg = 'Kata sandi terlalu lemah (min. 6 karakter).';
      showNotification(errorMsg);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-in fade-in">
      <div className="text-center mb-8">
        {/* Hapus bayangan (shadow) biru di mode gelap agar lebih bersih */}
        <div className="bg-indigo-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-200 dark:shadow-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">KeuanganKu</h1>
        <p className="text-gray-500 dark:text-gray-400">Kelola keuangan Anda dengan aman.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1 mb-6 transition-colors">
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMode === 'login' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            onClick={() => setAuthMode('login')}
          >
            Masuk
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMode === 'register' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            onClick={() => setAuthMode('register')}
          >
            Daftar
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800" 
              placeholder="nama@email.com" 
              value={authEmail} 
              onChange={(e) => setAuthEmail(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kata Sandi</label>
            <input 
              type="password" 
              required 
              minLength={6} 
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800" 
              placeholder="Minimal 6 karakter" 
              value={authPassword} 
              onChange={(e) => setAuthPassword(e.target.value)} 
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors mt-2">
            {authMode === 'login' ? 'Masuk ke Akun' : 'Buat Akun Baru'}
          </button>
        </form>
      </div>
    </div>
  );
};