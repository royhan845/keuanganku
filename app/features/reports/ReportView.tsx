import React, { useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import { useTransactions } from '../../hooks/useTransactions';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { IconFileText, IconPDF, IconExcel, IconSearch } from '../../components/icons/Icons';
import * as XLSX from 'xlsx';

interface ReportViewProps {
  user: User | null;
  showNotification: (msg: string) => void;
}

export const ReportView = ({ user, showNotification }: ReportViewProps) => {
  // Hanya mengambil 'transactions', restore dihapus
  const { transactions } = useTransactions(user);
  const [exportPeriod, setExportPeriod] = useState('this_month');

  const filteredTx = useMemo(() => {
    const now = new Date();
    if (exportPeriod === 'this_month') {
      return transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (exportPeriod === 'last_month') {
      return transactions.filter(t => {
        const d = new Date(t.date);
        return now.getMonth() === 0 
          ? d.getMonth() === 11 && d.getFullYear() === now.getFullYear() - 1 
          : d.getMonth() === now.getMonth() - 1 && d.getFullYear() === now.getFullYear();
      });
    }
    return transactions;
  }, [transactions, exportPeriod]);

  const previewMetrics = useMemo(() => {
    let pem = 0; let pen = 0;
    filteredTx.forEach(t => {
      if (t.type === 'pemasukan' || t.type === 'utang') pem += t.amount;
      if (t.type === 'pengeluaran' || t.type === 'piutang') pen += t.amount;
    });
    return { count: filteredTx.length, pem, pen, saldo: pem - pen };
  }, [filteredTx]);

  const handleExportExcel = () => {
    if (filteredTx.length === 0) { showNotification('Tidak ada transaksi di periode ini.'); return; }
    const excelData = filteredTx.map(t => ({
      'Tanggal': formatDate(t.date),
      'Tipe': t.type.toUpperCase(),
      'Kategori': t.category || '-',
      'Keterangan': t.description,
      'Jumlah (Rp)': t.amount
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");
    worksheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 40 }, { wch: 20 }];
    XLSX.writeFile(workbook, `Laporan_Keuangan_${exportPeriod}.xlsx`);
    showNotification('Laporan Excel berhasil diunduh');
  };

  const handleExportPDF = () => {
    if (filteredTx.length === 0) { showNotification('Tidak ada transaksi di periode ini.'); return; }
    let rows = '';
    
    // Sortir berdasarkan tanggal (terlama ke terbaru)
    const sortedTx = [...filteredTx].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedTx.forEach(t => {
      const isPositive = t.type === 'pemasukan' || t.type === 'utang';
      rows += `
        <tr>
          <td>${formatDate(t.date)}</td>
          <td>${t.category || '-'}</td>
          <td>${t.description}</td>
          <td class="text-center"><span class="badge ${isPositive ? 'badge-green' : 'badge-red'}">${t.type.toUpperCase()}</span></td>
          <td class="text-right ${isPositive ? 'positive' : 'negative'}">${formatRupiah(t.amount)}</td>
        </tr>
      `;
    });

    const periodLabel = exportPeriod === 'this_month' ? 'Bulan Ini' : exportPeriod === 'last_month' ? 'Bulan Lalu' : 'Semua Waktu';
    
    // HTML & CSS khusus untuk hasil Print/PDF yang elegan
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Keuangan - DuitKu</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 20px; line-height: 1.5; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 15px; }
            .header h1 { margin: 0; color: #4f46e5; font-size: 28px; letter-spacing: -0.5px; }
            .header p { margin: 5px 0 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
            
            .summary { display: flex; justify-content: space-between; background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
            .summary-item { text-align: left; }
            .summary-item strong { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
            .summary-item span { font-size: 16px; font-weight: bold; color: #0f172a; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 14px 10px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
            
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .positive { color: #16a34a; }
            .negative { color: #dc2626; }
            
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; display: inline-block; }
            .badge-green { background: #dcfce7; color: #166534; }
            .badge-red { background: #fee2e2; color: #991b1b; }
            
            .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 50px; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
            @media print {
              body { padding: 0; }
              .summary { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DuitKu.rf</h1>
            <p>Laporan Rekapitulasi Finansial</p>
          </div>
          
          <div class="summary">
            <div class="summary-item"><strong>Periode Laporan</strong><span>${periodLabel}</span></div>
            <div class="summary-item"><strong>Total Pemasukan</strong><span class="positive">${formatRupiah(previewMetrics.pem)}</span></div>
            <div class="summary-item"><strong>Total Pengeluaran</strong><span class="negative">${formatRupiah(previewMetrics.pen)}</span></div>
            <div class="summary-item"><strong>Saldo Bersih</strong><span style="color: #4f46e5;">${formatRupiah(previewMetrics.saldo)}</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Kategori</th>
                <th>Keterangan</th>
                <th class="text-center">Tipe Transaksi</th>
                <th class="text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="footer">
            Dokumen ini dicetak secara otomatis oleh sistem DuitKu pada ${new Date().toLocaleString('id-ID')}
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe'); 
    iframe.style.display = 'none'; 
    document.body.appendChild(iframe);
    
    if (iframe.contentDocument) { 
      iframe.contentDocument.write(printContent); 
      iframe.contentDocument.close(); 
    }
    
    setTimeout(() => { 
      iframe.contentWindow?.focus(); 
      iframe.contentWindow?.print(); 
      document.body.removeChild(iframe); 
    }, 500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* KARTU EKSPOR LAPORAN */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center gap-3 mb-5 text-indigo-600 dark:text-indigo-400">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2.5 rounded-xl"><IconFileText className="w-6 h-6" /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">Ekspor Laporan</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Unduh ringkasan transaksi Anda ke format dokumen.</p>
          </div>
        </div>
        
        <div className="space-y-5 border-t border-slate-100 dark:border-slate-700/50 pt-5">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Pilih Periode Laporan</label>
            <div className="relative">
              <select 
                className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl outline-none bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-sm appearance-none" 
                value={exportPeriod} 
                onChange={(e) => setExportPeriod(e.target.value)}
              >
                <option value="this_month">Bulan Ini ({new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })})</option>
                <option value="last_month">Bulan Lalu</option>
                <option value="all">Semua Waktu</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">▼</div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center">
              <IconSearch className="w-4 h-4 mr-1.5" /> Preview Dokumen Ekspor
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 mb-0.5">Total Transaksi</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{previewMetrics.count} Data</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Estimasi Saldo Bersih</p>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatRupiah(previewMetrics.saldo)}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Pemasukan & Utang</p>
                <p className="text-sm font-bold text-emerald-600">{formatRupiah(previewMetrics.pem)}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Pengeluaran & Piutang</p>
                <p className="text-sm font-bold text-red-600">{formatRupiah(previewMetrics.pen)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={handleExportPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm"><IconPDF className="w-5 h-5" /> Cetak PDF</button>
            <button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm"><IconExcel className="w-5 h-5" /> Cetak Excel</button>
          </div>
          
        </div>
      </div>
    </div>
  );
};