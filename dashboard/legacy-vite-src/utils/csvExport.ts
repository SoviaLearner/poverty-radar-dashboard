import { District } from '../types';

/**
 * Export filtered districts list to CSV
 * Mandatory label: 'Ekspor daftar skrining'
 */
export const exportDistrictsToCSV = (districts: District[], filenamePrefix: string = 'PovertyRadar_Daftar_Skrining'): void => {
  if (!districts || districts.length === 0) return;

  const headers = [
    'Provinsi',
    'Kabupaten_Kota',
    'Tipe_Wilayah',
    'Region_Pulau',
    'Klaster_ID',
    'Nama_Klaster',
    'Kuadran_Skrining',
    'Skor_Kerentanan_V_struc',
    'Persentase_Kemiskinan_P0',
    'Rata_Rata_Lama_Sekolah_RLS',
    'Pengeluaran_per_Kapita_Ribu_Rp',
    'IPM_BPS',
    'UHH_Tahun',
    'Akses_Sanitasi_Pct',
    'Akses_Air_Bersih_Pct',
    'TPT_Pengangguran_Pct',
    'TPAK_Partisipasi_Kerja_Pct',
    'PDRB_Konstan_Juta_Rp',
    'Anomali_Multivariat'
  ];

  const rows = districts.map(d => [
    `"${d.provinsi}"`,
    `"${d.kab_kota}"`,
    `"${d.tipe_wilayah}"`,
    `"${d.region_pulau}"`,
    d.cluster_id,
    `"${d.cluster_name}"`,
    `"${d.vulnerability_quadrant}"`,
    d.vulnerability_score.toFixed(4),
    d.poverty_rate_p0.toFixed(2),
    d.avg_school_years.toFixed(2),
    d.expenditure_per_capita,
    d.human_dev_index.toFixed(2),
    d.life_expectancy.toFixed(2),
    d.sanitation_access_pct.toFixed(2),
    d.clean_water_access_pct.toFixed(2),
    d.unemployment_rate_tpt.toFixed(2),
    d.labor_participation_tpak.toFixed(2),
    d.grdp_constant_million_idr,
    d.is_multivariate_anomaly ? 'TRUE' : 'FALSE'
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
