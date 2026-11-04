import React, { useState, useMemo, useEffect } from 'react';
import { Download, ChevronDown, ChevronUp, ChevronsUpDown, Search, X } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setPage(1);
  }, [districts, searchQuery]);

  const handleSort = (field: keyof District) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for rates/metrics
    }
  };

  // Filter by local search query if provided
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return districts;
    const q = searchQuery.toLowerCase().trim();
    return districts.filter(d => 
      d.kab_kota.toLowerCase().includes(q) || 
      d.provinsi.toLowerCase().includes(q) ||
      d.tipe_wilayah.toLowerCase().includes(q)
    );
  }, [districts, searchQuery]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc 
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

  const renderSortIcon = (field: keyof District) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 text-slate-300 ml-0.5 inline shrink-0" />;
    return sortAsc 
      ? <ChevronUp className="w-3 h-3 text-okabe-blue ml-0.5 inline shrink-0" /> 
      : <ChevronDown className="w-3 h-3 text-okabe-blue ml-0.5 inline shrink-0" />;
  };

  // Format clean compact district name
  const formatDistrictName = (d: District) => {
    const shortPrefix = d.tipe_wilayah.toLowerCase() === 'kabupaten' ? 'Kab.' : 'Kota';
    const cleanName = d.kab_kota.replace(/^(Kabupaten|Kota)\s+/i, '');
    return `${shortPrefix} ${cleanName}`;
  };

  return (
    <div className="bg-surface rounded-xl border border-slate-200/90 shadow-subtle flex flex-col w-full">
      {/* Table Header Controls */}
      <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/50">
        <div>
          <h3 className="text-sm font-bold text-ink-primary tracking-tight">{title}</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            {subtitle} ({sortedData.length} dari {districts.length} daerah)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari daerah / provinsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-7 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1.5 focus:ring-okabe-blue/40 w-44 sm:w-52 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Hapus pencarian"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => exportDistrictsToCSV(sortedData, 'PovertyRadar_Daftar_Skrining')}
            disabled={sortedData.length === 0}
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 transition-colors shadow-2xs shrink-0"
            title="Unduh daftar wilayah hasil filter aktif dalam format CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Table Surface with Compact Columns to Eliminate Horizontal Scroll */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-[11px] table-auto">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-[10.5px] font-bold text-slate-600 uppercase tracking-tight select-none">
              <th className="py-2 px-2 text-center w-8 shrink-0">No</th>
              <th 
                className="py-2 px-2 cursor-pointer hover:bg-slate-200/60 transition-colors" 
                onClick={() => handleSort('kab_kota')}
                title="Klik untuk mengurutkan berdasarkan nama daerah"
              >
                <div className="flex items-center">
                  <span>Daerah</span>
                  {renderSortIcon('kab_kota')}
                </div>
              </th>
              <th 
                className="py-2 px-2 cursor-pointer hover:bg-slate-200/60 transition-colors" 
                onClick={() => handleSort('provinsi')}
                title="Klik untuk mengurutkan berdasarkan provinsi"
              >
                <div className="flex items-center">
                  <span>Provinsi</span>
                  {renderSortIcon('provinsi')}
                </div>
              </th>
              <th 
                className="py-2 px-2 cursor-pointer hover:bg-slate-200/60 transition-colors" 
                onClick={() => handleSort('cluster_id')}
                title="Klaster Tipologi Sosio-Ekonomi K-Means"
              >
                <div className="flex items-center">
                  <span>Klaster</span>
                  {renderSortIcon('cluster_id')}
                </div>
              </th>
              <th 
                className="py-2 px-2 cursor-pointer hover:bg-slate-200/60 transition-colors" 
                onClick={() => handleSort('vulnerability_quadrant')}
                title="Kuadran Matriks 2x2 Portofolio Kebijakan"
              >
                <div className="flex items-center">
                  <span>Kuadran</span>
                  {renderSortIcon('vulnerability_quadrant')}
                </div>
              </th>
              <th 
                className="py-2 px-2 text-right cursor-pointer hover:bg-slate-200/60 transition-colors" 
                onClick={() => handleSort('poverty_rate_p0')}
                title="Tingkat Kemiskinan Pengeluaran P0 (%)"
              >
                <div className="flex items-center justify-end">
                  <span>P0 (%)</span>
                  {renderSortIcon('poverty_rate_p0')}
                </div>
              </th>
              <th 
                className="py-2 px-2 text-right cursor-pointer hover:bg-slate-200/60 transition-colors" 
                onClick={() => handleSort('sanitation_access_pct')}
                title="Akses Sanitasi Layak (%)"
              >
                <div className="flex items-center justify-end">
                  <span>Sanitasi</span>
                  {renderSortIcon('sanitation_access_pct')}
                </div>
              </th>
              <th 
                className="py-2 px-2 text-right cursor-pointer hover:bg-slate-200/60 transition-colors" 
                onClick={() => handleSort('clean_water_access_pct')}
                title="Akses Air Bersih Terlindung (%)"
              >
                <div className="flex items-center justify-end">
                  <span>Air</span>
                  {renderSortIcon('clean_water_access_pct')}
                </div>
              </th>
              <th 
                className="py-2 px-2 text-right cursor-pointer hover:bg-slate-200/60 transition-colors" 
                onClick={() => handleSort('avg_school_years')}
                title="Rata-rata Lama Sekolah (Tahun)"
              >
                <div className="flex items-center justify-end">
                  <span>RLS</span>
                  {renderSortIcon('avg_school_years')}
                </div>
              </th>
              <th 
                className="py-2 px-2 text-right cursor-pointer hover:bg-slate-200/60 transition-colors" 
                onClick={() => handleSort('expenditure_per_capita')}
                title="Pengeluaran Riil per Kapita (Ribu Rp / Tahun)"
              >
                <div className="flex items-center justify-end">
                  <span>Pengeluaran</span>
                  {renderSortIcon('expenditure_per_capita')}
                </div>
              </th>
              <th 
                className="py-2 px-2 text-right cursor-pointer hover:bg-slate-200/60 transition-colors" 
                onClick={() => handleSort('unemployment_rate_tpt')}
                title="Tingkat Pengangguran Terbuka (%)"
              >
                <div className="flex items-center justify-end">
                  <span>TPT</span>
                  {renderSortIcon('unemployment_rate_tpt')}
                </div>
              </th>
              <th 
                className="py-2 px-2 text-right cursor-pointer hover:bg-slate-200/60 transition-colors" 
                onClick={() => handleSort('labor_participation_tpak')}
                title="Tingkat Partisipasi Angkatan Kerja (%)"
              >
                <div className="flex items-center justify-end">
                  <span>TPAK</span>
                  {renderSortIcon('labor_participation_tpak')}
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-8 text-slate-400">
                  Tidak ada daerah yang memenuhi kriteria pencarian / filter.
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
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-1.5 px-2 text-slate-400 font-mono text-[10.5px] text-center w-8">{rankNum}</td>
                    <td className="py-1.5 px-2 font-semibold text-ink-primary whitespace-nowrap text-[11.5px]">
                      {formatDistrictName(d)}
                    </td>
                    <td className="py-1.5 px-2 text-slate-500 whitespace-nowrap text-[10.5px]">{d.provinsi}</td>
                    <td className="py-1.5 px-2 whitespace-nowrap">
                      <ClusterBadge clusterId={d.cluster_id} clusterName={d.cluster_name} />
                    </td>
                    <td className="py-1.5 px-2 whitespace-nowrap">
                      <QuadrantBadge quadrantName={d.vulnerability_quadrant} />
                    </td>
                    <td className="py-1.5 px-2 text-right font-bold text-slate-900 tabular-nums text-[11.5px]">
                      {formatPercent(d.poverty_rate_p0)}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-slate-600">{formatPercent(d.sanitation_access_pct)}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-slate-600">{formatPercent(d.clean_water_access_pct)}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-slate-600">{formatYears(d.avg_school_years)}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-slate-600">{formatCurrencyMillion(d.expenditure_per_capita)}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-slate-600">{formatPercent(d.unemployment_rate_tpt)}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-slate-600">{formatPercent(d.labor_participation_tpak)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-2.5 sm:px-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-ink-muted bg-slate-50/40">
        <div className="flex items-center space-x-2">
          <span>Tampilkan:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border border-slate-200 rounded px-2 py-0.5 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-okabe-blue/40"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-slate-400">| Total {sortedData.length} baris</span>
        </div>

        <div className="flex items-center space-x-1.5 self-end sm:self-auto">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2.5 py-1 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors text-xs font-medium"
          >
            Sebelumnya
          </button>
          <span className="px-2 font-mono text-xs text-slate-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2.5 py-1 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors text-xs font-medium"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
