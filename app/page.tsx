'use client';

import React, { useState, useEffect } from 'react'; 
import { useAuth } from './hooks/useAuth';
import { useTheme } from 'next-themes';
import { IconHome, IconList, IconUsers, IconFileText, IconLogOut } from './components/icons';

// Import Views
import { AuthView } from './features/auth/AuthView';
import { DashboardView } from './features/dashboard/DashboardView';
import { TransactionView } from './features/transactions/TransactionView';
import { DebtView } from './features/debts/DebtView';
import { ReportView } from './features/reports/ReportView';

export default function Page() {
  const { user, isAuthReady, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isAuthReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthView showNotification={showNotification} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans pb-20 transition-colors">
      
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-xl text-sm font-medium animate-in slide-in-from-top-5">
          {notification}
        </div>
      )}

      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/>
              </svg>
            </div>
            KeuanganKu
          </h1>
          <div className="flex items-center gap-4">
            <span className="flex h-3 w-3 relative" title="Tersambung ke Cloud">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            
            <button 
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-w-[34px] min-h-[34px] flex items-center justify-center"
              title="Ganti Tema"
            >
              {mounted ? (
                resolvedTheme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                )
              ) : (
                <div className="w-[18px] h-[18px]"></div> 
              )}
            </button>

            <button onClick={logout} className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Keluar">
              <IconLogOut />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <DashboardView user={user} />}
        {activeTab === 'transactions' && <TransactionView user={user} showNotification={showNotification} />}
        {activeTab === 'debts' && <DebtView user={user} showNotification={showNotification} />}
        {activeTab === 'reports' && <ReportView user={user} showNotification={showNotification} />}
      </main>

      <nav className="fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe z-40 transition-colors">
        <div className="max-w-2xl mx-auto px-1">
          <div className="flex justify-between">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <IconHome />
              <span className="mt-1">Beranda</span>
            </button>
            <button 
              onClick={() => setActiveTab('transactions')} 
              className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${activeTab === 'transactions' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <IconList />
              <span className="mt-1">Catat</span>
            </button>
            <button 
              onClick={() => setActiveTab('debts')} 
              className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${activeTab === 'debts' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <IconUsers />
              <span className="mt-1">Hutang</span>
            </button>
            <button 
              onClick={() => setActiveTab('reports')} 
              className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${activeTab === 'reports' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <IconFileText />
              <span className="mt-1">Laporan</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}