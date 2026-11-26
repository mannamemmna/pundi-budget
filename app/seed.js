// seed.js — transaksi contoh Keluarga Ibu Sari (Bekasi, 4 anggota, gaji Rp8 jt).
// Jun–Nov 2026, 57 transaksi; harga riil mengikuti PIHPS BI 20/24 Nov 2026,
// tarif PLN 24–30 Nov 2026, iuran BPJS Perpres 59/2024 (kelas 3: peserta Rp35.000/orang).
// Bukan angka karangan — setiap catatan menyebut sumber/satuannya.

let n = 0;
const id = () => 's' + String(++n).padStart(3, '0');
const t = (date, cat, amount, note, type = 'out') => ({ id: id(), date, cat, type, amount, note });

const MONTHS = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];

// inti keluarga setiap bulan (7 transaksi)
function monthTxns(mk, i) {
  const day = d2 => `${mk}-${String(d2).padStart(2, '0')}`;
  return [
    t(day(25), 'gaji', 8000000, 'Gaji bulanan — kontrak kerja', 'in'),
    t(day(2),  'perumahan_fasilitas', 130000, 'Listrik 1.300 VA non-subsidi, 90 kWh × Rp1.444,70 (tarif PLN Nov 2026)'),
    t(day(5),  'pajak_pungutan_asuransi', 140000, 'BPJS Kesehatan kelas 3 — 4 × Rp35.000 (iuran penuh Rp42.000, subsidi pemerintah Rp7.000)'),
    t(day(3),  'padi_padian', 169000, 'Beras medium I 10 kg × Rp16.900 (PIHPS 20 Nov 2026)'),
    t(day(8),  'daging', 43100 + (i % 3) * 2000, 'Daging ayam ras 1 kg (PIHPS 20 Nov: Rp43.100/kg)'),
    t(day(6),  'sayur', 145000 + i * 4000, 'Sayur + bumbu pasar mingguan (4 × ±Rp36 rb)'),
    t(day(18), 'aneka_barang_jasa', 60000 + (i % 2) * 15000, 'Ojek online & angkot ke kantor/sekolah'),
  ];
}

export function seedTxns() {
  const all = [];
  MONTHS.forEach((mk, i) => all.push(...monthTxns(mk, i)));

  // peristiwa khusus bulan (tahun ajaran baru, THR, hajatan) + pelengkap November
  all.push(
    t('2026-06-14', 'aneka_barang_jasa', 250000, 'SPP SD swasta Juni (2 bulan × Rp125 rb)'),
    t('2026-07-09', 'aneka_barang_jasa', 385000, 'Buku & seragam tahun ajaran baru'),
    t('2026-07-28', 'lain_masuk', 1200000, 'THR Idul Adha 1448 H', 'in'),
    t('2026-08-16', 'barang_tahan_lama', 349000, 'Kipas angin baru — musim kemarau panas'),
    t('2026-08-21', 'ikan_udang_cumi', 96000, 'Ikan kembung 2 kg × Rp48.000'),
    t('2026-09-05', 'pesta_upacara', 150000, 'Sumbangan hajatan tetangga + arisan'),
    t('2026-09-19', 'pakaian_alas_kaki', 210000, 'Sepatu sekolah anak + kaos'),
    t('2026-10-03', 'rokok', 195000, 'Rokok eceran ayah — 3 karton × Rp65.000'),
    t('2026-10-17', 'buah', 88000, 'Pisang, jeruk & semangka seminggu'),
    t('2026-10-30', 'lain_masuk', 350000, 'Hasil jual barang bekas marketplace', 'in'),
    t('2026-11-07', 'bumbu', 73600, 'Gula lokal 2 kg × Rp19.300 + cabai rawit ½ kg × Rp70.000 (PIHPS 20 Nov 2026)'),
    t('2026-11-13', 'telur_susu', 57600, 'Telur ayam ras 2 kg × Rp28.800 (PIHPS 24 Nov 2026)'),
    t('2026-11-16', 'minyak_kelapa', 42000, 'Minyak goreng curah 2 liter × Rp21.000 (PIHPS)'),
    t('2026-11-21', 'bahan_minuman', 52000, 'Kopi, teh & galon air 3×'),
    t('2026-11-25', 'aneka_barang_jasa', 250000, 'SPP SD swasta November'),
  );
  return all.sort((a, b) => a.date < b.date ? 1 : -1);
}
