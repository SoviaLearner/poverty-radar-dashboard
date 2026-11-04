import React, { useState, useEffect } from 'react';
import { X, Copy, Check, FileText, AlertTriangle, ShieldAlert, Building, Landmark, CheckCircle2 } from 'lucide-react';
import { District, PolicyRecommendation } from '../../types';

interface PolicyBriefModalProps {
  district: District | null;
  policy: PolicyRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PolicyBriefModal: React.FC<PolicyBriefModalProps> = ({
  district,
  policy,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !district) return null;

  const isQ1 = district.vulnerability_quadrant.startsWith('Kuadran I');
  const isQ2 = district.vulnerability_quadrant.startsWith('Kuadran II');
  const isQ3 = district.vulnerability_quadrant.startsWith('Kuadran III');
  const isQ4 = district.vulnerability_quadrant.startsWith('Kuadran IV');

  const getMisallocationAlert = () => {
    if (isQ2) {
      return {
        title: "Peringatan Alokasi Anggaran Kuadran II (Cegah Bantuan Sosial Murni):",
        content: "Dilarang hanya mengandalkan bantuan sosial tunai konsumtif! Angka kemiskinan moneter tampak rendah (P0 < 10.46%) karena ditopang ketahanan pangan kebun sendiri atau remitansi, namun daerah menyimpan 'bom waktu' krisis sanitasi (55%) dan air bersih. Prioritaskan alokasi DAK Fisik Sanitasi & Tangki Biofilter Kedap Air Pasang Surut.",
        tone: "border-amber-300 bg-amber-50 text-amber-900"
      };
    }
    if (isQ3) {
      return {
        title: "Peringatan Alokasi Anggaran Kuadran III (Dilarang Proyek Fisik Baru):",
        content: "Hindari memboroskan APBD untuk membangun proyek fisik jamban atau gedung sekolah baru! Fasilitas sarana dasar fisik telah memadai (V_struc < 0.2720); defisit utama berakar pada daya beli lemah dan ketiadaan off-taker komoditas. Alihkan anggaran ke subsidi pembiayaan ultra mikro (UMi/KUR), hilirisasi BUMDes, dan Padat Karya Tunai.",
        tone: "border-rose-300 bg-rose-50 text-rose-900"
      };
    }
    if (isQ1) {
      return {
        title: "Prinsip Alokasi Anggaran Kuadran I (Konvergensi Ganda Mandatori):",
        content: "Wajib memadukan bantalan sosial tunai penopang konsumsi jangka pendek (PKH/BLT) dengan belanja modal fisik infrastruktur dasar secara simultan. Bantuan tunai tanpa sarana air/sanitasi tidak akan memutus rantai kemiskinan struktural antargenerasi.",
        tone: "border-blue-300 bg-blue-50 text-blue-900"
      };
    }
    return {
      title: "Prinsip Alokasi Anggaran Kuadran IV (Stabilitas & Pembinaan Rantai Pasok):",
      content: "Fokus anggaran diarahkan untuk mitigasi risiko inflasi pangan, penyerapan tenaga kerja formal, peremajaan kantong kumuh residu perkotaan, serta bertindak sebagai pembina rantai pasok bagi kabupaten sekitarnya.",
      tone: "border-emerald-300 bg-emerald-50 text-emerald-900"
    };
  };

  const misallocation = getMisallocationAlert();

  // Generate plain text version for clipboard
  const generateMarkdownText = () => {
    return `# POLICY BRIEF: REKOMENDASI INTERVENSI STRUKTURAL KEMISKINAN & LAYANAN DASAR
KABUPATEN/KOTA: ${district.tipe_wilayah.toUpperCase()} ${district.kab_kota.toUpperCase()}
PROVINSI: ${district.provinsi.toUpperCase()}
TAHUN ANGGARAN: 2026

Kepada Yth: Bupati / Walikota ${district.kab_kota}
Melalui: Sekretaris Daerah & Kepala Bappeda Kabupaten/Kota ${district.kab_kota}
Perihal: Rekomendasi Alokasi Program Penanggulangan Kemiskinan Berbasis Skrining 2x2 PovertyRadar SDGs

---

1. RINGKASAN EKSEKUTIF & POSISI EMPIRIS DAERAH
- Tipologi Klaster Sosio-Ekonomi: ${district.cluster_name} (Klaster ${district.cluster_id + 1})
- Posisi Skrining Kuadran 2x2: ${district.vulnerability_quadrant}
- Indikator Kunci Daerah vs Tolok Ukur Nasional:
  * Tingkat Kemiskinan Moneter (P0): ${district.poverty_rate_p0.toFixed(2)}% (Median Nasional: 10.46%)
  * Akses Sanitasi Layak: ${district.sanitation_access_pct.toFixed(2)}% (Target SPM: 100%)
  * Akses Air Minum Terlindung: ${district.clean_water_access_pct.toFixed(2)}%
  * Rata-rata Lama Sekolah (RLS): ${district.avg_school_years.toFixed(2)} tahun
  * Angka Harapan Hidup (UHH): ${district.life_expectancy.toFixed(2)} tahun
  * Pengeluaran Riil per Kapita: Rp ${(district.expenditure_per_capita / 1000).toFixed(2)} juta/tahun
  * Tingkat Pengangguran Terbuka (TPT): ${district.unemployment_rate_tpt.toFixed(2)}%
  * Tingkat Partisipasi Angkatan Kerja (TPAK): ${district.labor_participation_tpak.toFixed(2)}%

---

2. TANGGA BUKTI KEBIJAKAN & SYARAT UJI LAPANGAN
- A. Hipotesis Masalah Struktural (Level 2):
  ${policy?.working_hypothesis || 'Perlu pendalaman spesifik terhadap konstelasi fasilitas dasar daerah.'}
- B. Syarat Verifikasi Bukti Langsung (Level 3 - Wajib Diuji Sebelum Penetapan Pagu):
  ${policy?.direct_evidence_required || 'Pemeriksaan mikrodata Susenas/Sakernas dan survei lapangan dinas teknis.'}
- C. Peringatan Salah Sasaran Kebijakan:
  ${misallocation.title}
  ${misallocation.content}

---

3. REKOMENDASI PAKET PROGRAM & OPD PENGAMPU (UU NO. 23/2014)
- Jalur Intervensi Utama:
  ${policy?.primary_policy_track || 'Intervensi konvergensi penanggulangan kemiskinan terpadu.'}
- OPD & K/L Pengampu Berwenang:
  ${policy?.lead_agencies || 'Bappeda, Dinas Sosial, Dinas PUPR, Dinas Kesehatan.'}

---

4. STRATEGI PENGUNCIAN KANAL PENDANAAN STATUTER (UU NO. 1/2022 HKPD)
- Opsi Kanal Fiskal Resmi:
  ${policy?.fiscal_instruments || 'DAK Fisik Penugasan, DAU Earmarked PU/Kesehatan, Dana Desa.'}

---

5. INDIKATOR PEMANTAUAN KINERJA (TARGET IKU KDH)
- Output Fisik: Terpasangnya sarana fisik / penyaluran stimulus tepat sasaran sesuai verivali P3KE/DTSEN.
- Outcome Tahunan: Penurunan angka kemiskinan moneter makro P0, pemenuhan 100% target SPM, dan penurunan stunting balita.

Dokumen ini disusun otomatis berdasarkan Kerangka Translasi Kebijakan PovertyRadar SDGs 2026.`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdownText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-brief-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-okabe-blue flex items-center justify-center text-white shrink-0">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono tracking-wider uppercase text-blue-200 font-semibold">
                PovertyRadar SDGs · Format Advokasi Bappeda 2026
              </span>
              <h2 id="policy-brief-title" className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                Policy Brief: {district.tipe_wilayah} {district.kab_kota} ({district.provinsi})
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tutup dialog"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed">
          {/* Target Audience Metadata */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11.5px]">
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Penerima Advokasi:</span>
              <strong className="text-slate-900">Bupati / Walikota {district.kab_kota}</strong> (via Bappeda &amp; Sekda)
            </div>
            <div className="sm:text-right">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Tahun Anggaran Perencanaan:</span>
              <span className="font-semibold text-okabe-blue">RKPD &amp; APBD TA 2026</span>
            </div>
          </div>

          {/* Section 1: Executive Summary & Observed Empirical Metrics */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center space-x-1.5 border-b border-slate-100 pb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-okabe-blue"></span>
              <span>1. Posisi Empiris &amp; Profil Sosio-Ekonomi</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium block">Klaster Sosio-Ekonomi:</span>
                <strong className="text-xs text-slate-900">{district.cluster_name}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium block">Kuadran Skrining 2x2:</span>
                <strong className="text-xs text-slate-900">{district.vulnerability_quadrant.split(':')[0]}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium block">Kemiskinan P0 (Aktual):</span>
                <strong className="text-xs text-slate-900">{district.poverty_rate_p0.toFixed(2)}%</strong>
                <span className="text-[10px] text-slate-400 block">(Median: 10.46%)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium block">Sanitasi Layak (Aktual):</span>
                <strong className="text-xs text-slate-900">{district.sanitation_access_pct.toFixed(2)}%</strong>
                <span className="text-[10px] text-slate-400 block">(Target SPM: 100%)</span>
              </div>
            </div>
          </div>

          {/* Section 2: Policy Misallocation Warning (Caution Callout) */}
          <div className={`p-3.5 rounded-xl border ${misallocation.tone}`}>
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">{misallocation.title}</strong>
                <p className="mt-0.5 leading-relaxed">{misallocation.content}</p>
              </div>
            </div>
          </div>

          {/* Section 3: Evidence Ladder (Hypothesis vs Direct Verification) */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center space-x-1.5 border-b border-slate-100 pb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>2. Tangga Bukti Kebijakan (Four-Tier Evidence Ladder)</span>
            </h3>
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
              <div>
                <div className="flex items-center space-x-1.5 text-amber-700 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Level 2: Hipotesis Masalah Struktural (Dugaan yang Perlu Diuji)</span>
                </div>
                <p className="text-slate-600 mt-1 pl-5 leading-relaxed">
                  {policy?.working_hypothesis || 'Mekanisme dugaan tantangan struktural daerah berdasar klaster.'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/80">
                <div className="flex items-center space-x-1.5 text-blue-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Level 3: Syarat Verifikasi Bukti Langsung Lapangan (Wajib Pemda)</span>
                </div>
                <p className="text-slate-600 mt-1 pl-5 leading-relaxed">
                  {policy?.direct_evidence_required || 'Data mikro Susenas/Sakernas dan survei sektoral Dinkes/Dinas KUKM.'}
                </p>
                <div className="mt-1.5 pl-5 text-[10.5px] text-slate-500 italic">
                  *Prinsip Dokumen Master: "No Direct Proof, No Budget Commitment". Status dugaan di atas dilarang diklaim sebagai akar masalah mutlak sebelum diuji oleh bukti langsung lapangan.
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Recommended Program Package & Lead Agencies */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center space-x-1.5 border-b border-slate-100 pb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>3. Paket Program Prioritas &amp; Pembagian Kewenangan (UU 23/2014)</span>
            </h3>
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-start space-x-2">
                <Building className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Jalur Intervensi Pokok:</strong>
                  <p className="text-slate-600 mt-0.5">{policy?.primary_policy_track}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 pt-1 border-t border-slate-100">
                <Landmark className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">OPD Pelaksana &amp; K/L Pengampu:</strong>
                  <p className="text-slate-600 mt-0.5">{policy?.lead_agencies}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Statutory Fiscal Locking (UU 1/2022 HKPD) */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center space-x-1.5 border-b border-slate-100 pb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
              <span>4. Penguncian Kanal Pendanaan Statuter (UU No. 1/2022 HKPD)</span>
            </h3>
            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/80 text-purple-900">
              <p className="leading-relaxed">
                <strong>Opsi Pembiayaan Resmi:</strong> {policy?.fiscal_instruments}
              </p>
              <p className="text-[10.5px] text-purple-700 mt-1">
                Catatan: Intervensi ini tidak membebani ruang fiskal bebas APBD jika diusulkan tepat waktu melalui DAK Fisik (KRISNA), Earmarked DAU Pekerjaan Umum/Kesehatan, dan afirmasi Dana Desa.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500">
            Format resmi sesuai Bagian 14 Dokumen Master Rekomendasi Kebijakan PovertyRadar.
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-okabe-blue text-white hover:bg-blue-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Draf Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Draf Policy Brief</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
