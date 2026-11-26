// views.js — enam halaman Pundi. Semua kontrol benar-benar bekerja: form, filter,
// slider, toggle, dropdown, hapus/edit, CSV (Blob offline), kalkulator. Tanpa library.
import { STORE } from './store.js';
import { CATEGORIES, CAT_BY_KEY, INCOME_CATEGORIES, UMP2027, PLN, BPJS, BPS, PIHPS, HET, SOURCES } from './data.js';
import { rp, shortRp, pct, monthKey, monthLabel, fmtDate, todayISO, last12Keys,
         benchmarkBudget, listrik, bpjs, bandingUMP, estimasiBiayaHidup } from './calc.js';
import { donut, monthBars, spark2, PALETTE } from './charts.js';

/* ── util DOM ───────────────────────────────────────────────────────────── */
function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'on') for (const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn);
    else if (k.startsWith('data-') || k === 'for' || k === 'href' || k === 'colspan') e.setAttribute(k, v);
    else if (v != null) e.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    e.appendChild(typeof kid === 'string' || typeof kid === 'number' ? document.createTextNode(String(kid)) : kid);
  }
  return e;
}
const card = (title, sub, ...kids) => h('section', { class: 'card' }, h('h2', {}, title), sub && h('p', { class: 'sub' }, sub), ...kids);
const kpi = (lab, val, note, cls) => h('div', { class: 'kpi ' + (cls || '') }, h('div', { class: 'lab' }, lab), h('div', { class: 'val num' }, val), note && h('div', { class: 'note' }, note));

function pageHead(root, title, desc) {
  root.appendChild(h('div', { class: 'page-head' }, h('h1', {}, title), h('p', {}, desc)));
}

/* ── agregasi ───────────────────────────────────────────────────────────── */
const ACTIVE_MONTH = monthKey(todayISO());
function sumsByMonth() {
  const m = {};
  for (const t of STORE.state.txns) {
    const k = monthKey(t.date);
    (m[k] ||= { income: 0, spent: 0 });
    if (t.type === 'in') m[k].income += t.amount; else m[k].spent += t.amount;
  }
  return m;
}
function spentByCat(monthK) {
  const m = {};
  for (const t of STORE.state.txns) if (t.type !== 'in' && monthKey(t.date) === monthK)
    m[t.cat] = (m[t.cat] || 0) + t.amount;
  return m;
}
function effBudgets() {
  const p = STORE.state.profile;
  const bench = benchmarkBudget(p.anggota, p.urban);
  const out = {};
  for (const c of CATEGORIES) out[c.key] = STORE.state.budgets[c.key] ?? bench[c.key];
  return out;
}

