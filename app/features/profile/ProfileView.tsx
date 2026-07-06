import React, { useState, useEffect } from 'react';
import { User, signOut, updateProfile, updatePassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { IconUser, IconMoon, IconSettings, IconKey, IconLogout, IconWallet } from '../../components/icons/Icons';
import { useFinancialSettings } from '../../hooks/useFinancialSettings';

interface ProfileViewProps {
  user: User | null;
  showNotification: (msg: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export const ProfileView = ({ user, showNotification, isDarkMode, setIsDarkMode }: ProfileViewProps) => {
  // Panggil hook finansial kita
  const { settings, updateFinancialSettings } = useFinancialSettings(user);

  // State untuk form Ubah Profil
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  
  // State untuk form Ganti Password
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // State untuk form Finansial (Budget & Target)
  const [isEditingFinance, setIsEditingFinance] = useState(false);
  const [finForm, setFinForm] = useState({
    budgetLimit: '',
    savingsTitle: '',
    savingsTarget: '',
    savingsCollected: ''
  });

  // Sinkronisasi data awal dari database ke form finansial
  useEffect(() => {
    if (settings) {
      setFinForm({
        budgetLimit: settings.budgetLimit.toString(),
        savingsTitle: settings.savingsTitle,
        savingsTarget: settings.savingsTarget.toString(),
        savingsCollected: settings.savingsCollected.toString()
      });
    }
  }, [settings]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification('Berhasil keluar akun');
    } catch (error) {
      showNotification('Gagal keluar akun.');
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !newName.trim()) return;
    try {
      await updateProfile(user, { displayName: newName });
      showNotification('Profil berhasil diperbarui!');
      setIsEditingProfile(false);
    } catch (error) {
      showNotification('Gagal memperbarui profil.');
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;
    if (newPassword.length < 6) {
      showNotification('Password minimal 6 karakter.');
      return;
    }
    try {
      await updatePassword(user, newPassword);
      showNotification('Password berhasil diperbarui!');
      setIsEditingPassword(false);
      setNewPassword('');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        showNotification('Akses ditolak: Silakan Logout dan Login kembali untuk mengganti password.');
      } else {
        showNotification('Gagal memperbarui password.');
      }
    }
  };

  const handleUpdateFinance = async () => {
    try {
      await updateFinancialSettings({
        budgetLimit: Number(finForm.budgetLimit) || 0,
        savingsTitle: finForm.savingsTitle || 'Target Tabungan',
        savingsTarget: Number(finForm.savingsTarget) || 0,
        savingsCollected: Number(finForm.savingsCollected) || 0
      });
      showNotification('Pengaturan finansial berhasil disimpan!');
      setIsEditingFinance(false);
    } catch (err) {
      showNotification('Gagal menyimpan pengaturan finansial.');
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto animate-in fade-in duration-300 pb-10">
      
      {/* KARTU PROFIL UTAMA */}
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

      {/* KARTU PENGATURAN */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm transition-colors divide-y divide-slate-50 dark:divide-slate-700/50">
        
        {/* Toggle Mode Gelap */}
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

        {/* ----------------- FORM PENGATURAN FINANSIAL ----------------- */}
        {isEditingFinance ? (
          <div className="px-4 py-4 bg-slate-50 dark:bg-slate-900/30 animate-in fade-in slide-in-from-top-2 space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Batas Anggaran Bulanan (Rp)</label>
              <input 
                type="number" value={finForm.budgetLimit} onChange={e => setFinForm({...finForm, budgetLimit: e.target.value})} 
                placeholder="Misal: 2500000"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
              />
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-700/50 pt-3">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Nama Target Tabungan</label>
              <input 
                type="text" value={finForm.savingsTitle} onChange={e => setFinForm({...finForm, savingsTitle: e.target.value})} 
                placeholder="Misal: Beli Laptop Baru"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white mb-3"
              />
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Target (Rp)</label>
                  <input 
                    type="number" value={finForm.savingsTarget} onChange={e => setFinForm({...finForm, savingsTarget: e.target.value})} 
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Terkumpul (Rp)</label>
                  <input 
                    type="number" value={finForm.savingsCollected} onChange={e => setFinForm({...finForm, savingsCollected: e.target.value})} 
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleUpdateFinance} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">Simpan</button>
              <button onClick={() => setIsEditingFinance(false)} className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold py-2.5 rounded-lg transition-colors">Batal</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsEditingFinance(true)} className="w-full flex justify-between items-center px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/30 text-left transition-colors">
            <div className="flex items-center gap-3">
              <IconWallet className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pengaturan Finansial</span>
            </div>
            <span className="text-slate-400 text-xs">➔</span>
          </button>
        )}

        {/* Form / Tombol Ubah Profil */}
        {isEditingProfile ? (
          <div className="px-4 py-4 bg-slate-50 dark:bg-slate-900/30 animate-in fade-in slide-in-from-top-2">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Nama Baru</label>
            <input 
              type="text" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              placeholder="Masukkan nama baru"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 mb-3 text-slate-800 dark:text-white"
            />
            <div className="flex gap-2">
              <button onClick={handleUpdateProfile} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">Simpan</button>
              <button onClick={() => { setIsEditingProfile(false); setNewName(user?.displayName || ''); }} className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold py-2.5 rounded-lg transition-colors">Batal</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsEditingProfile(true)} className="w-full flex justify-between items-center px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/30 text-left transition-colors">
            <div className="flex items-center gap-3">
              <IconSettings className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ubah Profil</span>
            </div>
            <span className="text-slate-400 text-xs">➔</span>
          </button>
        )}

        {/* Form / Tombol Ganti Password */}
        {isEditingPassword ? (
          <div className="px-4 py-4 bg-slate-50 dark:bg-slate-900/30 animate-in fade-in slide-in-from-top-2">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Password Baru</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              placeholder="Minimal 6 karakter"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 mb-3 text-slate-800 dark:text-white"
            />
            <div className="flex gap-2">
              <button onClick={handleUpdatePassword} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">Perbarui</button>
              <button onClick={() => { setIsEditingPassword(false); setNewPassword(''); }} className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold py-2.5 rounded-lg transition-colors">Batal</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsEditingPassword(true)} className="w-full flex justify-between items-center px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/30 text-left transition-colors">
            <div className="flex items-center gap-3">
              <IconKey className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ganti Password</span>
            </div>
            <span className="text-slate-400 text-xs">➔</span>
          </button>
        )}

        <div className="px-4 py-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
          <p className="font-bold text-slate-500 dark:text-slate-400 text-sm mb-1">Tentang Aplikasi</p>
          DuitKu Finance v1.2.0 — Dirancang sebagai portofolio sistem manajemen keuangan web app modern terenkripsi cloud.
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