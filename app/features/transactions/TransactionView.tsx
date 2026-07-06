import React, { useState, useMemo, useEffect } from 'react';
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
  const [quickTimeFilter, setQuickTimeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // STATE BARU: Mesin Undo (Soft Delete UI)
  const [pendingDelete, setPendingDelete] = useState<{ id: string, timeout: ReturnType<typeof setTimeout> } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup timeout jika komponen di-unmount
  useEffect(() => {
    return () => {
      if (pendingDelete) clearTimeout(pendingDelete.timeout);
    };
  }, [pendingDelete]);

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
      // Sembunyikan transaksi yang sedang dalam proses "Undo" (Optimistic UI)
      if (pendingDelete && tx.id === pendingDelete.id) return false;

      const searchLower = searchTerm.toLowerCase();
      const matchSearch = 
        searchTerm === '' || 
        tx.description.toLowerCase().includes(searchLower) ||
        (tx.category && tx.category.toLowerCase().includes(searchLower)) ||
        tx.amount.toString().includes(searchLower);

      const matchType = filterType === 'all' || tx.type === filterType;

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

      return matchSearch && matchType && matchTime;
    });
  }, [transactions, searchTerm, filterType, quickTimeFilter, pendingDelete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.description || !user) return;
    try {
      await addTransaction(txForm);
      setTxForm({ ...txForm, amount: '', description: '', category: '', dueDate: '', status: 'belum_lunas' });
      showNotification('Transaksi berhasil disimpan 🎉');
    } catch (error) { showNotification('Gagal menyimpan transaksi.'); }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await updateTransaction(id, { status: 'lunas' });
      showNotification('Status diubah menjadi Lunas!');
    } catch (error) { showNotification('Gagal memperbarui status.'); }
  };

  // LOGIKA UNDO DELETE
  const triggerDelete = (id: string) => {
    // Jika ada data lain yang masih pending, hapus permanen dulu data tersebut
    if (pendingDelete) {
      deleteTransaction(pendingDelete.id);
      clearTimeout(pendingDelete.timeout);
    }

    // Buat timer 5 detik untuk menghapus data permanen
    const timeout = setTimeout(() => {
      deleteTransaction(id);
      setPendingDelete(null);
    }, 5000);

    setPendingDelete({ id, timeout });
  };

  const handleUndo = () => {
    if (pendingDelete) {
      clearTimeout(pendingDelete.timeout); // Batalkan timer hapus permanen
      setPendingDelete(null); // Kembalikan ke UI
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
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      
      {/* ---------------- PENGINGAT JATUH TEMPO ---------------- */}
      {dueReminders.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm animate-in slide-in-from-top-2">
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
                  className="text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg ml-2 transition-all active:scale-95"
                >
                  Tandai Lunas
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------------- FORMULIR PENCATATAN ---------------- */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Catat Transaksi</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
          {['pengeluaran', 'pemasukan', 'utang', 'piutang'].map((type) => (
            <button 
              key={type} type="button"
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                txForm.type === type 
                ? (type === 'pengeluaran' || type === 'piutang' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 shadow-sm' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-sm') 
                : 'bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Jumlah (Rp)</label>
              <input 
                type="number" required min="1" 
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-medium" 
                placeholder="0" value={txForm.amount} onChange={(e) => setTxForm({...txForm, amount: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Kategori (Opsional)</label>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-medium" 
                placeholder="Misal: Makan, Transport" value={txForm.category} onChange={(e) => setTxForm({...txForm, category: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Keterangan</label>
              <input 
                type="text" required 
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-medium" 
                placeholder="Misal: Nasi Padang" value={txForm.description} onChange={(e) => setTxForm({...txForm, description: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Tanggal</label>
              <input 
                type="date" required 
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-medium" 
                value={txForm.date} onChange={(e) => setTxForm({...txForm, date: e.target.value})} 
              />
            </div>
          </div>

          {(txForm.type === 'utang' || txForm.type === 'piutang') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 animate-in zoom-in-95 duration-200">
              <div>
                <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1.5 uppercase">Jatuh Tempo (Opsional)</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2.5 border border-indigo-200 dark:border-indigo-700/50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white font-medium" 
                  value={txForm.dueDate} onChange={(e) => setTxForm({...txForm, dueDate: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-700 dark:text-slate-300 mb-1.5 uppercase">Status</label>
                <select 
                  className="w-full px-4 py-2.5 border border-indigo-200 dark:border-indigo-700/50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white cursor-pointer font-medium"
                  value={txForm.status} onChange={(e) => setTxForm({...txForm, status: e.target.value})}
                >
                  <option value="belum_lunas">⏳ Belum Lunas</option>
                  <option value="lunas">✔ Lunas</option>
                </select>
              </div>
            </div>
          )}

          <button type="submit" disabled={!user} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm mt-2">
            <IconPlus className="w-5 h-5" /> Simpan Transaksi
          </button>
        </form>
      </div>

      {/* ---------------- RIWAYAT & SMART SEARCH ---------------- */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Riwayat Transaksi</h2>
          <span className="text-xs font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-full">{filteredTransactions.length} Data</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 mb-5 space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" 
              placeholder="Cari transaksi, kategori, atau nominal..." 
              className="w-full pl-11 pr-10 py-3 border border-slate-200 rounded-xl dark:bg-slate-900/50 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-medium text-slate-800 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-3 border-t border-slate-100 dark:border-slate-700/50 pt-3">
            <select 
              className="px-4 py-2 border border-slate-200 rounded-lg dark:bg-slate-900/50 dark:border-slate-700 outline-none cursor-pointer text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Semua Jenis</option>
              <option value="pemasukan">Pemasukan</option>
              <option value="pengeluaran">Pengeluaran</option>
              <option value="utang">Utang</option>
              <option value="piutang">Piutang</option>
            </select>
            
            <div className="flex flex-wrap gap-2">
              {[ { id: 'all', label: 'Semua Waktu' }, { id: 'today', label: 'Hari Ini' }, { id: 'this_week', label: 'Minggu Ini' }, { id: 'this_month', label: 'Bulan Ini' }].map(tab => (
                <button
                  key={tab.id} type="button" onClick={() => setQuickTimeFilter(tab.id)}
                  className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${quickTimeFilter === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 pb-20">
          
          {isLoading ? (
            [1, 2, 3].map(n => (
              <div key={n} className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"></div>
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="w-20 h-5 bg-slate-200 dark:bg-slate-700 rounded shrink-0"></div>
              </div>
            ))
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map(t => {
              const isPositive = t.type === 'pemasukan' || t.type === 'utang';
              return (
                <div key={t.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2.5 rounded-xl shrink-0 ${isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                      {isPositive ? <IconTrendingUp /> : <IconTrendingDown />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{t.description}</p>
                        {t.category && (
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getCategoryColor(t.category)}`}>
                            {t.category}
                          </span>
                        )}
                        {(t.type === 'utang' || t.type === 'piutang') && (
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${t.status === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {t.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {formatDate(t.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className={`font-black text-sm ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isPositive ? '+' : '-'}{formatRupiah(t.amount)}
                    </p>
                    
                    <div className="flex gap-1">
                      {(t.type === 'utang' || t.type === 'piutang') && t.status === 'belum_lunas' && (
                        <button 
                          onClick={() => handleMarkAsPaid(t.id)} 
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100" 
                          title="Tandai Lunas"
                        >
                          <IconCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => triggerDelete(t.id)} 
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 sm:opacity-100" 
                        title="Hapus"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <IconInbox className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                {searchTerm ? 'Pencarian Tidak Ditemukan' : 'Belum Ada Transaksi'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[280px] mb-4">
                {searchTerm 
                  ? `Tidak ada data yang cocok dengan kata kunci "${searchTerm}".`
                  : 'Yuk, mulai catat pengeluaran atau pemasukan pertamamu hari ini!'}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => { setSearchTerm(''); setFilterType('all'); setQuickTimeFilter('all'); }} 
                  className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 text-xs font-bold rounded-lg transition-all"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---------------- TOAST UNDO / RECYCLE BIN ---------------- */}
      {pendingDelete && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300 min-w-[280px] justify-between">
          <p className="text-sm font-medium">1 transaksi dihapus.</p>
          <button 
            onClick={handleUndo} 
            className="text-amber-400 dark:text-amber-600 font-bold text-sm hover:underline active:scale-95 transition-all outline-none"
          >
            Batal (Undo)
          </button>
        </div>
      )}

    </div>
  );
};