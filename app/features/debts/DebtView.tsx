import React, { useMemo } from 'react';
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

  const debtList = useMemo(() => {
    return transactions.filter(t => t.type === 'utang' || t.type === 'piutang');
  }, [transactions]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'lunas' ? 'belum_lunas' : 'lunas';
      await updateTransaction(id, { status: nextStatus });
      showNotification('Status berhasil diperbarui');
    } catch (error) { showNotification('Gagal memperbarui status.'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Buku Hutang & Piutang</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Semua pencatatan dilakukan melalui menu utama. Halaman ini khusus untuk memantau status pelunasan.
        </p>
        
        <div className="space-y-3">
          {debtList.map(d => (
            <div key={d.id} className={`bg-white dark:bg-slate-800 p-4 rounded-xl border shadow-sm transition-all group ${d.status === 'lunas' ? 'border-emerald-200 dark:border-emerald-900/50 opacity-75' : 'border-slate-100 dark:border-slate-700 hover:shadow-md'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${d.type === 'utang' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      {d.type === 'utang' ? 'HUTANG SAYA' : 'PIUTANG ORANG'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${d.status === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {d.status === 'lunas' ? 'LUNAS' : 'BELUM LUNAS'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{d.description}</h3>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{formatRupiah(d.amount)}</p>
                  {d.dueDate && <p className="text-[11px] text-slate-500 dark:text-slate-400">Tempo: {formatDate(d.dueDate)}</p>}
                </div>
              </div>
              
              {d.category && <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Kategori: {d.category}</p>}
              
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-50 dark:border-slate-700/50">
                <button 
                  onClick={() => handleToggleStatus(d.id, d.status || 'belum_lunas')} 
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${d.status === 'lunas' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                >
                  <IconCheck /> {d.status === 'lunas' ? 'Batal Lunas' : 'Tandai Lunas'}
                </button>
                <button 
                  onClick={() => deleteTransaction(d.id)} 
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1 transition-colors"
                >
                  <IconTrash /> Hapus
                </button>
              </div>
            </div>
          ))}

          {debtList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <IconFileText className="w-16 h-16 mb-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada utang ataupun piutang</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] mt-1">Tekan tombol pencatatan di menu Transaksi untuk menambahkan data finansial.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};