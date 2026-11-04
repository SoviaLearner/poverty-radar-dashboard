export const OKABE_ITO = {
  blue: "#0072B2",       // Klaster 1: Perkotaan Modern & Formal
  skyBlue: "#56B4E9",    // Alternative accent
  amber: "#E69F00",      // Klaster 2: Kabupaten Penyangga Mapan
  teal: "#009E73",       // Klaster 3: Perdesaan Agraris Rentan
  vermillion: "#D55E00",  // Klaster 4: Wilayah 3T Deprivasi Akut
  reddishPurple: "#CC79A7", // Kuadran III accent
  neutralGray: "#999999",
  charcoal: "#1E293B",
  slateMuted: "#475569", // WCAG AA text
} as const;

export const CLUSTER_COLORS: Record<number, string> = {
  0: OKABE_ITO.blue,
  1: OKABE_ITO.amber,
  2: OKABE_ITO.teal,
  3: OKABE_ITO.vermillion,
};

export const QUADRANT_COLORS: Record<string, string> = {
  "Kuadran I (Prioritas Utama)": OKABE_ITO.vermillion,
  "Kuadran II (Kerentanan Tersembunyi)": OKABE_ITO.amber,
  "Kuadran III (Kantong Kemiskinan Daya Beli)": OKABE_ITO.reddishPurple,
  "Kuadran IV (Wilayah Terbina/Mapan)": OKABE_ITO.blue,
};
