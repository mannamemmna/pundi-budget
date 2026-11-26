# Pundi — anggaran keluarga

[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/mannamemmna/pundi-budget/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/mannamemmna/pundi-budget/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

**Pundi** adalah perencana anggaran rumah tangga untuk keluarga Indonesia — situs statis vanilla (HTML + CSS + ES modules, tanpa library, tanpa build, tanpa panggilan jaringan saat runtime). Semua angka referensinya nyata dan dibakar ke `app/data.js`: rata-rata pengeluaran BPS Susenas 2024 (kota/desa, 20 komoditas), harga eceran PIHPS Bank Indonesia (20 & 24 Nov 2026), HET Kemendag zonasi, UMP 2027 38 provinsi, tarif PLN periode 24–30 Nov 2026, dan iuran BPJS Kesehatan (Perpres 59/2024) — dikompilasi & di-cross-check 26 November 2026.

## Halaman (hash-router SPA)

| Route | Isi |
|---|---|
| `#/` | Ringkasan bulan berjalan: KPI, alarm kategori jebol (riil, dari transaksi vs pagu), donut SVG pengeluaran vs pagu, bar 12 bulan pemasukan vs pengeluaran, kartu sisa pagu. |
| `#/transaksi` | Form tambah transaksi (validasi nyata), filter bulan/kategori/pencarian, ubah & hapus (dengan konfirmasi), ekspor CSV offline via Blob. |
| `#/pagu` | Pagu per kategori: benchmark BPS per kapita × slider 1–8 anggota + toggle kota/desa, pagu manual + reset ke benchmark, ringkasan vs pemasukan, saran alokasi 50/30/20 dengan status kebutuhan/keinginan. |
| `#/kalkulator` | (a) tagihan listrik per golongan tarif PLN, (b) iuran BPJS PBPU/PPU/PBI, (c) gaji vs UMP 2027 per provinsi (38 provinsi + % kenaikan), (d) estimasi biaya hidup BPS + keranjang harga PIHPS yang bisa dicentang. |
| `#/harga` | Dashboard harga pangan: tabel PIHPS 20→24 Nov vs HET, badge "di atas HET"/"dalam HET", sparkline naik/turun, catatan sumber & tanggal. |
| `#/tentang` | Metodologi, daftar sumber lengkap dengan tanggal akses, disclaimer, penjelasan privasi localStorage. |

Data keluarga (profil, pagu, transaksi) disimpan di `localStorage` browser (`pundi.v1`) — tidak ada server, tidak ada akun, tidak ada analitik. Contoh awal: Keluarga Ibu Sari (Bekasi, 4 anggota, gaji Rp8 jt) dengan ±60 transaksi Jun–Nov 2026 berharga konsisten dengan data referensi.

## Struktur

```
app/
  index.html   style.css   main.js (router+boot)   store.js (localStorage)
  data.js      views.js    charts.js (SVG donut/bar/sparkline tulis-tangan)
  calc.js      seed.js
screenshots/   4 bidangan (3 desktop 1280×800, 1 ponsel 390×844)
main.ts        salin app/ + screenshots/ ke MAKEFUN_OUTPUT_DIR + tulis dossier.json
serve.ts       server statis kecil (Node stdlib) untuk pengembangan
vendor/        makefun-frontend.ts — kit, byte-identik, jangan disentuh
```

## Run

Perlu Node ≥ 22 (menjalankan `.ts` dengan type-stripping bawaan; tidak ada npm install):

```sh
node serve.ts            # app/ di http://localhost:8080
node serve.ts --port 8095
```

Buat dossier pengiriman:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Disclaimer

Angka di situs ini adalah rata-rata resmi & tarif pada tanggal kompilasi (26 Nov 2026) — bukan rekomendasi keuangan dan bukan prediksi. Beberapa provinsi belum merilis % kenaikan UMP 2027 saat kompilasi (ditandai "belum dirilis").
