import React from 'react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { IconUser, IconMoon, IconSettings, IconKey, IconLogout } from '../../components/icons/Icons';

interface ProfileViewProps {
  user: User | null;
  showNotification: (msg: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export const ProfileView = ({ user, showNotification, isDarkMode, setIsDarkMode }: ProfileViewProps) => {
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification('Berhasil keluar akun');
    } catch (error) {
      showNotification('Gagal keluar akun.');
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
      
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-indigo-100 dark:border-indigo-800 shadow-sm select-none">
          <IconUser className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
          {user?.displayName || 'Pengguna DuitKu'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          {user?.email || 'email@domain.com'}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-2 shadow-sm transition-colors divide-y divide-slate-50 dark:divide-slate-700/50">
        
        <div className="flex justify-between items-center px-4 py-3.5">
          <div className="flex items-center gap-3">
            <IconMoon className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mode Gelap</span>
          </div>
          <button 
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-900'}`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <button onClick={() => showNotification('Fitur Hubungkan Profil segera hadir!')} className="w-full flex justify-between items-center px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/30 text-left transition-colors">
          <div className="flex items-center gap-3">
            <IconSettings className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ubah Profil</span>
          </div>
          <span className="text-slate-400 text-xs">➔</span>
        </button>

        <button onClick={() => showNotification('Fitur Ganti Password terproteksi email!')} className="w-full flex justify-between items-center px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/30 text-left transition-colors">
          <div className="flex items-center gap-3">
            <IconKey className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ganti Password</span>
          </div>
          <span className="text-slate-400 text-xs">➔</span>
        </button>

        <div className="px-4 py-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
          <p className="font-bold text-slate-500 dark:text-slate-400 text-sm mb-1">Tentang Aplikasi</p>
          DuitKu Finance v1.0.0 — Dirancang sebagai portofolio sistem manajemen keuangan web app modern terenkripsi cloud.
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold py-3.5 rounded-xl text-sm border border-red-100 dark:border-red-900/50 transition-colors shadow-sm text-center"
      >
        <IconLogout className="w-5 h-5" /> Keluar dari Akun
      </button>

    </div>
  );
};