// store.js — keadaan Pundi, dipersist ke localStorage (kunci 'pundi.v1').
// Data tidak pernah meninggalkan browser: tidak ada fetch/XHR sama sekali di app ini.
import { seedTxns } from './seed.js';
import { todayISO } from './calc.js';

const KEY = '***';

function defaultState() {
  return {
    version: 1,
    profile: {
      nama: 'Keluarga Ibu Sari',
      kota: 'Bekasi',
      provinsi: 'Jawa Barat',
      anggota: 4,
      urban: true,           // benchmark BPS: kota (true) / desa (false)
      income: 8000000,       // gaji Rp8 juta/bulan
      bpjsClass: 'kelas2',
    },
    // pagu manual per kategori; entri hilang = ikut benchmark BPS (dihitung live)
    budgets: {},
    txns: seedTxns(),
    seededOn: todayISO(),
  };
}

export const STORE = {
  state: null,
  listeners: [],
  load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch { /* storage diblokir → jalan dengan state memori */ }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.txns) && parsed.profile) { this.state = parsed; return; }
      } catch { /* rusak → seed ulang */ }
    }
    this.state = defaultState();
    this.save();
  },
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch { /* penuh: sesi tetap jalan di memori */ }
  },
  mutate(fn) {
    fn(this.state);
    this.save();
    this.listeners.forEach(l => l());
  },
  onChange(fn) { this.listeners.push(fn); },
  reset() { this.state = defaultState(); this.save(); this.listeners.forEach(l => l()); },
};
