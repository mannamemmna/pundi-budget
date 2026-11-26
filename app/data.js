// Pundi — baked-in reference figures for Indonesian household budgeting.
// Zero network at runtime: every number below was compiled on 2026-11-26 from
// official/public sources cross-checked across 2+ outlets. Sources noted per block.
// These are reference averages and official tariffs, not financial advice.

// ── Upah Minimum Provinsi (UMP) 2027, Rp/bulan ───────────────────────────────
// Sumber: pengumuman gubernur per provinsi, dirangkum Kompas / Katadata / Suara.com,
// 23–25 Nov 2026. Angka kedua = % kenaikan terhadap UMP 2026 (null = belum dipublikasikan
// di sumber kami saat kompilasi).
export const UMP2027 = {
  "DKI Jakarta": [6136941, 7.10],
  "Papua": [4661424, 5.07],
  "Bali": [4559287, 42.15],
  "Papua Pegunungan": [4508718, null],
  "Papua Selatan": [4508100, null],
  "Sulawesi Utara": [4323465, 8.02],
  "Kep. Bangka Belitung": [4299000, 6.54],
  "Papua Tengah": [4285848, null],
  "Sulawesi Selatan": [4233913, 7.97],
  "Kepulauan Riau": [4229356, 9.02],
  "Sumatera Selatan": [4210059, 6.77],
  "Aceh": [4197000, 6.72],
  "Kalimantan Timur": [4046360, 7.54],
  "Papua Barat Daya": [4042500, 7.34],
  "Riau": [4031142, 6.63],
  "Kalimantan Utara": [4027901, 6.69],
  "Kalimantan Tengah": [3949697, 7.15],
  "Papua Barat": [3841000, null],
  "Gorontalo": [3748000, 10.07],
  "Kalimantan Selatan": [3725000, null],
  "Jambi": [3711516, 6.91],
  "Maluku": [3584844, 7.51],
  "Maluku Utara": [3510240, null],
  "Sulawesi Barat": [3502290, 5.62],
  "Sulawesi Tengah": [3453000, 8.58],
  "Sumatera Utara": [3410000, 5.61],
  "Sumatera Barat": [3383258, 6.29],
  "Banten": [3372829, 8.77],
  "Sulawesi Tenggara": [3306496, null],
  "Bengkulu": [3059085, 7.68],
  "Lampung": [3285152, 7.79],
  "Kalimantan Barat": [3054552, null],
  "Jawa Barat": [3000000, 29.44],
  "Nusa Tenggara Barat": [2921059, 9.24],
  "Jawa Timur": [2730000, 11.57],
  "DI Yogyakarta": [2725000, 12.72],
  "Jawa Tengah": [2655454, 14.10],
  "Nusa Tenggara Timur": [2602441, 5.97],
};

// ── Tarif listrik PT PLN (persetujuan BWP, periode 24–30 Nov 2026) ────────────
// Sumber: Kompas.com Money 2026-11-24; Suara.com 2026-11-25. Rp/kWh, belum termasuk
// PPJ (pajak Penerangan Jalan Umum, berbeda per daerah) dan biaya admin.
export const PLN = {
  valid: "24–30 November 2026",
  tiers: [
    { id: "subsid_450", label: "Rumah tangga subsidi 450 VA", va: "450 VA", rate: 415, subsid: true },
    { id: "subsid_900", label: "Rumah tangga subsidi 900 VA (RTM)", va: "900 VA", rate: 605, subsid: true },
    { id: "nonsub_900", label: "Rumah tangga non-subsidi 900 VA", va: "900 VA", rate: 1352, subsid: false },
    { id: "nonsub_1300", label: "Rumah tangga non-subsidi 1.300–2.200 VA", va: "1.300–2.200 VA", rate: 1444.70, subsid: false },
    { id: "nonsub_3500", label: "Rumah tangga non-subsidi 3.500–5.500 VA", va: "3.500–5.500 VA", rate: 1699.53, subsid: false },
    { id: "nonsub_6600", label: "Rumah tangga non-subsidi ≥ 6.600 VA", va: "≥ 6.600 VA", rate: 1699.53, subsid: false },
  ],
};

