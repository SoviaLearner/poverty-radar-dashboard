import React, { useEffect } from 'react';
import { X, Calendar, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PlanningCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlanningCycleModal: React.FC<PlanningCycleModalProps> = ({ isOpen, onClose }) => {
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

  if (!isOpen) return null;

  const translationSteps = [
    { num: "01", title: "Ekstraksi Baseline Wilayah", desc: "Mengambil data klaster (1–4) dan kuadran (I–IV) daerah dari PovertyRadar." },
    { num: "02", title: "Identifikasi Kesenjangan Defisit", desc: "Mendekomposisi 7 fitur terhadap median nasional (sanitasi, air, RLS, UHH)." },
    { num: "03", title: "Perumusan Hipotesis Masalah", desc: "Merumuskan dugaan sementara mekanisme kendala (supply, demand, atau spasial)." },
    { num: "04", title: "Verifikasi Bukti Langsung", desc: "Uji lapangan via EHRA Dinkes, DTSEN desil 1–2, dan Sakernas mikro (Syarat Mutlak!)." },
    { num: "05", title: "Harmonisasi Kelembagaan TKPKD", desc: "Membawa kesimpulan akar masalah ke forum resmi TKPKD bersama Bappeda & DPRD." },
    { num: "06", title: "Sasaran SMART Renstra OPD", desc: "Menetapkan target kuantitatif terukur dalam dokumen RKPD dan Renstra OPD teknis." },
    { num: "07", title: "Penapisan Menu Program Kuadran", desc: "Menyeleksi intervensi tepat: cegah salah alokasi anggaran pada kuadran II & III." },
    { num: "08", title: "Penyelarasan Kewenangan UU 23/2014", desc: "Menentukan Lead OPD & Supporting OPD urusan wajib pelayanan dasar tanpa tumpang tindih." },
    { num: "09", title: "Penguncian Fiskal UU 1/2022 HKPD", desc: "Menetapkan kanal statuter: DAK Fisik (KRISNA), DAU Earmark, dan Dana Desa." },
    { num: "10", title: "Penguncian SIPD-RI & Pemantauan", desc: "Penerbitan DPA-SKPD di SIPD-RI dan pemantauan berkala via e-Monev & Inspektorat." },
  ];

  const statutoryPhases = [
    {
      period: "Januari – Maret",
      phase: "Tahap 1: Musrenbang RKPD & TKPKD",
      actions: "Paparan temuan PovertyRadar di forum TKPKD daerah, penyusunan Rencana Aksi Tahunan (RKT), dan penguncian lokus ke Rancangan Awal RKPD.",
      badge: "Musrenbang RKPD"
    },
    {
      period: "April – Mei",
      phase: "Tahap 2: Rakorbitek & DAK KRISNA",
      actions: "Penyelarasan target SPM di Rakorbitek Kemendagri, pengunggahan dokumen Readiness Criteria DAK Fisik ke KRISNA, penetapan Perkada RKPD.",
      badge: "Sistem KRISNA"
    },
    {
      period: "Juni – Agustus",
      phase: "Tahap 3: KUA-PPAS & Pokir DPRD",
      actions: "TAPD memasukkan pagu indikatif ke KUA-PPAS, harmonisasi Pokir DPRD agar selaras lokus SPM kemiskinan, penandatanganan nota kesepakatan KDH-DPRD.",
      badge: "KUA-PPAS APBD"
    },
    {
      period: "September – Desember",
      phase: "Tahap 4: SIPD-RI & Pengesahan APBD",
      actions: "OPD menginput rincian sub-kegiatan ke SIPD-RI, evaluasi RAPBD oleh Kemendagri/Gubernur, penerbitan DPA-SKPD paling lambat 31 Desember.",
      badge: "SIPD-RI Terkunci"
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="planning-cycle-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <Calendar className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-300 font-semibold">
                Sistem Perencanaan &amp; Penganggaran Daerah (SIPD-RI)
              </span>
              <h2 id="planning-cycle-title" className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                Panduan Translasi 10 Langkah: Dari Sains Data ke APBD Riil
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tutup panduan"
            aria-label="Tutup panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* Executive Intro */}
          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-900">
            <p>
              Data sains tidak boleh berhenti sebagai grafik di layar. Agar temuan <strong>PovertyRadar SDGs</strong> menjadi program nyata yang terbiayai di lapangan, analis perencana Bappeda wajib mengikuti <strong>Protokol Translasi 10 Langkah</strong> dan menyelaraskannya dengan <strong>4 Tahapan Statuter RKPD-APBD</strong>.
            </p>
          </div>

          {/* Section 1: 4 Tahapan Statuter APBD */}
          <div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center space-x-1.5 border-b border-slate-100 pb-1.5 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Siklus 4 Tahap Penganggaran Resmi Pemda (RKPD &amp; APBD TA 2026)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {statutoryPhases.map((phase, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[10px] font-bold text-okabe-blue uppercase tracking-wider">
                      {phase.period}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                      {phase.badge}
                    </span>
                  </div>
                  <strong className="text-slate-900 text-xs block">{phase.phase}</strong>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">{phase.actions}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: 10 Langkah Translasi */}
          <div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center space-x-1.5 border-b border-slate-100 pb-1.5 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-okabe-blue"></span>
              <span>10 Langkah Operasional: Dari Klastering ke DPA-SKPD</span>
            </h3>
            <div className="space-y-2">
              {translationSteps.map((s, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all">
                  <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-mono text-[10px] font-bold text-slate-700 shrink-0">
                    {s.num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="text-slate-900 text-xs">{s.title}</strong>
                    <p className="text-[11.5px] text-slate-600 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Epistemic Alert */}
          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 text-[11px] flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Prinsip Integritas Ilmiah ("No Direct Proof, No Budget Commitment"):</strong>
              <p className="mt-0.5">
                PovertyRadar tidak boleh digunakan langsung untuk memvonis alokasi bansos individu. Bappeda wajib melakukan verifikasi bukti langsung lapangan (Langkah 4) sebelum mengunci pagu anggaran di SIPD-RI.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Sumber: Bagian 4 &amp; 10 Dokumen Master Rekomendasi Kebijakan PovertyRadar.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
