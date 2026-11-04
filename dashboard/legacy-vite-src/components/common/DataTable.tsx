import React, { useState, useMemo, useEffect } from 'react';
import { Download, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { District } from '../../types';
import { exportDistrictsToCSV } from '../../utils/csvExport';
import { formatPercent, formatYears, formatCurrencyMillion } from '../../utils/formatters';
import { ClusterBadge, QuadrantBadge } from './Badge';

interface DataTableProps {
  districts: District[];
  title?: string;
  subtitle?: string;
  defaultSortField?: keyof District;
  defaultSortAsc?: boolean;
  onSelectDistrict?: (d: District) => void;
  selectedDistrictKey?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  districts,
  title = "Daftar Skrining Wilayah Terfilter",
  subtitle = "Tabel rincian profil sosial-ekonomi daerah",
  defaultSortField = 'poverty_rate_p0',
  defaultSortAsc = false,
  onSelectDistrict,
  selectedDistrictKey,
}) => {
  const [sortField, setSortField] = useState<keyof District>(defaultSortField);
  const [sortAsc, setSortAsc] = useState<boolean>(defaultSortAsc);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    setPage(1);
  }, [districts]);

  const handleSort = (field: keyof District) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for rates/metrics
    }
  };

  const sortedData = useMemo(() => {
    return [...districts].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc 
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [districts, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

  const renderSortIcon = (field: keyof District) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 text-slate-300 ml-1 inline" />;
    return sortAsc 
      ? <ChevronUp className="w-3 h-3 text-okabe-blue ml-1 inline" /> 
      : <ChevronDown className="w-3 h-3 text-okabe-blue ml-1 inline" />;
  };

  return (
    <div className="bg-surface rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink-primary tracking-tight">{title}</h3>
          <p className="text-xs text-ink-muted mt-0.5">{subtitle} ({districts.length} daerah terpilih)</p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => exportDistrictsToCSV(districts, 'PovertyRadar_Daftar_Skrining')}
            disabled={districts.length === 0}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 transition-colors shadow-2xs"
            title="Unduh daftar wilayah hasil filter aktif dalam format CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor daftar skrining</span>
          </button>
        </div>
      </div>

      {/* Table Surface */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase tracking-wider select-none">
              <th className="py-2.5 px-3">No</th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('kab_kota')}>
                Daerah {renderSortIcon('kab_kota')}
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('provinsi')}>
                Provinsi {renderSortIcon('provinsi')}
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('cluster_id')}>
                Klaster {renderSortIcon('cluster_id')}
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('vulnerability_quadrant')}>
                Kuadran 2x2 {renderSortIcon('vulnerability_quadrant')}
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('poverty_rate_p0')}>
                Kemiskinan P0 (%) {renderSortIcon('poverty_rate_p0')}
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('sanitation_access_pct')}>
                Sanitasi (%) {renderSortIcon('sanitation_access_pct')}
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('clean_water_access_pct')}>
                Air Bersih (%) {renderSortIcon('clean_water_access_pct')}
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('avg_school_years')}>
                RLS (Thn) {renderSortIcon('avg_school_years')}
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('expenditure_per_capita')}>
                Pengeluaran {renderSortIcon('expenditure_per_capita')}
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('unemployment_rate_tpt')}>
                TPT (%) {renderSortIcon('unemployment_rate_tpt')}
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('labor_participation_tpak')}>
                TPAK (%) {renderSortIcon('labor_participation_tpak')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-8 text-slate-400">
                  Tidak ada daerah yang memenuhi filter.
                </td>
              </tr>
            ) : (
              paginatedData.map((d, idx) => {
                const rankNum = (page - 1) * pageSize + idx + 1;
                const rowKey = `${d.provinsi}-${d.kab_kota}`;
                const isSelected = selectedDistrictKey === rowKey;

                return (
                  <tr 
                    key={rowKey} 
                    onClick={() => onSelectDistrict?.(d)}
                    className={`transition-colors ${onSelectDistrict ? 'cursor-pointer' : ''} ${
                      isSelected 
                        ? 'bg-blue-50/90 hover:bg-blue-100/90' 
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-400 font-mono text-xs">{rankNum}</td>
                    <td className="py-2 px-3 font-semibold text-ink-primary whitespace-nowrap">
                      {d.tipe_wilayah} {d.kab_kota}
                    </td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{d.provinsi}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <ClusterBadge clusterId={d.cluster_id} clusterName={d.cluster_name} />
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <QuadrantBadge quadrantName={d.vulnerability_quadrant} />
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">
                      {formatPercent(d.poverty_rate_p0)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">{formatPercent(d.sanitation_access_pct)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{formatPercent(d.clean_water_access_pct)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{formatYears(d.avg_school_years)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{formatCurrencyMillion(d.expenditure_per_capita)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{formatPercent(d.unemployment_rate_tpt)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{formatPercent(d.labor_participation_tpak)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 sm:px-5 border-t border-slate-100 flex items-center justify-between text-xs text-ink-muted bg-slate-50/40">
        <div className="flex items-center space-x-2">
          <span>Tampilkan:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border border-slate-200 rounded px-2 py-0.5 text-xs bg-white text-slate-700"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-slate-400">| Total {sortedData.length} baris</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2.5 py-1 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors text-xs"
          >
            Sebelumnya
          </button>
          <span className="px-2 font-mono text-xs text-slate-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2.5 py-1 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors text-xs"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
};