// ── Iuran BPJS Kesehatan 2026 (Perpres 59/2024) ───────────────────────────────
// Sumber: online-pajak.com + Kompas Health, per Okt 2026.
// PBPU = peserta bayar sendiri (mandat); PPU = pekerja penerima upah (gaji dipotong);
// PBI = ditanggung pemerintah.
export const BPJS = {
  pbpu: [
    { id: "kelas1", label: "Kelas 1 (rawat inap)", iuran: 150000 },
    { id: "kelas2", label: "Kelas 2 (rawat inap)", iuran: 100000 },
    { id: "kelas3", label: "Kelas 3 (iuran penuh Rp42.000 — peserta bayar Rp35.000, pemerintah subsidi Rp7.000)", iuran: 35000, penuh: 42000, subsidi: 7000 },
  ],
  ppu: { pctTotal: 5.0, pctPekerja: 1.0, pctPengusaha: 4.0, capGaji: 12000000 },
  pbiLabel: "PBI — iuran ditanggung penuh oleh pemerintah (Rp0 dari kantong keluarga)",
};

// ── Rata-rata pengeluaran rumah tangga per kapita / bulan — BPS Susenas 2024 ──
// Sumber: BPS, web-api.bps.go.id (Vol. 16, 2025) + tabel komoditas bps.go.id 2024.
// Nilai per komoditas = [kota, desa, nasional] dalam Rp/kapita/bulan.
export const BPS = {
  tahun: 2024,
  totalPerKapita: { kota: 1737427, desa: 1162944, nasional: 1500556 },
  agregatMakanan: { kota: 809847, desa: 669039, nasional: 751789 },
  agregatNonMakanan: { kota: 927580, desa: 493906, nasional: 748767 },
  // 20 baris komoditas taksonomi Susenas (dipakai sebagai taksonomi kategori Pundi).
  komoditas: {
    padi_padian:              [88417, 103512, 94641],
    umbi:                     [7283, 10338, 8542],
    ikan_udang_cumi:          [60361, 53822, 57665],
    daging:                   [42006, 28622, 36488],
    telur_susu:               [44365, 28386, 37776],
    sayur:                    [60665, 59021, 59988],
    kacang:                   [15864, 13080, 14716],
    buah:                     [44966, 34539, 40667],
    minyak_kelapa:            [17984, 18710, 18283],
    bahan_minuman:            [20469, 21930, 21071],
    bumbu:                    [15710, 14410, 15174],
    konsumsi_lain_makanan:    [14257, 12182, 13402],
    makanan_minuman_jadi:     [285676, 172234, 238902],
    rokok:                    [91826, 98253, 94476],
    perumahan_fasilitas:      [483435, 261076, 391751],
    aneka_barang_jasa:        [232747, 105609, 180325],
    pakaian_alas_kaki:        [40384, 28434, 35457],
    barang_tahan_lama:        [62412, 38481, 52545],
    pajak_pungutan_asuransi:  [75497, 38790, 60362],
    pesta_upacara:            [33105, 21516, 28326],
  },
};