/* ═══ 1. BERANDA ══════════════════════════════════════════════════════════ */
export function renderBeranda(root) {
  const p = STORE.state.profile;
  const sb = spentByCat(ACTIVE_MONTH);
  const bud = effBudgets();
  const sums = sumsByMonth();
  const cur = sums[ACTIVE_MONTH] || { income: 0, spent: 0 };
  const sisa = cur.income - cur.spent;

  pageHead(root, 'Ringkasan Bulan Ini — ' + monthLabel(ACTIVE_MONTH),
    `${p.nama} · ${p.kota}, ${p.provinsi} · ${p.anggota} anggota · gaji ${rp(p.income)}/bulan. Semua angka dari transaksi Anda di browser ini + benchmark BPS Susenas 2024.`);

  // KPI
  root.appendChild(h('div', { class: 'kpis' },
    kpi('Pemasukan bulan ini', shortRp(cur.income), `${(STORE.state.txns.filter(t => t.type === 'in' && monthKey(t.date) === ACTIVE_MONTH).length)} transaksi masuk`),
    kpi('Pengeluaran bulan ini', shortRp(cur.spent), `${Object.keys(sb).length} kategori terpakai`, 'bad'),
    kpi('Sisa / saldo', rp(sisa), sisa >= 0 ? 'Aman — masih ada napas' : 'Jebol! Lihat peringatan di bawah', sisa >= 0 ? 'good' : 'bad'),
    kpi('Total pagu', shortRp(Object.values(bud).reduce((a, b) => a + b, 0)), 'Benchmark BPS × ' + p.anggota + ' anggota, bisa diubah di Pagu'),
  ));

  // Alarm defisit riil
  const jebol = CATEGORIES.map(c => ({ c, s: sb[c.key] || 0, b: bud[c.key] }))
    .filter(x => x.s > x.b).sort((a, b) => (b.s - b.b) - (a.s - a.b));
  const alarmBox = h('div', { class: 'stack', style: 'gap:8px' });
  if (jebol.length) {
    for (const j of jebol) {
      alarmBox.appendChild(h('div', { class: 'alarm' },
        h('span', {}, '🔺'),
        h('div', {},
          h('strong', {}, `${j.c.label} jebol ${rp(j.s - j.b)} `),
          `(pakai ${rp(j.s)} dari pagu ${rp(j.b)}). `,
          j.c.bucket === 'keinginan'
            ? 'Ini pos "keinginan" — pangkas dulu di sini: turunkan pagu atau tunda pembelian bulan depan.'
            : 'Pos kebutuhan pokok — tambahkan pagu dari pos keinginan, atau cari versi lebih murah (beras medium vs premium, ayam vs ikan).')));
    }
  } else {
    alarmBox.appendChild(h('div', { class: 'alarm ok' }, h('span', {}, '✅'),
      h('div', {}, h('strong', {}, 'Tidak ada kategori yang jebol. '), 'Semua pengeluaran bulan ini masih di dalam pagu — pertahankan.')));
  }
  root.appendChild(alarmBox);

  // Donut + bar 12 bulan berdampingan
  const segs = CATEGORIES.filter(c => (sb[c.key] || 0) > 0).map(c => ({
    label: c.label, spent: sb[c.key], budget: bud[c.key], color: PALETTE[CATEGORIES.indexOf(c) % PALETTE.length],
  }));
  const donutHolder = h('div', { class: 'chart-holder' });
  const legend = h('div', { class: 'legend' });
  const topSegs = [...segs].sort((a, b) => b.spent - a.spent).slice(0, 6);
  topSegs.forEach(s => legend.appendChild(h('span', {}, h('i', { style: `background:${s.color}` }), s.label)));
  if (segs.length > 6) legend.appendChild(h('span', { class: 'muted' }, `+${segs.length - 6} lainnya`));
  const barHolder = h('div', { class: 'chart-holder' });
  const keys = last12Keys(todayISO());
  const months = keys.map(k => ({
    key: k, label: monthLabel(k),
    income: sums[k]?.income || 0, spent: sums[k]?.spent || 0,
    current: k === ACTIVE_MONTH,
  }));
  root.appendChild(h('div', { class: 'grid beranda-3', style: 'margin-top:14px' },
    card('Pengeluaran per kategori vs pagu', 'Arahkan kursor ke busur untuk rincian.', donutHolder, legend),
    card('12 bulan — pemasukan vs pengeluaran', 'Hijau = pemasukan, merah = pengeluaran.',
      barHolder,
      h('div', { class: 'legend' },
        h('span', {}, h('i', { style: 'background:#1c7c50' }), 'Pemasukan'),
        h('span', {}, h('i', { style: 'background:#b3372e' }), 'Pengeluaran'))),
    (() => {
      const col = h('div', { class: 'pagu-strip' });
      return card('Sisa pagu', 'hijau aman · kuning >80% · merah jebol', col);
    })(),
  ));
  if (segs.length) donut(donutHolder, segs, 'terpakai ' + monthLabel(ACTIVE_MONTH));
  monthBars(barHolder, months);

  // isi kolom sisa pagu — 3 teratas (rasio tertinggi) + tautan ke halaman Pagu
  const holder = root.querySelector('.pagu-strip');
  const rows = CATEGORIES.map(c => ({ c, s: sb[c.key] || 0, b: bud[c.key] }))
    .filter(x => x.s > 0 || x.b > 0)
    .sort((a, b) => (b.s / b.b) - (a.s / a.b));
  for (const r of rows.slice(0, 2)) {
    const ratio = r.b ? r.s / r.b : 0;
    const over = r.s > r.b;
    holder.appendChild(h('div', { class: 'pagu-card' + (over ? ' over' : '') },
      h('div', { class: 'cat' }, r.c.label, h('span', { class: 'tag' }, r.c.bucket)),
      h('div', { class: 'amt num' }, rp(r.s)),
      h('div', { class: 'of num' }, over ? `lewat ${rp(r.s - r.b)} dari pagu ${rp(r.b)}` : `sisa ${rp(r.b - r.s)} dari ${rp(r.b)}`),
      h('div', { class: 'bar' }, h('i', { style: `width:${Math.min(100, ratio * 100)}%`, class: ratio > .8 && !over ? 'warn' : '' }))));
  }
  holder.appendChild(h('a', { class: 'plain small', href: '#/pagu', style: 'margin-top:2px' },
    `Lihat semua ${rows.length} kategori di halaman Pagu →`));

  root.appendChild(h('p', { class: 'small muted', style: 'margin-top:14px' },
    'Mulai catat sendiri: ', h('a', { class: 'plain', href: '#/transaksi' }, '+ tambah transaksi'),
    ' · atur pagu keluarga: ', h('a', { class: 'plain', href: '#/pagu' }, 'Pagu'),
    ' · cek tarif & UMP riil: ', h('a', { class: 'plain', href: '#/kalkulator' }, 'Kalkulator')));
}

