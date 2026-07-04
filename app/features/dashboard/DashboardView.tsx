import React, { useMemo } from 'react';
import { User } from 'firebase/auth';
import { useTransactions } from '../../hooks/useTransactions';
import { useDebts } from '../../hooks/useDebts';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { IconTrendingUp, IconTrendingDown } from '../../components/icons';

interface DashboardViewProps {
  user: User;
}

export const DashboardView = ({ user }: DashboardViewProps) => {
  const { transactions } = useTransactions(user);
  const { debts } = useDebts(user);

  const summary = useMemo(() => {
    let totalPemasukan = 0; let totalPengeluaran = 0;
    let totalHutangAktif = 0; let totalPiutangAktif = 0;
    
    transactions.forEach(t => {
      if (t.type === 'pemasukan') totalPemasukan += t.amount;
      if (t.type === 'pengeluaran') totalPengeluaran += t.amount;
    });

    debts.forEach(d => {
      if (!d.isPaid) {
        if (d.type === 'hutang') totalHutangAktif += d.amount;
        if (d.type === 'piutang') totalPiutangAktif += d.amount;
      }
    });

    return { saldo: totalPemasukan - totalPengeluaran, totalPemasukan, totalPengeluaran, totalHutangAktif, totalPiutangAktif };
  }, [transactions, debts]);

  const chartData = useMemo(() => {
    const data = []; const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });
      
      let pemasukan = 0; let pengeluaran = 0;
      transactions.forEach(t => {
        if (t.date === dateStr) {
          if (t.type === 'pemasukan') pemasukan += t.amount;
          if (t.type === 'pengeluaran') pengeluaran += t.amount;
        }
      });
      data.push({ date: dateStr, label: dayLabel, pemasukan, pengeluaran });
    }
    const maxAmount = Math.max(...data.flatMap(d => [d.pemasukan, d.pengeluaran]), 1);
    return { data, maxAmount };
  }, [transactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 dark:from-indigo-900 dark:to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
        <h3 className="text-indigo-100 dark:text-indigo-200 text-sm font-medium mb-1">Total Saldo Saat Ini</h3>
        <h1 className="text-4xl font-bold mb-4">{formatRupiah(summary.saldo)}</h1>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-400/30">
          <div>
            <div className="flex items-center text-indigo-100 dark:text-indigo-200 text-xs mb-1">
              <IconTrendingUp /> <span className="ml-1">Pemasukan</span>
            </div>
            <p className="font-semibold">{formatRupiah(summary.totalPemasukan)}</p>
          </div>
          <div>
             <div className="flex items-center text-indigo-100 dark:text-indigo-200 text-xs mb-1">
              <IconTrendingDown /> <span className="ml-1">Pengeluaran</span>
            </div>
            <p className="font-semibold">{formatRupiah(summary.totalPengeluaran)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Hutang Aktif (Saya berhutang)</h3>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatRupiah(summary.totalHutangAktif)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Piutang Aktif (Orang berhutang)</h3>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(summary.totalPiutangAktif)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
        <h3 className="text-gray-800 dark:text-gray-100 text-sm font-bold mb-4">Aktivitas 7 Hari Terakhir</h3>
        <div className="flex items-end justify-between h-36 gap-1 sm:gap-2">
          {chartData.data.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center flex-1 gap-2 h-full justify-end">
              <div className="flex items-end justify-center gap-0.5 sm:gap-1 w-full h-full">
                <div 
                  className="bg-emerald-400 dark:bg-emerald-500 w-full max-w-[12px] sm:max-w-[16px] rounded-t-sm transition-all duration-500 hover:opacity-80" 
                  style={{ height: `${(day.pemasukan / chartData.maxAmount) * 100}%`, minHeight: day.pemasukan > 0 ? '4px' : '0' }}
                  title={`Pemasukan (${day.label}): ${formatRupiah(day.pemasukan)}`}
                ></div>
                <div 
                  className="bg-red-400 dark:bg-red-500 w-full max-w-[12px] sm:max-w-[16px] rounded-t-sm transition-all duration-500 hover:opacity-80" 
                  style={{ height: `${(day.pengeluaran / chartData.maxAmount) * 100}%`, minHeight: day.pengeluaran > 0 ? '4px' : '0' }}
                  title={`Pengeluaran (${day.label}): ${formatRupiah(day.pengeluaran)}`}
                ></div>
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">Transaksi Terakhir</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">Belum ada transaksi.</p>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map(t => (
              <div key={t.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${t.type === 'pemasukan' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                    {t.type === 'pemasukan' ? <IconTrendingUp /> : <IconTrendingDown />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{t.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(t.date)} {t.category && `• ${t.category}`}</p>
                  </div>
                </div>
                <p className={`font-bold ${t.type === 'pemasukan' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {t.type === 'pemasukan' ? '+' : '-'}{formatRupiah(t.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};