// Taksonomi kategori Pundi = 20 komoditas Susenas + agregat.
// bucket: 'kebutuhan' (needs) atau 'keinginan' (wants) — dipakai utk saran 50/30/20.
export const CATEGORIES = [
  { key: "padi_padian", label: "Beras & padi-padian", group: "makanan", bucket: "kebutuhan" },
  { key: "umbi", label: "Umbi-umbian", group: "makanan", bucket: "kebutuhan" },
  { key: "ikan_udang_cumi", label: "Ikan, udang, cumi", group: "makanan", bucket: "kebutuhan" },
  { key: "daging", label: "Daging segar", group: "makanan", bucket: "kebutuhan" },
  { key: "telur_susu", label: "Telur & susu", group: "makanan", bucket: "kebutuhan" },
  { key: "sayur", label: "Sayuran", group: "makanan", bucket: "kebutuhan" },
  { key: "kacang", label: "Kacang & biji", group: "makanan", bucket: "kebutuhan" },
  { key: "buah", label: "Buah-buahan", group: "makanan", bucket: "kebutuhan" },
  { key: "minyak_kelapa", label: "Minyak goreng & kelapa", group: "makanan", bucket: "kebutuhan" },
  { key: "bahan_minuman", label: "Bahan minuman (kopi, teh, air)", group: "makanan", bucket: "kebutuhan" },
  { key: "bumbu", label: "Bumbu & gula", group: "makanan", bucket: "kebutuhan" },
  { key: "konsumsi_lain_makanan", label: "Jajanan & konsumsi lain", group: "makanan", bucket: "keinginan" },
  { key: "makanan_minuman_jadi", label: "Makanan & minuman jadi", group: "makanan", bucket: "keinginan" },
  { key: "rokok", label: "Rokok & tembakau", group: "non-makanan", bucket: "keinginan" },
  { key: "perumahan_fasilitas", label: "Listrik, air, sewa, rumah", group: "non-makanan", bucket: "kebutuhan" },
  { key: "aneka_barang_jasa", label: "Transport, sekolah, jasa", group: "non-makanan", bucket: "kebutuhan" },
  { key: "pakaian_alas_kaki", label: "Pakaian & alas kaki", group: "non-makanan", bucket: "keinginan" },
  { key: "barang_tahan_lama", label: "Barang tahan lama", group: "non-makanan", bucket: "keinginan" },
  { key: "pajak_pungutan_asuransi", label: "Pajak & asuransi (BPJS, dll.)", group: "non-makanan", bucket: "kebutuhan" },
  { key: "pesta_upacara", label: "Pesta, upacara, sumbangan", group: "non-makanan", bucket: "keinginan" },
];
export const CAT_BY_KEY = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

// Kategori pemasukan (di luar taksonomi pengeluaran Susenas).
export const INCOME_CATEGORIES = [
  { key: "gaji", label: "Gaji / upah" },
  { key: "lain_masuk", label: "Pemasukan lain" },
];

// ── Harga eceran pangan nasional — PIHPS Bank Indonesia ───────────────────────
// Sumber: PIHPS BI via Liputan6 (2026-11-20) + Kontan (2026-11-24). Rata-rata nasional.
// Format entri: [harga 20-Nov, harga 24-Nov (null bila tak dilaporkan), unit, pembanding HET key]
export const PIHPS = [
  { id: "beras_super_1", label: "Beras premium (Super I)", p20: 18750, p24: 18050, unit: "kg", het: "beras_premium", zona: "zona1" },
  { id: "beras_super_2", label: "Beras premium (Super II)", p20: null, p24: 17450, unit: "kg", het: "beras_premium", zona: "zona1" },
  { id: "beras_medium_1", label: "Beras medium (Medium I)", p20: 16900, p24: null, unit: "kg", het: "beras_medium", zona: "zona1" },
  { id: "beras_medium_2", label: "Beras medium (Medium II)", p20: 15700, p24: null, unit: "kg", het: "beras_medium", zona: "zona1" },
  { id: "beras_bawah_1", label: "Beras bawah (I)", p20: 14800, p24: null, unit: "kg", het: "beras_sphp", zona: "zona1" },
  { id: "beras_bawah_2", label: "Beras bawah (II)", p20: 14650, p24: null, unit: "kg", het: "beras_sphp", zona: "zona1" },
  { id: "ayam", label: "Daging ayam ras segar", p20: 43100, p24: 37750, unit: "kg", het: "daging_ayam_ras", zona: "het" },
  { id: "sapi", label: "Daging sapi kualitas I", p20: 147400, p24: null, unit: "kg", het: null },
  { id: "telur", label: "Telur ayam ras", p20: 31350, p24: 28800, unit: "kg", het: "telur_ayam_ras", zona: "het" },
  { id: "gula_premium", label: "Gula premium", p20: 22500, p24: 20600, unit: "kg", het: "gula_konsumsi", zona: "luar_timur_3tp" },
  { id: "gula_lokal", label: "Gula lokal konsumsi", p20: 19300, p24: null, unit: "kg", het: "gula_konsumsi", zona: "luar_timur_3tp" },
  { id: "minyak_curah", label: "Minita / minyak curah", p20: 21000, p24: null, unit: "liter", het: "minyakita", zona: "semua" },
  { id: "minyak_kemas_1", label: "Minyak goreng kemasan (I)", p20: 25350, p24: 24450, unit: "liter", het: null },
  { id: "minyak_kemas_2", label: "Minyak goreng kemasan (II)", p20: 23800, p24: null, unit: "liter", het: null },
  { id: "cabai", label: "Cabai rawit merah", p20: 70000, p24: null, unit: "kg", het: null },
];

