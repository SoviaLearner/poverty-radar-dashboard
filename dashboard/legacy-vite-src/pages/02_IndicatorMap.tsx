import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { District } from '../types';
import { IndonesiaChoroplethMap } from '../components/charts/IndonesiaChoroplethMap';
import { SpatialRankingBar } from '../components/charts/SpatialRankingBar';
import { TheGreatDualismBar } from '../components/charts/TheGreatDualismBar';
import { WorkingPoorScatter } from '../components/charts/WorkingPoorScatter';
import { NarrativeCallout } from '../components/common/NarrativeCallout';
import { KpiCard } from '../components/common/KpiCard';
import { PARADOXES } from '../constants/paradoxes';
import { formatPercent, formatYears, formatCurrencyMillion } from '../utils/formatters';
import { Map, BarChart3 } from 'lucide-react';

interface PageProps {
  districts: District[];
}

export const IndicatorMap: React.FC<PageProps> = ({ districts }) => {
  const [selectedIndicator, setSelectedIndicator] = useState<keyof District>('poverty_rate_p0');
  const [viewMode, setViewMode] = useState<'map' | 'ranking'>('map');

  const indicatorOptions = [
    { key: 'poverty_rate_p0', label: 'Tingkat Kemiskinan Moneter (P0)', unit: '%' },
    { key: 'sanitation_access_pct', label: 'Akses Sanitasi Layak', unit: '%' },
    { key: 'clean_water_access_pct', label: 'Akses Air Bersih Terlindung', unit: '%' },
    { key: 'avg_school_years', label: 'Rata-rata Lama Sekolah (RLS)', unit: ' thn' },
    { key: 'expenditure_per_capita', label: 'Pengeluaran Riil per Kapita', unit: ' Ribu Rp/thn' },
    { key: 'unemployment_rate_tpt', label: 'Tingkat Pengangguran Terbuka (TPT)', unit: '%' },
    { key: 'labor_participation_tpak', label: 'Tingkat Partisipasi Kerja (TPAK)', unit: '%' },
  ];

  const activeOption = indicatorOptions.find(o => o.key === selectedIndicator) || indicatorOptions[0];

  // Dynamic summary statistics for active indicator
  const validDistricts = districts.filter(d => typeof d[selectedIndicator] === 'number');
  const sortedByIndicator = [...validDistricts].sort((a, b) => (a[selectedIndicator] as number) - (b[selectedIndicator] as number));
  const minRegion = sortedByIndicator[0] || null;
  const maxRegion = sortedByIndicator[sortedByIndicator.length - 1] || null;

  const minVal = minRegion ? (minRegion[selectedIndicator] as number) : 0;
  const maxVal = maxRegion ? (maxRegion[selectedIndicator] as number) : 0;

  let medianVal = 0;
  if (sortedByIndicator.length > 0) {
    const mid = Math.floor(sortedByIndicator.length / 2);
    medianVal = sortedByIndicator.length % 2 !== 0
      ? (sortedByIndicator[mid][selectedIndicator] as number)
      : (((sortedByIndicator[mid - 1][selectedIndicator] as number) + (sortedByIndicator[mid][selectedIndicator] as number)) / 2);
  }

  const disparitySpan = maxVal - minVal;
  const disparityRatio = (minVal > 0 && maxVal > 0) ? (maxVal / minVal) : null;

  // Policy thresholds for active indicator
  const THRESHOLD_MAP: Record<string, {
    criticalLabel: string;
    criticalBenchmark: string;
    criticalContext: string;
    isCritical: (v: number) => boolean;
    primeLabel: string;
    primeBenchmark: string;
    primeContext: string;
    isPrime: (v: number) => boolean;
  }> = {
    poverty_rate_p0: {
      criticalLabel: "Kantong Akut (P0 ≥ 20%)",
      criticalBenchmark: "Ambang batas kemiskinan akut: P0 ≥ 20.0%",
      criticalContext: "Prioritas intervensi bansos & infrastruktur dasar",
      isCritical: (v) => v >= 20.0,
      primeLabel: "Target RPJMN Tercapai",
      primeBenchmark: "Sasaran RPJMN 2024: P0 ≤ 7.0%",
      primeContext: "Wilayah berhasil menekan kemiskinan di bawah target",
      isPrime: (v) => v <= 7.0,
    },
    sanitation_access_pct: {
      criticalLabel: "Defisit Sanitasi Kritis",
      criticalBenchmark: "Ambang defisit parah: Akses < 60.0%",
      criticalContext: "Wilayah darurat sanitasi layak & jamban higienis",
      isCritical: (v) => v < 60.0,
      primeLabel: "Standar Layak Terpenuhi",
      primeBenchmark: "Standar Pelayanan Minimal: Akses ≥ 80.0%",
      primeContext: "Mayoritas rumah tangga memiliki sanitasi higienis",
      isPrime: (v) => v >= 80.0,
    },
    clean_water_access_pct: {
      criticalLabel: "Defisit Air Bersih",
      criticalBenchmark: "Ambang krisis air terlindung: Akses < 60.0%",
      criticalContext: "Ketergantungan pada sumber air tak terlindung",
      isCritical: (v) => v < 60.0,
      primeLabel: "Akses Air Terlindung Baik",
      primeBenchmark: "Target cakupan air terlindung: Akses ≥ 80.0%",
      primeContext: "Keamanan pasokan air minum terlindung memadai",
      isPrime: (v) => v >= 80.0,
    },
    avg_school_years: {
      criticalLabel: "Di Bawah Lulusan SD",
      criticalBenchmark: "Ambang tertinggal: RLS < 7.0 Tahun",
      criticalContext: "Kualifikasi modal manusia di bawah jenjang dasar",
      isCritical: (v) => v < 7.0,
      primeLabel: "Tuntas Wajib Belajar",
      primeBenchmark: "Standar Wajib Belajar 9 Tahun: RLS ≥ 9.0 Thn",
      primeContext: "Rata-rata penduduk menamatkan jenjang SMP sederajat",
      isPrime: (v) => v >= 9.0,
    },
    expenditure_per_capita: {
      criticalLabel: "Daya Beli Rendah",
      criticalBenchmark: "Kuartil bawah: < Rp8,50 Juta/tahun",
      criticalContext: "Kapasitas konsumsi riil penduduk sangat terbatas",
      isCritical: (v) => v < 8500,
      primeLabel: "Konsumsi Mapan",
      primeBenchmark: "Kuartil atas: ≥ Rp12,00 Juta/tahun",
      primeContext: "Daya beli riil masyarakat tergolong tinggi",
      isPrime: (v) => v >= 12000,
    },
    unemployment_rate_tpt: {
      criticalLabel: "Pengangguran Tinggi",
      criticalBenchmark: "Ambang friksional tinggi: TPT ≥ 7.0%",
      criticalContext: "Tantangan penyerapan tenaga kerja perkotaan",
      isCritical: (v) => v >= 7.0,
      primeLabel: "Pasar Kerja Stabil",
      primeBenchmark: "Ambang stabil pengangguran: TPT < 4.5%",
      primeContext: "Daya serap aktivitas ekonomi lokal terjaga",
      isPrime: (v) => v < 4.5,
    },
    labor_participation_tpak: {
      criticalLabel: "Kerja Subsistensi Ekstrem",
      criticalBenchmark: "Ambang beban bertahan hidup: TPAK ≥ 75.0%",
      criticalContext: "Warga miskin wajib bekerja bertahan hidup",
      isCritical: (v) => v >= 75.0,
      primeLabel: "Struktur Kerja Terbina",
      primeBenchmark: "Keseimbangan sektor formal: TPAK < 68.0%",
      primeContext: "Didukung peluang pendidikan & kesempatan formal",
      isPrime: (v) => v < 68.0,
    },
  };

  const activeThreshold = THRESHOLD_MAP[selectedIndicator as string] || THRESHOLD_MAP['poverty_rate_p0'];
  const criticalCount = validDistricts.filter(d => activeThreshold.isCritical(d[selectedIndicator] as number)).length;
  const criticalPct = validDistricts.length > 0 ? (criticalCount / validDistricts.length) * 100 : 0;
  const primeCount = validDistricts.filter(d => activeThreshold.isPrime(d[selectedIndicator] as number)).length;
  const primePct = validDistricts.length > 0 ? (primeCount / validDistricts.length) * 100 : 0;

  const formatIndicatorVal = (v: number): string => {
    if (selectedIndicator === 'expenditure_per_capita') return formatCurrencyMillion(v);
    if (selectedIndicator === 'avg_school_years') return formatYears(v);
    return formatPercent(v);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Editorial Headline & Controls Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-okabe-blue shrink-0"></span>
            <span>Polarisasi Spasial 34 Provinsi &amp; Paradoks Ketenagakerjaan</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Peta interaktif membongkar dikotomi kabupaten vs kota dan tekanan kerja subsistensi di wilayah 3T.
          </p>
        </div>

        {/* Controls: Mode Toggle & Indicator Selector */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <button
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                viewMode === 'map'
                  ? 'bg-white text-okabe-blue shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Peta</span>
            </button>
            <button
              onClick={() => setViewMode('ranking')}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                viewMode === 'ranking'
                  ? 'bg-white text-okabe-blue shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Peringkat</span>
            </button>
          </div>

          {/* Indicator Layer Selector */}
          <select
            value={selectedIndicator}
            onChange={(e) => setSelectedIndicator(e.target.value as keyof District)}
            aria-label="Pilih Indikator Spasial"
            className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-white text-slate-900 font-medium focus:ring-1 focus:ring-okabe-blue focus:outline-hidden"
          >
            {indicatorOptions.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 1: Active Indicator KPI Cards Strip (4 Clean 3-Tier Executive Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Median Wilayah"
          value={formatIndicatorVal(medianVal)}
          benchmarkText="Titik Tengah Distribusi Spasial"
          contextText={`Cakupan: ${validDistricts.length} daerah · Rentang: ${formatIndicatorVal(minVal)} s.d. ${formatIndicatorVal(maxVal)}`}
          badge={{ text: `${validDistricts.length} Daerah`, type: "default" }}
        />

        <KpiCard
          label={activeThreshold.criticalLabel}
          value={`${criticalCount} Daerah`}
          unit={`(${criticalPct.toFixed(1)}%)`}
          benchmarkText={activeThreshold.criticalBenchmark}
          contextText={activeThreshold.criticalContext}
          badge={{
            text: criticalCount > 0 ? "Defisit Kritis" : "Terkendali",
            type: criticalCount > 0 ? "critical" : "positive",
          }}
          accentColor="#D55E00"
        />

        <KpiCard
          label={activeThreshold.primeLabel}
          value={`${primeCount} Daerah`}
          unit={`(${primePct.toFixed(1)}%)`}
          benchmarkText={activeThreshold.primeBenchmark}
          contextText={activeThreshold.primeContext}
          badge={{
            text: primePct >= 50 ? "Mayoritas Capai" : "Sebagian Capai",
            type: primePct >= 50 ? "positive" : "warning",
          }}
          accentColor="#009E73"
        />

        <KpiCard
          label="Disparitas Antardaerah"
          value={disparityRatio !== null ? `${disparityRatio.toFixed(2)}x` : formatIndicatorVal(disparitySpan)}
          unit={disparityRatio !== null ? "Lipat" : ""}
          benchmarkText={
            minRegion && maxRegion
              ? `${minRegion.kab_kota.replace(/^(Kabupaten|Kota)\s+/, '')} (${formatIndicatorVal(minVal)}) vs ${maxRegion.kab_kota.replace(/^(Kabupaten|Kota)\s+/, '')} (${formatIndicatorVal(maxVal)})`
              : `Rentang Spasial: ${formatIndicatorVal(disparitySpan)}`
          }
          contextText={`Rentang absolut: ${formatIndicatorVal(disparitySpan)} · Kesenjangan nilai terendah vs tertinggi`}
          badge={{
            text: disparityRatio && disparityRatio >= 3.0 ? "Disparitas Tinggi" : "Kesenjangan Spasial",
            type: disparityRatio && disparityRatio >= 3.0 ? "warning" : "default",
          }}
          accentColor={disparityRatio && disparityRatio >= 3.0 ? "#E69F00" : "#0072B2"}
        />
      </div>

      {/* Primary Spatial Visualization: Map or Ranking Bar */}
      {viewMode === 'map' ? (
        <IndonesiaChoroplethMap
          districts={districts}
          indicator={selectedIndicator}
          indicatorLabel={activeOption.label}
          unit={activeOption.unit}
        />
      ) : (
        <SpatialRankingBar
          districts={districts}
          indicator={selectedIndicator}
          indicatorLabel={activeOption.label}
          unit={activeOption.unit}
        />
      )}

      {/* Dualism & Working Poor Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TheGreatDualismBar districts={districts} />
        <WorkingPoorScatter districts={districts} />
      </div>

      {/* Narrative Callout for Dualism & Working Poor */}
      {(() => {
        const kabs = districts.filter(d => d.tipe_wilayah === 'Kabupaten');
        const kotas = districts.filter(d => d.tipe_wilayah === 'Kota');
        const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const kabMeanP0 = mean(kabs.map(d => d.poverty_rate_p0));
        const kotaMeanP0 = mean(kotas.map(d => d.poverty_rate_p0));
        const kabMeanTpt = mean(kabs.map(d => d.unemployment_rate_tpt));
        const kotaMeanTpt = mean(kotas.map(d => d.unemployment_rate_tpt));
        const p0Ratio = (kabs.length > 0 && kotas.length > 0 && kotaMeanP0 > 0) ? (kabMeanP0 / kotaMeanP0).toFixed(2) : null;
        const tptRatio = (kabs.length > 0 && kotas.length > 0 && kabMeanTpt > 0) ? (kotaMeanTpt / kabMeanTpt).toFixed(2) : null;

        return (
          <NarrativeCallout
            title="WAWASAN DUALISME SPASIAL & KERJA SUBSISTENSI"
            insight={
              p0Ratio 
                ? `Kabupaten menanggung kemiskinan ~${p0Ratio}x lebih tinggi dari kota, sementara pengangguran rendah di wilayah miskin mencerminkan kerja subsistensi bertahan hidup (The Working Poor), bukan tingginya kemakmuran ekonomi.`
                : "Pada seleksi wilayah aktif, pengangguran rendah di kantong perdesaan mencerminkan kerja subsistensi bertahan hidup (The Working Poor), bukan tingginya kemakmuran ekonomi."
            }
            evidence={
              p0Ratio && tptRatio
                ? `Rasio P0 Kab:Kota = ${p0Ratio}x; Rasio TPT Kota:Kab = ${tptRatio}x; Nduga TPAK 97.93% dengan TPT 0.00%.`
                : "Nduga TPAK 97.93% dengan TPT 0.00%; asosiasi statistik mengindikasikan tekanan bertahan hidup, bukan hubungan sebab-akibat."
            }
          />
        );
      })()}
    </motion.div>
  );
};

export default IndicatorMap;
