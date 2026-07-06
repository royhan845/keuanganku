import React, { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import { useTransactions } from '../../hooks/useTransactions';
import { useFinancialSettings } from '../../hooks/useFinancialSettings';
import { formatRupiah } from '../../utils/formatters';
import { IconTrendingUp, IconTrendingDown, IconWallet } from '../../components/icons/Icons';

interface DashboardViewProps {
  user: User | null;
  onNavigate?: (tab: string) => void;
}

interface ChartBarData {
  label: string;
  pem: number;
  pen: number;
  isCurrent?: boolean;
}

export const DashboardView = ({ user, onNavigate }: DashboardViewProps) => {
  const { transactions } = useTransactions(user);
  
  // MENGAMBIL DATA ASLI DARI FIREBASE
  const { settings } = useFinancialSettings(user);

  const [chartMode, setChartMode] = useState<'days' | 'weeks' | 'months'>('days');
  const [chartOffset, setChartOffset] = useState(0); 
  const [showPem, setShowPem] = useState(true);
  const [showPen, setShowPen] = useState(true);

  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Pengguna';

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let totalPemasukan = 0; let totalPengeluaran = 0;
    let pemLastMonth = 0; let penLastMonth = 0;
    
    let utangAktif = 0; let piutangAktif = 0;
    let txBulanIniCount = 0; let saldoSaatIni = 0; 
    
    let categoryTotals: Record<string, number> = {};
    let dailyTotals: Record<string, number> = {};

    transactions.forEach(t => {
      const d = new Date(t.date);
      const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      const isLastMonth = d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;

      if (t.type === 'pemasukan') saldoSaatIni += t.amount;
      else if (t.type === 'pengeluaran') saldoSaatIni -= t.amount;
      else if (t.type === 'utang' && t.status === 'belum_lunas') { utangAktif += t.amount; saldoSaatIni += t.amount; }
      else if (t.type === 'piutang' && t.status === 'belum_lunas') { piutangAktif += t.amount; saldoSaatIni -= t.amount; }

      if (isThisMonth) {
        txBulanIniCount++;
        if (t.type === 'pemasukan' || (t.type === 'utang' && t.status === 'lunas')) totalPemasukan += t.amount;
        if (t.type === 'utang' && t.status === 'belum_lunas') totalPemasukan += t.amount; 

        if (t.type === 'pengeluaran' || (t.type === 'piutang' && t.status === 'lunas')) {
          totalPengeluaran += t.amount;
          const cat = t.category ? t.category.trim() : 'Lainnya';
          const normalizedCat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
          categoryTotals[normalizedCat] = (categoryTotals[normalizedCat] || 0) + t.amount;
          
          const dayName = d.toLocaleDateString('id-ID', { weekday: 'long' });
          dailyTotals[dayName] = (dailyTotals[dayName] || 0) + t.amount;
        }
        if (t.type === 'piutang' && t.status === 'belum_lunas') totalPengeluaran += t.amount; 
      }

      if (isLastMonth) {
        if (t.type === 'pemasukan' || t.type === 'utang') pemLastMonth += t.amount;
        if (t.type === 'pengeluaran' || t.type === 'piutang') penLastMonth += t.amount;
      }
    });

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
    const topDay = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])[0] || ['-', 0];

    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({ name, amount }));

    const pemChange = pemLastMonth === 0 ? 0 : ((totalPemasukan - pemLastMonth) / pemLastMonth) * 100;
    const penChange = penLastMonth === 0 ? 0 : ((totalPengeluaran - penLastMonth) / penLastMonth) * 100;

    let insightMessage = "";
    let insightType = "neutral";

    if (totalPengeluaran === 0 && totalPemasukan === 0) {
      insightMessage = "Belum ada transaksi bulan ini. Yuk, mulai mencatat!";
    } else if (totalPengeluaran > totalPemasukan && totalPemasukan > 0) {
      insightMessage = "⚠️ Pengeluaranmu bulan ini melebihi pemasukan. Yuk, rem sedikit belanjanya!";
      insightType = "warning";
    } else if (penChange > 20) {
      insightMessage = `📈 Pengeluaran naik ${penChange.toFixed(0)}% dibanding bulan lalu. Kategori penyumbang terbesar adalah ${topCategory[0]}.`;
      insightType = "warning";
    } else if (penChange < -10 && totalPengeluaran > 0) {
      insightMessage = `🎉 Hebat! Pengeluaranmu turun ${Math.abs(penChange).toFixed(0)}% dari bulan lalu. Pertahankan!`;
      insightType = "success";
    } else {
      insightMessage = "💡 Arus keuanganmu bulan ini terpantau stabil. Lanjutkan kebiasaan baikmu!";
      insightType = "success";
    }

    return { 
      saldoSaatIni, totalPemasukan, totalPengeluaran, utangAktif, piutangAktif, txBulanIniCount,
      pemChange, penChange, topCategory, topDay, insightMessage, insightType, sortedCategories
    };
  }, [transactions]);


  const chartData = useMemo(() => {
    const realNow = new Date();
    realNow.setHours(0, 0, 0, 0);
    let bars: ChartBarData[] = [];
    let dateRangeLabel = '';
    
    if (chartMode === 'days') {
      const targetDate = new Date(realNow);
      targetDate.setDate(targetDate.getDate() + (chartOffset * 7));
      const dayOfWeek = targetDate.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; 
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(targetDate.getDate() + diffToMonday);
      const endDate = new Date(startOfWeek);
      endDate.setDate(startOfWeek.getDate() + 6);
      const startStr = startOfWeek.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const endStr = endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      dateRangeLabel = chartOffset === 0 ? 'Minggu Ini' : `${startStr} - ${endStr}`;
      const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      const dateKeys: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dateKeys.push(key);
        bars.push({ label: dayNames[i], pem: 0, pen: 0, isCurrent: d.getDate() === realNow.getDate() && d.getMonth() === realNow.getMonth() && d.getFullYear() === realNow.getFullYear() });
      }
      transactions.forEach(t => {
        const idx = dateKeys.indexOf(t.date);
        if (idx !== -1) {
          if (t.type === 'pemasukan' || (t.type === 'utang' && t.status === 'belum_lunas')) bars[idx].pem += t.amount;
          else if (t.type === 'pengeluaran' || (t.type === 'piutang' && t.status === 'belum_lunas')) bars[idx].pen += t.amount;
        }
      });
    }
    else if (chartMode === 'weeks') {
      const currentMonthId = realNow.getFullYear() * 12 + realNow.getMonth();
      const targetMonthId = currentMonthId + chartOffset;
      const targetYear = Math.floor(targetMonthId / 12);
      const targetMonth = targetMonthId % 12;
      const monthNamesFull = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      dateRangeLabel = chartOffset === 0 ? 'Bulan Ini' : `${monthNamesFull[targetMonth]} ${targetYear}`;
      const firstDayOfMonth = new Date(targetYear, targetMonth, 1).getDay();
      const offsetToMonday = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const totalWeeks = Math.floor((daysInMonth - 1 + offsetToMonday) / 7) + 1;
      for (let i = 0; i < totalWeeks; i++) bars.push({ label: 'W' + (i + 1), pem: 0, pen: 0, isCurrent: false });
      if (targetYear === realNow.getFullYear() && targetMonth === realNow.getMonth()) {
        const currentWeekIdx = Math.floor((realNow.getDate() - 1 + offsetToMonday) / 7);
        if (bars[currentWeekIdx]) bars[currentWeekIdx].isCurrent = true;
      }
      transactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
          const weekIdx = Math.floor((d.getDate() - 1 + offsetToMonday) / 7);
          if (bars[weekIdx]) {
            if (t.type === 'pemasukan' || (t.type === 'utang' && t.status === 'belum_lunas')) bars[weekIdx].pem += t.amount;
            else if (t.type === 'pengeluaran' || (t.type === 'piutang' && t.status === 'belum_lunas')) bars[weekIdx].pen += t.amount;
          }
        }
      });
    }
    else if (chartMode === 'months') {
      const currentSemesterId = realNow.getFullYear() * 2 + (realNow.getMonth() < 6 ? 0 : 1);
      const targetSemesterId = currentSemesterId + chartOffset;
      const targetYear = Math.floor(targetSemesterId / 2);
      const isFirstHalf = targetSemesterId % 2 === 0;
      dateRangeLabel = chartOffset === 0 ? 'Semester Ini' : (isFirstHalf ? `Jan - Jun ${targetYear}` : `Jul - Des ${targetYear}`);
      const monthNames = isFirstHalf ? ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'] : ['Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      const startMonthOffset = isFirstHalf ? 0 : 6;
      for (let i = 0; i < 6; i++) {
        bars.push({ label: monthNames[i], pem: 0, pen: 0, isCurrent: (targetYear === realNow.getFullYear() && startMonthOffset + i === realNow.getMonth()) });
      }
      transactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getFullYear() === targetYear) {
          const tMonth = d.getMonth();
          if (isFirstHalf && tMonth < 6) {
            if (t.type === 'pemasukan' || (t.type === 'utang' && t.status === 'belum_lunas')) bars[tMonth].pem += t.amount;
            else if (t.type === 'pengeluaran' || (t.type === 'piutang' && t.status === 'belum_lunas')) bars[tMonth].pen += t.amount;
          } else if (!isFirstHalf && tMonth >= 6) {
            const idx = tMonth - 6; 
            if (t.type === 'pemasukan' || (t.type === 'utang' && t.status === 'belum_lunas')) bars[idx].pem += t.amount;
            else if (t.type === 'pengeluaran' || (t.type === 'piutang' && t.status === 'belum_lunas')) bars[idx].pen += t.amount;
          }
        }
      });
    }

    let maxVal = 0;
    bars.forEach(b => {
      if (showPem && b.pem > maxVal) maxVal = b.pem;
      if (showPen && b.pen > maxVal) maxVal = b.pen;
    });
    if (maxVal === 0) maxVal = 100000;

    const formatAxis = (val: number) => {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
      return val.toString();
    };

    return { bars, maxVal, yLabels: [formatAxis(maxVal), formatAxis(maxVal * 0.75), formatAxis(maxVal * 0.5), formatAxis(maxVal * 0.25), '0'], dateRangeLabel };
  }, [transactions, chartMode, chartOffset, showPem, showPen]);

  const handleChartModeChange = (mode: 'days' | 'weeks' | 'months') => { setChartMode(mode); setChartOffset(0); };
  const getGridColsClass = () => {
    if (chartMode === 'days') return 'grid-cols-7';
    if (chartMode === 'months') return 'grid-cols-6';
    if (chartMode === 'weeks') return `grid-cols-${chartData.bars.length}`;
    return 'grid-cols-4';
  };

  const getCategoryColorClass = (index: number) => {
    const colors = [
      'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500'
    ];
    return colors[index % colors.length];
  };

  // MENGGUNAKAN DATA DINAMIS DARI FIREBASE (Dengan fallback nilai 0 jika belum diset)
  const budgetLimit = settings?.budgetLimit || 0;
  const savingsGoal = {
    title: settings?.savingsTitle || 'Target Tabungan',
    target: settings?.savingsTarget || 0,
    collected: settings?.savingsCollected || 0
  };

  // KALKULASI PROGRESS DENGAN PENGAMAN (Menghindari Infinity/NaN jika target = 0)
  const budgetPercentage = budgetLimit > 0 
    ? Math.min((metrics.totalPengeluaran / budgetLimit) * 100, 100) 
    : 0;
  const isOverBudget = budgetLimit > 0 && metrics.totalPengeluaran > budgetLimit;
  
  const savingsPercentage = savingsGoal.target > 0 
    ? Math.min((savingsGoal.collected / savingsGoal.target) * 100, 100) 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-6">
      
      {/* ---------------- HEADER & QUICK ACTIONS ---------------- */}
      <div className="pt-2 pb-1 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            Halo, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Ringkasan keuanganmu siap dipantau.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <button onClick={() => onNavigate && onNavigate('transaction')} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </div>
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Catat</span>
        </button>
        <button onClick={() => onNavigate && onNavigate('debt')} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          </div>
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Utang</span>
        </button>
        <button onClick={() => alert("Fitur Multi-Wallet akan datang di V1.3!")} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <IconWallet className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Dompet</span>
        </button>
        <button onClick={() => onNavigate && onNavigate('report')} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Laporan</span>
        </button>
      </div>

      {/* ---------------- CARD SALDO UTAMA ---------------- */}
      <div className="bg-gradient-to-br from-indigo-600 to-slate-900 text-white rounded-2xl p-6 shadow-xl shadow-indigo-500/20 relative overflow-hidden border border-indigo-500/30">
        <div className="relative z-10 space-y-4">
          <div>
            <p className="text-xs text-indigo-200 font-medium tracking-wide uppercase">Saldo Total</p>
            <h1 className="text-3xl font-black tracking-tight mt-1">{formatRupiah(metrics.saldoSaatIni)}</h1>
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-t border-indigo-500/40 pt-4">
            <div>
              <p className="text-[10px] text-indigo-100 uppercase font-medium mb-1">Pemasukan (Bulan Ini)</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-emerald-300">+{formatRupiah(metrics.totalPemasukan)}</p>
                {metrics.pemChange !== 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${metrics.pemChange > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                    {metrics.pemChange > 0 ? '▲' : '▼'} {Math.abs(metrics.pemChange).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-indigo-100 uppercase font-medium mb-1">Pengeluaran (Bulan Ini)</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-red-300">-{formatRupiah(metrics.totalPengeluaran)}</p>
                {metrics.penChange !== 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${metrics.penChange > 0 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {metrics.penChange > 0 ? '▲' : '▼'} {Math.abs(metrics.penChange).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
      </div>

      {/* ---------------- AI SMART INSIGHT BANNER ---------------- */}
      <div className={`p-4 rounded-xl border flex gap-3 items-start shadow-sm transition-colors ${
        metrics.insightType === 'warning' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/50' :
        metrics.insightType === 'success' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/50' :
        'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/50'
      }`}>
        <div className={`p-2 rounded-full shrink-0 ${
          metrics.insightType === 'warning' ? 'bg-amber-200 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' :
          metrics.insightType === 'success' ? 'bg-emerald-200 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' :
          'bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
        }`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${
             metrics.insightType === 'warning' ? 'text-amber-800 dark:text-amber-500' :
             metrics.insightType === 'success' ? 'text-emerald-800 dark:text-emerald-500' :
             'text-blue-800 dark:text-blue-500'
          }`}>Insight Bulan Ini</h3>
          <p className={`text-sm font-medium ${
             metrics.insightType === 'warning' ? 'text-amber-900 dark:text-amber-200' :
             metrics.insightType === 'success' ? 'text-emerald-900 dark:text-emerald-200' :
             'text-blue-900 dark:text-blue-200'
          }`}>{metrics.insightMessage}</p>
        </div>
      </div>

      {/* ---------------- FINANCIAL GOALS & BUDGET (DINAMIS FIREBASE) ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* KARTU: BATAS ANGGARAN BULAN INI */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Anggaran Bulanan</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOverBudget ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-900/50'}`}>
              {budgetLimit > 0 ? (isOverBudget ? 'Melebihi Batas' : `${budgetPercentage.toFixed(0)}% Terpakai`) : 'Belum Diatur'}
            </span>
          </div>
          <div className="mb-3">
            <p className="text-lg font-black text-slate-800 dark:text-slate-100">
              {formatRupiah(metrics.totalPengeluaran)}
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500 ml-1">/ {formatRupiah(budgetLimit)}</span>
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                isOverBudget ? 'bg-red-500' : 
                budgetPercentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'
              }`} 
              style={{ width: `${budgetPercentage}%` }}
            ></div>
          </div>
          <p className="text-[11px] font-medium mt-2 text-slate-500 dark:text-slate-400">
            {budgetLimit === 0 
              ? 'Atur anggaran di halaman Profil.'
              : isOverBudget 
              ? `Kamu overbudget ${formatRupiah(metrics.totalPengeluaran - budgetLimit)}` 
              : `Sisa anggaran: ${formatRupiah(budgetLimit - metrics.totalPengeluaran)}`}
          </p>
        </div>

        {/* KARTU: TARGET TABUNGAN */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm transition-colors group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate max-w-[150px]">
                {savingsGoal.title}
              </h3>
            </div>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full">
              Target
            </span>
          </div>
          <div className="mb-3">
            <p className="text-lg font-black text-slate-800 dark:text-slate-100">
              {formatRupiah(savingsGoal.collected)}
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500 ml-1">/ {formatRupiah(savingsGoal.target)}</span>
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div 
              className="h-full rounded-full bg-indigo-500 transition-all duration-700 group-hover:brightness-110" 
              style={{ width: `${savingsPercentage}%` }}
            ></div>
          </div>
          <p className="text-[11px] font-medium mt-2 text-slate-500 dark:text-slate-400">
            {savingsGoal.target === 0 
              ? 'Belum ada target yang diatur.'
              : `Terkumpul ${savingsPercentage.toFixed(1)}%. Semangat menabung!`}
          </p>
        </div>

      </div>

      {/* ---------------- GRAFIK ARUS KAS ---------------- */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Arus Kas</h2>
            <div className="flex sm:ml-4 items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
              <button onClick={() => setChartOffset(p => p - 1)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors rounded-md hover:bg-slate-200 dark:hover:bg-slate-800"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 min-w-[75px] text-center whitespace-nowrap">{chartData.dateRangeLabel}</span>
              <button onClick={() => setChartOffset(p => p + 1)} disabled={chartOffset === 0} className={`p-1 rounded-md transition-colors ${chartOffset === 0 ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
            </div>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg shrink-0">
            <button onClick={() => handleChartModeChange('days')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${chartMode === 'days' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}>7 HARI</button>
            <button onClick={() => handleChartModeChange('weeks')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${chartMode === 'weeks' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}>MINGGUAN</button>
            <button onClick={() => handleChartModeChange('months')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${chartMode === 'months' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}>6 BULAN</button>
          </div>
        </div>

        <div className="flex justify-end gap-5 text-[10px] font-bold mb-5 mt-1 border-b border-slate-100 dark:border-slate-700/50 pb-3">
          <button onClick={() => setShowPem(!showPem)} className={`flex items-center gap-1.5 transition-all outline-none ${showPem ? 'text-slate-600 dark:text-slate-200' : 'text-slate-400 opacity-50 grayscale'}`}><span className={`w-3 h-3 rounded-full ${showPem ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} /> Pemasukan</button>
          <button onClick={() => setShowPen(!showPen)} className={`flex items-center gap-1.5 transition-all outline-none ${showPen ? 'text-slate-600 dark:text-slate-200' : 'text-slate-400 opacity-50 grayscale'}`}><span className={`w-3 h-3 rounded-full ${showPen ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'}`} /> Pengeluaran</button>
        </div>

        <div className="flex h-48 gap-2 sm:gap-3 items-stretch relative">
          <div className="flex flex-col justify-between text-[10px] text-slate-400 font-bold text-right w-8 sm:w-10 pr-1 select-none">
            {chartData.yLabels.map((lbl, idx) => <span key={idx}>{lbl}</span>)}
          </div>
          <div className={`flex-1 grid gap-2 items-end border-l border-b border-slate-200 dark:border-slate-700 pl-2 sm:pl-4 pb-1 relative ${getGridColsClass()}`}>
            <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-slate-200 dark:border-slate-700/50 pointer-events-none" />
            <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-slate-200 dark:border-slate-700/50 pointer-events-none" />
            <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-slate-200 dark:border-slate-700/50 pointer-events-none" />

            {chartData.bars.map((bar, i) => {
              const pemHeight = chartData.maxVal > 0 ? `${(bar.pem / chartData.maxVal) * 100}%` : '0%';
              const penHeight = chartData.maxVal > 0 ? `${(bar.pen / chartData.maxVal) * 100}%` : '0%';
              return (
                <div key={i} className="flex flex-col items-center h-full justify-end relative group cursor-pointer">
                  <div className="flex items-end gap-0.5 sm:gap-1 w-full h-full">
                    {showPem && <div style={{ height: pemHeight }} className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-sm group-hover:brightness-110 transition-all duration-300 min-h-[4px]" title={`${bar.label} - Pemasukan: ${formatRupiah(bar.pem)}`} />}
                    {showPen && <div style={{ height: penHeight }} className="flex-1 bg-gradient-to-t from-red-500 to-red-400 rounded-t-sm group-hover:brightness-110 transition-all duration-300 min-h-[4px]" title={`${bar.label} - Pengeluaran: ${formatRupiah(bar.pen)}`} />}
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-medium mt-1.5 block ${bar.isCurrent ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}`}>{bar.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------------- STATISTIK KATEGORI ---------------- */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            Rincian Pengeluaran
          </h2>
          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full">Bulan Ini</span>
        </div>

        {metrics.sortedCategories.length > 0 ? (
          <div className="space-y-5">
            {metrics.sortedCategories.map((cat, index) => {
              const percentage = (cat.amount / metrics.totalPengeluaran) * 100;
              const colorClass = getCategoryColorClass(index);
              
              return (
                <div key={cat.name} className="group">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-2">{formatRupiah(cat.amount)}</span>
                      <span className="text-[10px] font-black text-slate-400">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${colorClass} group-hover:brightness-110`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada pengeluaran yang tercatat bulan ini.</p>
          </div>
        )}
      </div>

    </div>
  );
};