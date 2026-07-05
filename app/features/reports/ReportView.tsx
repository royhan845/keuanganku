import React, { useState, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import { useTransactions } from '../../hooks/useTransactions';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { IconFileText, IconPDF, IconExcel, IconSearch, IconSave, IconUpload } from '../../components/icons/Icons';
import * as XLSX from 'xlsx';

interface ReportViewProps {
  user: User | null;
  showNotification: (msg: string) => void;
}

export const ReportView = ({ user, showNotification }: ReportViewProps) => {
  const { transactions, restoreTransactions } = useTransactions(user);
  const [exportPeriod, setExportPeriod] = useState('this_month');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    filteredTx.forEach(t => {
      const isPositive = t.type === 'pemasukan' || t.type === 'utang';
      rows += `
        <tr>
          <td>${formatDate(t.date)}</td>
          <td style="color: ${isPositive ? '#16a34a' : '#dc2626'}; font-weight: bold;">${t.type.toUpperCase()}</td>
          <td>${t.category || '-'}</td>
          <td>${t.description}</td>
          <td style="text-align: right;">${formatRupiah(t.amount)}</td>
        </tr>
      `;
    });

    const periodLabel = exportPeriod === 'this_month' ? 'Bulan Ini' : exportPeriod === 'last_month' ? 'Bulan Lalu' : 'Semua Waktu';
    const printContent = `
      <html>
        <head><title>Laporan Keuangan</title><style>body { font-family: Arial, sans-serif; padding: 40px; color:#333;} h2{text-align:center;color:#4f46e5;} table{border-collapse:collapse;width:100%;margin-bottom:20px;} th,td{border:1px solid #e5e7eb;padding:12px;font-size:14px;} th{background:#f9fafb;}</style></head>
        <body><h2>Laporan Keuangan</h2><p style="text-align:center">Periode: ${periodLabel}</p><table><thead><tr><th>Tanggal</th><th>Tipe</th><th>Kategori</th><th>Keterangan</th><th style="text-align:right">Jumlah</th></tr></thead><tbody>${rows}</tbody></table></body>
      </html>
    `;
    const iframe = document.createElement('iframe'); iframe.style.display = 'none'; document.body.appendChild(iframe);
    if (iframe.contentDocument) { iframe.contentDocument.write(printContent); iframe.contentDocument.close(); }
    setTimeout(() => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); document.body.removeChild(iframe); }, 500);
  };

  const handleBackupJSON = async () => {
    if (transactions.length === 0) { showNotification('Tidak ada data untuk dibackup.'); return; }
    const jsonString = JSON.stringify(transactions, null, 2);
    const fileName = `Backup_DuitKu_${new Date().toISOString().split('T')[0]}.json`;
    const file = new File([jsonString], fileName, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Backup DuitKu' }); } catch (e) {}
    } else {
      const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([jsonString])); link.download = fileName; link.click();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg"><IconFileText /></div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Ekspor Laporan</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Pilih Periode Laporan</label>
            <select className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl outline-none bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer" value={exportPeriod} onChange={(e) => setExportPeriod(e.target.value)}>
              <option value="this_month">Bulan Ini ({new Date().toLocaleString('id-ID', { month: 'long' })})</option>
              <option value="last_month">Bulan Lalu</option>
              <option value="all">Semua Waktu</option>
            </select>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center">
              <IconSearch className="w-4 h-4 mr-1.5" /> Preview Dokumen Ekspor
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div><p className="text-slate-400">Total Transaksi</p><p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{previewMetrics.count} Data</p></div>
              <div><p className="text-slate-400">Pemasukan & Utang</p><p className="text-sm font-bold text-emerald-600 mt-0.5">{formatRupiah(previewMetrics.pem)}</p></div>
              <div><p className="text-slate-400">Pengeluaran & Piutang</p><p className="text-sm font-bold text-red-600 mt-0.5">{formatRupiah(previewMetrics.pen)}</p></div>
              <div><p className="text-slate-400">Estimasi Saldo Bersih</p><p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{formatRupiah(previewMetrics.saldo)}</p></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"><IconPDF /> Unduh PDF</button>
            <button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"><IconExcel /> Unduh Excel</button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Backup & Pulihkan Data</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <button onClick={handleBackupJSON} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors">
            <IconSave className="w-5 h-5" /> Backup ke JSON
          </button>
          <div>
            <input type="file" accept=".json" ref={fileInputRef} onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (ev) => { try { const json = JSON.parse(ev.target?.result as string); if (Array.isArray(json) && restoreTransactions) { showNotification('Memulihkan...'); await restoreTransactions(json); showNotification('Data berhasil dipulihkan!'); } } catch (err) { showNotification('Gagal membaca file.'); } }; reader.readAsText(file); }} className="hidden" id="restore-file"/>
            <label htmlFor="restore-file" className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-xl cursor-pointer transition-colors">
              <IconUpload className="w-5 h-5" /> Pulihkan dari JSON
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};