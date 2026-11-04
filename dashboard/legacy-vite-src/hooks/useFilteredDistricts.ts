import { useMemo } from 'react';
import { District } from '../types';
import { useFilterStore } from '../store/useFilterStore';

export const useFilteredDistricts = (districts: District[]): District[] => {
  const {
    selectedIsland,
    selectedProvince,
    selectedCluster,
    selectedQuadrant,
    searchQuery,
    p0Range,
  } = useFilterStore();

  return useMemo(() => {
    if (!districts || districts.length === 0) return [];

    return districts.filter((d) => {
      // 1. Island Filter
      if (selectedIsland !== 'Semua Wilayah' && d.region_pulau !== selectedIsland) {
        return false;
      }

      // 2. Province Filter
      if (selectedProvince !== 'Semua Provinsi' && d.provinsi !== selectedProvince) {
        return false;
      }

      // 3. Cluster Filter
      if (selectedCluster !== 'all' && d.cluster_id !== selectedCluster) {
        return false;
      }

      // 4. Quadrant Filter
      if (selectedQuadrant !== 'all' && d.vulnerability_quadrant !== selectedQuadrant) {
        return false;
      }

      // 5. P0 Range
      if (d.poverty_rate_p0 < p0Range[0] || d.poverty_rate_p0 > p0Range[1]) {
        return false;
      }

      // 6. Search Query (Tolerant & case-insensitive)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${d.tipe_wilayah} ${d.kab_kota}`.toLowerCase();
        const provName = d.provinsi.toLowerCase();
        if (!fullName.includes(q) && !provName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [
    districts,
    selectedIsland,
    selectedProvince,
    selectedCluster,
    selectedQuadrant,
    searchQuery,
    p0Range,
  ]);
};
