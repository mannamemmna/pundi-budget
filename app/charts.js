// charts.js — grafik SVG buatan tangan (tanpa library). Semua fungsi mengembalikan
// elemen SVG siap tempel; tooltip memakai satu .chart-tip per holder.
import { rp, shortRp } from './calc.js';

const NS = 'http://www.w3.org/2000/svg';
export const PALETTE = ['#1c7c50', '#2b5f8a', '#a86a10', '#7a4e8f', '#b3372e',
  '#3d8b7a', '#8a6d3b', '#5b7f2f', '#a04d7c', '#4a6fa5',
  '#c07a2c', '#6d8a2b', '#8f5a4e', '#356e4f', '#96712d',
  '#5c6b73', '#7c5030', '#2e7d6b', '#996b9e', '#6b7c3a'];

function el(name, attrs = {}, parent) {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}

function tipFor(holder) {
  let tip = holder.querySelector('.chart-tip');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'chart-tip';
    holder.appendChild(tip);
  }
  return tip;
}

function bindTip(holder, node, textFn) {
  const tip = tipFor(holder);
  node.addEventListener('pointerenter', ev => {
    tip.textContent = textFn();
    tip.classList.add('show');
    move(ev);
  });
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerleave', () => tip.classList.remove('show'));
  function move(ev) {
    const r = holder.getBoundingClientRect();
    tip.style.left = (ev.clientX - r.left) + 'px';
    tip.style.top = (ev.clientY - r.top - 6) + 'px';
  }
}

/* Donut: pengeluaran per kategori vs pagu.
   segs = [{label, spent, budget, color}] — busur = spent, cincin tipis latar = budget. */
export function donut(holder, segs, centerLabel, centerValue) {
  const size = 260, cx = size / 2, cy = size / 2, R = 96, r = 62;
  const svg = el('svg', { viewBox: `0 0 ${size} ${size}`, style: 'width:100%;max-width:170px;height:auto;display:block;margin:auto', role: 'img',
    'aria-label': 'Donut pengeluaran per kategori' });
  holder.appendChild(svg);
  const total = segs.reduce((s, x) => s + x.spent, 0) || 1;

  // cincin latar (total pagu) supaya terlihat porsi terhadap pagu
  el('circle', { cx, cy, r: (R + r) / 2, fill: 'none', stroke: '#ece5d6', 'stroke-width': R - r }, svg);

  let a0 = -Math.PI / 2;
  const arc = (a1, a2, rad, w, attrs) => {
    const p1 = [cx + rad * Math.cos(a1), cy + rad * Math.sin(a1)];
    const p2 = [cx + rad * Math.cos(a2), cy + rad * Math.sin(a2)];
    const large = a2 - a1 > Math.PI ? 1 : 0;
    return el('path', {
      d: `M ${p1[0]} ${p1[1]} A ${rad} ${rad} 0 ${large} 1 ${p2[0]} ${p2[1]}`,
      fill: 'none', 'stroke-width': w, ...attrs,
    }, svg);
  };
  for (const s of segs) {
    if (s.spent <= 0) continue;
    const sweep = (s.spent / total) * Math.PI * 2;
    const a1 = a0 + Math.min(sweep, Math.PI * 2 - 0.001);
    const path = arc(a0, a1, (R + r) / 2, R - r - 2, { stroke: s.color, 'stroke-linecap': 'butt' });
    path.style.cursor = 'pointer';
    bindTip(holder, path, () => `${s.label}: ${rp(s.spent)} (${Math.round(s.spent / total * 100)}%) · pagu ${rp(s.budget)}`);
    a0 += sweep;
  }
  const t1 = el('text', { x: cx, y: cy - 8, class: 'donut-center', 'font-size': '20', 'font-weight': '800', fill: '#2b2620' }, svg);
  t1.textContent = shortRp(total);
  const t2 = el('text', { x: cx, y: cy + 14, class: 'donut-center', 'font-size': '12', fill: '#6f675c' }, svg);
  t2.textContent = centerLabel;
  void centerValue;
  return svg;
}

/* Bar 12 bulan: spending vs income. months = [{key:'YYYY-MM', label, income, spent}] */
export function monthBars(holder, months) {
  const W = 640, H = 200, padL = 52, padB = 26, padT = 8, padR = 6;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, style: 'width:100%;height:auto;display:block', role: 'img',
    'aria-label': 'Batang 12 bulan: pemasukan vs pengeluaran' });
  holder.appendChild(svg);
  const max = Math.max(1, ...months.map(m => Math.max(m.income, m.spent)));
  const plotH = H - padB - padT, plotW = W - padL - padR;
  const y = v => padT + plotH - (v / max) * plotH;
  const bw = plotW / months.length;

  for (let i = 0; i <= 4; i++) {
    const v = max * i / 4, yy = y(v);
    el('line', { x1: padL, x2: W - padR, y1: yy, y2: yy, stroke: '#ece5d6', 'stroke-width': 1 }, svg);
    const t = el('text', { x: padL - 6, y: yy + 4, 'text-anchor': 'end', 'font-size': '10', fill: '#6f675c' }, svg);
    t.textContent = shortRp(v);
  }
  months.forEach((m, i) => {
    const x0 = padL + i * bw;
    const wIn = bw * 0.30, wOut = bw * 0.30;
    if (m.income > 0) {
      const rect = el('rect', { x: x0 + bw * 0.12, y: y(m.income), width: wIn, height: padT + plotH - y(m.income),
        fill: '#1c7c50', rx: 3, opacity: .85 }, svg);
      bindTip(holder, rect, () => `${m.label} pemasukan: ${rp(m.income)}`);
    }
    if (m.spent > 0) {
      const rect = el('rect', { x: x0 + bw * 0.52, y: y(m.spent), width: wOut, height: padT + plotH - y(m.spent),
        fill: '#b3372e', rx: 3, opacity: .85 }, svg);
      bindTip(holder, rect, () => `${m.label} pengeluaran: ${rp(m.spent)}`);
    }
    const t = el('text', { x: x0 + bw / 2, y: H - 8, 'text-anchor': 'middle', 'font-size': '10',
      fill: m.current ? '#2b2620' : '#6f675c', 'font-weight': m.current ? '700' : '400' }, svg);
    t.textContent = m.label;
  });
  return svg;
}

/* Sparkline 2 titik harga (20 → 24 Nov). Naik = merah, turun = hijau. */
export function spark2(p20, p24) {
  const svg = el('svg', { viewBox: '0 0 44 18', width: 44, height: 18, class: 'spark' });
  if (p20 == null || p24 == null) {
    const t = el('text', { x: 22, y: 13, 'text-anchor': 'middle', 'font-size': '11', fill: '#6f675c' }, svg);
    t.textContent = '·';
    return svg;
  }
  const up = p24 > p20, flat = p24 === p20;
  const color = flat ? '#6f675c' : up ? '#b3372e' : '#1c7c50';
  const y1 = up ? 14 : 4, y2 = up ? 4 : 14;
  el('polyline', { points: flat ? '4,9 40,9' : `4,${y1} 40,${y2}`, fill: 'none', stroke: color, 'stroke-width': 2.4,
    'stroke-linecap': 'round' }, svg);
  el('circle', { cx: 4, cy: flat ? 9 : y1, r: 2.6, fill: color }, svg);
  el('circle', { cx: 40, cy: flat ? 9 : y2, r: 2.6, fill: color }, svg);
  return svg;
}
