import React, { useEffect, useRef } from 'react';
import { RotateCcw, Search, Sparkles, Filter, PanelLeft, PanelLeftOpen, X, AlertTriangle, Layers, MapPin, SlidersHorizontal } from 'lucide-react';
import { useFilterStore } from '../../store/useFilterStore';
import { ACT_NAV_ITEMS } from './Sidebar';
import { ISLAND_REGIONS, CLUSTERS, QUADRANTS } from '../../constants/benchmarks';

interface TopBarProps {
  totalDistricts: number;
  filteredCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({ totalDistricts, filteredCount }) => {
  const { 
    activeAct, 
    searchQuery, 
    setSearchQuery, 
    selectedIsland,
    setSelectedIsland,
    selectedCluster,
    setSelectedCluster,
    selectedQuadrant,
    setSelectedQuadrant,
    resetFilters, 
    clearIsland,
    clearCluster,
    clearQuadrant,
    clearSearch,
    clearCasePin,
    hasActiveFilters,
    activeCasePin,
    setActiveCasePin,
    isSidebarCollapsed,
    toggleSidebar
  } = useFilterStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentItem = ACT_NAV_ITEMS[activeAct] || ACT_NAV_ITEMS[0];
  const isFiltered = hasActiveFilters();

  // Keyboard shortcuts: '/' to focus search, 'Escape' to reset filters
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        // Guard: Do not reset filters if a modal dialog is currently open
        if (document.querySelector('[role="dialog"]') || e.defaultPrevented) {
          return;
        }
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        } else if (isFiltered) {
          resetFilters();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFiltered, resetFilters]);

  // Selected cluster helper object
  const activeClusterObj = selectedCluster !== 'all' 
    ? CLUSTERS.find(c => c.id === selectedCluster) 
    : null;

  // Selected quadrant helper object
  const activeQuadrantObj = selectedQuadrant !== 'all'
    ? QUADRANTS.find(q => q.id === selectedQuadrant)
    : null;

  // Sample status tone calculation
  const getSampleBadgeStyle = () => {
    if (filteredCount < 30) {
      return {
        container: 'bg-rose-50 text-rose-800 border-rose-200/90 font-bold',
        dot: 'bg-rose-500',
        note: 'Sampel Terbatas (<30)'
      };
    }
    if (filteredCount < totalDistricts) {
      return {
        container: 'bg-amber-50 text-amber-800 border-amber-200/90 font-semibold',
        dot: 'bg-amber-500',
        note: 'Sub-sampel'
      };
    }
    return {
      container: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 font-semibold',
      dot: 'bg-emerald-500',
      note: 'Total Nasional'
    };
  };

  const sampleStyle = getSampleBadgeStyle();

  return (
    <div className="sticky top-0 z-30 flex flex-col shadow-subtle select-none">
      {/* Primary Top Bar Row */}
      <header className="h-[52px] bg-surface/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-5 flex items-center justify-between gap-3">
        {/* Left: Sidebar Toggle + Current Act Title & Scope Count */}
        <div className="flex items-center space-x-2.5 min-w-0 shrink-0">
          <button
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg border transition-all ${
              isSidebarCollapsed 
                ? 'bg-blue-50 border-okabe-blue/40 text-okabe-blue shadow-2xs hover:bg-blue-100' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={isSidebarCollapsed ? "Perluas Sidebar Navigasi" : "Ciutkan Sidebar ke Mode Ikon"}
            aria-label={isSidebarCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </button>

          <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight truncate">
            {currentItem.label}
          </h1>

          {/* Sample Size Indicator Badge */}
          <span 
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs shrink-0 border ${sampleStyle.container}`}
            title={`Cakupan data yang aktif dianalisis: ${filteredCount} dari ${totalDistricts} daerah (${sampleStyle.note})`}
          >
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${sampleStyle.dot}`}></span>
            {filteredCount} / {totalDistricts} Daerah
          </span>
        </div>

        {/* Center: Global Filter Dropdowns */}
        <div className="hidden lg:flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1 text-slate-500 mr-0.5">
            <Filter className="w-3.5 h-3.5 text-slate-600" />
          </div>

          {/* 1. Island Filter */}
          <select
            value={selectedIsland}
            onChange={(e) => setSelectedIsland(e.target.value)}
            aria-label="Filter Wilayah Kepulauan"
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all focus:outline-hidden focus:ring-2 focus:ring-okabe-blue ${
              selectedIsland !== 'Semua Wilayah'
                ? 'bg-blue-50 border border-okabe-blue text-okabe-blue font-bold ring-1 ring-okabe-blue/20'
                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {ISLAND_REGIONS.map((island) => (
              <option key={island} value={island}>
                {island === 'Semua Wilayah' ? 'Semua Pulau' : island}
              </option>
            ))}
          </select>

          {/* 2. Cluster Filter */}
          <select
            value={selectedCluster === 'all' ? 'all' : selectedCluster.toString()}
            onChange={(e) => setSelectedCluster(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            aria-label="Filter Klaster Sosio-Ekonomi"
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all focus:outline-hidden focus:ring-2 focus:ring-okabe-blue ${
              selectedCluster !== 'all'
                ? 'bg-blue-50 border border-okabe-blue text-okabe-blue font-bold ring-1 ring-okabe-blue/20'
                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <option value="all">Semua Klaster</option>
            {CLUSTERS.map((c) => (
              <option key={c.id} value={c.id.toString()}>
                Klaster {c.id + 1} ({c.shortName})
              </option>
            ))}
          </select>

          {/* 3. Quadrant Filter */}
          <select
            value={selectedQuadrant}
            onChange={(e) => setSelectedQuadrant(e.target.value)}
            aria-label="Filter Kuadran Kerentanan"
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all focus:outline-hidden focus:ring-2 focus:ring-okabe-blue ${
              selectedQuadrant !== 'all'
                ? 'bg-blue-50 border border-okabe-blue text-okabe-blue font-bold ring-1 ring-okabe-blue/20'
                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <option value="all">Semua Kuadran</option>
            {QUADRANTS.map((q) => (
              <option key={q.id} value={q.id}>
                {q.code} · {q.label.split(':')[1]?.trim() || q.label}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Quick Search Box & Reset Action */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari daerah ('/')"
              className="w-36 sm:w-44 lg:w-52 pl-8 pr-6 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-ink-primary placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-okabe-blue focus:ring-2 focus:ring-okabe-blue/30 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-ink-primary font-bold p-0.5"
                title="Hapus kata kunci pencarian"
                aria-label="Hapus kata kunci pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Reset Filter Button */}
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs shrink-0 focus-visible:ring-2 focus-visible:ring-rose-500"
              title="Kembalikan semua filter ke kondisi awal (Esc)"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </header>

      {/* Sub-Bar: Interactive Active Filter Chips Strip */}
      {isFiltered && (
        <div className="bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-5 py-1.5 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center space-x-1.5 min-w-0 flex-wrap gap-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 mr-1 flex items-center shrink-0">
              <Filter className="w-3 h-3 mr-1 text-okabe-blue" />
              Filter Aktif:
            </span>

            {/* Island Chip */}
            {selectedIsland !== 'Semua Wilayah' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-okabe-blue border border-blue-200 shrink-0">
                <MapPin className="w-3 h-3 text-okabe-blue" />
                <span>Pulau: {selectedIsland}</span>
                <button
                  onClick={clearIsland}
                  className="hover:bg-blue-100 rounded p-0.5 ml-0.5"
                  title="Hapus filter pulau"
                  aria-label="Hapus filter pulau"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Cluster Chip */}
            {selectedCluster !== 'all' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                <Layers className="w-3 h-3 text-emerald-700" />
                <span>Klaster {Number(selectedCluster) + 1}: {activeClusterObj?.shortName || selectedCluster}</span>
                <button
                  onClick={clearCluster}
                  className="hover:bg-emerald-100 rounded p-0.5 ml-0.5"
                  title="Hapus filter klaster"
                  aria-label="Hapus filter klaster"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Quadrant Chip */}
            {selectedQuadrant !== 'all' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                <SlidersHorizontal className="w-3 h-3 text-amber-700" />
                <span>Kuadran: {activeQuadrantObj?.code || selectedQuadrant}</span>
                <button
                  onClick={clearQuadrant}
                  className="hover:bg-amber-100 rounded p-0.5 ml-0.5"
                  title="Hapus filter kuadran"
                  aria-label="Hapus filter kuadran"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Search Query Chip */}
            {searchQuery.trim() !== '' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-200 text-slate-800 border border-slate-300 shrink-0">
                <Search className="w-3 h-3 text-slate-600" />
                <span>Cari: "{searchQuery}"</span>
                <button
                  onClick={clearSearch}
                  className="hover:bg-slate-300 rounded p-0.5 ml-0.5"
                  title="Hapus pencarian"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Case Study Pin Chip */}
            {activeCasePin !== 'none' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 shrink-0">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>Pin Kasus: {activeCasePin === 'resource_curse' ? 'Kutukan Tambang' : (activeCasePin === 'madura' ? 'Kantong Madura' : 'Barito Kuala')}</span>
                <button
                  onClick={clearCasePin}
                  className="hover:bg-purple-100 rounded p-0.5 ml-0.5"
                  title="Matikan pin studi kasus"
                  aria-label="Matikan pin studi kasus"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {/* Quick Clear All Link */}
          <button
            onClick={resetFilters}
            className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline shrink-0 ml-2"
            title="Hapus semua filter aktif sekaligus"
          >
            Hapus Semua Filter
          </button>
        </div>
      )}
    </div>
  );
};
