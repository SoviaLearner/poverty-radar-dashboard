import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  CheckCircle2, 
  Building, 
  Briefcase, 
  FileText, 
  Calendar, 
  AlertTriangle, 
  ShieldAlert, 
  Target,
  Landmark
} from 'lucide-react';
import { District, PolicyRecommendation } from '../types';
import { VulnerabilityMatrix2x2 } from '../components/charts/VulnerabilityMatrix2x2';
import { DataTable } from '../components/common/DataTable';
import { NarrativeCallout } from '../components/common/NarrativeCallout';
import { KpiCard } from '../components/common/KpiCard';
import { PolicyBriefModal } from '../components/modals/PolicyBriefModal';
import { PlanningCycleModal } from '../components/modals/PlanningCycleModal';
import { useFilterStore } from '../store/useFilterStore';
import { QUADRANTS } from '../constants/benchmarks';
import { PARADOXES } from '../constants/paradoxes';

interface PageProps {
  districts: District[];
  allDistricts?: District[];
  policyMatrix: PolicyRecommendation[];
}

export const PriorityImplications: React.FC<PageProps> = ({ 
  districts, 
  allDistricts = districts,
  policyMatrix 
}) => {
  const { 
    selectedQuadrant, 
    setSelectedQuadrant, 
    activeCasePin, 
    setActiveCasePin 
  } = useFilterStore();
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [isPolicyBriefOpen, setIsPolicyBriefOpen] = useState<boolean>(false);
  const [isPlanningCycleOpen, setIsPlanningCycleOpen] = useState<boolean>(false);

  // Derive active quadrant code ('ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4') from global store
  const selectedQuadrantCode = useMemo(() => {
    if (!selectedQuadrant || selectedQuadrant === 'all') return 'ALL';
    const found = QUADRANTS.find(q => q.id === selectedQuadrant);
    return found ? found.code : 'ALL';
  }, [selectedQuadrant]);

  // Compute dynamic benchmarks from all available districts
  const medianP0 = useMemo(() => {
    if (!allDistricts || allDistricts.length === 0) return 10.46;
    const sorted = [...allDistricts].map(d => d.poverty_rate_p0).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }, [allDistricts]);

  const medianVStruc = useMemo(() => {
    if (!allDistricts || allDistricts.length === 0) return 0.2720;
    const sorted = [...allDistricts].map(d => d.vulnerability_score).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }, [allDistricts]);

  // Active policy recommendation item from matrix based on quadrant
  const activePolicy = selectedQuadrantCode === 'ALL'
    ? null
    : (policyMatrix.find(p => p.code === selectedQuadrantCode) || null);

  // Synchronize case pin with selected district & quadrant
  useEffect(() => {
    if (activeCasePin === 'barito_kuala') {
      const q2 = QUADRANTS.find(q => q.code === 'Q2');
      if (q2) setSelectedQuadrant(q2.id);
      const bk = districts.find(d => d.kab_kota.toLowerCase().includes('barito kuala'));
      if (bk) setSelectedDistrict(bk);
    } else if (activeCasePin === 'madura') {
      const sp = districts.find(d => d.kab_kota.toLowerCase().includes('sampang'));
      if (sp) setSelectedDistrict(sp);
    } else if (activeCasePin === 'resource_curse') {
      const mm = districts.find(d => d.kab_kota.toLowerCase().includes('mimika'));
      if (mm) setSelectedDistrict(mm);
    }
  }, [activeCasePin, districts, setSelectedQuadrant]);

  const handleSelectQuadrant = (code: string) => {
    if (code === 'ALL') {
      setSelectedQuadrant('all');
    } else {
      const found = QUADRANTS.find(q => q.code === code);
      if (found) {
        setSelectedQuadrant(found.id);
      }
    }
    if (activeCasePin !== 'none') {
      setActiveCasePin('none');
    }
  };

  const handleSelectDistrict = (d: District) => {
    setSelectedDistrict(d);
    const found = QUADRANTS.find(q => d.vulnerability_quadrant.startsWith(q.id.split(' ')[0] + ' ' + q.id.split(' ')[1]));
    if (found) {
      setSelectedQuadrant(found.id);
    }
  };

  // Policy recommendation for the selected district (for modal)
  const selectedDistrictPolicy = useMemo(() => {
    if (!selectedDistrict) return activePolicy;
    let code = 'Q1';
    if (selectedDistrict.vulnerability_quadrant.startsWith('Kuadran I ')) code = 'Q1';
    else if (selectedDistrict.vulnerability_quadrant.startsWith('Kuadran II ')) code = 'Q2';
    else if (selectedDistrict.vulnerability_quadrant.startsWith('Kuadran III ')) code = 'Q3';
    else if (selectedDistrict.vulnerability_quadrant.startsWith('Kuadran IV ')) code = 'Q4';
    return policyMatrix.find(p => p.code === code) || null;
  }, [selectedDistrict, activePolicy, policyMatrix]);

  // Filtered districts for table based on selected quadrant
  const displayedDistricts = useMemo(() => {
    if (selectedQuadrantCode === 'ALL') return districts;
    const qMap: Record<string, string> = {
      Q1: 'Kuadran I ',
      Q2: 'Kuadran II ',
      Q3: 'Kuadran III ',
      Q4: 'Kuadran IV ',
    };
    const prefix = qMap[selectedQuadrantCode];
    return prefix ? districts.filter(d => d.vulnerability_quadrant.startsWith(prefix)) : districts;
  }, [districts, selectedQuadrantCode]);

  const quadrantStats = useMemo(() => {
    const base = allDistricts && allDistricts.length > 0 ? allDistricts : districts;
    const q1 = base.filter(d => d.vulnerability_quadrant.startsWith('Kuadran I ')).length;
    const q2 = base.filter(d => d.vulnerability_quadrant.startsWith('Kuadran II ')).length;
    const q3 = base.filter(d => d.vulnerability_quadrant.startsWith('Kuadran III ')).length;
    const q4 = base.filter(d => d.vulnerability_quadrant.startsWith('Kuadran IV ')).length;
    const total = base.length || 514;
    return {
      q1: { count: q1, pct: (q1 / total) * 100 },
      q2: { count: q2, pct: (q2 / total) * 100 },
      q3: { count: q3, pct: (q3 / total) * 100 },
      q4: { count: q4, pct: (q4 / total) * 100 },
    };
  }, [allDistricts, districts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Editorial Headline, Statutory Planning Modal CTA, & Case Study Pins */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-okabe-vermillion shrink-0"></span>
            <span>Matriks Skrining Kerentanan 2x2: Penapisan Portofolio Kebijakan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diferensiasi intervensi fiskal memadukan kemiskinan konsumsi (P0) dan defisit fasilitas dasar (V_struc).
          </p>
        </div>

        {/* Action Toolbars: Planning Cycle Guide + Case Study Pins */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Statutory Translation Guide Button */}
          <button
            onClick={() => setIsPlanningCycleOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-all"
            title="Buka panduan resmi 10 langkah translasi dari data analitik ke dokumen RKPD & APBD"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Alur Translasi 10 Langkah (SIPD-RI)</span>
          </button>

          {/* Case-Study Pins Strip */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveCasePin('none')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activeCasePin === 'none'
                  ? 'bg-white text-ink-primary shadow-2xs'
                  : 'text-slate-600 hover:text-ink-primary'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveCasePin('resource_curse')}
              className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                activeCasePin === 'resource_curse'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-amber-800'
              }`}
              title="Pin 29 daerah tambang jumbo (PDRB ≥ Rp 25T)"
            >
              <Sparkles className="w-3 h-3" />
              <span>Tambang</span>
            </button>
            <button
              onClick={() => setActiveCasePin('madura')}
              className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                activeCasePin === 'madura'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-amber-800'
              }`}
              title="Pin kesenjangan 5.4 km Suramadu"
            >
              <Sparkles className="w-3 h-3" />
              <span>Madura</span>
            </button>
            <button
              onClick={() => setActiveCasePin('barito_kuala')}
              className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                activeCasePin === 'barito_kuala'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-amber-800'
              }`}
              title="Pin studi kasus Kuadran II: Barito Kuala (P0 5.11% vs Sanitasi 55.29%)"
            >
              <Sparkles className="w-3 h-3" />
              <span>Barito Kuala</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: 4 Interactive Quadrant KPI Cards Strip (Click-to-Filter) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Kuadran I: Prioritas Beban Ganda"
          value={`${quadrantStats.q1.count} Daerah`}
          unit={`(${quadrantStats.q1.pct.toFixed(1)}%)`}
          benchmarkText={`Kriteria: P0 ≥ ${medianP0.toFixed(2)}% & V_struc ≥ ${medianVStruc.toFixed(3)}`}
          contextText="Kemiskinan konsumsi tinggi & defisit fisik parah · Prioritas DAK Fisik & Bansos"
          badge={{
            text: selectedQuadrantCode === 'Q1' ? "Aktif Terpilih" : "Prioritas Utama",
            type: selectedQuadrantCode === 'Q1' ? "filter" : "critical",
          }}
          accentColor="#D55E00"
          onClick={() => handleSelectQuadrant(selectedQuadrantCode === 'Q1' ? 'ALL' : 'Q1')}
          isActive={selectedQuadrantCode === 'Q1'}
        />

        <KpiCard
          label="Kuadran II: Kerentanan Tersembunyi"
          value={`${quadrantStats.q2.count} Daerah`}
          unit={`(${quadrantStats.q2.pct.toFixed(1)}%)`}
          benchmarkText={`Kriteria: P0 < ${medianP0.toFixed(2)}% & V_struc ≥ ${medianVStruc.toFixed(3)}`}
          contextText="Moneter tampak aman, sanitasi/air rapuh · Intervensi preventif infrastruktur dasar"
          badge={{
            text: selectedQuadrantCode === 'Q2' ? "Aktif Terpilih" : "Rentan Fisik",
            type: selectedQuadrantCode === 'Q2' ? "filter" : "warning",
          }}
          accentColor="#E69F00"
          onClick={() => handleSelectQuadrant(selectedQuadrantCode === 'Q2' ? 'ALL' : 'Q2')}
          isActive={selectedQuadrantCode === 'Q2'}
        />

        <KpiCard
          label="Kuadran III: Kantong Daya Beli"
          value={`${quadrantStats.q3.count} Daerah`}
          unit={`(${quadrantStats.q3.pct.toFixed(1)}%)`}
          benchmarkText={`Kriteria: P0 ≥ ${medianP0.toFixed(2)}% & V_struc < ${medianVStruc.toFixed(3)}`}
          contextText="Fasilitas dasar baik, daya beli lemah · Stimulus pasar kerja & padat karya"
          badge={{
            text: selectedQuadrantCode === 'Q3' ? "Aktif Terpilih" : "Defisit Moneter",
            type: selectedQuadrantCode === 'Q3' ? "filter" : "default",
          }}
          accentColor="#CC79A7"
          onClick={() => handleSelectQuadrant(selectedQuadrantCode === 'Q3' ? 'ALL' : 'Q3')}
          isActive={selectedQuadrantCode === 'Q3'}
        />

        <KpiCard
          label="Kuadran IV: Wilayah Terbina / Mapan"
          value={`${quadrantStats.q4.count} Daerah`}
          unit={`(${quadrantStats.q4.pct.toFixed(1)}%)`}
          benchmarkText={`Kriteria: P0 < ${medianP0.toFixed(2)}% & V_struc < ${medianVStruc.toFixed(3)}`}
          contextText="Layanan dasar lengkap & konsumsi stabil · Perluasan kemandirian fiskal PAD"
          badge={{
            text: selectedQuadrantCode === 'Q4' ? "Aktif Terpilih" : "Wilayah Mapan",
            type: selectedQuadrantCode === 'Q4' ? "filter" : "positive",
          }}
          accentColor="#0072B2"
          onClick={() => handleSelectQuadrant(selectedQuadrantCode === 'Q4' ? 'ALL' : 'Q4')}
          isActive={selectedQuadrantCode === 'Q4'}
        />
      </div>

      {/* Grid: 2x2 Scatterplot (7-Col) & Policy Recommendation Panel (5-Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <VulnerabilityMatrix2x2
            districts={allDistricts}
            activeCasePin={activeCasePin}
            activeQuadrantCode={selectedQuadrantCode}
            onSelectDistrict={handleSelectDistrict}
          />
        </div>

        {/* Policy Guidance & Quadrant Lookup Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-surface rounded-xl border border-slate-200/80 p-5 shadow-subtle h-full flex flex-col justify-between">
            <div>
              {/* Quadrant Selector Tabs */}
              <div className="flex items-center space-x-1 pb-3 border-b border-slate-100">
                <button
                  onClick={() => handleSelectQuadrant('ALL')}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold text-center transition-all ${
                    selectedQuadrantCode === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua
                </button>
                {QUADRANTS.map(q => (
                  <button
                    key={q.code}
                    onClick={() => handleSelectQuadrant(q.code)}
                    className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold text-center transition-all ${
                      selectedQuadrantCode === q.code
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {q.code} <span className="text-xs opacity-75">({q.count})</span>
                  </button>
                ))}
              </div>

              {/* Contextual Policy Misallocation Warning Alert for Active Quadrant */}
              {activePolicy && (
                <div className={`mt-3.5 p-3 rounded-xl border text-[11.5px] leading-relaxed ${
                  selectedQuadrantCode === 'Q2'
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                    : selectedQuadrantCode === 'Q3'
                    ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                    : selectedQuadrantCode === 'Q1'
                    ? 'bg-blue-50/90 border-blue-300 text-blue-950'
                    : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                }`}>
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                      selectedQuadrantCode === 'Q2' ? 'text-amber-600' :
                      selectedQuadrantCode === 'Q3' ? 'text-rose-600' :
                      selectedQuadrantCode === 'Q1' ? 'text-okabe-blue' : 'text-emerald-600'
                    }`} />
                    <div>
                      <strong className="font-bold block">
                        {selectedQuadrantCode === 'Q2' && "Peringatan Alokasi Anggaran Kuadran II (Cegah Bantuan Sosial Murni):"}
                        {selectedQuadrantCode === 'Q3' && "Peringatan Alokasi Anggaran Kuadran III (Dilarang Proyek Fisik Baru):"}
                        {selectedQuadrantCode === 'Q1' && "Prinsip Alokasi Anggaran Kuadran I (Konvergensi Ganda Mandatori):"}
                        {selectedQuadrantCode === 'Q4' && "Fokus Anggaran Kuadran IV (Stabilitas & Pembina Rantai Pasok):"}
                      </strong>
                      <p className="mt-0.5">
                        {selectedQuadrantCode === 'Q2' && "Dilarang hanya mengandalkan bansos tunai semata! Kemiskinan moneter tampak rendah (P0 < 10.46%) karena ditopang ketahanan pangan kebun sendiri/remitansi, namun daerah menyimpan 'bom waktu' krisis sanitasi (55%). Prioritaskan DAK Fisik Sanitasi & Tangki Biofilter Pasang Surut."}
                        {selectedQuadrantCode === 'Q3' && "Hindari memboroskan APBD membangun fisik jamban/sekolah baru! Sarana fisik telah memadai (V_struc < 0.2720); masalah utama adalah daya beli rendah dan ketiadaan off-taker komoditas. Alihkan anggaran ke subsidi UMi, BUMDes, dan Padat Karya Tunai."}
                        {selectedQuadrantCode === 'Q1' && "Wajib memadukan bantalan sosial tunai jangka pendek (PKH/BLT) dengan belanja modal fisik infrastruktur dasar secara simultan. Bantuan tunai tanpa sarana air/sanitasi tidak memutus kemiskinan antargenerasi."}
                        {selectedQuadrantCode === 'Q4' && "Menjaga stabilitas daya beli dari inflasi pangan, penyerapan tenaga kerja formal, peremajaan permukiman kumuh kantong marginal, serta pembinaan rantai pasok bagi kabupaten sekitar."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quadrant Policy Content with Strict Epistemic Labeling */}
              {activePolicy ? (
                <div className="mt-3.5 space-y-3 text-xs">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Rekomendasi Kebijakan Terpadu ({activePolicy.code})
                    </span>
                    <h3 className="text-sm font-extrabold text-ink-primary mt-0.5 leading-snug">
                      {activePolicy.name}
                    </h3>
                  </div>

                  <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
                    {/* 1. Hipotesis Masalah Struktural (Level 2 - Anti-Kausalitas Palsu) */}
                    <div className="flex items-start space-x-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <strong className="text-slate-800">Hipotesis Masalah Struktural:</strong>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Level 2
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">{activePolicy.working_hypothesis}</p>
                        <span className="text-[10px] text-slate-400 italic block mt-0.5">
                          *Dugaan sementara pemodelan data sains; wajib dibuktikan oleh data lapangan sebelum komitmen anggaran.
                        </span>
                      </div>
                    </div>

                    {/* 2. Syarat Verifikasi Bukti Langsung (Level 3 - Wajib Pemda) */}
                    <div className="flex items-start space-x-2 pt-1 border-t border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-okabe-blue shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <strong className="text-slate-800">Syarat Verifikasi Bukti Langsung:</strong>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-blue-100 text-okabe-blue border border-blue-200">
                            Level 3
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">{activePolicy.direct_evidence_required}</p>
                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                          Prinsip: "No Direct Proof, No Budget Commitment" (EHRA Dinkes, DTSEN Desil 1–2).
                        </span>
                      </div>
                    </div>

                    {/* 3. Jalur Intervensi Utama */}
                    <div className="flex items-start space-x-2 pt-1 border-t border-slate-100">
                      <Target className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">Jalur Intervensi Pokok:</strong>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">{activePolicy.primary_policy_track}</p>
                      </div>
                    </div>

                    {/* 4. Rekomendasi Alokasi APBN/DAK */}
                    <div className="flex items-start space-x-2 pt-1 border-t border-slate-100">
                      <Briefcase className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">Penyelarasan Fiskal Statuter (UU 1/2022 HKPD):</strong>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">{activePolicy.fiscal_instruments}</p>
                      </div>
                    </div>

                    {/* Accordion: Detail Regulasi & OPD Pelaksana */}
                    <details className="mt-2 group border border-slate-200 rounded-lg bg-white overflow-hidden text-xs transition-all">
                      <summary className="px-3 py-2 cursor-pointer font-semibold text-slate-700 hover:text-slate-900 flex justify-between items-center select-none bg-slate-50/60">
                        <span className="flex items-center space-x-1.5">
                          <Building className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Lihat Detail Regulasi &amp; OPD Pelaksana (UU 23/2014)</span>
                        </span>
                        <span className="text-slate-400 text-xs transition-transform group-open:rotate-180">▼</span>
                      </summary>
                      <div className="p-3 border-t border-slate-200 space-y-2 text-slate-600 leading-relaxed bg-white">
                        <div>
                          <strong className="text-slate-800">OPD &amp; K/L Pengampu:</strong>
                          <p className="mt-0.5 text-slate-700">{activePolicy.lead_agencies}</p>
                        </div>
                        <div className="text-xs text-slate-500 pt-1 border-t border-slate-100">
                          Rujukan: Kerangka Kerja Penapisan SDGs Kemendagri &amp; Bappenas 2026.
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Penapisan Portofolio Kebijakan Nasional
                    </span>
                    <h3 className="text-sm font-extrabold text-ink-primary mt-0.5 leading-snug">
                      Matriks Relatif 2x2: Diferensiasi Portofolio Intervensi
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Penapisan memisahkan kemiskinan moneter konsumsi (Sumbu X) dan defisit fasilitas fisik (Sumbu Y). Pilih tab kuadran (Q1–Q4) untuk menelaah intervensi spesifik tiap kelompok.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {QUADRANTS.map(q => (
                      <button
                        key={q.code}
                        onClick={() => handleSelectQuadrant(q.code)}
                        className="text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: q.color }}></span>
                          <span className="font-bold text-slate-800 text-xs">{q.code}</span>
                          <span className="text-xs text-slate-400 font-normal">({q.count})</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-1">{q.label.split(':')[1]?.trim()}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected District Callout with Direct Policy Brief Action */}
            {selectedDistrict && (
              <div className="mt-3.5 p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-okabe-blue"></span>
                    <strong className="text-okabe-blue font-bold text-[13px]">
                      {selectedDistrict.tipe_wilayah} {selectedDistrict.kab_kota}
                    </strong>
                    <span className="text-slate-500">({selectedDistrict.provinsi})</span>
                  </div>
                  <button 
                    onClick={() => setSelectedDistrict(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs px-1 font-bold"
                    title="Tutup pilihan daerah"
                  >
                    ×
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-blue-100">
                  <div>P0: <strong className="text-slate-900">{selectedDistrict.poverty_rate_p0.toFixed(2)}%</strong></div>
                  <div>V_struc: <strong className="text-slate-900">{selectedDistrict.vulnerability_score.toFixed(4)}</strong></div>
                  <div>Sanitasi: <strong className="text-slate-900">{selectedDistrict.sanitation_access_pct.toFixed(1)}%</strong></div>
                  <div>Air Minum: <strong className="text-slate-900">{selectedDistrict.clean_water_access_pct.toFixed(1)}%</strong></div>
                  <div>RLS: <strong className="text-slate-900">{selectedDistrict.avg_school_years.toFixed(1)} thn</strong></div>
                  <div>UHH: <strong className="text-slate-900">{selectedDistrict.life_expectancy.toFixed(1)} thn</strong></div>
                </div>
                <div className="pt-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Advokasi Bappeda &amp; DPRD TA 2026:
                  </span>
                  <button
                    onClick={() => setIsPolicyBriefOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-okabe-blue text-white hover:bg-blue-700 shadow-2xs transition-all w-full sm:w-auto justify-center"
                    title="Buka templat Policy Brief resmi Bappeda untuk daerah ini"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Draf Policy Brief Daerah</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Narrative Callout for Active Pin or General Action */}
      <NarrativeCallout
        title={
          activeCasePin === 'resource_curse' 
            ? "ANOMALI KUTUKAN SUMBER DAYA" 
            : (activeCasePin === 'madura' 
                ? "ANOMALI DISPARITAS MADURA" 
                : (activeCasePin === 'barito_kuala'
                    ? "KERENTANAN TERSEMBUNYI BARITO KUALA"
                    : "PENAPISAN BEBAN GANDA KUADRAN I"))
        }
        insight={
          activeCasePin === 'resource_curse'
            ? PARADOXES.resourceCurse.insightCallout
            : (activeCasePin === 'madura' 
                ? PARADOXES.maduraDisparity.insightCallout 
                : (activeCasePin === 'barito_kuala'
                    ? PARADOXES.baritoKuala.insightCallout
                    : "Matriks 2x2 mendiferensiasikan intervensi: wilayah beban ganda (Kuadran I) wajib memadukan bansos tunai dan belanja modal fisik, sedangkan daerah defisit moneter murni cukup perluasan kerja formal dan subsidi."))
        }
        evidence={
          activeCasePin === 'resource_curse'
            ? PARADOXES.resourceCurse.evidence
            : (activeCasePin === 'madura' 
                ? PARADOXES.maduraDisparity.evidence 
                : (activeCasePin === 'barito_kuala'
                    ? PARADOXES.baritoKuala.evidence
                    : "N_Kuadran_I = 162 daerah, Kuadran II = 95 daerah, Kuadran III = 95 daerah, Kuadran IV = 162 daerah."))
        }
      />

      {/* Filtered Screening Table with Row Selection */}
      <DataTable
        districts={displayedDistricts}
        title={
          selectedQuadrantCode === 'ALL'
            ? "Daftar Skrining Wilayah Penapisan Kebijakan (Semua Daerah)"
            : `Daftar Skrining Wilayah Penapisan Kebijakan (${selectedQuadrantCode} · ${displayedDistricts.length} Daerah)`
        }
        subtitle="Data tersaring yang siap diekspor ke format CSV. Klik salah satu baris daerah untuk meninjau Policy Brief."
        defaultSortField="vulnerability_score"
        defaultSortAsc={false}
        onSelectDistrict={handleSelectDistrict}
        selectedDistrictKey={selectedDistrict ? `${selectedDistrict.provinsi}-${selectedDistrict.kab_kota}` : undefined}
      />

      {/* Policy Brief Modal Dialog */}
      <PolicyBriefModal
        district={selectedDistrict}
        policy={selectedDistrictPolicy}
        isOpen={isPolicyBriefOpen}
        onClose={() => setIsPolicyBriefOpen(false)}
      />

      {/* Statutory 10-Step Planning Cycle Guide Modal */}
      <PlanningCycleModal
        isOpen={isPlanningCycleOpen}
        onClose={() => setIsPlanningCycleOpen(false)}
      />
    </motion.div>
  );
};

export default PriorityImplications;
