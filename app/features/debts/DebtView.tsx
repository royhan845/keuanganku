import React, { useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import { useTransactions } from '../../hooks/useTransactions';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { IconCheck, IconTrash, IconFileText } from '../../components/icons/Icons';

interface DebtViewProps {
  user: User | null;
  showNotification: (msg: string) => void;
}

export const DebtView = ({ user, showNotification }: DebtViewProps) => {
  const { transactions, updateTransaction, deleteTransaction } = useTransactions(user);

  // STATE BARU: Untuk menyimpan pilihan filter saat ini
  const [filterType, setFilterType] = useState<'semua' | 'utang' | 'piutang'>('semua');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'belum_lunas' | 'lunas'>('semua');

  // MODIFIKASI: debtList sekarang merespon terhadap pilihan filter
  const debtList = useMemo(() => {
    let filtered = transactions.filter(t => t.type === 'utang' || t.type === 'piutang');
    
    // Terapkan Filter Tipe
    if (filterType !== 'semua') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    
    // Terapkan Filter Status Lunas
    if (filterStatus !== 'semua') {
      filtered = filtered.filter(t => (t.status || 'belum_lunas') === filterStatus);
    }
    
    // Urutkan: Yang belum lunas di atas, yang lunas di bawah
    return filtered.sort((a, b) => {
      const statusA = a.status || 'belum_lunas';
      const statusB = b.status || 'belum_lunas';
      if (statusA === 'belum_lunas' && statusB === 'lunas') return -1;
      if (statusA === 'lunas' && statusB === 'belum_lunas') return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [transactions, filterType, filterStatus]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'lunas' ? 'belum_lunas' : 'lunas';
      await updateTransaction(id, { status: nextStatus });
      showNotification(nextStatus === 'lunas' ? 'Ditandai sebagai Lunas!' : 'Dibatalkan dari Lunas');
    } catch (error) { 
      showNotification('Gagal memperbarui status.'); 
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Kelola Hutang & Piutang</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Pantau dan kelola status pelunasan utang/piutang Anda di sini.
        </p>
        
        {/* ---------------- BAGIAN FILTER ---------------- */}
        <div className="space-y-3 mb-5">
          
          {/* Filter Tipe Transaksi */}
          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
            <button onClick={() => setFilterType('semua')} className={`flex-1 py-2 text-[11px] uppercase tracking-wide font-bold rounded-lg transition-all ${filterType === 'semua' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              Semua
            </button>
            <button onClick={() => setFilterType('utang')} className={`flex-1 py-2 text-[11px] uppercase tracking-wide font-bold rounded-lg transition-all ${filterType === 'utang' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              Hutang Saya
            </button>
            <button onClick={() => setFilterType('piutang')} className={`flex-1 py-2 text-[11px] uppercase tracking-wide font-bold rounded-lg transition-all ${filterType === 'piutang' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              Piutang Orang
            </button>
          </div>

          {/* Filter Status Lunas */}
          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
            <button onClick={() => setFilterStatus('semua')} className={`flex-1 py-2 text-[11px] uppercase tracking-wide font-bold rounded-lg transition-all ${filterStatus === 'semua' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              Semua Status
            </button>
            <button onClick={() => setFilterStatus('belum_lunas')} className={`flex-1 py-2 text-[11px] uppercase tracking-wide font-bold rounded-lg transition-all ${filterStatus === 'belum_lunas' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              ⏳ Belum Lunas
            </button>
            <button onClick={() => setFilterStatus('lunas')} className={`flex-1 py-2 text-[11px] uppercase tracking-wide font-bold rounded-lg transition-all ${filterStatus === 'lunas' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              ✔ Lunas
            </button>
          </div>
          
        </div>

        {/* ---------------- DAFTAR KARTU ---------------- */}
        <div className="space-y-4">
          {debtList.map(d => {
            const isLunas = d.status === 'lunas';
            
            return (
              <div 
                key={d.id} 
                className={`p-4 rounded-2xl border transition-all duration-300 ${
                  isLunas 
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-emerald-200 dark:border-emerald-900/30 opacity-75' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${d.type === 'utang' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                        {d.type === 'utang' ? 'HUTANG SAYA' : 'PIUTANG ORANG'}
                      </span>
                      
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${isLunas ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {isLunas ? '✔ LUNAS' : '⏳ BELUM LUNAS'}
                      </span>
                    </div>
                    
                    <h3 className={`font-bold text-base ${isLunas ? 'text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600' : 'text-slate-800 dark:text-slate-100'}`}>
                      {d.description}
                    </h3>
                  </div>
                  
                  <div className="text-right ml-3">
                    <p className={`font-black text-lg ${isLunas ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                      {formatRupiah(d.amount)}
                    </p>
                    {d.dueDate && (
                      <p className={`text-[11px] mt-0.5 font-medium ${isLunas ? 'text-slate-400 dark:text-slate-500' : 'text-red-500 dark:text-red-400'}`}>
                        Tempo: {formatDate(d.dueDate)}
                      </p>
                    )}
                  </div>
                </div>
                
                {d.category && <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">Kategori: <span className="text-slate-600 dark:text-slate-300">{d.category}</span></p>}
                
                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-700/50">
                  <button 
                    onClick={() => handleToggleStatus(d.id, d.status || 'belum_lunas')} 
                    className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 ${
                      isLunas 
                        ? 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600' 
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60'
                    }`}
                  >
                    <IconCheck className="w-4 h-4" /> {isLunas ? 'Batal Lunas' : 'Tandai Lunas'}
                  </button>
                  
                  <button 
                    onClick={() => {
                      if (window.confirm('Yakin ingin menghapus catatan ini?')) {
                        deleteTransaction(d.id);
                      }
                    }} 
                    className="text-xs font-bold px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 flex items-center gap-1 transition-all active:scale-95"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {debtList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <IconFileText className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-600" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Data tidak ditemukan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] mt-1.5 leading-relaxed">
                Tidak ada catatan yang sesuai dengan filter saat ini, atau Anda belum memiliki data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};