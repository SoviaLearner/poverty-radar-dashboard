import { create } from 'zustand';
import { CaseStudyPin } from '../types';

interface FilterStore {
  selectedIsland: string;
  selectedProvince: string;
  selectedCluster: number | 'all';
  selectedQuadrant: string | 'all';
  searchQuery: string;
  p0Range: [number, number];
  activeCasePin: CaseStudyPin;
  activeAct: number; // 0: Landscape, 1: Map/Indicator, 2: Profiles, 3: Priority, 4: Methodology
  isSidebarCollapsed: boolean;

  setSelectedIsland: (island: string) => void;
  setSelectedProvince: (prov: string) => void;
  setSelectedCluster: (cluster: number | 'all') => void;
  setSelectedQuadrant: (quadrant: string | 'all') => void;
  setSearchQuery: (query: string) => void;
  setP0Range: (range: [number, number]) => void;
  setActiveCasePin: (pin: CaseStudyPin) => void;
  setActiveAct: (act: number) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  resetFilters: () => void;
  clearIsland: () => void;
  clearCluster: () => void;
  clearQuadrant: () => void;
  clearSearch: () => void;
  clearCasePin: () => void;
  hasActiveFilters: () => boolean;
}

const DEFAULT_P0_RANGE: [number, number] = [2.0, 42.0];

const getInitialAct = (): number => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const act = params.get('act');
    if (act !== null) {
      const parsed = parseInt(act, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 4) {
        return parsed;
      }
    }
  }
  return 0;
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  selectedIsland: 'Semua Wilayah',
  selectedProvince: 'Semua Provinsi',
  selectedCluster: 'all',
  selectedQuadrant: 'all',
  searchQuery: '',
  p0Range: DEFAULT_P0_RANGE,
  activeCasePin: 'none',
  activeAct: getInitialAct(),
  isSidebarCollapsed: false,

  setSelectedIsland: (island) => set({ selectedIsland: island, selectedProvince: 'Semua Provinsi' }),
  setSelectedProvince: (prov) => set({ selectedProvince: prov }),
  setSelectedCluster: (cluster) => set({ selectedCluster: cluster }),
  setSelectedQuadrant: (quadrant) => set({ selectedQuadrant: quadrant }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setP0Range: (range) => set({ p0Range: range }),
  setActiveCasePin: (pin) => set({ activeCasePin: pin }),
  setActiveAct: (act) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('act', act.toString());
      window.history.replaceState({}, '', url.toString());
    }
    set({ activeAct: act });
  },
  toggleSidebar: () => {
    set((s) => {
      const next = !s.isSidebarCollapsed;
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 310);
      }
      return { isSidebarCollapsed: next };
    });
  },
  setSidebarCollapsed: (collapsed: boolean) => {
    set({ isSidebarCollapsed: collapsed });
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 310);
    }
  },

  resetFilters: () => set({
    selectedIsland: 'Semua Wilayah',
    selectedProvince: 'Semua Provinsi',
    selectedCluster: 'all',
    selectedQuadrant: 'all',
    searchQuery: '',
    p0Range: DEFAULT_P0_RANGE,
    activeCasePin: 'none',
  }),

  clearIsland: () => set({ selectedIsland: 'Semua Wilayah', selectedProvince: 'Semua Provinsi' }),
  clearCluster: () => set({ selectedCluster: 'all' }),
  clearQuadrant: () => set({ selectedQuadrant: 'all' }),
  clearSearch: () => set({ searchQuery: '' }),
  clearCasePin: () => set({ activeCasePin: 'none' }),

  hasActiveFilters: () => {
    const s = get();
    return (
      s.selectedIsland !== 'Semua Wilayah' ||
      s.selectedProvince !== 'Semua Provinsi' ||
      s.selectedCluster !== 'all' ||
      s.selectedQuadrant !== 'all' ||
      s.searchQuery.trim() !== '' ||
      s.activeCasePin !== 'none' ||
      s.p0Range[0] > 2.0 ||
      s.p0Range[1] < 42.0
    );
  }
}));
