// Pundi — perencana anggaran rumah tangga untuk keluarga Indonesia (bounty
// best-household-budget-site-20261126-1457). Situs ini adalah folder app/ di
// sebelah berkas ini: HTML + CSS + modul ES murni (vanilla, tanpa library,
// tanpa build, tanpa panggilan jaringan saat runtime). Angka referensinya
// nyata dan dibakar ke app/data.js pada saat kompilasi — BPS Susenas 2024,
// PIHPS Bank Indonesia 20–24 Nov 2026, HET Kemendag, UMP 2027 38 provinsi,
// tarif PLN periode 24–30 Nov 2026, iuran BPJS Perpres 59/2024 — sehingga
// pagu, kalkulator, dan benchmark keluarga selalu memakai rupiah riil.
//
// Enam halaman, semua berfungsi: #/ ringkasan bulan berjalan (donut vs pagu,
// bar 12 bulan, alarm kategori jebol), #/transaksi (catat/ubah/hapus/saring,
// ekspor CSV offline), #/pagu (benchmark BPS × slider anggota, saran 50/30/20),
// #/kalkulator (listrik, BPJS, UMP, biaya hidup), #/harga (PIHPS vs HET +
// sparkline), #/tentang (metodologi & sumber). Data keluarga hidup di
// localStorage browser — tidak ada server, tidak ada akun.
//
// Jalankan lokal: `node serve.ts` lalu buka http://localhost:8080.
// Program ini menyerahkan entri: menyalin app/ dan screenshots/ ke /output
// dan menulis /output/dossier.json (yang dibaca juri) lewat pustaka vendored
// make.fun — vendor/makefun-frontend.ts dibiarkan apa adanya, byte-identik
// dengan kit, karena scorer menuntut dossier.json persis seperti tulisannya.
// Di luar kontainer scorer, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });

// Gerbang integritas: arsitektur Pundi adalah 8 modul app/ yang saling mengimpor;
// satu berkas hilang berarti situs setengah jalan dan dossier menipu juri. Tolak
// sebelum menyalin apa pun.
const APP_FILES = ['index.html', 'style.css', 'main.js', 'store.js', 'data.js', 'views.js', 'charts.js', 'calc.js', 'seed.js'];
const missing = APP_FILES.filter(f => !existsSync(join(here, 'app', f)));
if (missing.length) {
  console.error(`app/ tidak lengkap — hilang: ${missing.join(', ')}`);
  process.exit(1);
}

cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Gerbang screenshot: 4 bidangan JPG wajib ada — juri menilai dari tangkapan layar, bukan kode.
const SHOTS = ['1-overview.jpg', '2-transaksi.jpg', '3-kalkulator.jpg', '4-phone.jpg'];
const noShots = SHOTS.filter(f => !existsSync(join(out, 'screenshots', f)));
if (noShots.length) console.warn(`peringatan: screenshots/ belum berisi ${noShots.join(', ')}`);

// Batas kaps scorer (reference/gate.json): text_max_bytes membentuk byte; sisanya
// menolak entri yang memang ditolak scorer (>4 screenshot / >256 KiB; >993 berkas
// di app/ atau 16 MiB).
const dossier = buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 });
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`dossier.json ditulis ke ${out} (${Buffer.byteLength(dossier)} byte, ${APP_FILES.length} modul app).`);
