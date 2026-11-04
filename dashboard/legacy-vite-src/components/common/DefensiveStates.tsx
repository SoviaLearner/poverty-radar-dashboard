import React from 'react';
import { AlertCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import { useFilterStore } from '../../store/useFilterStore';

export const SkeletonCard: React.FC<{ height?: string }> = ({ height = "h-48" }) => (
  <div className={`bg-slate-100/80 rounded-xl animate-pulse ${height} border border-slate-200/50 flex flex-col justify-center items-center text-slate-400 text-xs`}>
    <span>Memuat data analitis...</span>
  </div>
);

export const EmptyResultState: React.FC = () => {
  const { resetFilters } = useFilterStore();

  return (
    <div className="bg-surface rounded-xl border border-slate-200/80 p-8 text-center my-4">
      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-ink-primary">Tidak Ada Daerah yang Memenuhi Kriteria</h3>
      <p className="text-xs text-ink-muted max-w-md mx-auto mt-1 mb-4 leading-relaxed">
        Kombinasi filter yang Anda pilih menghasilkan 0 kabupaten/kota. Silakan sesuaikan interval atau reset filter ke kondisi standar.
      </p>
      <button
        onClick={resetFilters}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-okabe-blue text-white hover:bg-okabe-blue/90 shadow-xs"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset Filters</span>
      </button>
    </div>
  );
};

export const SmallSampleWarning: React.FC<{ count: number }> = ({ count }) => {
  if (count >= 10 || count === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center space-x-2.5 text-xs text-amber-800 my-2">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
      <span>
        <strong>Peringatan Sampel Terbatas:</strong> Hanya {count} daerah tersaring. Analisis agregat statistik pada subset &lt;10 daerah memiliki variabilitas tinggi.
      </span>
    </div>
  );
};
