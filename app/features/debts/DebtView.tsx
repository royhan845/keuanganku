import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { useDebts } from '../../hooks/useDebts';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { IconPlus, IconCheck, IconTrash } from '../../components/icons';

interface DebtViewProps {
  user: User | null;
  showNotification: (msg: string) => void;
}

export const DebtView = ({ user, showNotification }: DebtViewProps) => {
  const { debts, addDebt, toggleDebtStatus, deleteDebt } = useDebts(user);
  const [debtForm, setDebtForm] = useState({ 
    type: 'hutang', person: '', amount: '', description: '', dueDate: new Date().toISOString().split('T')[0] 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtForm.amount || !debtForm.person || !user) return;
    try {
      await addDebt(debtForm);
      setDebtForm({ ...debtForm, person: '', amount: '', description: '' });
      showNotification(`${debtForm.type === 'hutang' ? 'Hutang' : 'Piutang'} berhasil dicatat!`);
    } catch(error) { showNotification('Gagal menyimpan catatan.'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Catat Hutang / Piutang</h2>
        
        <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1 mb-4 transition-colors">
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${debtForm.type === 'hutang' ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            onClick={() => setDebtForm({...debtForm, type: 'hutang'})}
          >
            Hutang (Saya Pinjam)
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${debtForm.type === 'piutang' ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            onClick={() => setDebtForm({...debtForm, type: 'piutang'})}
          >
            Piutang (Orang Pinjam)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Orang / Pihak</label>
            <input 
              type="text" required 
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800" 
              placeholder="Contoh: Budi" value={debtForm.person} onChange={(e) => setDebtForm({...debtForm, person: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah (Rp)</label>
            <input 
              type="number" required min="1" 
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800" 
              placeholder="Contoh: 100000" value={debtForm.amount} onChange={(e) => setDebtForm({...debtForm, amount: e.target.value})} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Keterangan Tambahan</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800" 
                placeholder="Pinjam uang makan" value={debtForm.description} onChange={(e) => setDebtForm({...debtForm, description: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Target Lunas</label>
              <input 
                type="date" required 
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800" 
                value={debtForm.dueDate} onChange={(e) => setDebtForm({...debtForm, dueDate: e.target.value})} 
              />
            </div>
          </div>
          <button type="submit" disabled={!user} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <IconPlus /> Simpan Catatan
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">Daftar Hutang & Piutang</h2>
        <div className="space-y-3">
          {debts.map(d => (
            <div key={d.id} className={`bg-white dark:bg-gray-800 p-4 rounded-xl border shadow-sm transition-all group ${d.isPaid ? 'border-emerald-200 dark:border-emerald-900 opacity-75' : 'border-gray-100 dark:border-gray-700 hover:shadow-md'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${d.type === 'hutang' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                      {d.type === 'hutang' ? 'HUTANG' : 'PIUTANG'}
                    </span>
                    {d.isPaid && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">LUNAS</span>}
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">{d.person}</h3>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800 dark:text-gray-100">{formatRupiah(d.amount)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Jatuh Tempo: {formatDate(d.dueDate)}</p>
                </div>
              </div>
              
              {d.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{d.description}</p>}
              
              <div className="flex gap-2 justify-end pt-2 border-t border-gray-50 dark:border-gray-700/50">
                <button 
                  onClick={() => toggleDebtStatus(d.id, d.isPaid)} 
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${d.isPaid ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/50'}`}
                >
                  <IconCheck /> {d.isPaid ? 'Batal Lunas' : 'Tandai Lunas'}
                </button>
                <button 
                  onClick={() => deleteDebt(d.id)} 
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/50 flex items-center gap-1 transition-colors"
                >
                  <IconTrash /> Hapus
                </button>
              </div>
            </div>
          ))}
          {debts.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Tidak ada catatan hutang/piutang</p>}
        </div>
      </div>
    </div>
  );
};