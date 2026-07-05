import React, { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import { useTransactions } from '../../hooks/useTransactions';
import { formatRupiah } from '../../utils/formatters';
import { IconTrendingUp, IconTrendingDown, IconCreditCard, IconWallet, IconUser } from '../../components/icons/Icons';

interface DashboardViewProps {
  user: User | null;
}

// Tipe data untuk output grafik dinamis
interface ChartBarData {
  label: string;
  pem: number;
  pen: number;
  isCurrent?: boolean;
}

export const DashboardView = ({ user }: DashboardViewProps) => {
  const { transactions } = useTransactions(user);
  
  // STATE BARU: Filter mode grafik ('days', 'weeks', 'months')
  const [chartMode, setChartMode] = useState<'days' | 'weeks' | 'months'>('days');

  // Ambil nama depan pengguna untuk sapaan (Fallback ke 'Pengguna' jika kosong)
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Pengguna';

  // 1. Kalkulasi Metrik Dompet (Bulan Berjalan)
  const metrics = useMemo(() => {
    const now = new Date();
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let utangAktif = 0;
    let piutangAktif = 0;
    let txBulanIniCount = 0;

    transactions.forEach(t => {
      const tDate = new Date(t.date);
      const isThisMonth = tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      
      if (isThisMonth) txBulanIniCount++;

      if (t.type === 'pemasukan') totalPemasukan += t.amount;
      if (t.type === 'pengeluaran') totalPengeluaran += t.amount;
      
      if (t.type === 'utang') {
        if (t.status === 'belum_lunas') utangAktif += t.amount;
        totalPemasukan += t.amount; 
      }
      if (t.type === 'piutang') {
        if (t.status === 'belum_lunas') piutangAktif += t.amount;
        totalPengeluaran += t.amount; 
      }
    });

    return { 
      saldoSaatIni: totalPemasukan - totalPengeluaran, 
      totalPemasukan, 
      totalPengeluaran, 
      utangAktif, 
      piutangAktif, 
      txBulanIniCount 
    };
  }, [transactions]);

  // 2. LOGIKA GRAFIK MULTI-MODE (Hari / Minggu / Bulan)
  const chartData = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let bars: ChartBarData[] = [];
    
    // ----------- MODE 1: 7 HARI TERAKHIR -----------
    if (chartMode === 'days') {
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const dateKeys: string[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const key = `${year}-${month}-${day}`;
        dateKeys.push(key);

        bars.push({
          label: dayNames[d.getDay()],
          pem: 0,
          pen: 0,
          isCurrent: i === 0 // Tandai Hari ini
        });
      }

      transactions.forEach(t => {
        const idx = dateKeys.indexOf(t.date);
        if (idx !== -1) {
          if (t.type === 'pemasukan' || (t.type === 'utang' && t.status === 'belum_lunas')) bars[idx].pem += t.amount;
          else if (t.type === 'pengeluaran' || (t.type === 'piutang' && t.status === 'belum_lunas')) bars[idx].pen += t.amount;
        }
      });
    }

    // ----------- MODE 2: 4 MINGGU TERAKHIR -----------
    else if (chartMode === 'weeks') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const currentDate = now.getDate();

      bars.push(
        { label: 'W1', pem: 0, pen: 0, isCurrent: currentDate <= 7 },
        { label: 'W2', pem: 0, pen: 0, isCurrent: currentDate > 7 && currentDate <= 14 },
        { label: 'W3', pem: 0, pen: 0, isCurrent: currentDate > 14 && currentDate <= 21 },
        { label: 'W4', pem: 0, pen: 0, isCurrent: currentDate > 21 }
      );

      transactions.forEach(t => {
        const d = new Date(t.date);
        
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          const dateNum = d.getDate();
          let weekIdx = 0; // Default W1 (tanggal 1-7)
          
          if (dateNum > 7 && dateNum <= 14) weekIdx = 1;       // W2
          else if (dateNum > 14 && dateNum <= 21) weekIdx = 2; // W3
          else if (dateNum > 21) weekIdx = 3;                  // W4 (22 ke atas)

          if (t.type === 'pemasukan' || (t.type === 'utang' && t.status === 'belum_lunas')) {
            bars[weekIdx].pem += t.amount;
          } else if (t.type === 'pengeluaran' || (t.type === 'piutang' && t.status === 'belum_lunas')) {
            bars[weekIdx].pen += t.amount;
          }
        }
      });
    }

    // ----------- MODE 3: 6 BULAN TERAKHIR -----------
    else if (chartMode === 'months') {
      const currentYear = now.getFullYear();
      const currentMonthIndex = now.getMonth(); // 0 = Jan, 6 = Jul
      
      // Tentukan apakah kita di Semester 1 (Jan-Jun) atau Semester 2 (Jul-Des)
      const isFirstHalf = currentMonthIndex < 6;

      const monthNames = isFirstHalf 
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun']
        : ['Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

      const startMonthOffset = isFirstHalf ? 0 : 6;

      // Setup 6 batang bulan
      for (let i = 0; i < 6; i++) {
        const absoluteMonthIndex = startMonthOffset + i;
        bars.push({
          label: monthNames[i],
          pem: 0,
          pen: 0,
          isCurrent: currentMonthIndex === absoluteMonthIndex // Tandai bulan ini
        });
      }

      transactions.forEach(t => {
        const d = new Date(t.date);
        
        // Hanya proses transaksi di tahun yang sama
        if (d.getFullYear() === currentYear) {
          const tMonth = d.getMonth();
          
          // Cek apakah bulan transaksi masuk ke semester yang sedang aktif
          if (isFirstHalf && tMonth < 6) {
            const idx = tMonth;
            if (t.type === 'pemasukan' || (t.type === 'utang' && t.status === 'belum_lunas')) bars[idx].pem += t.amount;
            else if (t.type === 'pengeluaran' || (t.type === 'piutang' && t.status === 'belum_lunas')) bars[idx].pen += t.amount;
          } 
          else if (!isFirstHalf && tMonth >= 6) {
            const idx = tMonth - 6; // Geser index agar pas (Jul/6 jadi 0, Ags/7 jadi 1, dst)
            if (t.type === 'pemasukan' || (t.type === 'utang' && t.status === 'belum_lunas')) bars[idx].pem += t.amount;
            else if (t.type === 'pengeluaran' || (t.type === 'piutang' && t.status === 'belum_lunas')) bars[idx].pen += t.amount;
          }
        }
      });
    }

    // Kalkulasi Sumbu Y Dinamis
    let maxVal = 0;
    bars.forEach(b => {
      if (b.pem > maxVal) maxVal = b.pem;
      if (b.pen > maxVal) maxVal = b.pen;
    });

    if (maxVal === 0) maxVal = 100000;

    const formatAxis = (val: number) => {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
      return val.toString();
    };

    const yLabels = [formatAxis(maxVal), formatAxis(maxVal * 0.75), formatAxis(maxVal * 0.5), formatAxis(maxVal * 0.25), '0'];

    return { bars, maxVal, yLabels };
  }, [transactions, chartMode]);


  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ---------------- HEADER SAPAAN PENGGUNA ---------------- */}
      <div className="pt-2 pb-1">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
          Halo, {firstName}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
          Berikut adalah ringkasan keuanganmu saat ini.
        </p>
      </div>

      {/* ---------------- CARD SALDO UTAMA ---------------- */}
      <div className="bg-gradient-to-br from-indigo-600 to-slate-900 text-white rounded-2xl p-6 shadow-xl shadow-indigo-500/20 relative overflow-hidden border border-indigo-500/30">
        <div className="relative z-10 space-y-4">
          <div>
            <p className="text-xs text-indigo-200 font-medium tracking-wide uppercase">Saldo Saat Ini</p>
            <h1 className="text-3xl font-black tracking-tight mt-1">{formatRupiah(metrics.saldoSaatIni)}</h1>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-indigo-500/40 pt-4">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 p-2 rounded-full text-emerald-300"><IconTrendingUp /></div>
              <div>
                <p className="text-[10px] text-indigo-100 uppercase font-medium">Pemasukan</p>
                <p className="text-sm font-bold text-emerald-300">+{formatRupiah(metrics.totalPemasukan)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/10 p-2 rounded-full text-red-300"><IconTrendingDown /></div>
              <div>
                <p className="text-[10px] text-indigo-100 uppercase font-medium">Pengeluaran</p>
                <p className="text-sm font-bold text-red-300">-{formatRupiah(metrics.totalPengeluaran)}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-indigo-500/30 pt-3 flex justify-between items-center text-xs text-indigo-100">
            <span>Transaksi bulan ini</span>
            <span className="font-bold bg-white/20 px-2 py-0.5 rounded-full">{metrics.txBulanIniCount} Transaksi</span>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
      </div>

      {/* ---------------- KOTAK UTANG & PIUTANG ---------------- */}
      <div className="grid grid-cols-2 gap-4">
        {/* Card Utang */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-4 rounded-2xl shadow-sm flex items-center gap-3.5 transition-colors">
          <div className="text-red-500 bg-red-50 dark:bg-red-500/10 p-2.5 rounded-xl flex-shrink-0">
            <IconCreditCard className="w-6 h-6" />
          </div>
          <div className="truncate">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Utang Aktif</p>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">{formatRupiah(metrics.utangAktif)}</p>
          </div>
        </div>
        
        {/* Card Piutang */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-4 rounded-2xl shadow-sm flex items-center gap-3.5 transition-colors">
          <div className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-2.5 rounded-xl flex-shrink-0">
            <IconWallet className="w-6 h-6" />
          </div>
          <div className="truncate">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Piutang Aktif</p>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">{formatRupiah(metrics.piutangAktif)}</p>
          </div>
        </div>
      </div>

      {/* ---------------- GRAFIK ARUS KAS FILTERABLE ---------------- */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
        
        {/* Header Grafik & Filter Buttons */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Arus Kas</h2>
          
          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg">
            <button onClick={() => setChartMode('days')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${chartMode === 'days' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>7 HARI</button>
            <button onClick={() => setChartMode('weeks')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${chartMode === 'weeks' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>4 MINGGU</button>
            <button onClick={() => setChartMode('months')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${chartMode === 'months' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>6 BULAN</button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-end gap-4 text-[10px] font-semibold mb-4">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pemasukan</span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Pengeluaran</span>
        </div>

        {/* Render Chart */}
        <div className="flex h-48 gap-2 sm:gap-3 items-stretch relative">
          
          {/* Y-Axis Labels */}
          <div className="flex flex-col justify-between text-[10px] text-slate-400 font-bold text-right w-8 sm:w-10 pr-1 select-none">
            {chartData.yLabels.map((lbl, idx) => <span key={idx}>{lbl}</span>)}
          </div>

          {/* Chart Grid & Bars */}
          <div className={`flex-1 grid gap-2 items-end border-l border-b border-slate-200 dark:border-slate-700 pl-2 sm:pl-4 pb-1 relative ${chartMode === 'days' ? 'grid-cols-7' : chartMode === 'weeks' ? 'grid-cols-4' : 'grid-cols-6'}`}>
            <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-slate-200 dark:border-slate-700/50 pointer-events-none" />
            <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-slate-200 dark:border-slate-700/50 pointer-events-none" />
            <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-slate-200 dark:border-slate-700/50 pointer-events-none" />

            {chartData.bars.map((bar, i) => {
              const pemHeight = chartData.maxVal > 0 ? `${(bar.pem / chartData.maxVal) * 100}%` : '0%';
              const penHeight = chartData.maxVal > 0 ? `${(bar.pen / chartData.maxVal) * 100}%` : '0%';

              return (
                <div key={i} className="flex flex-col items-center h-full justify-end relative group cursor-pointer">
                  <div className="flex items-end gap-0.5 sm:gap-1 w-full h-full">
                    <div style={{ height: pemHeight }} className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-sm group-hover:brightness-110 transition-all min-h-[4px]" title={`${bar.label} - Pemasukan: ${formatRupiah(bar.pem)}`} />
                    <div style={{ height: penHeight }} className="flex-1 bg-gradient-to-t from-red-500 to-red-400 rounded-t-sm group-hover:brightness-110 transition-all min-h-[4px]" title={`${bar.label} - Pengeluaran: ${formatRupiah(bar.pen)}`} />
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-medium mt-1.5 block ${bar.isCurrent ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}`}>
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};