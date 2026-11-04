export interface ParadoxItem {
  id: string;
  name: string;
  actionTitle: string;
  page: string;
  insightCallout: string;
  evidence: string;
  caseDistricts?: string[];
  disclaimer?: string;
}

export const EPISTEMIC_DISCLAIMER = "[Asosiasi Statistik]: Menunjukkan kovariansi empiris linier multivariat, bukan hubungan sebab-akibat deterministik.";

export const PARADOXES: Record<string, ParadoxItem> = {
  workingPoor: {
    id: "paradox-1",
    name: "The Working Poor",
    page: "02_IndicatorMap",
    actionTitle: "The Working Poor: Tekanan Kerja Subsistensi Berasosiasi Positif dengan Angka Kemiskinan di Daerah Tertinggal",
    insightCallout: "[Asosiasi Statistik]: Menunjukkan kovariansi empiris linier multivariat, bukan hubungan sebab-akibat deterministik. Angka pengangguran rendah di wilayah 3T mencerminkan tekanan kerja subsistensi bertahan hidup (r = +0.462), bukan tingginya kemakmuran, sementara pengangguran kota didominasi pencari kerja terdidik.",
    evidence: "TPT Nduga 0.00% (TPAK 97.93%, P0 37.18%) vs Kota Depok TPT 9.76% (P0 2.58%). Mengindikasikan asosiasi statistik, bukan kausalitas.",
    disclaimer: EPISTEMIC_DISCLAIMER,
    caseDistricts: ["Nduga", "Lanny Jaya", "Puncak", "Kota Depok"]
  },
  greatDualism: {
    id: "paradox-2",
    name: "The Great Dualism",
    page: "02_IndicatorMap",
    actionTitle: "The Great Dualism: Kabupaten ~1.9x Lebih Miskin, Namun Kota ~1.8x Lebih Menganggur",
    insightCallout: "[Asosiasi Statistik]: Menunjukkan kovariansi empiris linier multivariat, bukan hubungan sebab-akibat deterministik. Kabupaten menanggung kemiskinan 1.9x lebih tinggi dari kota, namun kota menanggung pengangguran 1.8x lebih tinggi, menuntut diferensiasi fokus: kerja formal perkotaan vs sarana dasar perdesaan.",
    evidence: "Rasio kemiskinan Kabupaten:Kota = 1.87x; Rasio pengangguran Kota:Kabupaten = 1.82x.",
    disclaimer: EPISTEMIC_DISCLAIMER
  },
  resourceCurse: {
    id: "paradox-3",
    name: "The Resource Curse",
    page: "04_PriorityImplications",
    actionTitle: "Kutukan Sumber Daya: 29 Daerah Lumbung Tambang Jumbo Berasosiasi dengan Kemiskinan di Atas Median",
    insightCallout: "[Asosiasi Statistik]: Menunjukkan kovariansi empiris linier multivariat, bukan hubungan sebab-akibat deterministik. Sebanyak 29 daerah lumbung tambang (PDRB ≥ Rp 25 Triliun) tercatat memiliki kemiskinan di atas median nasional yang beriringan dengan keterbatasan penyerapan tenaga kerja lokal pada sektor ekstraktif.",
    evidence: "Kab. Mimika (PDRB Rp69.6T, P0 14.17%), Bojonegoro (Rp65.8T, P0 13.27%), Morowali (Rp54.9T, P0 13.75%), Musi Banyuasin (Rp46.1T, P0 15.84%), Teluk Bintuni (Rp25.1T, P0 29.79%).",
    disclaimer: EPISTEMIC_DISCLAIMER,
    caseDistricts: ["Mimika", "Bojonegoro", "Morowali", "Musi Banyuasin", "Teluk Bintuni"]
  },
  basicServices: {
    id: "paradox-4",
    name: "Sanitasi & Air Dasar vs PDRB",
    page: "03_RegionalProfiles",
    actionTitle: "Faktor Layanan Dasar: Akses Sanitasi & Air Beriringan Kuat dengan Variasi Kemiskinan",
    insightCallout: "[Asosiasi Statistik]: Menunjukkan kovariansi empiris linier multivariat, bukan hubungan sebab-akibat deterministik. Akses sanitasi layak (r = -0.562) dan air bersih (r = -0.374) memiliki asosiasi linier negatif yang lebih konsisten terhadap variasi kemiskinan dibanding skala PDRB nominal (r = -0.240).",
    evidence: "Korelasi Pearson: Sanitasi r = -0.562, Air r = -0.374, Log PDRB r = -0.527. Menunjukkan kovariansi empiris linier, bukan hubungan sebab-akibat.",
    disclaimer: EPISTEMIC_DISCLAIMER
  },
  maduraDisparity: {
    id: "paradox-5",
    name: "Disparitas Madura",
    page: "04_PriorityImplications",
    actionTitle: "Disparitas Madura: Jembatan Fisik Suramadu (5.4 km) Belum Mengikis Jurang Kemiskinan Regional",
    insightCallout: "[Asosiasi Statistik]: Menunjukkan kovariansi empiris linier multivariat, bukan hubungan sebab-akibat deterministik. Hanya berjarak 5.4 km Suramadu, Kota Surabaya mapan sementara Kabupaten Sampang tercatat dengan kemiskinan 23.8%, merefleksikan bahwa ketersediaan infrastruktur fisik semata tetap beriringan dengan disparitas modal manusia dan sanitasi.",
    evidence: "Surabaya (P0 5.23%, RLS 10.51) vs Sampang (P0 23.76%, RLS 4.86), Bangkalan (P0 21.57%), Pamekasan (P0 15.30%), Sumenep (P0 20.51%).",
    disclaimer: EPISTEMIC_DISCLAIMER,
    caseDistricts: ["Sampang", "Bangkalan", "Pamekasan", "Sumenep", "Kota Surabaya"]
  },
  westernAnomaly: {
    id: "paradox-6",
    name: "3T di Kawasan Barat",
    page: "01_PovertyLandscape",
    actionTitle: "Anomali Barat: Kepulauan Terisolir Menyerupai Profil Deprivasi Akut Kawasan Timur",
    insightCallout: "[Asosiasi Statistik]: Menunjukkan kovariansi empiris linier multivariat, bukan hubungan sebab-akibat deterministik. 86.9% kantong kemiskinan akut terkonsentrasi di Kawasan Timur, namun profil deprivasi serupa juga muncul di kantong kepulauan terisolir barat seperti Nias dan Mentawai.",
    evidence: "Nias Barat (P0 26.42%), Nias Selatan (P0 16.92%), Kepulauan Mentawai (P0 14.84%).",
    disclaimer: EPISTEMIC_DISCLAIMER,
    caseDistricts: ["Nias", "Nias Selatan", "Nias Barat", "Nias Utara", "Kepulauan Mentawai"]
  },
  educatedPoor: {
    id: "paradox-7",
    name: "The Educated Poor",
    page: "03_RegionalProfiles",
    actionTitle: "The Educated Poor: RLS Relatif Tinggi di Kepulauan Terpencil Namun Kemiskinan Tetap Kritis",
    insightCallout: "[Asosiasi Statistik]: Menunjukkan kovariansi empiris linier multivariat, bukan hubungan sebab-akibat deterministik. Kabupaten kepulauan terpencil Papua mencatatkan RLS setara SMP/SMA (8.2–9.2 tahun) namun kemiskinan tetap di atas 29%, mengindikasikan bahwa capaian pendidikan tanpa penyerapan industri produktif lokal belum berasosiasi dengan penurunan kemiskinan.",
    evidence: "Kab. Supiori (RLS 8.87 thn, P0 37.91%), Kab. Waropen (RLS 9.21 thn, P0 29.85%), Kab. Teluk Bintuni (RLS 8.22 thn, P0 29.79%).",
    disclaimer: EPISTEMIC_DISCLAIMER,
    caseDistricts: ["Supiori", "Waropen", "Teluk Bintuni"]
  },
  kaggleDeconstruction: {
    id: "paradox-8",
    name: "Dekonstruksi Label Kaggle",
    page: "05_MethodologyAudit",
    actionTitle: "Dekonstruksi Label Kaggle: Pembuktian Ilmiah 98.8% Akurasi Rekonstruksi Aturan Biner",
    insightCallout: "[Fakta Terverifikasi]: Label biner bawaan Kaggle dibongkar sebagai aturan deterministik sederhana dengan kecocokan 98.83% (508 daerah), membuktikan label tersebut bukan ground truth BPS dan wajib ditolak demi mencegah target leakage.",
    evidence: "508 dari 514 daerah cocok sempurna (98.83% akurasi rekonstruksi)."
  },
  olsStandardizedBeta: {
    id: "paradox-9",
    name: "Koefisien Terstandarisasi OLS",
    page: "05_MethodologyAudit",
    actionTitle: "Ekonometrika OLS: Pengeluaran Riil (β = -0.318) & Sanitasi (β = -0.190) Memiliki Asosiasi Relatif Terkuat",
    insightCallout: "[Asosiasi Statistik]: Menunjukkan kovariansi empiris linier multivariat, bukan hubungan sebab-akibat deterministik. Hasil multivariat OLS menunjukkan daya beli warga (β = -0.318) dan sanitasi fisik (β = -0.190) memiliki asosiasi relatif negatif terkuat terhadap variasi tingkat kemiskinan (P0), sementara TPAK berasosiasi relatif positif signifikan (β = +0.179).",
    evidence: "Koefisien baku terstandarisasi: Pengeluaran (-0.318) > Sanitasi (-0.190) = Log PDRB (-0.190) > TPAK (+0.179) > RLS (-0.113) > TPT (+0.100).",
    disclaimer: EPISTEMIC_DISCLAIMER
  },
  baritoKuala: {
    id: "paradox-10",
    name: "Kerentanan Tersembunyi Barito Kuala",
    page: "04_PriorityImplications",
    actionTitle: "Kerentanan Tersembunyi: Kemiskinan Moneter Rendah (5.11%) Menyimpan Krisis Sanitasi Akut (55.29%)",
    insightCallout: "[Asosiasi Statistik]: Menunjukkan kovariansi empiris linier multivariat, bukan hubungan sebab-akibat deterministik. Barito Kuala berada di Kuadran II dengan P0 rendah (5.11%) berkat ketahanan pangan pasang surut, namun 44.7% warga belum bersanitasi layak. Solusi tepat adalah DAK Fisik Sanitasi & Tangki Biofilter Kedap Air Pasang Surut (Rp30.5 M), bukan bansos tunai semata.",
    evidence: "Barito Kuala (P0 5.11%, Sanitasi 55.29%, Air 65.15%, UHH 66.86 thn, V_struc 0.4475). Intervensi terverifikasi: 4.500 unit tangki biofilter lahan basah.",
    disclaimer: EPISTEMIC_DISCLAIMER,
    caseDistricts: ["Barito Kuala", "Tanah Datar", "Mandailing Natal", "Lebak"]
  }
};
