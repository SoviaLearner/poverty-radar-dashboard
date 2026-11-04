import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Sparkles, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { District, NationalBenchmarks } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { ArchipelagoStripPlot } from '../components/charts/ArchipelagoStripPlot';
import { DistrictsDataModal } from '../components/modals/DistrictsDataModal';
import { PARADOXES } from '../constants/paradoxes';
import { formatPercent } from '../utils/formatters';

interface PageProps {
  districts: District[];
  benchmarks: NationalBenchmarks | null;
}

export const PovertyLandscape: React.FC<PageProps> = ({ districts, benchmarks }) => {
  // Modal state for exploring full 514 districts
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);

  // Tab state for executive side panel
  const [activeTab, setActiveTab] = useState<'extremes' | 'insights'>('extremes');
  const [leaderboardScope, setLeaderboardScope] = useState<'top5' | 'top10'>('top5');

  // Helper to format district name cleanly and compactly (e.g. "Kab. Intan Jaya", "Kota Sawah Lunto")
  const formatDistrictName = (d: District) => {
    const name = d.kab_kota.trim();
    const type = d.tipe_wilayah.trim();
    const shortPrefix = type.toLowerCase() === 'kabupaten' ? 'Kab.' : 'Kota';
    const cleanName = name.replace(/^(Kabupaten|Kota)\s+/i, '');
    return `${shortPrefix} ${cleanName}`;
  };

  // Compute dynamic leaderboard
  const sortedByP0 = [...districts].sort((a, b) => b.poverty_rate_p0 - a.poverty_rate_p0);
  const limitCount = leaderboardScope === 'top5' ? 5 : 10;
  const displayedHighest = sortedByP0.slice(0, limitCount);
  const displayedLowest = [...districts].sort((a, b) => a.poverty_rate_p0 - b.poverty_rate_p0).slice(0, limitCount);

  // Baseline national benchmarks
  const nationalMedianP0 = benchmarks?.median_p0 ?? 10.46;
  const nationalDisparityRatio = benchmarks?.disparity_ratio ?? 17.50;
  const easternAcutePct = benchmarks?.eastern_acute_pct ?? 86.9;
  const easternAcuteCount = benchmarks?.eastern_acute_count ?? 53;
  const totalAcute = benchmarks?.total_acute_pockets ?? 61;

  // Check if regional filter is currently active
  const isFilterActive = districts.length < (benchmarks?.n_regions ?? 514);

  // Compute dynamic statistics for current selection
  const sortedP0Asc = [...districts].sort((a, b) => a.poverty_rate_p0 - b.poverty_rate_p0);
  const minDistrict = sortedP0Asc[0] || null;
  const maxDistrict = sortedP0Asc[sortedP0Asc.length - 1] || null;

  let dynamicMedianP0 = nationalMedianP0;
  if (sortedP0Asc.length > 0) {
    const mid = Math.floor(sortedP0Asc.length / 2);
    dynamicMedianP0 = sortedP0Asc.length % 2 !== 0
      ? sortedP0Asc[mid].poverty_rate_p0
      : (sortedP0Asc[mid - 1].poverty_rate_p0 + sortedP0Asc[mid].poverty_rate_p0) / 2;
  }

  const dynamicDisparityRatio = (minDistrict && minDistrict.poverty_rate_p0 > 0 && maxDistrict)
    ? maxDistrict.poverty_rate_p0 / minDistrict.poverty_rate_p0
    : nationalDisparityRatio;

  const acuteDistricts = districts.filter(d => d.poverty_rate_p0 >= 20.0);
  const acuteCount = acuteDistricts.length;
  const acutePct = districts.length > 0 ? (acuteCount / districts.length) * 100 : 0;

  const targetRpjmnCount = districts.filter(d => d.poverty_rate_p0 <= 7.0).length;
  const targetRpjmnPct = districts.length > 0 ? (targetRpjmnCount / districts.length) * 100 : 0;
  const aboveRpjmnCount = districts.length - targetRpjmnCount;
  const aboveRpjmnPct = districts.length > 0 ? (aboveRpjmnCount / districts.length) * 100 : 0;

  // Dynamic composition badges for leaderboard
  const highestPapuaCount = displayedHighest.filter(d => d.region_pulau === 'Maluku & Papua').length;
  const highestPapuaPct = displayedHighest.length > 0 ? (highestPapuaCount / displayedHighest.length) * 100 : 0;
  const highestBadgeText = highestPapuaPct === 100 
    ? "100% Papua" 
    : (highestPapuaPct > 0 
        ? `${highestPapuaPct.toFixed(0)}% Papua` 
        : `${displayedHighest[0]?.region_pulau || 'Daerah'} Dominan`);

  const lowestKotaCount = displayedLowest.filter(d => d.tipe_wilayah.toLowerCase() === 'kota').length;
  const lowestKotaPct = displayedLowest.length > 0 ? (lowestKotaCount / displayedLowest.length) * 100 : 0;
  const lowestBadgeText = `${lowestKotaPct.toFixed(0)}% Kota Modern`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="space-y-1.5 sm:space-y-2 max-w-full"
    >
      {/* Editorial Headline Strip (Compact) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sdg shrink-0"></span>
            <span>Jurang Disparitas Ekstrem {nationalDisparityRatio.toFixed(2)}x Lipat Membelah Lanskap Kemiskinan</span>
          </h2>
          <p className="text-[10.5px] text-slate-500 font-medium leading-tight">
            Polarisasi spasial tajam antara pusat perkotaan barat dan kantong deprivasi kepulauan timur (BPS Susenas 2021, N=514 daerah).
          </p>
        </div>
      </div>

      {/* Row 1: Executive 3-KPI Cards Strip (Compact Density, Zero Truncation) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 sm:gap-2">
        <KpiCard
          label={isFilterActive ? "Median Kemiskinan Wilayah" : "Median Kemiskinan (P0)"}
          value={formatPercent(isFilterActive ? dynamicMedianP0 : nationalMedianP0)}
          benchmarkText={
            isFilterActive
              ? `Baseline RI: ${formatPercent(nationalMedianP0)}`
              : "Titik tengah sebaran 514 kab/kota"
          }
          contextText={
            isFilterActive && minDistrict && maxDistrict
              ? `Rentang: ${minDistrict.poverty_rate_p0.toFixed(1)}% s.d. ${maxDistrict.poverty_rate_p0.toFixed(1)}%`
              : "Rentang: 2.38% (Sawahlunto) – 41.66% (Intan Jaya)"
          }
          badge={{
            text: isFilterActive ? `${districts.length} Daerah Terpilih` : "Agregat Nasional",
            type: isFilterActive ? "filter" : "default",
          }}
        />

        <KpiCard
          label={isFilterActive ? "Rasio Disparitas Wilayah" : "Rasio Disparitas Ekstrem"}
          value={`${(isFilterActive ? dynamicDisparityRatio : nationalDisparityRatio).toFixed(2)}x`}
          unit="Lipat"
          benchmarkText={
            isFilterActive && minDistrict && maxDistrict
              ? `${minDistrict.kab_kota.replace(/^(Kabupaten|Kota)\s+/, '')} vs ${maxDistrict.kab_kota.replace(/^(Kabupaten|Kota)\s+/, '')}`
              : "Sawahlunto (2.38%) vs Intan Jaya (41.66%)"
          }
          contextText={
            isFilterActive
              ? `Disparitas nasional: ${nationalDisparityRatio.toFixed(2)}x lipat`
              : "Target disparitas ideal: 1.0x lipat"
          }
          badge={{
            text: isFilterActive 
              ? (dynamicDisparityRatio >= 5.0 ? "Disparitas Tinggi" : "Disparitas Terkendali")
              : "Ketimpangan Kritis",
            type: (isFilterActive ? dynamicDisparityRatio : nationalDisparityRatio) >= 5.0 ? "critical" : "default",
          }}
          accentColor={
            (isFilterActive ? dynamicDisparityRatio : nationalDisparityRatio) >= 5.0 
              ? "#D55E00" 
              : "#0F172A"
          }
        />

        <KpiCard
          label={isFilterActive ? "Kantong Akut Terpilih" : "Konsentrasi Kantong Akut"}
          value={
            isFilterActive
              ? `${acuteCount} Daerah`
              : `${easternAcutePct.toFixed(1)}%`
          }
          unit={isFilterActive ? `(${acutePct.toFixed(1)}%)` : "di Kawasan Timur"}
          benchmarkText={
            isFilterActive
              ? `Nasional: ${totalAcute} kantong akut (P0 ≥ 20%)`
              : `${easternAcuteCount} dari ${totalAcute} kantong akut di Timur`
          }
          contextText={
            isFilterActive
              ? (acuteCount > 0 
                  ? `${acuteCount} daerah berkategori kritis`
                  : "Nol daerah terpilih P0 ≥ 20%")
              : "Kawasan barat menyumbang 13.1% (8 kantong 3T)"
          }
          badge={{
            text: isFilterActive
              ? (acuteCount > 0 ? `${acuteCount} Kantong Akut` : "Nol Kantong Akut")
              : "Polarisasi Spasial",
            type: isFilterActive 
              ? (acuteCount > 0 ? "warning" : "positive") 
              : "warning",
          }}
          accentColor={
            isFilterActive 
              ? (acuteCount > 0 ? "#E69F00" : "#009E73")
              : "#E69F00"
          }
        />
      </div>

      {/* Row 1.5: Bilah Progres Sasaran RPJMN 2024 (Compact Executive Bar) */}
      <div className="bg-surface rounded-xl border border-slate-200/90 py-1.5 px-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
            <span className="text-[10.5px] font-bold text-slate-800 tracking-tight">
              {isFilterActive
                ? `Capaian Sasaran RPJMN 2024 — Wilayah Terpilih (${districts.length} Daerah)`
                : "Capaian Sasaran RPJMN 2024 (Sasaran Nasional: 6.5% – 7.0%)"}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[10.5px]">
            <span className="font-bold text-emerald-700">
              {targetRpjmnCount} Daerah ({targetRpjmnPct.toFixed(1)}%) Memenuhi Target
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-500">
              {districts.length - targetRpjmnCount} Daerah ({(100 - targetRpjmnPct).toFixed(1)}%) Masih Tertinggal
            </span>
          </div>
        </div>
        {/* Dual-bar progress track */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
          <div 
            className="bg-emerald-600 h-full transition-all duration-500" 
            style={{ width: `${targetRpjmnPct}%` }}
            title={`Memenuhi Target: ${targetRpjmnCount} Daerah (${targetRpjmnPct.toFixed(1)}%)`}
          />
          <div 
            className="bg-amber-500 h-full transition-all duration-500" 
            style={{ width: `${100 - targetRpjmnPct}%` }}
            title={`Tertinggal di Atas Target: ${districts.length - targetRpjmnCount} Daerah ({(100 - targetRpjmnPct).toFixed(1)}%)`}
          />
        </div>
      </div>

      {/* Row 2: Dual Hero Side-by-Side Canvas (Grid 12 Kolom, Rasio 8:4, True Zero-Scroll) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-1.5 sm:gap-2 items-stretch">
        {/* Kolom Kiri: Single Hero Visual (8 Kolom / ~67% Lebar) */}
        <div className="lg:col-span-8 flex flex-col">
          <ArchipelagoStripPlot districts={districts} />
        </div>

        {/* Kolom Kanan: Executive Side Panel Dual-Tab (4 Kolom / ~33% Lebar) */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-surface rounded-xl border border-slate-200/90 p-2.5 sm:p-3 shadow-subtle flex flex-col justify-between h-full">
            {/* Panel Header & Tab Switcher */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                  <button
                    onClick={() => setActiveTab('extremes')}
                    className={`px-2 py-0.5 text-[10.5px] font-bold rounded-md transition-all ${
                      activeTab === 'extremes'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Kutub Ekstrem
                  </button>
                  <button
                    onClick={() => setActiveTab('insights')}
                    className={`px-2 py-0.5 text-[10.5px] font-bold rounded-md transition-all flex items-center space-x-1 ${
                      activeTab === 'insights'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Wawasan Naratif</span>
                  </button>
                </div>

                {activeTab === 'extremes' && (
                  <div className="flex items-center space-x-1 text-[10px]">
                    <button
                      onClick={() => setLeaderboardScope('top5')}
                      className={`px-1.5 py-0.5 rounded font-semibold ${
                        leaderboardScope === 'top5' 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Top 5
                    </button>
                    <button
                      onClick={() => setLeaderboardScope('top10')}
                      className={`px-1.5 py-0.5 rounded font-semibold ${
                        leaderboardScope === 'top10' 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Top 10
                    </button>
                  </div>
                )}
              </div>

              {/* Tab Content 1: Kutub Ekstrem */}
              {activeTab === 'extremes' && (
                <div className="space-y-1.5">
                  {/* Sub-panel 1: Tertinggi */}
                  <div className="bg-slate-50/60 rounded-lg p-2 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1 text-red-700 font-bold text-[10.5px] uppercase tracking-wider">
                        <TrendingUp className="w-3 h-3 text-red-600" />
                        <span>{leaderboardScope === 'top5' ? 'Top 5' : 'Top 10'} Kemiskinan Tertinggi</span>
                      </div>
                      <span className="text-[9.5px] font-bold font-mono bg-red-100/80 text-red-800 px-1 py-0.2 rounded border border-red-200">
                        {highestBadgeText}
                      </span>
                    </div>

                    <div className={`space-y-0.5 ${leaderboardScope === 'top10' ? 'max-h-[85px] overflow-y-auto pr-0.5' : ''}`}>
                      {displayedHighest.map((d, i) => {
                        const barWidth = Math.min(100, Math.max(10, (d.poverty_rate_p0 / 45) * 100));
                        return (
                          <div key={d.kab_kota} className="flex items-center justify-between text-[10.5px] py-0.2">
                            <div className="flex items-center space-x-1.5 truncate min-w-0 pr-1">
                              <span className="font-mono text-slate-400 w-3.5 shrink-0 text-[9.5px]">{i + 1}.</span>
                              <span className="font-semibold text-slate-800 truncate">{formatDistrictName(d)}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <div className="w-10 bg-slate-200/80 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                <div className="bg-red-600 h-full rounded-full" style={{ width: `${barWidth}%` }} />
                              </div>
                              <span className="font-bold font-mono text-red-700 text-[10.5px] tabular-nums w-10 text-right">
                                {formatPercent(d.poverty_rate_p0)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sub-panel 2: Terendah */}
                  <div className="bg-slate-50/60 rounded-lg p-2 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1 text-okabe-blue font-bold text-[10.5px] uppercase tracking-wider">
                        <TrendingDown className="w-3 h-3 text-okabe-blue" />
                        <span>{leaderboardScope === 'top5' ? 'Top 5' : 'Top 10'} Kemiskinan Terendah</span>
                      </div>
                      <span className="text-[9.5px] font-bold font-mono bg-blue-100/80 text-okabe-blue px-1 py-0.2 rounded border border-blue-200">
                        {lowestBadgeText}
                      </span>
                    </div>

                    <div className={`space-y-0.5 ${leaderboardScope === 'top10' ? 'max-h-[85px] overflow-y-auto pr-0.5' : ''}`}>
                      {displayedLowest.map((d, i) => {
                        const barWidth = Math.min(100, Math.max(10, (d.poverty_rate_p0 / 45) * 100));
                        return (
                          <div key={d.kab_kota} className="flex items-center justify-between text-[10.5px] py-0.2">
                            <div className="flex items-center space-x-1.5 truncate min-w-0 pr-1">
                              <span className="font-mono text-slate-400 w-3.5 shrink-0 text-[9.5px]">{i + 1}.</span>
                              <span className="font-semibold text-slate-800 truncate">{formatDistrictName(d)}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <div className="w-10 bg-slate-200/80 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                <div className="bg-okabe-blue h-full rounded-full" style={{ width: `${barWidth}%` }} />
                              </div>
                              <span className="font-bold font-mono text-okabe-blue text-[10.5px] tabular-nums w-10 text-right">
                                {formatPercent(d.poverty_rate_p0)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content 2: Wawasan Naratif 9 Paradoks */}
              {activeTab === 'insights' && (
                <div className="space-y-1.5 text-[10.5px]">
                  <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/80 text-slate-700">
                    <span className="font-bold text-amber-900 block mb-0.5 text-[10.5px]">Anomali Kemiskinan Barat</span>
                    <p className="leading-snug text-slate-600 text-[10px]">
                      {isFilterActive 
                        ? `Pada seleksi wilayah ini terdapat ${acuteCount} daerah berkategori kantong kemiskinan akut (P0 ≥ 20.0%).`
                        : "86.9% kantong akut berada di Timur, namun profil deprivasi serupa muncul di pulau terisolir barat seperti Nias Barat (26.4%) dan Mentawai (14.8%)."}
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200/80 text-slate-700">
                    <span className="font-bold text-okabe-blue block mb-0.5 text-[10.5px]">Tantangan Target RPJMN 2024</span>
                    <p className="leading-snug text-slate-600 text-[10px]">
                      {aboveRpjmnCount} daerah ({aboveRpjmnPct.toFixed(1)}%) masih tertinggal di atas sasaran nasional (6.5%–7.0%). Kebijakan seragam tidak efektif untuk jurang disparitas {(isFilterActive ? dynamicDisparityRatio : nationalDisparityRatio).toFixed(2)}x lipat.
                    </p>
                  </div>

                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-500 text-[9.5px]">
                    <span>
                      Bukti: {minDistrict && maxDistrict ? `${maxDistrict.kab_kota.replace(/^(Kabupaten|Kota)\s+/, '')} (${maxDistrict.poverty_rate_p0.toFixed(2)}%) vs ${minDistrict.kab_kota.replace(/^(Kabupaten|Kota)\s+/, '')} (${minDistrict.poverty_rate_p0.toFixed(2)}%) = ${dynamicDisparityRatio.toFixed(2)}x Lipat.` : `Intan Jaya (41.66%) vs Kota Sawahlunto (2.38%) = 17.50x Lipat.`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Panel Footer: Action Button to Open 514-District Modal */}
            <div className="pt-2 border-t border-slate-100 mt-1.5">
              <button
                type="button"
                onClick={() => setIsDataModalOpen(true)}
                className="w-full py-1.5 px-2.5 bg-slate-900 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1.5 hover:bg-slate-800 transition-colors shadow-2xs group focus:outline-none focus:ring-2 focus:ring-okabe-blue/30"
              >
                <Database className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
                <span>Buka Eksplorasi Data 514 Daerah</span>
                <span className="text-[9.5px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono font-bold">
                  {districts.length} Daerah
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dialog Eksplorasi Data 514 Daerah */}
      <DistrictsDataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        districts={districts}
      />
    </motion.div>
  );
};

export default PovertyLandscape;