/* ═══ 2. TRANSAKSI ════════════════════════════════════════════════════════ */
export function renderTransaksi(root) {
  pageHead(root, 'Transaksi', 'Tambah, saring, ubah, hapus, dan ekspor transaksi keluarga. Tersimpan di localStorage browser ini.');

  const fDate = h('input', { type: 'date', value: todayISO(), max: todayISO(), required: '' });
  const fType = h('select', {}, h('option', { value: 'out' }, 'Pengeluaran'), h('option', { value: 'in' }, 'Pemasukan'));
  const catOpts = () => {
    const isOut = fType.value === 'out';
    const list = isOut ? CATEGORIES : INCOME_CATEGORIES;
    fCat.replaceChildren(...list.map(c => h('option', { value: c.key }, c.label)));
  };
  const fCat = h('select', {});
  const fAmt = h('input', { type: 'number', min: '1', step: '1', placeholder: 'mis. 169000' });
  const fNote = h('input', { type: 'text', placeholder: 'mis. Beras medium 10 kg × Rp16.900' });
  const msg = h('p', {});
  let editingId = null;
  const submitBtn = h('button', { type: 'submit' }, 'Simpan transaksi');

  catOpts();
  fType.addEventListener('change', catOpts);

  const form = h('form', { class: 'card', novalidate: '', on: { submit: ev => {
    ev.preventDefault();
    msg.className = ''; msg.textContent = '';
    fAmt.classList.remove('err'); fDate.classList.remove('err');
    const amount = Number(fAmt.value);
    if (!fDate.value) { msg.className = 'err-msg'; msg.textContent = 'Tanggal wajib diisi.'; fDate.classList.add('err'); return; }
    if (!(amount > 0) || !Number.isFinite(amount)) {
      msg.className = 'err-msg'; msg.textContent = 'Nominal harus angka lebih dari Rp0.'; fAmt.classList.add('err'); return;
    }
    if (amount > 1e10) { msg.className = 'err-msg'; msg.textContent = 'Nominal terlalu besar (maks Rp10 miliar).'; fAmt.classList.add('err'); return; }
    STORE.mutate(s => {
      if (editingId) {
        const t = s.txns.find(x => x.id === editingId);
        if (t) Object.assign(t, { date: fDate.value, type: fType.value, cat: fCat.value, amount: Math.round(amount), note: fNote.value.trim() });
      } else {
        s.txns.unshift({ id: 'u' + Date.now().toString(36), date: fDate.value, type: fType.value,
          cat: fCat.value, amount: Math.round(amount), note: fNote.value.trim() || CAT_BY_KEY[fCat.value]?.label || 'Pemasukan' });
      }
    });
    editingId = null; submitBtn.textContent = 'Simpan transaksi';
    msg.className = 'ok-msg'; msg.textContent = 'Tersimpan. Tabel dan grafik langsung diperbarui.';
    fAmt.value = ''; fNote.value = '';
    refreshTable();
  } } },
    h('div', { class: 'row' },
      h('label', { class: 'f' }, 'Tanggal', fDate),
      h('label', { class: 'f' }, 'Tipe', fType),
      h('label', { class: 'f' }, 'Kategori', fCat),
      h('label', { class: 'f' }, 'Nominal (Rp)', fAmt),
      h('label', { class: 'f', style: 'flex:2 1 260px' }, 'Catatan', fNote),
    ),
    h('div', { class: 'row', style: 'margin-top:10px; align-items:center' }, submitBtn,
      h('button', { type: 'button', class: 'ghost', on: { click: () => {
        editingId = null; submitBtn.textContent = 'Simpan transaksi';
        fDate.value = todayISO(); fAmt.value = ''; fNote.value = ''; msg.textContent = '';
      } } }, 'Baru'),
      msg));

  // filter
  const monthSet = [...new Set(STORE.state.txns.map(t => monthKey(t.date)))].sort().reverse();
  const fMon = h('select', {}, h('option', { value: '' }, 'Semua bulan'),
    ...monthSet.map(k => h('option', { value: k }, monthLabel(k))));
  const fFilterCat = h('select', {}, h('option', { value: '' }, 'Semua kategori'),
    ...CATEGORIES.map(c => h('option', { value: c.key }, c.label)),
    ...INCOME_CATEGORIES.map(c => h('option', { value: c.key }, c.label)));
  const fQ = h('input', { type: 'text', placeholder: 'cari catatan… mis. beras' });
  const tbody = h('tbody');
  const totRow = h('p', { class: 'small muted' });

  function refreshTable() {
    const q = fQ.value.trim().toLowerCase();
    const rows = STORE.state.txns.filter(t =>
      (!fMon.value || monthKey(t.date) === fMon.value) &&
      (!fFilterCat.value || t.cat === fFilterCat.value) &&
      (!q || (t.note || '').toLowerCase().includes(q)));
    tbody.replaceChildren(...rows.map(t => {
      const label = CAT_BY_KEY[t.cat]?.label || INCOME_CATEGORIES.find(c => c.key === t.cat)?.label || t.cat;
      return h('tr', {},
        h('td', { class: 'sticky-col' }, fmtDate(t.date)),
        h('td', {}, h('span', { class: 'badge ' + (t.type === 'in' ? 'in' : 'out') }, t.type === 'in' ? 'masuk' : 'keluar')),
        h('td', {}, label),
        h('td', { class: 'wrap muted' }, t.note || ''),
        h('td', { class: 'num' }, (t.type === 'in' ? '+' : '−') + rp(t.amount)),
        h('td', {},
          h('button', { class: 'ghost small', on: { click: () => {
            editingId = t.id;
            fDate.value = t.date; fType.value = t.type; catOpts(); fCat.value = t.cat;
            fAmt.value = t.amount; fNote.value = t.note || '';
            submitBtn.textContent = 'Perbarui transaksi'; msg.className = 'ok-msg';
            msg.textContent = 'Mengubah ' + fmtDate(t.date) + ' — simpan untuk menerapkan.';
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } } }, 'Ubah'), ' ',
          h('button', { class: 'danger small', on: { click: () => {
            if (!confirm(`Hapus transaksi ${fmtDate(t.date)} — ${rp(t.amount)} (${t.note || 'tanpa catatan'})?`)) return;
            STORE.mutate(s => { s.txns = s.txns.filter(x => x.id !== t.id); });
            refreshTable();
          } } }, 'Hapus')));
    }));
    if (!rows.length) tbody.appendChild(h('tr', {}, h('td', { colspan: '6', class: 'muted' }, 'Tidak ada transaksi yang cocok dengan filter.')));
    const inn = rows.filter(t => t.type === 'in').reduce((a, t) => a + t.amount, 0);
    const out = rows.filter(t => t.type !== 'in').reduce((a, t) => a + t.amount, 0);
    totRow.textContent = `${rows.length} transaksi · masuk ${rp(inn)} · keluar ${rp(out)} · net ${rp(inn - out)}`;
  }

  const csvBtn = h('button', { class: 'ghost', on: { click: () => {
    const q = fQ.value.trim().toLowerCase();
    const data = STORE.state.txns.filter(t =>
      (!fMon.value || monthKey(t.date) === fMon.value) &&
      (!fFilterCat.value || t.cat === fFilterCat.value) &&
      (!q || (t.note || '').toLowerCase().includes(q)));
    const esc = v => '"' + String(v).replace(/"/g, '""') + '"';
    const lines = [['tanggal', 'tipe', 'kategori', 'nominal_rupiah', 'catatan'].join(',')];
    for (const t of data) lines.push([esc(t.date), esc(t.type === 'in' ? 'pemasukan' : 'pengeluaran'),
      esc(CAT_BY_KEY[t.cat]?.label || t.cat), t.amount, esc(t.note || '')].join(','));
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pundi-transaksi.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } } }, 'Ekspor CSV');

  root.appendChild(form);
  root.appendChild(h('div', { class: 'card', style: 'margin-top:16px' },
    h('h2', {}, 'Riwayat transaksi'),
    h('p', { class: 'sub' }, 'Saring lalu ekspor atau ubah langsung.'),
    h('div', { class: 'filters' },
      h('label', { class: 'f' }, 'Bulan', fMon),
      h('label', { class: 'f' }, 'Kategori', fFilterCat),
      h('label', { class: 'f', style: 'flex:2 1 220px' }, 'Cari catatan', fQ),
      csvBtn),
    h('div', { class: 'tablewrap' },
      h('table', {},
        h('thead', {}, h('tr', {},
          h('th', { class: 'sticky-col' }, 'Tanggal'), h('th', {}, 'Tipe'), h('th', {}, 'Kategori'),
          h('th', { class: 'wrap' }, 'Catatan'), h('th', { class: 'num' }, 'Nominal'), h('th', {}, 'Aksi'))),
        tbody)),
    totRow));

  fMon.addEventListener('change', refreshTable);
  fFilterCat.addEventListener('change', refreshTable);
  fQ.addEventListener('input', refreshTable);
  refreshTable();
}

/* ═══ 3. PAGU ═════════════════════════════════════════════════════════════ */
export function renderPagu(root) {
  const angVal = h('strong', {}, STORE.state.profile.anggota + ' anggota');
  const slider = h('input', { type: 'range', min: '1', max: '8', step: '1', value: String(STORE.state.profile.anggota) });
  const segUrban = h('div', { class: 'seg' },
    h('button', { type: 'button', class: STORE.state.profile.urban ? 'on' : '', on: { click: () => setArea(true) } }, 'Kota'),
    h('button', { type: 'button', class: !STORE.state.profile.urban ? 'on' : '', on: { click: () => setArea(false) } }, 'Desa'));
  const incInput = h('input', { type: 'number', min: '0', step: '100000', value: String(STORE.state.profile.income) });

  function setArea(urban) {
    STORE.mutate(s => { s.profile.urban = urban; });
    renderPaguFresh(root);
  }
  slider.addEventListener('input', () => { angVal.textContent = slider.value + ' anggota'; });
  slider.addEventListener('change', () => {
    STORE.mutate(s => { s.profile.anggota = Number(slider.value); });
    renderPaguFresh(root);
  });
  incInput.addEventListener('change', () => {
    const v = Math.max(0, Number(incInput.value) || 0);
    STORE.mutate(s => { s.profile.income = v; });
    renderPaguFresh(root);
  });

  function renderPaguFresh(host) {
    host.replaceChildren();
    renderPaguInner(host);
  }

  function renderPaguInner(host) {
    const prof = STORE.state.profile;
    const b = benchmarkBudget(prof.anggota, prof.urban);
    const bud = effBudgets();
    const totalBud = Object.values(bud).reduce((a, x) => a + x, 0);

    host.appendChild(h('div', { class: 'page-head' },
      h('h1', {}, 'Pagu Bulanan Keluarga'),
      h('p', {}, `Benchmark BPS Susenas 2024 (${prof.urban ? 'kota' : 'desa'}) × ${prof.anggota} anggota. Geser dan ketik — angka berubah riil seketika.`)));

    host.appendChild(card('Profil keluarga', 'Dasar perhitungan benchmark',
      h('div', { class: 'row', style: 'display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end' },
        h('label', { class: 'f', style: 'flex:2 1 240px' },
          h('span', {}, 'Jumlah anggota: '), angVal, slider),
        h('label', { class: 'f' }, 'Wilayah', segUrban),
        h('label', { class: 'f' }, 'Pemasukan keluarga (Rp/bulan)', incInput)),
      h('p', { class: 'small muted', style: 'margin:10px 0 0' },
        `Benchmark total BPS: ${rp(BPS.totalPerKapita[prof.urban ? 'kota' : 'desa'])}/kapita/bulan × ${prof.anggota} = ${rp(BPS.totalPerKapita[prof.urban ? 'kota' : 'desa'] * prof.anggota)}.`)));

    // ringkasan pagu vs income
    const selisih = prof.income - totalBud;
    host.appendChild(h('div', { class: 'kpis', style: 'margin-top:16px' },
      kpi('Total pagu', shortRp(totalBud), Object.keys(STORE.state.budgets).length + ' kategori disesuaikan manual'),
      kpi('Pemasukan', shortRp(prof.income), 'dari profil'),
      kpi('Sisa untuk ditabung', rp(selisih), selisih >= 0 ? `${pct(selisih / (prof.income || 1) * 100, 0)} dari pemasukan` : 'pagu melebihi pemasukan — pangkas pos keinginan', selisih >= 0 ? 'good' : 'bad'),
      kpi('Benchmark BPS', shortRp(BPS.totalPerKapita[prof.urban ? 'kota' : 'desa'] * prof.anggota), 'rata-rata nasional ' + (prof.urban ? 'kota' : 'desa')),
    ));

    // tabel pagu per kategori
    const tbody = h('tbody');
    for (const c of CATEGORIES) {
      const inp = h('input', { type: 'number', min: '0', step: '5000', value: String(bud[c.key]), style: 'max-width:130px;text-align:right' });
      inp.addEventListener('change', () => {
        const v = Math.max(0, Math.round(Number(inp.value) || 0));
        STORE.mutate(s => { s.budgets[c.key] = v; });
        renderPaguFresh(host);
      });
      const resetBtn = h('button', { class: 'ghost small', on: { click: () => {
        STORE.mutate(s => { delete s.budgets[c.key]; });
        renderPaguFresh(host);
      } } }, 'Ke benchmark');
      tbody.appendChild(h('tr', {},
        h('td', { class: 'sticky-col' }, c.label),
        h('td', {}, h('span', { class: 'badge ' + (c.bucket === 'kebutuhan' ? 'needs' : 'wants') }, c.bucket)),
        h('td', { class: 'num muted' }, rp(b[c.key])),
        h('td', {}, inp),
        h('td', {}, STORE.state.budgets[c.key] != null ? resetBtn : h('span', { class: 'muted small' }, 'benchmark'))));
    }
    host.appendChild(h('div', { class: 'card', style: 'margin-top:16px' },
      h('h2', {}, 'Pagu per kategori'),
      h('p', { class: 'sub' }, 'Kolom "benchmark" = BPS per kapita × anggota. Ketik angka sendiri untuk menyesuaikan; klik "Ke benchmark" untuk kembali.'),
      h('div', { class: 'tablewrap' },
        h('table', {},
          h('thead', {}, h('tr', {},
            h('th', { class: 'sticky-col' }, 'Kategori'), h('th', {}, 'Bucket'),
            h('th', { class: 'num' }, 'Benchmark BPS'), h('th', { class: 'num' }, 'Pagu keluarga (Rp)'), h('th', {}, 'Sumber'))),
          tbody))));

    // saran 50/30/20
    const inc = prof.income || 1;
    const line = (lab, val, target, advice) => {
      const share = val / inc * 100;
      const ok = target == null ? val >= 0 : Math.abs(share - target) <= 7;
      return h('div', { class: 'pagu-card' + (ok ? '' : ' over'), style: 'flex:1 1 180px' },
        h('div', { class: 'cat' }, lab, h('span', { class: 'tag' }, target != null ? 'target ' + target + '%' : 'target ≥20%')),
        h('div', { class: 'amt num' }, rp(val)),
        h('div', { class: 'of num' }, pct(share, 0) + ' dari pemasukan'),
        h('div', { class: 'bar' }, h('i', { style: `width:${Math.min(100, share)}%`, class: share > (target || 100) + 7 ? 'warn' : '' })),
        h('p', { class: 'small muted', style: 'margin:8px 0 0' }, advice));
    };
    const saranBox = h('div', { style: 'display:flex;gap:12px;flex-wrap:wrap' });
    const renderSaran = () => {
      const bud2 = effBudgets();
      const n2 = CATEGORIES.filter(c => c.bucket === 'kebutuhan').reduce((a, c) => a + bud2[c.key], 0);
      const w2 = CATEGORIES.filter(c => c.bucket === 'keinginan').reduce((a, c) => a + bud2[c.key], 0);
      const s2 = inc - n2 - w2;
      saranBox.replaceChildren(
        line('Kebutuhan (needs)', n2, 50, n2 / inc * 100 > 57 ? 'Pagu kebutuhan terlalu besar — sulit menabung. Cek pos listrik/transport.' : 'Masih wajar untuk ukuran keluarga.'),
        line('Keinginan (wants)', w2, 30, w2 / inc * 100 > 37 ? 'Pos keinginan (makan jadi, rokok, jajan, pakaian) bisa dipangkas dulu.' : 'Ideal — cukup ruang nikmat tanpa boros.'),
        line('Tabungan', s2, null, s2 >= 0 ? `${pct(s2 / inc * 100, 0)} masuk celengan — target 20%.` : 'Minus! Pagu melebihi pemasukan; turunkan pagu keinginan.'));
    };
    renderSaran();
    host.appendChild(h('div', { class: 'card', style: 'margin-top:16px' },
      h('h2', {}, 'Saran alokasi 50 / 30 / 20'),
      h('p', { class: 'sub' }, 'Kebutuhan 50%, keinginan 30%, tabungan 20% dari pemasukan — status dihitung dari pagu Anda saat ini.'),
      saranBox));
  }
  renderPaguInner(root);
}

/* ═══ 4. KALKULATOR ═══════════════════════════════════════════════════════ */
export function renderKalkulator(root) {
  pageHead(root, 'Kalkulator Rumah Tangga', 'Empat kalkulator bertarif riil — PLN 24–30 Nov 2026, BPJS Perpres 59/2024, UMP 2027, BPS + PIHPS.');
  root.appendChild(h('div', { class: 'calc-grid' }, calcListrik(), calcUmp(), calcBpjs(), calcBiayaHidup()));
}

function calcListrik() {
  const tier = h('select', {}, ...PLN.tiers.map(t => h('option', { value: t.id },
    `${t.va} ${t.subsid ? 'subsidi' : 'non-sub'} — Rp${t.rate.toLocaleString('id-ID')}/kWh`)));
  tier.value = 'nonsub_1300';
  const kwh = h('input', { type: 'number', min: '0', max: '5000', value: '90' });
  const out = h('div', { class: 'result' });
  const recalc = () => {
    const r = listrik(tier.value, Math.max(0, Number(kwh.value) || 0));
    out.className = 'result';
    out.replaceChildren(
      h('div', { class: 'big num' }, rp(r.total)),
      h('div', { class: 'small muted' }, `estimasi ${r.kwh} kWh · ${r.tier.va} ${r.tier.subsid ? 'subsidi' : 'non-subsidi'} · tarif ${PLN.valid}`),
      h('ul', { class: 'result-lines' },
        h('li', {}, h('span', {}, 'Energi (' + r.kwh + ' kWh × Rp' + r.tier.rate.toLocaleString('id-ID') + ')'), h('span', { class: 'num' }, rp(r.dasar))),
        h('li', {}, h('span', {}, 'PPJ ±3% + biaya admin/PPJP'), h('span', { class: 'num' }, rp(r.ppj + r.admin)))));
  };
  tier.addEventListener('change', recalc); kwh.addEventListener('input', recalc); recalc();
  return card('(a) Tagihan listrik', 'Daya terpasang + kWh/bulan → rupiah riil (tarif PLN Nov 2026; PPJ & admin termasuk estimasi)',
    h('div', { class: 'row', style: 'flex-wrap:nowrap' }, h('label', { class: 'f', style: 'flex:2 1 0' }, 'Golongan tarif', tier),
      h('label', { class: 'f', style: 'flex:1 1 0' }, 'Pemakaian kWh/bulan', kwh)), out);
}

function calcBpjs() {
  const jenis = h('select', {},
    h('option', { value: 'kelas1' }, 'PBPU Mandiri — Kelas 1 (Rp150.000/orang)'),
    h('option', { value: 'kelas2' }, 'PBPU Mandiri — Kelas 2 (Rp100.000/orang)'),
    h('option', { value: 'kelas3' }, 'PBPU Mandiri — Kelas 3 (peserta Rp35.000/orang)'),
    h('option', { value: 'ppu' }, 'PPU — pekerja bergaji (5% gaji)'),
    h('option', { value: 'pbi' }, 'PBI — ditanggung pemerintah'));
  const orang = h('input', { type: 'number', min: '1', max: '10', value: String(STORE.state.profile.anggota) });
  const gaji = h('input', { type: 'number', min: '0', step: '100000', value: String(STORE.state.profile.income) });
  const gajiWrap = h('label', { class: 'f', style: 'flex:1.4 1 0' }, 'Gaji sebulan (Rp)', gaji);
  const out = h('div', { class: 'result' });
  const recalc = () => {
    const isPpu = jenis.value === 'ppu';
    gajiWrap.style.display = isPpu ? '' : 'none';
    const r = bpjs(jenis.value, Math.max(1, Number(orang.value) || 1), Math.max(0, Number(gaji.value) || 0));
    if (r.jenis === 'pbi') {
      out.replaceChildren(h('div', { class: 'big num' }, 'Rp0'), h('div', { class: 'small' }, BPJS.pbiLabel));
      return;
    }
    if (isPpu) {
      out.replaceChildren(
        h('div', { class: 'big num' }, 'Potongan pekerja ' + rp(r.pekerja)),
        h('ul', { class: 'result-lines' },
          h('li', {}, h('span', {}, 'Gaji dipakai (cap Rp12 jt)'), h('span', { class: 'num' }, rp(r.dasar))),
          h('li', {}, h('span', {}, 'Iuran total 5% (pekerja 1% + pemberi kerja 4%)'), h('span', { class: 'num' }, rp(r.total))),
          h('li', {}, h('span', {}, 'Ditanggung perusahaan'), h('span', { class: 'num' }, rp(r.pengusaha)))));
      return;
    }
    const plan = r.plan;
    out.replaceChildren(
      h('div', { class: 'big num' }, rp(r.iuran)),
      h('div', { class: 'small muted' }, `${orang.value || 1} orang × ${rp(plan.iuran)}${plan.penuh ? ` — iuran penuh ${rp(plan.penuh)}, subsidi pemerintah ${rp(plan.subsidi)}` : ''}`),
      h('ul', { class: 'result-lines' },
        h('li', {}, h('span', {}, 'Iuran per orang sebulan'), h('span', { class: 'num' }, rp(plan.iuran))),
        h('li', {}, h('span', {}, 'Keluarga sebulan / setahun'), h('span', { class: 'num' }, rp(r.iuran) + ' / ' + rp(r.iuran * 12)))));
  };
  jenis.addEventListener('change', recalc); orang.addEventListener('input', recalc); gaji.addEventListener('input', recalc); recalc();
  return card('(b) Iuran BPJS Kesehatan', 'Jenis kepesertaan → rincian per orang & keluarga',
    h('div', { class: 'row', style: 'flex-wrap:nowrap' }, h('label', { class: 'f', style: 'flex:2 1 0' }, 'Jenis kepesertaan', jenis),
      h('label', { class: 'f', style: 'flex:1 1 0' }, 'Jumlah orang', orang), gajiWrap), out);
}

function calcUmp() {
  const prov = h('select', {}, h('option', { value: '' }, '— pilih provinsi —'),
    ...Object.keys(UMP2027).sort().map(k => h('option', { value: k }, k)));
  prov.value = STORE.state.profile.provinsi in UMP2027 ? STORE.state.profile.provinsi : 'Jawa Barat';
  const gaji = h('input', { type: 'number', min: '0', step: '100000', value: String(STORE.state.profile.income) });
  const out = h('div', { class: 'result' });
  const recalc = () => {
    const r = bandingUMP(prov.value, Math.max(0, Number(gaji.value) || 0));
    if (!r) { out.className = 'result'; out.textContent = 'Pilih provinsi untuk membandingkan.'; return; }
    out.className = 'result ' + (r.diAtas ? '' : 'bad');
    const diff = Math.abs(r.selisihPct);
    out.replaceChildren(
      h('div', { class: 'big num' }, r.diAtas ? 'Di atas UMP' : 'Di bawah UMP'),
      h('div', { class: 'small' }, `Gaji ${rp(r.gaji)} vs UMP 2027 ${r.provinsi} ${rp(r.ump)} — ${r.diAtas ? 'lebih tinggi' : 'kurang'} ${pct(diff, 1)}`),
      h('ul', { class: 'result-lines' },
        h('li', {}, h('span', {}, 'UMP 2027'), h('span', { class: 'num' }, rp(r.ump))),
        h('li', {}, h('span', {}, 'Selisih'), h('span', { class: 'num' }, (r.selisihPct >= 0 ? '+' : '') + pct(r.selisihPct, 1))),
        h('li', {}, h('span', {}, 'Kenaikan UMP 2027 vs 2026'), h('span', { class: 'num' }, r.naik == null ? 'belum dirilis' : '+' + pct(r.naik, 2)))));
  };
  prov.addEventListener('change', recalc); gaji.addEventListener('input', recalc); recalc();
  return card('(c) Gaji vs UMP 2027', '38 provinsi, angka gubernur Nov 2026',
    h('div', { class: 'row', style: 'flex-wrap:nowrap' }, h('label', { class: 'f', style: 'flex:1.6 1 0' }, 'Provinsi', prov),
      h('label', { class: 'f', style: 'flex:1 1 0' }, 'Gaji Anda (Rp/bulan)', gaji)), out);
}

function calcBiayaHidup() {
  const orang = h('input', { type: 'number', min: '1', max: '10', value: String(STORE.state.profile.anggota) });
  const area = h('div', { class: 'seg' },
    h('button', { type: 'button', class: 'on', on: { click: e => { setArea(true, e.target); } } }, 'Kota'),
    h('button', { type: 'button', on: { click: e => { setArea(false, e.target); } } }, 'Desa'));
  let urban = true;
  function setArea(u, btn) {
    urban = u;
    [...area.children].forEach(b => b.classList.toggle('on', b === btn));
    recalc();
  }
  // keranjang pasar: komoditas yang bisa dicentang, harga PIHPS riil
  const basket = [
    { id: 'beras10', label: 'Beras 10 kg', price: 16900 * 10 },
    { id: 'telur2', label: 'Telur 2 kg', price: 28800 * 2 },
    { id: 'ayam2', label: 'Ayam ras 2 kg', price: 37750 * 2 },
    { id: 'minyak2l', label: 'Minyak curah 2 l', price: 21000 * 2 },
    { id: 'gula2', label: 'Gula 2 kg', price: 19300 * 2 },
    { id: 'cabaih', label: 'Cabai ½ kg', price: 70000 / 2 },
  ];
  const checks = basket.map(b => {
    const cb = h('input', { type: 'checkbox', checked: '' });
    cb.addEventListener('change', recalc);
    return { ...b, cb, row: h('label', { class: 'checkrow', title: b.label + ' — harga PIHPS 20–24 Nov 2026' }, cb, h('span', {}, b.label), h('span', { class: 'num muted', style: 'margin-left:auto' }, shortRp(b.price))) };
  });
  const out = h('div', { class: 'result' });
  function recalc() {
    const n = Math.max(1, Number(orang.value) || 1);
    const comps = estimasiBiayaHidup(n, urban);
    const totalBps = comps.reduce((a, x) => a + x.benchmark, 0);
    const basketTotal = checks.filter(c => c.cb.checked).reduce((a, c) => a + c.price, 0);
    const top = [...comps].sort((a, b) => b.benchmark - a.benchmark).slice(0, 1);
    out.replaceChildren(
      h('div', { class: 'big num' }, rp(totalBps)),
      h('div', { class: 'small muted' }, `benchmark BPS ${urban ? 'kota' : 'desa'} × ${n} orang`),
      h('ul', { class: 'result-lines' },
        ...top.map(x => h('li', {}, h('span', {}, x.cat.label), h('span', { class: 'num' }, rp(x.benchmark)))),
        h('li', {}, h('span', {}, 'Keranjang pasar terpilih'), h('span', { class: 'num' }, rp(basketTotal))),
        h('li', {}, h('strong', {}, 'Estimate total'), h('strong', { class: 'num' }, rp(totalBps + basketTotal)))));
  }
  orang.addEventListener('input', recalc);
  recalc();
  return card('(d) Estimasi biaya hidup 1 bulan', 'Anggota + wilayah → komponen BPS; centang keranjang harga PIHPS riil',
    h('div', { class: 'row', style: 'flex-wrap:nowrap' }, h('label', { class: 'f', style: 'flex:1 1 0' }, 'Jumlah anggota', orang), h('label', { class: 'f', style: 'flex:1.4 1 0' }, 'Wilayah', area)),
    h('div', { class: 'basket-grid' }, ...checks.map(c => c.row)),
    out);
}

/* ═══ 5. HARGA ════════════════════════════════════════════════════════════ */
export function renderHarga(root) {
  pageHead(root, 'Harga Pangan — PIHPS vs HET', 'Harga eceran rata-rata nasional (PIHPS Bank Indonesia, 20 & 24 Nov 2026) dibandingkan Harga Eceran Tertinggi Kemendag (per 10 Nov 2026). Zona HET: zona 1 (Sumatera, Jawa, Bali, NTB) kecuali disebut lain.');
  const tbody = h('tbody');
  for (const row of PIHPS) {
    let badge = h('span', { class: 'muted small' }, 'tanpa HET');
    let hetVal = null;
    if (row.het && HET[row.het]) {
      const table = HET[row.het];
      hetVal = table[row.zona] ?? table.semua ?? table.zona1;
      const ref = row.p24 ?? row.p20;
      if (hetVal != null && ref != null) {
        badge = ref > hetVal
          ? h('span', { class: 'badge over-het' }, 'di atas HET')
          : h('span', { class: 'badge in-het' }, 'dalam HET');
      }
    }
    const delta = (row.p20 != null && row.p24 != null) ? (row.p24 - row.p20) / row.p20 * 100 : null;
    tbody.appendChild(h('tr', {},
      h('td', { class: 'sticky-col' }, row.label),
      h('td', {}, row.unit),
      h('td', { class: 'num' }, row.p20 != null ? rp(row.p20) : '—'),
      h('td', { class: 'num' }, row.p24 != null ? rp(row.p24) : '—'),
      h('td', {}, spark2(row.p20, row.p24),
        delta == null ? h('span', { class: 'flat', style: 'margin-left:6px' }, '·')
          : h('span', { class: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat', style: 'margin-left:6px' },
              (delta > 0 ? '▲ ' : delta < 0 ? '▼ ' : '– ') + pct(Math.abs(delta), 1))),
      h('td', { class: 'num' }, hetVal != null ? rp(hetVal) : '—'),
      h('td', {}, badge)));
  }
  root.appendChild(h('div', { class: 'card' },
    h('h2', {}, 'Tabel harga 20 → 24 November 2026'),
    h('p', { class: 'sub' }, 'Sparkline: kiri = 20 Nov, kanan = 24 Nov. ▲ merah = naik, ▼ hijau = turun.'),
    h('div', { class: 'tablewrap' },
      h('table', {},
        h('thead', {}, h('tr', {},
          h('th', { class: 'sticky-col' }, 'Komoditas'), h('th', {}, 'Unit'),
          h('th', { class: 'num' }, '20 Nov'), h('th', { class: 'num' }, '24 Nov'),
          h('th', {}, 'Perubahan'), h('th', { class: 'num' }, 'HET/zona 1'), h('th', {}, 'Status'))),
        tbody))));
  root.appendChild(h('div', { class: 'card', style: 'margin-top:16px' },
    h('h2', {}, 'Catatan sumber & tanggal'),
    h('p', { class: 'sub' }, 'Semua angka dikompilasi 26 Nov 2026 dari publikasi resmi — bukan prediksi.'),
    h('dl', { class: 'src-list' },
      h('dt', {}, 'PIHPS — Bank Indonesia'), h('dd', {}, 'Rata-rata harga eceran nasional, laporan 20 Nov & 24 Nov 2026 (Liputan6, Kontan).'),
      h('dt', {}, 'HET — Kemendag'), h('dd', {}, `Harga Eceran Tertinggi zonasi, berlaku per ${HET.asof} (CNBC Indonesia). Beras: zona 1 = Jawa–Sumatera–Bali–NTB; zona 2 = Kalimantan–NTT–Sulawesi; zona 3 = Maluku–Papua. Gula: luar 3TP timur vs 3TP timur.`),
      h('dt', {}, 'Cara baca'), h('dd', {}, '"Di atas HET" berarti harga pasar nasional rata-rata melewati plafon Kemendag — biasanya karena distribusi atau panenan; belanja lebih hemat bila membeli dalam HET (SPHP, MinyaKita).'))));
}

/* ═══ 6. TENTANG ══════════════════════════════════════════════════════════ */
export function renderTentang(root) {
  pageHead(root, 'Tentang Pundi', 'Perencana anggaran keluarga yang angkanya bersumber dari data resmi — bukan perkiraan bebas.');
  root.appendChild(h('div', { class: 'grid g-2' },
    card('Metodologi', 'Bagaimana Pundi menghitung',
      h('ul', { style: 'margin:0;padding-left:18px;font-size:14px' },
        h('li', {}, 'Pagu default = rata-rata pengeluaran per kapita BPS Susenas 2024 (kota/desa) × jumlah anggota keluarga, dibulatkan ke Rp10.000.'),
        h('li', {}, 'Taksonomi kategori = 20 baris komoditas Susenas + agregat makanan/non-makanan; tiap kategori dilabeli kebutuhan (needs) atau keinginan (wants) untuk saran 50/30/20.'),
        h('li', {}, 'Harga pangan = rata-rata eceran nasional PIHPS Bank Indonesia per 20 & 24 Nov 2026, dibandingkan HET Kemendag zonasi (per 10 Nov 2026).'),
        h('li', {}, 'Listrik = tarif per kWh PLN periode 24–30 Nov 2026 + estimasi PPJ 3% + biaya admin; BPJS = tarif Perpres 59/2024; UMP = pengumuman gubernur 2027 (38 provinsi).'),
        h('li', {}, 'Inflasi konteks = World Bank FP.CPI.TOTL.ZG: 2023 2,62% · 2024 1,57% · 2025 1,91%.'))),
    card('Privasi: data tinggal di browser', 'localStorage, tanpa server',
      h('p', { style: 'font-size:14px;margin:0 0 10px' }, 'Semua transaksi, pagu, dan profil keluarga disimpan di ',
        h('code', {}, 'localStorage'), ' browser Anda (kunci ', h('code', {}, 'pundi.v1'), '). Pundi tidak memanggil jaringan sama sekali — tidak ada server, tidak ada analitik, tidak ada akun. Ekspor CSV dibuat langsung di browser.'),
      h('p', { style: 'font-size:14px;margin:0 0 12px' }, 'Konsekuensinya: hapus data browser atau pakai perangkat lain = data tidak ikut. Berkala-lah lewat Ekspor CSV.'),
      h('button', { class: 'danger', on: { click: () => {
        if (confirm('Reset seluruh data Pundi ke contoh awal Keluarga Ibu Sari? Data Anda di browser ini akan tergantikan.')) STORE.reset();
      } } }, 'Reset ke data contoh'))));
  root.appendChild(h('div', { class: 'card', style: 'margin-top:16px' },
    h('h2', {}, 'Sumber data'),
    h('p', { class: 'sub' }, 'Dikompilasi dan di-cross-check 2+ sumber pada 26 November 2026.'),
    h('dl', { class: 'src-list' }, ...SOURCES.flatMap(([n, d]) => [h('dt', {}, n), h('dd', {}, d)]))));
  root.appendChild(h('div', { class: 'card', style: 'margin-top:16px' },
    h('h2', {}, 'Disclaimer'),
    h('p', { style: 'font-size:14px;margin:0' }, 'Angka referensi (BPS, PIHPS, HET, UMP, tarif PLN/BPJS) adalah rata-rata dan tarif resmi pada tanggal kompilasi — bukan rekomendasi keuangan, bukan prediksi harga, dan bisa berubah. Tarif listrik belum termasuk penyesuaian otomatis (tariff adjustment) bulanan PLN; UMP beberapa provinsi belum mempublikasikan % kenaikan saat kompilasi (ditandai "belum dirilis"). Selalu cek sumber resmi untuk keputusan besar.')));
}
