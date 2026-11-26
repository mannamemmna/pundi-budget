// calc.js — pemformat dan kalkulasi murni (tanpa DOM). Semua angka dari data.js.
import { UMP2027, PLN, BPJS, BPS, CATEGORIES, MACRO } from './data.js';

const nf = new Intl.NumberFormat('id-ID');

/** Rp169.000 */
export function rp(n) {
  const v = Math.round(n);
  return (v < 0 ? '-Rp' : 'Rp') + nf.format(Math.abs(v));
}
/** Rp1,7 jt / Rp950 rb — untuk label grafik yang sempit. */
export function shortRp(n) {
  if (n >= 1e6) return 'Rp' + (n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
  if (n >= 1e3) return 'Rp' + Math.round(n / 1e3) + ' rb';
  return 'Rp' + Math.round(n);
}
export function pct(n, d = 1) {
  return n.toLocaleString('id-ID', { maximumFractionDigits: d, minimumFractionDigits: 0 }) + '%';
}

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export function monthKey(date) {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
export function monthLabel(key) {
  const [y, m] = key.split('-');
  return BULAN[Number(m) - 1] + ' ' + y.slice(2);
}
export function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
}
export function todayISO() {
  // "hari ini" menurut Pundi = tanggal kompilasi data referensi, agar seed & bulan aktif konsisten.
  return new Date().toISOString().slice(0, 10) > '2026-11-26' ? new Date().toISOString().slice(0, 10) : '2026-11-26';
}
export function last12Keys(anchorISO) {
  const a = new Date(anchorISO + 'T00:00:00');
  const keys = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(a.getFullYear(), a.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

/* ── Pagu benchmark: BPS per kapita × anggota, dibulatkan ke Rp10.000 ── */
export function benchmarkBudget(members, urban) {
  const out = {};
  for (const c of CATEGORIES) {
    const per = BPS.komoditas[c.key][urban ? 0 : 1];
    out[c.key] = Math.round(per * members / 10000) * 10000;
  }
  return out;
}
export function benchmarkTotal(members, urban) {
  return BPS.totalPerKapita[urban ? 'kota' : 'desa'] * members;
}

/* ── (a) Tagihan listrik ── */
export function listrik(tierId, kwh) {
  const tier = PLN.tiers.find(t => t.id === tierId) || PLN.tiers[3];
  const dasar = kwh * tier.rate;
  const ppj = dasar * 0.03; // PPJ 3% — banyak daerah memakai 1–5%; dihitung sebagai estimasi
  const admin = 5000;        // biaya admin & PPJP tetap PLN untuk pasca-bayar rumah tangga
  return { tier, kwh, dasar, ppj, admin, total: dasar + ppj + admin };
}

/* ── (b) Iuran BPJS ── */
export function bpjs(jenis, jumlahOrang, gaji) {
  if (jenis === 'ppu') {
    const dasar = Math.min(gaji, BPJS.ppu.capGaji);
    const total = dasar * BPJS.ppu.pctTotal / 100;
    return { jenis, jumlahOrang, dasar, total,
      pekerja: dasar * BPJS.ppu.pctPekerja / 100,
      pengusaha: dasar * BPJS.ppu.pctPengusaha / 100,
      cap: BPJS.ppu.capGaji };
  }
  if (jenis === 'pbi') return { jenis, jumlahOrang, iuran: 0 };
  const plan = BPJS.pbpu.find(p => p.id === jenis) || BPJS.pbpu[1];
  return { jenis, jumlahOrang, plan, iuran: plan.iuran * jumlahOrang };
}

/* ── (c) Gaji vs UMP 2027 ── */
export function bandingUMP(provinsi, gaji) {
  const row = UMP2027[provinsi];
  if (!row) return null;
  const [ump, naik] = row;
  const selisihPct = (gaji - ump) / ump * 100;
  return { provinsi, ump, naik, gaji, selisihPct, diAtas: gaji >= ump };
}

/* ── (d) Estimasi biaya hidup sebulan ── */
export function estimasiBiayaHidup(members, urban) {
  const idx = urban ? 0 : 1;
  return CATEGORIES.map(c => ({
    cat: c,
    benchmark: Math.round(BPS.komoditas[c.key][idx] * members),
  }));
}

export const ANGGOTA_DEFAULT = MACRO.anggotaDefault;
