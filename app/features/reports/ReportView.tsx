import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { useTransactions } from '../../hooks/useTransactions';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { IconFileText, IconPDF, IconExcel } from '../../components/icons';
import * as XLSX from 'xlsx'; // Import library excel

interface ReportViewProps {
  user: User | null;
  showNotification: (msg: string) => void;
}

export const ReportView = ({ user, showNotification }: ReportViewProps) => {
  const { transactions } = useTransactions(user);
  const [exportPeriod, setExportPeriod] = useState('this_month');

  const filterTransactions = () => {
    const now = new Date();
    if (exportPeriod === 'this_month') {
      return transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (exportPeriod === 'last_month') {
      return transactions.filter(t => {
        const d = new Date(t.date);
        const isLastMonth = now.getMonth() === 0 
          ? d.getMonth() === 11 && d.getFullYear() === now.getFullYear() - 1 
          : d.getMonth() === now.getMonth() - 1 && d.getFullYear() === now.getFullYear();
        return isLastMonth;
      });
    }
    return transactions;
  };

  const handleExportExcel = () => {
    const filteredTx = filterTransactions();
    if (filteredTx.length === 0) { showNotification('Tidak ada transaksi di periode ini.'); return; }
    
    // 1. Siapkan data yang rapi untuk Excel
    const excelData = filteredTx.map(t => ({
      'Tanggal': formatDate(t.date),
      'Tipe': t.type.toUpperCase(),
      'Kategori': t.category || '-',
      'Keterangan': t.description,
      'Jumlah (Rp)': t.amount
    }));

    // 2. Buat Worksheet dan Workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");

    // 3. Atur lebar kolom agar tidak terlalu sempit
    const columnWidths = [
      { wch: 20 }, // Tanggal
      { wch: 15 }, // Tipe
      { wch: 20 }, // Kategori
      { wch: 40 }, // Keterangan
      { wch: 20 }  // Jumlah
    ];
    worksheet['!cols'] = columnWidths;

    // 4. Unduh file sebagai .xlsx
    XLSX.writeFile(workbook, `Laporan_Keuangan_${exportPeriod}.xlsx`);
    showNotification('Laporan Excel berhasil diunduh!');
  };

  const handleExportPDF = () => {
    const filteredTx = filterTransactions();
    if (filteredTx.length === 0) { showNotification('Tidak ada transaksi di periode ini.'); return; }

    let totalPemasukan = 0; let totalPengeluaran = 0; let rows = '';
    
    filteredTx.forEach(t => {
      if(t.type === 'pemasukan') totalPemasukan += t.amount;
      if(t.type === 'pengeluaran') totalPengeluaran += t.amount;
      rows += `
        <tr>
          <td>${formatDate(t.date)}</td>
          <td style="color: ${t.type === 'pemasukan' ? '#16a34a' : '#dc2626'}; font-weight: bold;">${t.type.toUpperCase()}</td>
          <td>${t.category || '-'}</td>
          <td>${t.description}</td>
          <td style="text-align: right;">${formatRupiah(t.amount)}</td>
        </tr>
      `;
    });

    const totalSaldo = totalPemasukan - totalPengeluaran;
    const periodLabel = exportPeriod === 'this_month' ? 'Bulan Ini' : exportPeriod === 'last_month' ? 'Bulan Lalu' : 'Semua Waktu';

    const printContent = `
      <html>
        <head>
          <title>Laporan Keuangan - ${periodLabel}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            h2 { text-align: center; color: #4f46e5; margin-bottom: 5px; }
            .subtitle { text-align: center; color: #666; margin-bottom: 30px; font-size: 14px; }
            table { border-collapse: collapse; margin-bottom: 20px; width: 100%; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-size: 14px; }
            th { background-color: #f9fafb; font-weight: bold; }
            .summary { width: 350px; float: right; border-collapse: collapse; margin-top: 20px; }
            .summary th { background-color: transparent; text-align: left; border: none; padding: 8px; }
            .summary td { text-align: right; font-weight: bold; border: none; padding: 8px; }
            .summary tr { border-bottom: 1px solid #e5e7eb; }
            .summary tr:last-child { border-bottom: none; }
            .positive { color: #16a34a; }
            .negative { color: #dc2626; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h2>Laporan Keuangan</h2>
          <div class="subtitle">Periode: ${periodLabel}</div>
          <table>
            <thead><tr><th>Tanggal</th><th>Tipe</th><th>Kategori</th><th>Keterangan</th><th style="text-align: right;">Jumlah (Rp)</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <table class="summary">
            <tr><th>Total Pemasukan</th><td class="positive">+ ${formatRupiah(totalPemasukan)}</td></tr>
            <tr><th>Total Pengeluaran</th><td class="negative">- ${formatRupiah(totalPengeluaran)}</td></tr>
            <tr><th style="font-size: 16px; padding-top: 15px;">Saldo Bersih</th><td style="font-size: 16px; padding-top: 15px;">${formatRupiah(totalSaldo)}</td></tr>
          </table>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none'; document.body.appendChild(iframe);
    if (iframe.contentDocument) { iframe.contentDocument.write(printContent); iframe.contentDocument.close(); }
    showNotification('Menyiapkan PDF...');
    
    setTimeout(() => {
      iframe.contentWindow?.focus(); iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg">
            <IconFileText />
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Ekspor Laporan</h2>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Unduh riwayat transaksi Anda ke dalam format dokumen atau spreadsheet.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Pilih Periode Laporan</label>
            <div className="relative">
              <select
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white appearance-none cursor-pointer transition-colors"
                value={exportPeriod}
                onChange={(e) => setExportPeriod(e.target.value)}
              >
                <option value="this_month">Bulan Ini</option>
                <option value="last_month">Bulan Lalu</option>
                <option value="all">Semua Waktu</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={handleExportPDF}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <IconPDF /> Unduh PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <IconExcel /> Unduh Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};