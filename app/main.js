// main.js — Pundi: hash-router, nav, boot. Keadaan ada di store.js; halaman di views.js.
import { STORE } from './store.js';
import { renderBeranda, renderTransaksi, renderPagu, renderKalkulator, renderHarga, renderTentang } from './views.js';

/* ── Router ─────────────────────────────────────────────────────────────── */
const ROUTES = {
  '':            { view: renderBeranda,    nav: 'beranda' },
  'transaksi':   { view: renderTransaksi,  nav: 'transaksi' },
  'pagu':        { view: renderPagu,       nav: 'pagu' },
  'kalkulator':  { view: renderKalkulator, nav: 'kalkulator' },
  'harga':       { view: renderHarga,      nav: 'harga' },
  'tentang':     { view: renderTentang,    nav: 'tentang' },
};
const app = document.getElementById('app');

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [name, ...rest] = h.split('/');
  return { name: name || '', sub: rest.join('/') };
}

let currentNav = null;
export function route() {
  const { name, sub } = parseHash();
  const r = ROUTES[name] || ROUTES[''];
  if (currentNav !== r.nav) {
    currentNav = r.nav;
    document.querySelectorAll('#desk-nav a, #mob-nav a').forEach(a =>
      a.classList.toggle('on', a.dataset.route === r.nav));
  }
  app.replaceChildren();
  window.scrollTo(0, 0);
  r.view(app, sub);
}
window.addEventListener('hashchange', route);

/* ── Ikon bottom-nav (SVG inline, tanpa jaringan) ───────────────────────── */
const ICONS = {
  home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="15" rx="3"/><path d="M12 9v7M8.5 12.5h7"/></svg>',
  target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  calc: '<svg viewBox="0 0 24 24"><rect x="4" y="2.5" width="16" height="19" rx="3"/><path d="M8 7h8M8.5 12h0M12 12h0M15.5 12h0M8.5 16h0M12 16h0M15.5 16h0"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M6 17v-6M11 17V7M16 17v-9M21 17V4"/></svg>',
};
document.querySelectorAll('#mob-nav .mi').forEach(s => { s.innerHTML = ICONS[s.dataset.i] || ''; });

/* ── Mulai ──────────────────────────────────────────────────────────────── */
STORE.load();
STORE.onChange(route);
route();
