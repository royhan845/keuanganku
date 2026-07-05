import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface AuthViewProps {
  showNotification: (msg: string) => void;
}

export const AuthView = ({ showNotification }: AuthViewProps) => {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // STATE BARU untuk nama pengguna
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;
    
    try {
      if (authMode === 'register') {
        await register(authEmail, authPassword, authName);
        
        setAuthMode('login');
        setAuthPassword(''); 
        
        showNotification('Registrasi berhasil! Silakan masuk dengan akun Anda.');
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
    <div className="min-h-[85vh] flex flex-col justify-center px-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="max-w-md w-full mx-auto">
        
        {/* Header Title & Logo */}
        <div className="text-center mb-8 mt-4">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-0 dark:opacity-30 rounded-full animate-pulse transition-opacity"></div>
            
            <div className="relative flex bg-indigo-600 w-20 h-20 rounded-2xl items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none border border-indigo-500/30 mx-auto overflow-hidden transition-all">
              <img 
                src="/LOGO.png" 
                alt="Logo DuitKu" 
                className="w-full h-full object-contain brightness-0 invert scale-[1.1]" 
              /> 
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
            DuitKu<span className="text-indigo-600 dark:text-indigo-400">.rf</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
            Kelola keuangan Anda dengan elegan.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/10 dark:shadow-none border border-slate-200/50 dark:border-slate-700/50 transition-colors">
          
          <div className="flex bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-xl mb-8">
            <button 
              type="button"
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${authMode === 'login' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm scale-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 scale-95 hover:scale-100'}`}
              onClick={() => setAuthMode('login')}
            >
              Masuk
            </button>
            <button 
              type="button"
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${authMode === 'register' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm scale-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 scale-95 hover:scale-100'}`}
              onClick={() => setAuthMode('register')}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            
            {/* KOLOM NAMA - Hanya muncul saat mode daftar */}
            {authMode === 'register' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase ml-1">Nama Lengkap</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required={authMode === 'register'} 
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all" 
                    placeholder="Contoh: Royhan Firdaus" 
                    value={authName} 
                    onChange={(e) => setAuthName(e.target.value)} 
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase ml-1">Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  required 
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all" 
                  placeholder="nama@email.com" 
                  value={authEmail} 
                  onChange={(e) => setAuthEmail(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase ml-1">Kata Sandi</label>
              <div className="relative">
                <input 
                  type="password" 
                  required 
                  minLength={6} 
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all" 
                  placeholder="Minimal 6 karakter" 
                  value={authPassword} 
                  onChange={(e) => setAuthPassword(e.target.value)} 
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] mt-4"
            >
              {authMode === 'login' ? 'Masuk ke Akun' : 'Buat Akun Baru'}
            </button>
          </form>

          {authMode === 'register' && (
             <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 mt-6 font-medium">
               Dengan mendaftar, Anda menyetujui Syarat & Ketentuan DuitKu.
             </p>
          )}
        </div>
      </div>
    </div>
  );
};