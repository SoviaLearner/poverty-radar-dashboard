export const NATIONAL_BENCHMARKS = {
  n_regions: 514,
  n_provinces: 34,
  median_p0: 10.46,
  min_p0: 2.38,
  min_p0_region: "Kota Sawahlunto",
  max_p0: 41.66,
  max_p0_region: "Kab. Intan Jaya",
  disparity_ratio: 17.50,
  eastern_acute_count: 53,
  eastern_acute_total: 61,
  eastern_acute_pct: 86.9,
  western_acute_count: 8,
  western_acute_pct: 13.1,
  median_v_struc: 0.2720,
  dualism_kab_p0: 13.51,
  dualism_kota_p0: 7.22,
  dualism_kab_tpt: 4.36,
  dualism_kota_tpt: 7.92,
  rls_compulsory_education: 9.0, // Wajib Belajar 9 Tahun
};

export const ISLAND_REGIONS = [
  "Semua Wilayah",
  "Jawa",
  "Sumatera",
  "Kalimantan",
  "Sulawesi",
  "Bali & Nusa Tenggara",
  "Maluku & Papua"
] as const;

export const CLUSTERS = [
  { id: 0, name: "Klaster 1: Perkotaan Modern & Formal", shortName: "Perkotaan Modern", count: 78, color: "#0072B2" },
  { id: 1, name: "Klaster 2: Kabupaten Penyangga Mapan", shortName: "Penyangga Mapan", count: 187, color: "#E69F00" },
  { id: 2, name: "Klaster 3: Perdesaan Agraris Rentan", shortName: "Agraris Rentan", count: 216, color: "#009E73" },
  { id: 3, name: "Klaster 4: Wilayah 3T Deprivasi Akut", shortName: "3T Deprivasi Akut", count: 33, color: "#D55E00" }
] as const;

export const QUADRANTS = [
  { id: "Kuadran I (Prioritas Utama)", code: "Q1", label: "Kuadran I: Prioritas Beban Ganda", count: 162, color: "#D55E00", bgTint: "rgba(213, 94, 0, 0.08)" },
  { id: "Kuadran II (Kerentanan Tersembunyi)", code: "Q2", label: "Kuadran II: Kerentanan Tersembunyi", count: 95, color: "#E69F00", bgTint: "rgba(230, 159, 0, 0.08)" },
  { id: "Kuadran III (Kantong Kemiskinan Daya Beli)", code: "Q3", label: "Kuadran III: Kantong Daya Beli", count: 95, color: "#CC79A7", bgTint: "rgba(204, 121, 167, 0.08)" },
  { id: "Kuadran IV (Wilayah Terbina/Mapan)", code: "Q4", label: "Kuadran IV: Wilayah Mapan", count: 162, color: "#0072B2", bgTint: "rgba(0, 114, 178, 0.08)" }
] as const;