// ── Harga Eceran Tertinggi (HET) — Kemendag ───────────────────────────────────
// Sumber: CNBC Indonesia 2026-11-10 (aturan harga acuan Kemendag), berlaku zonasi.
export const HET = {
  asof: "2026-11-10",
  beras_premium: { label: "Beras premium", zona1: 14900, zona2: 15400, zona3: 15800, unit: "kg" },
  beras_medium: { label: "Beras medium", zona1: 13500, zona2: 14000, zona3: 15500, unit: "kg" },
  beras_sphp: { label: "Beras SPHP (stabilisasi)", zona1: 12500, zona2: 13100, zona3: 13500, unit: "kg" },
  minyakita: { label: "MinyaKita", semua: 15700, unit: "kg" },
  gula_konsumsi: { label: "Gula konsumsi", luar_timur_3tp: 17500, timur_3tp: 18500, unit: "kg" },
  telur_ayam_ras: { label: "Telur ayam ras", produsen_hpp: 26500, het: 30000, unit: "kg" },
  daging_ayam_ras: { label: "Daging ayam ras", produsen_hpp: 25000, het: 40000, unit: "kg" },
};

// ── Konteks makro ─────────────────────────────────────────────────────────────
// Inflasi: World Bank indicator FP.CPI.TOTL.ZG (IDN), diakses 2026-11-26 (2025 = 1,913%).
// Ukuran rumah tangga: BPS/SUPAS rata-rata ~4,7 anggota; default perencana Pundi = 4.
export const MACRO = {
  inflasi: { 2023: 2.62, 2024: 1.57, 2025: 1.91 },
  anggotaDefault: 4,
};

// Daftar sumber untuk halaman Tentang.
export const SOURCES = [
  ["BPS — Susenas 2024", "Rata-rata pengeluaran per kapita/bulan per komoditas, kota/desa (web-api.bps.go.id Vol. 16/2025 & bps.go.id). Diakses 2026-11-26."],
  ["PIHPS — Bank Indonesia", "Harga eceran pangan nasional rata-rata, 20 & 24 Nov 2026 (via Liputan6 2026-11-20, Kontan 2026-11-24). Diakses 2026-11-26."],
  ["Kemendag — HET / harga acuan", "Harga Eceran Tertinggi zonasi beras, MinyaKita, gula, telur, ayam (CNBC Indonesia 2026-11-10). Diakses 2026-11-26."],
  ["UMP 2027 — 38 provinsi", "Upah minimum provinsi 2027 + % kenaikan (Kompas / Katadata / Suara.com, 23–25 Nov 2026). Diakses 2026-11-26."],
  ["PT PLN — tarif per kWh", "Tarif listrik periode 24–30 Nov 2026 (Kompas Money 2026-11-24; Suara.com 2026-11-25). Diakses 2026-11-26."],
  ["BPJS Kesehatan", "Iuran PBPU kelas 1/2/3 & PPU 5% (Perpres 59/2024; online-pajak.com + Kompas Health, Okt 2026). Diakses 2026-11-26."],
  ["World Bank", "Inflasi IHK Indonesia 2023–2025, indikator FP.CPI.TOTL.ZG. Diakses 2026-11-26."],
];

// Aggregate satu pintu untuk kemudahan audit (semua blok juga bisa diimpor langsung).
export const REF = { UMP2027, PLN, BPJS, BPS, CATEGORIES, CAT_BY_KEY, INCOME_CATEGORIES, PIHPS, HET, MACRO, SOURCES };
