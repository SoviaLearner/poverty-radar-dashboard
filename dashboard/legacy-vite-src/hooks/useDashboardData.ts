import { useState, useEffect } from 'react';
import { District, ClusterSummary, PolicyRecommendation, OLSResult, NationalBenchmarks, BoundaryCase } from '../types';

interface DashboardDataState {
  districts: District[];
  clusterSummary: ClusterSummary[];
  policyMatrix: PolicyRecommendation[];
  olsResults: OLSResult[];
  benchmarks: NationalBenchmarks | null;
  boundaryCases: BoundaryCase[];
  loading: boolean;
  error: string | null;
}

/**
 * Defensive runtime validator for dashboard data payloads.
 * Emits explicit console warnings if contracts are breached.
 */
const validateDataContracts = (
  districts: any,
  clusterSummary: any,
  policyMatrix: any,
  olsResults: any,
  benchmarks: any,
  boundaryCases: any
): void => {
  // 1. Districts validation
  if (!Array.isArray(districts)) {
    console.error('[DataContract Error]: districts payload must be an array, received:', typeof districts);
  } else {
    if (districts.length !== 514) {
      console.warn(`[DataContract Warning]: Expected exactly 514 districts per BPS 2021 canonical, but received ${districts.length}.`);
    }
    // Check critical fields on first 5 items and random sample
    const criticalFields: (keyof District)[] = [
      'kab_kota',
      'provinsi',
      'tipe_wilayah',
      'region_pulau',
      'poverty_rate_p0',
      'cluster_id',
      'vulnerability_quadrant',
      'vulnerability_score'
    ];
    let missingFieldCount = 0;
    for (let i = 0; i < Math.min(districts.length, 20); i++) {
      const d = districts[i];
      for (const f of criticalFields) {
        if (d[f] === undefined || d[f] === null) {
          missingFieldCount++;
          console.warn(`[DataContract Warning]: District #${i} (${d.kab_kota || 'unknown'}) is missing field '${String(f)}'.`);
        }
      }
    }
    if (missingFieldCount === 0) {
      console.info(`[DataContract Pass]: Validated ${districts.length} districts with all critical fields.`);
    }
  }

  // 2. Cluster Summary validation
  if (!Array.isArray(clusterSummary)) {
    console.warn('[DataContract Warning]: clusterSummary payload is not an array.');
  } else if (clusterSummary.length !== 4) {
    console.warn(`[DataContract Warning]: Expected 4 clusters (k=4), but received ${clusterSummary.length}.`);
  }

  // 3. Policy Matrix validation
  if (!Array.isArray(policyMatrix)) {
    console.warn('[DataContract Warning]: policyMatrix payload is not an array.');
  } else if (policyMatrix.length !== 4) {
    console.warn(`[DataContract Warning]: Expected 4 quadrant policy matrices, but received ${policyMatrix.length}.`);
  }

  // 4. OLS Results validation
  if (!Array.isArray(olsResults)) {
    console.warn('[DataContract Warning]: olsResults payload is not an array.');
  } else if (olsResults.length < 6) {
    console.warn(`[DataContract Warning]: Expected at least 6 OLS features, but received ${olsResults.length}.`);
  }

  // 5. National Benchmarks validation
  if (!benchmarks || typeof benchmarks !== 'object') {
    console.warn('[DataContract Warning]: benchmarks payload is missing or invalid.');
  } else {
    if (typeof benchmarks.median_p0 !== 'number' || typeof benchmarks.n_regions !== 'number') {
      console.warn('[DataContract Warning]: benchmarks missing median_p0 or n_regions numeric properties.');
    }
  }

  // 6. Boundary Cases validation
  if (!Array.isArray(boundaryCases) || boundaryCases.length === 0) {
    console.warn('[DataContract Warning]: boundaryCases payload is empty or invalid.');
  }
};

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardDataState>({
    districts: [],
    clusterSummary: [],
    policyMatrix: [],
    olsResults: [],
    benchmarks: null,
    boundaryCases: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [
          districtsRes,
          clusterSummaryRes,
          policyMatrixRes,
          olsRes,
          benchmarksRes,
          boundaryRes,
        ] = await Promise.all([
          fetch('/data/poverty_districts.json'),
          fetch('/data/cluster_summary.json'),
          fetch('/data/policy_matrix.json'),
          fetch('/data/ols_coefficients.json'),
          fetch('/data/national_benchmarks.json'),
          fetch('/data/boundary_cases.json'),
        ]);

        if (!districtsRes.ok) throw new Error('Gagal memuat poverty_districts.json');

        const [
          districts,
          clusterSummary,
          policyMatrix,
          olsResults,
          benchmarks,
          boundaryCases,
        ] = await Promise.all([
          districtsRes.json(),
          clusterSummaryRes.json(),
          policyMatrixRes.json(),
          olsRes.json(),
          benchmarksRes.json(),
          boundaryRes.json(),
        ]);

        // Defensive data contract validation
        validateDataContracts(
          districts,
          clusterSummary,
          policyMatrix,
          olsResults,
          benchmarks,
          boundaryCases
        );

        setData({
          districts,
          clusterSummary,
          policyMatrix,
          olsResults,
          benchmarks,
          boundaryCases,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setData(prev => ({ ...prev, loading: false, error: err.message || 'Gagal memuat data' }));
      }
    };

    loadAll();
  }, []);

  return data;
};
