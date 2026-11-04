import React, { useEffect } from 'react';
import { X, Database } from 'lucide-react';
import { District } from '../../types';
import { DataTable } from '../common/DataTable';

interface DistrictsDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  districts: District[];
}

export const DistrictsDataModal: React.FC<DistrictsDataModalProps> = ({ isOpen, onClose, districts }) => {
  // Listen to Escape key to close modal
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

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="districts-modal-title"
    >
      <div className="bg-surface rounded-2xl border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-okabe-blue border border-blue-200/60 shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 id="districts-modal-title" className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Eksplorasi Data 514 Kabupaten / Kota</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-okabe-blue border border-blue-200">
                  {districts.length} Daerah Terfilter
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dataset Resmi BPS Susenas & Sakernas 2021 (Dapat diurutkan, dicari, dan diekspor ke CSV)
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-okabe-blue/20"
            title="Tutup jendela modal (Esc)"
            aria-label="Tutup jendela modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: DataTable */}
        <div className="p-4 sm:p-5 overflow-y-auto">
          <DataTable 
            districts={districts} 
            title="Tabel Rincian Profil Sosio-Ekonomi Daerah"
            subtitle="Gunakan kotak pencarian dan klik tajuk kolom untuk mengurutkan indikator."
          />
        </div>
      </div>
    </div>
  );
};
