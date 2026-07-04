import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { useTransactions } from '../../hooks/useTransactions';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { IconPlus, IconTrash, IconTrendingUp, IconTrendingDown } from '../../components/icons';

interface TransactionViewProps {
  user: User | null;
  showNotification: (msg: string) => void;
}

export const TransactionView = ({ user, showNotification }: TransactionViewProps) => {
  const { transactions, addTransaction, deleteTransaction } = useTransactions(user);
  
  const [txForm, setTxForm] = useState({ 
    type: 'pengeluaran', amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0] 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.description || !user) return;
    try {
      await addTransaction(txForm);
      setTxForm({ ...txForm, amount: '', description: '', category: '' });
      showNotification('Transaksi berhasil disimpan!');
    } catch (error) { showNotification('Gagal menyimpan transaksi.'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Catat Transaksi</h2>
        
        <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1 mb-4 transition-colors">
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${txForm.type === 'pengeluaran' ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            onClick={() => setTxForm({...txForm, type: 'pengeluaran'})}
          >
            Pengeluaran
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${txForm.type === 'pemasukan' ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            onClick={() => setTxForm({...txForm, type: 'pemasukan'})}
          >
            Pemasukan
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah (Rp)</label>
            <input 
              type="number" required min="1" 
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800" 
              placeholder="Contoh: 50000" value={txForm.amount} onChange={(e) => setTxForm({...txForm, amount: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Keterangan</label>
            <input 
              type="text" required 
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800" 
              placeholder="Contoh: Beli makan siang" value={txForm.description} onChange={(e) => setTxForm({...txForm, description: e.target.value})} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800" 
                placeholder="Makanan, Gaji" value={txForm.category} onChange={(e) => setTxForm({...txForm, category: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal</label>
              <input 
                type="date" required 
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800" 
                value={txForm.date} onChange={(e) => setTxForm({...txForm, date: e.target.value})} 
              />
            </div>
          </div>
          <button type="submit" disabled={!user} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <IconPlus /> Simpan Transaksi
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">Riwayat Transaksi</h2>
        <div className="space-y-3">
          {transactions.map(t => (
            <div key={t.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${t.type === 'pemasukan' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                  {t.type === 'pemasukan' ? <IconTrendingUp /> : <IconTrendingDown />}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{t.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(t.date)} {t.category && `• ${t.category}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className={`font-bold ${t.type === 'pemasukan' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {t.type === 'pemasukan' ? '+' : '-'}{formatRupiah(t.amount)}
                </p>
                <button 
                  onClick={() => deleteTransaction(t.id)} 
                  className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" 
                  title="Hapus"
                >
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
          {transactions.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Belum ada transaksi</p>}
        </div>
      </div>
    </div>
  );
};