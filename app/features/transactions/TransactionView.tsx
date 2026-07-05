import React, { useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import { useTransactions } from '../../hooks/useTransactions';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { IconPlus, IconTrash, IconTrendingUp, IconTrendingDown, IconWarning, IconInbox, IconCheck } from '../../components/icons/Icons';

interface TransactionViewProps {
  user: User | null;
  showNotification: (msg: string) => void;
}

export const TransactionView = ({ user, showNotification }: TransactionViewProps) => {
  const { transactions, addTransaction, deleteTransaction, updateTransaction } = useTransactions(user);
  
  const [txForm, setTxForm] = useState({ 
    type: 'pengeluaran', amount: '', category: '', description: '', 
    date: new Date().toISOString().split('T')[0],
    dueDate: '', status: 'belum_lunas'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [quickTimeFilter, setQuickTimeFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, txId: '' });

  const dueReminders = useMemo(() => {
    const today = new Date().getTime();
    const threeDaysFromNow = today + (3 * 24 * 60 * 60 * 1000); 
    return transactions.filter(tx => {
      if ((tx.type === 'utang' || tx.type === 'piutang') && tx.status === 'belum_lunas' && tx.dueDate) {
        const dueTime = new Date(tx.dueDate).getTime();
        return dueTime <= threeDaysFromNow;
      }
      return false;
    });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'all' || tx.type === filterType;
      const matchStatus = filterStatus === 'all' || tx.status === filterStatus;

      const txDate = new Date(tx.date);
      const now = new Date();
      
      let matchTime = true;
      if (quickTimeFilter === 'today') {
        matchTime = tx.date === now.toISOString().split('T')[0];
      } else if (quickTimeFilter === 'this_week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchTime = txDate >= oneWeekAgo && txDate <= now;
      } else if (quickTimeFilter === 'this_month') {
        matchTime = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }

      return matchSearch && matchType && matchStatus && matchTime;
    });
  }, [transactions, searchTerm, filterType, filterStatus, quickTimeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.description || !user) return;
    try {
      await addTransaction(txForm);
      setTxForm({ ...txForm, amount: '', description: '', category: '', dueDate: '', status: 'belum_lunas' });
      showNotification('Transaksi berhasil disimpan');
    } catch (error) { showNotification('Gagal menyimpan transaksi.'); }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await updateTransaction(id, { status: 'lunas' });
      showNotification('Status diubah menjadi Lunas!');
    } catch (error) { showNotification('Gagal memperbarui status.'); }
  };

  const triggerDelete = (id: string) => {
    setDeleteModal({ isOpen: true, txId: id });
  };

  const confirmDelete = async () => {
    try {
      await deleteTransaction(deleteModal.txId);
      showNotification('Transaksi berhasil dihapus');
    } catch (error) {
      showNotification('Gagal menghapus transaksi.');
    } finally {
      setDeleteModal({ isOpen: false, txId: '' });
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('makan') || cat.includes('kuliner')) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400';
    if (cat.includes('gaji') || cat.includes('income') || cat.includes('topup')) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400';
    if (cat.includes('digital') || cat.includes('game') || cat.includes('pulsa')) return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400';
    return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {dueReminders.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold mb-2">
            <IconWarning className="w-5 h-5" /> Pengingat Jatuh Tempo
          </div>
          <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-300 space-y-1">
            {dueReminders.map(rem => (
              <li key={rem.id} className="flex justify-between items-center pr-4">
                <span>
                  <span className="font-semibold">{rem.description}</span> ({formatRupiah(rem.amount)}) 
                  - Jatuh tempo: <span className="font-bold">{formatDate(rem.dueDate!)}</span>
                </span>
                <button 
                  onClick={() => handleMarkAsPaid(rem.id)}
                  className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-2 py-1 rounded ml-2"
                >
                  Tandai Lunas
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Catat Transaksi</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {['pengeluaran', 'pemasukan', 'utang', 'piutang'].map((type) => (
            <button 
              key={type} type="button"
              className={`py-2 text-sm font-medium rounded-md transition-all capitalize ${
                txForm.type === type 
                ? (type === 'pengeluaran' || type === 'piutang' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400') 
                : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              onClick={() => setTxForm({...txForm, type})}
            >
              {type}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Jumlah (Rp)</label>
              <input 
                type="number" required min="1" 
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" 
                placeholder="Masukkan jumlah" value={txForm.amount} onChange={(e) => setTxForm({...txForm, amount: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Kategori (Opsional)</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" 
                placeholder="Masukkan kategori" value={txForm.category} onChange={(e) => setTxForm({...txForm, category: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Keterangan</label>
              <input 
                type="text" required 
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" 
                placeholder="Masukkan keterangan" value={txForm.description} onChange={(e) => setTxForm({...txForm, description: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tanggal Transaksi</label>
              <input 
                type="date" required 
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" 
                value={txForm.date} onChange={(e) => setTxForm({...txForm, date: e.target.value})} 
              />
            </div>
          </div>

          {(txForm.type === 'utang' || txForm.type === 'piutang') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <div>
                <label className="block text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">Jatuh Tempo (Opsional)</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2 border border-indigo-200 dark:border-indigo-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-white" 
                  value={txForm.dueDate} onChange={(e) => setTxForm({...txForm, dueDate: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">Status</label>
                <select 
                  className="w-full px-4 py-2 border border-indigo-200 dark:border-indigo-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer"
                  value={txForm.status} onChange={(e) => setTxForm({...txForm, status: e.target.value})}
                >
                  <option value="belum_lunas">Belum Lunas</option>
                  <option value="lunas">Lunas</option>
                </select>
              </div>
            </div>
          )}

          <button type="submit" disabled={!user} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm">
            <span className="scale-75"><IconPlus /></span> Simpan Transaksi
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">Riwayat Transaksi</h2>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="text" 
              placeholder="Cari nama transaksi..." 
              className="flex-1 px-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="px-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-600 outline-none cursor-pointer"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Semua Jenis</option>
              <option value="pemasukan">Pemasukan</option>
              <option value="pengeluaran">Pengeluaran</option>
              <option value="utang">Utang</option>
              <option value="piutang">Piutang</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2 border-t pt-3 border-slate-100 dark:border-slate-700">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'today', label: 'Hari Ini' },
              { id: 'this_week', label: 'Minggu Ini' },
              { id: 'this_month', label: 'Bulan Ini' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setQuickTimeFilter(tab.id)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${quickTimeFilter === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredTransactions.map(t => {
            const isPositive = t.type === 'pemasukan' || t.type === 'utang';
            
            return (
              <div key={t.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                    {isPositive ? <IconTrendingUp /> : <IconTrendingDown />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{t.description}</p>
                      
                      {t.category && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getCategoryColor(t.category)}`}>
                          {t.category}
                        </span>
                      )}

                      {(t.type === 'utang' || t.type === 'piutang') && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {t.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatDate(t.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isPositive ? '+' : '-'}{formatRupiah(t.amount)}
                  </p>
                  
                  {(t.type === 'utang' || t.type === 'piutang') && t.status === 'belum_lunas' && (
                    <button 
                      onClick={() => handleMarkAsPaid(t.id)} 
                      className="text-slate-400 hover:text-emerald-500 transition-colors opacity-0 group-hover:opacity-100" 
                      title="Tandai Lunas"
                    >
                      <IconCheck className="w-5 h-5" />
                    </button>
                  )}
                  
                  <button 
                    onClick={() => triggerDelete(t.id)} 
                    className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" 
                    title="Hapus"
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <IconInbox className="w-12 h-12 mb-3 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada transaksi</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[250px] mt-1">Silakan isi formulir di atas untuk mulai mencatat keuanganmu.</p>
            </div>
          )}
        </div>
      </div>

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-100 dark:border-slate-700 text-center animate-in zoom-in-95 duration-200">
            <IconWarning className="w-12 h-12 mb-3 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Hapus Transaksi?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Yakin ingin menghapus transaksi ini? Data yang terhapus tidak bisa dikembalikan.</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setDeleteModal({ isOpen: false, txId: '' })}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};