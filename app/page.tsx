'use client';

import React, { useState, useEffect } from 'react'; 
import { useAuth } from './hooks/useAuth';
import { useTheme } from 'next-themes';
import { IconHome, IconList, IconUsers, IconFileText, IconUser } from './components/icons/Icons';

import { AuthView } from './features/auth/AuthView';
import { DashboardView } from './features/dashboard/DashboardView';
import { TransactionView } from './features/transactions/TransactionView';
import { DebtView } from './features/debts/DebtView';
import { ReportView } from './features/reports/ReportView';
import { ProfileView } from './features/profile/ProfileView';

export default function Page() {
  const { user, isAuthReady } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (user) {
      setActiveTab('dashboard');
    }
  }, [user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isAuthReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans pb-20 transition-colors">
      
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-xl text-sm font-medium animate-in slide-in-from-top-5">
          {notification}
        </div>
      )}

      {!user ? (
        <AuthView showNotification={showNotification} />
      ) : (
        <>
          {/* HEADER*/}
          <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
            <div className="max-w-2xl mx-auto px-5 py-3.5 flex justify-between items-center">
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-indigo-500/20 overflow-hidden">
                  <img 
                    src="/LOGO.png" 
                    alt="Logo DQ" 
                    className="w-full h-full object-contain brightness-0 invert scale-[1.1]"
                  />
                </div>
                
                <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                  DuitKu<span className="text-indigo-600 dark:text-indigo-400">.rf</span>
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <span className="flex h-2.5 w-2.5 relative" title="Online">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 py-6">
            {activeTab === 'dashboard' && <DashboardView user={user} />}
            {activeTab === 'transactions' && <TransactionView user={user} showNotification={showNotification} />}
            {activeTab === 'debts' && <DebtView user={user} showNotification={showNotification} />}
            {activeTab === 'reports' && <ReportView user={user} showNotification={showNotification} />}
            
            {activeTab === 'profil' && (
              <ProfileView 
                user={user} 
                showNotification={showNotification} 
                isDarkMode={resolvedTheme === 'dark'} 
                setIsDarkMode={(val) => setTheme(val ? 'dark' : 'light')} 
              />
            )}
          </main>

          <nav className="fixed bottom-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pb-safe z-40 transition-colors">
            <div className="max-w-2xl mx-auto px-1">
              <div className="flex justify-between">
                <button 
                  onClick={() => setActiveTab('dashboard')} 
                  className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <IconHome />
                  <span className="mt-1">Beranda</span>
                </button>
                <button 
                  onClick={() => setActiveTab('transactions')} 
                  className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${activeTab === 'transactions' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <IconList />
                  <span className="mt-1">Catat</span>
                </button>
                <button 
                  onClick={() => setActiveTab('debts')} 
                  className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${activeTab === 'debts' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <IconUsers />
                  <span className="mt-1">Hutang</span>
                </button>
                <button 
                  onClick={() => setActiveTab('reports')} 
                  className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${activeTab === 'reports' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <IconFileText />
                  <span className="mt-1">Laporan</span>
                </button>
                <button 
                  onClick={() => setActiveTab('profil')} 
                  className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${activeTab === 'profil' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <IconUser />
                  <span className="mt-1">Profil</span>
                </button>
              </div>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}