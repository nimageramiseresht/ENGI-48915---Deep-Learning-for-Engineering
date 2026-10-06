/* Week 1 widgets. Colour semantics: amber = data/signal, purple = weights,
   red = error/loss, teal = gradients. */
(function () {
  const U = DeckUtil;
  const C = {
    ink: '#1D2433', soft: '#4A5468', faint: '#8790A0', line: '#CBD2DA', paper: '#F6F7F4', panel: '#FFFFFF',
    purple: '#68246D', purpleTint: '#F1E8F2', amber: '#E09A12', amberText: '#9A6200', amberTint: '#FCF1DC',
    teal: '#17707F', tealTint: '#E1F0F2', red: '#B83A2E', redTint: '#F8E5E2'
  };
  const h = (tag, attrs = {}, parent, html) => {
    const el = document.createElement(tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (html !== undefined) el.innerHTML = html;
    if (parent) parent.appendChild(el);
    return el;
  };

  /* ------------------------------------------------------------ pixel 7 icon */
  (function pix7() {
    const g = document.getElementById('pix7');
    if (!g) return;
    const rows = ['.......', '.#####.', '.....#.', '....#..', '...#...', '...#...', '.......'];
    rows.forEach((row, r) => [...row].forEach((ch, c) => {
      U.svg('rect', { x: 12 + c * 18, y: 12 + r * 18, width: 16, height: 16, rx: 2,
        fill: ch === '#' ? C.ink : '#E3E7EC' }, g);
    }));
  })();

  /* ------------------------------------------------------------ network diagram */
  Deck.widget('net', el => {
    const layers = el.dataset.layers.split(',').map(Number);
    const counts = el.dataset.counts ? el.dataset.counts.split(',') : null;
    const captions = el.dataset.captions ? el.dataset.captions.split(',') : null;
    const dark = el.dataset.theme === 'dark';
    const backward = el.dataset.direction === 'backward';
    const W = counts ? 640 : 560, H = counts ? 430 : 400;
    const top = 24, bottom = captions ? 64 : 16;
    const svg = U.svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img',
      'aria-label': 'Neural network diagram with layers of ' + (counts || layers).join(', ') + ' units' }, el);
    const mx = counts ? 90 : 60;
    const xs = layers.map((_, i) => mx + i * (W - 2 * mx) / (layers.length - 1));
    const pos = layers.map((n, li) => {
      const slots = counts ? n + 1 : n;
      const avail = H - top - bottom;
      const sp = Math.min(counts ? 34 : 64, avail / slots);
      const y0 = top + (avail - sp * (slots - 1)) / 2;
      const pts = [];
      for (let k = 0; k < slots; k++) {
        if (counts && k === Math.floor(slots / 2)) continue; // gap for the ellipsis
        pts.push({ x: xs[li], y: y0 + k * sp });
      }
      return { pts, sp, mid: y0 + Math.floor(slots / 2) * sp };
    });
    const r = Math.min(17, Math.min(...pos.map(p => p.sp)) * 0.36);
    const edgeCol = dark ? '#8F99AD' : C.purple;
    const gEdges = U.svg('g', {}, svg), gPulse = U.svg('g', {}, svg), gNodes = U.svg('g', {}, svg);
    const edges = [];
    for (let l = 0; l < layers.length - 1; l++) {
      pos[l].pts.forEach(a => pos[l + 1].pts.forEach(b => {
        U.svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: edgeCol,
          'stroke-opacity': dark ? 0.28 : 0.22, 'stroke-width': 1.3 }, gEdges);
        edges.push({ a, b, l });
      }));
    }
    pos.forEach((p, li) => {
      const isIn = li === 0, isOut = li === layers.length - 1;
      p.pts.forEach(pt => {
        let fill = dark ? '#273047' : C.panel, stroke = dark ? '#B9C1CF' : C.ink;
        if (isIn) { fill = dark ? '#3A3220' : C.amberTint; stroke = C.amber; }
        if (isOut) { fill = backward ? C.redTint : (dark ? '#3B2440' : C.purpleTint); stroke = backward ? C.red : (dark ? '#C9A7D1' : C.purple); }
        U.svg('circle', { cx: pt.x, cy: pt.y, r, fill, stroke, 'stroke-width': 2.2 }, gNodes);
      });
      if (counts) {
        const t = U.svg('text', { x: xs[li], y: p.mid + 7, 'text-anchor': 'middle', 'font-size': 26,
          fill: dark ? '#B9C1CF' : C.soft, 'font-weight': 700 }, gNodes);
        t.textContent = '\u22EE';
      }
      if (captions && captions[li]) {
        const lines = captions[li].split(':');
        lines.forEach((ln, k) => {
          const t = U.svg('text', { x: xs[li], y: H - bottom + 30 + k * 20, 'text-anchor': 'middle',
            'font-size': k ? 15 : 16, 'font-weight': k ? 400 : 700, fill: dark ? '#B9C1CF' : (k ? C.soft : C.ink),
            'font-family': 'Atkinson Hyperlegible, sans-serif' }, svg);
          t.textContent = ln.trim();
        });
      }
    });
    if (U.reduced) return {};
    // travelling pulses: each layer gap lights up in turn
    const gaps = layers.length - 1, slot = 0.9, T = gaps * slot + 0.8;
    const rand = U.rng(7);
    const keep = edges.length > 70 ? 0.35 : 0.75;
    edges.forEach(e => {
      if (rand() > keep) return;
      const order = backward ? gaps - 1 - e.l : e.l;
      const s = (order * slot + rand() * 0.15) / T, f = Math.min(0.999, s + 0.75 / T);
      const from = backward ? e.b : e.a, to = backward ? e.a : e.b;
      const c = U.svg('circle', { r: 4.2, fill: backward ? C.teal : C.amber, opacity: 0 }, gPulse);
      U.svg('animateMotion', { dur: T + 's', repeatCount: 'indefinite', path: `M${from.x},${from.y} L${to.x},${to.y}`,
        keyPoints: '0;0;1;1', keyTimes: `0;${s.toFixed(3)};${f.toFixed(3)};1`, calcMode: 'linear' }, c);
      U.svg('animate', { attributeName: 'opacity', dur: T + 's', repeatCount: 'indefinite',
        values: '0;0;1;1;0;0', keyTimes: `0;${s.toFixed(3)};${(s + 0.01).toFixed(3)};${(f - 0.01).toFixed(3)};${f.toFixed(3)};1` }, c);
    });
    return {};
  });

  /* ------------------------------------------------------------ representation (polar) */
  Deck.widget('rep', el => {
    const W = 540, H = 430, x0 = 60, y0 = 16, w = 450, hgt = 360;
    const svg = U.svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', style: 'max-height:440px', 'aria-label': 'Two classes of points, a disc inside a ring, shown in x-y and then polar coordinates' }, el);
    U.svg('rect', { x: x0, y: y0, width: w, height: hgt, fill: C.panel, stroke: C.line }, svg);
    const boundary = U.svg('line', { x1: x0, x2: x0 + w, y1: y0 + (1 - 0.53) * hgt, y2: y0 + (1 - 0.53) * hgt,
      stroke: C.ink, 'stroke-width': 2.5, 'stroke-dasharray': '8 6', opacity: 0 }, svg);
    const bLabel = U.svg('text', { x: x0 + w - 8, y: y0 + (1 - 0.53) * hgt - 8, 'text-anchor': 'end', 'font-size': 16, fill: C.ink, opacity: 0 }, svg);
    bLabel.textContent = 'threshold r = 0.53';
    const rand = U.rng(42);
    const pts = [];
    for (let i = 0; i < 90; i++) {
      const inner = i % 2 === 0;
      const rr = inner ? 0.06 + 0.36 * Math.sqrt(rand()) : 0.64 + 0.3 * rand();
      const th = -Math.PI + 2 * Math.PI * rand();
      const xc = rr * Math.cos(th), yc = rr * Math.sin(th);
      const A = { x: x0 + (xc + 1) / 2 * w, y: y0 + (1 - (yc + 1) / 2) * hgt };
      const B = { x: x0 + (th + Math.PI) / (2 * Math.PI) * w, y: y0 + (1 - rr) * hgt };
      const c = U.svg('circle', { cx: A.x, cy: A.y, r: 6.5, fill: inner ? C.amber : C.purple,
        'fill-opacity': inner ? 0.9 : 0.75, stroke: '#fff', 'stroke-width': 1.2 }, svg);
      pts.push({ c, A, B });
    }
    const xl = U.svg('text', { x: x0 + w / 2, y: H - 22, 'text-anchor': 'middle', 'font-size': 18, fill: C.ink, 'font-weight': 700 }, svg);
    const yl = U.svg('text', { x: 22, y: y0 + hgt / 2, 'text-anchor': 'middle', 'font-size': 18, fill: C.ink, 'font-weight': 700,
      transform: `rotate(-90 22 ${y0 + hgt / 2})` }, svg);
    const controls = h('div', { class: 'wctl' }, el);
    const btn = h('button', { class: 'primary', type: 'button' }, controls, 'Switch to polar coordinates');
    let t = 0, target = 0, raf = null;
    function draw() {
      const e = U.ease(t);
      pts.forEach(p => {
        p.c.setAttribute('cx', p.A.x + (p.B.x - p.A.x) * e);
        p.c.setAttribute('cy', p.A.y + (p.B.y - p.A.y) * e);
      });
      boundary.setAttribute('opacity', Math.max(0, (e - 0.7) / 0.3));
      bLabel.setAttribute('opacity', Math.max(0, (e - 0.7) / 0.3));
      xl.textContent = e > 0.5 ? 'angle \u03B8' : 'x';
      yl.textContent = e > 0.5 ? 'radius r' : 'y';
    }
    function go(to) {
      target = to;
      btn.textContent = to ? 'Back to x, y coordinates' : 'Switch to polar coordinates';
      if (U.reduced) { t = to; draw(); return; }
      cancelAnimationFrame(raf);
      let last = performance.now();
      const step = now => {
        const dt = (now - last) / 1300; last = now;
        t = target > t ? Math.min(target, t + dt) : Math.max(target, t - dt);
        draw();
        if (t !== target) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    btn.addEventListener('click', () => go(target ? 0 : 1));
    draw();
    return { trigger(name, on) { if (name === 'rep-polar') go(on ? 1 : 0); } };
  });

  /* ------------------------------------------------------------ training loop orbit */
  Deck.widget('loop', el => {
    const W = 660, H = 440, cx = 330, cy = 215, R = 130;
    const svg = U.svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'The training loop: batch, forward pass, loss, backpropagation, weight update, repeated' }, el);
    const stages = [
      ['Batch of data', 'inputs and targets', C.amber],
      ['Forward pass', 'prediction \u0177', C.amber],
      ['Loss', 'compare \u0177 with y', C.red],
      ['Backpropagation', 'gradients \u2207L', C.teal],
      ['Update weights', 'optimiser step', C.purple]
    ];
    const ang = i => (-90 + i * 72) * Math.PI / 180;
    const P = i => ({ x: cx + R * Math.cos(ang(i)), y: cy + R * Math.sin(ang(i)) });
    const segCols = [C.amber, C.amber, C.red, C.teal, C.purple];
    for (let i = 0; i < 5; i++) {
      const a = P(i), b = P((i + 1) % 5);
      U.svg('path', { d: `M${a.x},${a.y} A${R},${R} 0 0 1 ${b.x},${b.y}`, fill: 'none', stroke: segCols[i], 'stroke-width': 5, 'stroke-opacity': 0.45 }, svg);
    }
    const ctext = U.svg('text', { x: cx, y: cy - 4, 'text-anchor': 'middle', 'font-size': 17, fill: C.soft }, svg);
    ctext.textContent = 'repeat for';
    const ctext2 = U.svg('text', { x: cx, y: cy + 18, 'text-anchor': 'middle', 'font-size': 17, fill: C.soft }, svg);
    ctext2.textContent = 'every batch';
    stages.forEach((s, i) => {
      const p = P(i);
      U.svg('circle', { cx: p.x, cy: p.y, r: 24, fill: C.panel, stroke: s[2], 'stroke-width': 3.5 }, svg);
      const n = U.svg('text', { x: p.x, y: p.y + 7, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 800, fill: C.ink,
        'font-family': 'Bricolage Grotesque, sans-serif' }, svg);
      n.textContent = i + 1;
      const lr = R + 44, lx = cx + lr * Math.cos(ang(i)), ly = cy + lr * Math.sin(ang(i));
      const anchor = Math.abs(lx - cx) < 20 ? 'middle' : (lx > cx ? 'start' : 'end');
      const dy = i === 0 ? -14 : 0;
      const t1 = U.svg('text', { x: lx, y: ly + dy, 'text-anchor': anchor, 'font-size': 19, 'font-weight': 700, fill: C.ink }, svg);
      t1.textContent = s[0];
      const t2 = U.svg('text', { x: lx, y: ly + dy + 21, 'text-anchor': anchor, 'font-size': 15, fill: C.soft }, svg);
      t2.textContent = s[1];
    });
    if (!U.reduced) {
      const dot = U.svg('circle', { r: 10, fill: C.amber, stroke: '#fff', 'stroke-width': 2.5 }, svg);
      U.svg('animateMotion', { dur: '7.5s', repeatCount: 'indefinite',
        path: `M${cx},${cy - R} A${R},${R} 0 1 1 ${cx - 0.01},${cy - R}` }, dot);
      U.svg('animate', { attributeName: 'fill', dur: '7.5s', repeatCount: 'indefinite', calcMode: 'discrete',
        values: segCols.join(';'), keyTimes: '0;0.2;0.4;0.6;0.8' }, dot);
    }
    return {};
  });

  /* ------------------------------------------------------------ single neuron */
  Deck.widget('neuron', el => {
    const xs = [0.8, -0.5, 0.3];
    const st = { w: [1.2, 0.4, -0.7], b: 0.1, f: 'relu' };
    const F = {
      linear: { fn: a => a, name: 'linear', lo: -4.5, hi: 4.5 },
      sigmoid: { fn: a => 1 / (1 + Math.exp(-a)), name: 'sigmoid', lo: -0.15, hi: 1.15 },
      relu: { fn: a => Math.max(0, a), name: 'ReLU', lo: -0.6, hi: 4.5 }
    };
    el.style.display = 'grid';
    el.style.gridTemplateColumns = '1.35fr 1fr';
    el.style.gap = '26px';
    el.style.fontSize = '0.68em';
    const left = h('div', {}, el), right = h('div', {}, el);
    const svg = U.svg('svg', { viewBox: '0 0 640 290', role: 'img', 'aria-label': 'A neuron with three inputs, adjustable weights, a summation and a transfer function' }, left);
    const inY = [55, 145, 235];
    const edges = [], wLabels = [];
    inY.forEach((y, i) => {
      edges.push(U.svg('line', { x1: 92, y1: y, x2: 300, y2: 145, stroke: C.purple }, svg));
      wLabels.push(U.svg('text', { x: 168, y: y + (145 - y) * 0.35 - 10, 'font-size': 19, fill: C.purple, 'font-weight': 700, 'text-anchor': 'middle' }, svg));
    });
    U.svg('line', { x1: 345, y1: 145, x2: 420, y2: 145, stroke: C.ink, 'stroke-width': 2.5 }, svg);
    U.svg('line', { x1: 500, y1: 145, x2: 560, y2: 145, stroke: C.amber, 'stroke-width': 4 }, svg);
    inY.forEach((y, i) => {
      U.svg('circle', { cx: 62, cy: y, r: 30, fill: C.amberTint, stroke: C.amber, 'stroke-width': 3 }, svg);
      const t = U.svg('text', { x: 62, y: y + 7, 'text-anchor': 'middle', 'font-size': 19, 'font-weight': 700, fill: C.amberText }, svg);
      t.textContent = xs[i].toFixed(1);
      const l = U.svg('text', { x: 18, y: y - 30, 'font-size': 15, fill: C.soft }, svg);
      l.textContent = 'x' + '\u2081\u2082\u2083'[i];
    });
    U.svg('circle', { cx: 322, cy: 145, r: 34, fill: C.panel, stroke: C.ink, 'stroke-width': 3 }, svg);
    const sig = U.svg('text', { x: 322, y: 156, 'text-anchor': 'middle', 'font-size': 32, fill: C.ink }, svg); sig.textContent = '\u03A3';
    const bT = U.svg('text', { x: 322, y: 210, 'text-anchor': 'middle', 'font-size': 17, fill: C.purple, 'font-weight': 700 }, svg);
    U.svg('rect', { x: 420, y: 115, width: 80, height: 60, rx: 8, fill: C.ink }, svg);
    const fT = U.svg('text', { x: 460, y: 152, 'text-anchor': 'middle', 'font-size': 18, fill: C.paper, 'font-weight': 700 }, svg);
    U.svg('circle', { cx: 592, cy: 145, r: 32, fill: C.amberTint, stroke: C.amber, 'stroke-width': 3 }, svg);
    const yT = U.svg('text', { x: 592, y: 152, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, fill: C.amberText }, svg);
    const aT = U.svg('text', { x: 384, y: 126, 'text-anchor': 'middle', 'font-size': 16, fill: C.soft }, svg);

    const sl = h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:8px 22px;margin-top:6px' }, left);
    const sliders = [];
    ['w\u2081', 'w\u2082', 'w\u2083', 'b'].forEach((name, i) => {
      const lab = h('label', {}, sl);
      h('span', { class: 'c-purple', style: 'min-width:26px' }, lab, name);
      const inp = h('input', { type: 'range', min: -2, max: 2, step: 0.1, 'aria-label': 'weight ' + name }, lab);
      inp.value = i < 3 ? st.w[i] : st.b;
      const out = h('span', { style: 'font-family:var(--font-mono);min-width:48px' }, lab);
      sliders.push({ inp, out, i });
      inp.addEventListener('input', () => { if (i < 3) st.w[i] = +inp.value; else st.b = +inp.value; draw(); });
    });

    const fbar = h('div', { class: 'wctl', style: 'margin-top:0' }, right);
    const fbtns = {};
    Object.keys(F).forEach(k => {
      fbtns[k] = h('button', { type: 'button' }, fbar, F[k].name);
      fbtns[k].addEventListener('click', () => { st.f = k; draw(); });
    });
    const plot = U.svg('svg', { viewBox: '0 0 360 230', style: 'margin-top:10px;background:#fff;border:1px solid var(--line);border-radius:6px' }, right);
    const curve = U.svg('path', { fill: 'none', stroke: C.amber, 'stroke-width': 3.5 }, plot);
    const ax = U.svg('g', {}, plot);
    const guide = U.svg('line', { stroke: C.faint, 'stroke-dasharray': '4 4' }, plot);
    const dot = U.svg('circle', { r: 8, fill: C.amber, stroke: C.ink, 'stroke-width': 2 }, plot);
    const read = h('div', { class: 'readout', style: 'margin-top:10px' }, right);

    function draw() {
      const a = xs.reduce((s, x, i) => s + st.w[i] * x, st.b);
      const f = F[st.f], y = f.fn(a);
      edges.forEach((e, i) => {
        e.setAttribute('stroke-width', 1 + 4 * Math.abs(st.w[i]));
        e.setAttribute('stroke-dasharray', st.w[i] < 0 ? '8 6' : '');
        e.setAttribute('stroke-opacity', 0.35 + 0.65 * Math.min(1, Math.abs(st.w[i]) / 2));
        wLabels[i].textContent = U.fmt(st.w[i], 1);
      });
      sliders.forEach(s => s.out.textContent = U.fmt(+s.inp.value, 1));
      bT.textContent = 'b = ' + U.fmt(st.b, 1);
      fT.textContent = f.name;
      aT.textContent = 'a = ' + U.fmt(a, 2);
      yT.textContent = U.fmt(y, 2);
      Object.keys(fbtns).forEach(k => fbtns[k].setAttribute('aria-pressed', k === st.f));
      // plot of f on a in [-4, 4]
      const X = v => 20 + (v + 4) / 8 * 320, Y = v => 210 - (v - f.lo) / (f.hi - f.lo) * 190;
      let d = '';
      for (let i = 0; i <= 160; i++) { const v = -4 + i * 0.05; d += (i ? 'L' : 'M') + X(v).toFixed(1) + ',' + Y(f.fn(v)).toFixed(1); }
      curve.setAttribute('d', d);
      ax.innerHTML = '';
      U.svg('line', { x1: 20, x2: 340, y1: Y(0), y2: Y(0), stroke: C.line, 'stroke-width': 1.5 }, ax);
      U.svg('line', { x1: X(0), x2: X(0), y1: 20, y2: 210, stroke: C.line, 'stroke-width': 1.5 }, ax);
      const lbl = U.svg('text', { x: 336, y: Y(0) - 6, 'text-anchor': 'end', 'font-size': 14, fill: C.soft }, ax); lbl.textContent = 'a';
      const ac = Math.max(-4, Math.min(4, a)), yc = Math.max(f.lo, Math.min(f.hi, f.fn(ac)));
      guide.setAttribute('x1', X(ac)); guide.setAttribute('x2', X(ac)); guide.setAttribute('y1', Y(0)); guide.setAttribute('y2', Y(yc));
      dot.setAttribute('cx', X(ac)); dot.setAttribute('cy', Y(yc));
      const terms = xs.map((x, i) => `${U.fmt(x, 1)}\u00D7(${U.fmt(st.w[i], 1)})`).join(' + ');
      read.innerHTML = `a = ${terms} + (${U.fmt(st.b, 1)})<br>&nbsp;&nbsp;= <b>${U.fmt(a, 2)}</b><br>y = ${f.name}(a) = <b style="color:var(--amber-text)">${U.fmt(y, 3)}</b>`;
    }
    draw();
    return {};
  });

  /* ------------------------------------------------------------ activation plots */
  Deck.widget('actplots', el => {
    el.style.display = 'grid'; el.style.gridTemplateColumns = 'repeat(3, 1fr)'; el.style.gap = '24px';
    const defs = [
      ['Linear', a => a, -6, 6],
      ['Sigmoid', a => 1 / (1 + Math.exp(-a)), -0.1, 1.1],
      ['ReLU', a => Math.max(0, a), -0.6, 6]
    ];
    defs.forEach(([name, fn, lo, hi]) => {
      const s = U.svg('svg', { viewBox: '0 0 380 230', role: 'img', 'aria-label': name + ' function plot', style: 'background:#fff;border:1px solid var(--line);border-radius:8px' }, el);
      const X = v => 24 + (v + 6) / 12 * 340, Y = v => 205 - (v - lo) / (hi - lo) * 175;
      for (let g = -6; g <= 6; g += 2) U.svg('line', { x1: X(g), x2: X(g), y1: 25, y2: 205, stroke: '#EEF1F4' }, s);
      U.svg('line', { x1: 24, x2: 364, y1: Y(0), y2: Y(0), stroke: C.faint, 'stroke-width': 1.5 }, s);
      U.svg('line', { x1: X(0), x2: X(0), y1: 25, y2: 205, stroke: C.faint, 'stroke-width': 1.5 }, s);
      if (name === 'Sigmoid') {
        U.svg('line', { x1: 24, x2: 364, y1: Y(1), y2: Y(1), stroke: C.faint, 'stroke-dasharray': '4 4' }, s);
        const t = U.svg('text', { x: 30, y: Y(1) - 6, 'font-size': 14, fill: C.soft }, s); t.textContent = '1';
      }
      let d = '';
      for (let i = 0; i <= 240; i++) { const v = -6 + i * 0.05; d += (i ? 'L' : 'M') + X(v).toFixed(1) + ',' + Y(fn(v)).toFixed(1); }
      U.svg('path', { d, fill: 'none', stroke: C.amber, 'stroke-width': 4, 'stroke-linejoin': 'round' }, s);
      const t = U.svg('text', { x: 34, y: 22, 'font-size': 18, 'font-weight': 700, fill: C.ink }, s); t.textContent = name;
    });
    return {};
  });

  /* ------------------------------------------------------------ cross-entropy curve */
  Deck.widget('celoss', el => {
    const s = U.svg('svg', { viewBox: '0 0 460 360', role: 'img', 'aria-label': 'Cross-entropy loss minus log p falls from large values near p equals 0 to zero at p equals 1' }, el);
    const X = p => 60 + p * 370, Y = v => 300 - v / 5 * 270;
    U.svg('rect', { x: 60, y: 30, width: 370, height: 270, fill: '#fff', stroke: C.line }, s);
    [0, 1, 2, 3, 4, 5].forEach(v => { const t = U.svg('text', { x: 50, y: Y(v) + 5, 'text-anchor': 'end', 'font-size': 14, fill: C.soft }, s); t.textContent = v; });
    [0, 0.5, 1].forEach(p => { const t = U.svg('text', { x: X(p), y: 320, 'text-anchor': 'middle', 'font-size': 14, fill: C.soft }, s); t.textContent = p; });
    const xl = U.svg('text', { x: 245, y: 350, 'text-anchor': 'middle', 'font-size': 15, fill: C.ink }, s); xl.textContent = 'probability given to the correct class';
    const yl = U.svg('text', { x: 18, y: 165, 'text-anchor': 'middle', 'font-size': 15, fill: C.ink, transform: 'rotate(-90 18 165)' }, s); yl.textContent = 'loss \u2212log p';
    let d = '';
    for (let i = 0; i <= 200; i++) { const p = 0.0068 + i * (1 - 0.0068) / 200; d += (i ? 'L' : 'M') + X(p).toFixed(1) + ',' + Y(-Math.log(p)).toFixed(1); }
    U.svg('path', { d, fill: 'none', stroke: C.red, 'stroke-width': 4 }, s);
    [[0.05, 'confident and wrong', C.red, 'start', 14], [0.5, 'unsure', C.ink, 'start', 12], [0.95, 'right and sure', C.teal, 'end', -4]].forEach(([p, txt, col, anc, dx]) => {
      const y = Y(-Math.log(p));
      U.svg('circle', { cx: X(p), cy: y, r: 7, fill: col }, s);
      const t = U.svg('text', { x: X(p) + dx, y: y - 12, 'text-anchor': anc, 'font-size': 15, 'font-weight': 700, fill: col }, s);
      t.textContent = `${txt}: ${(-Math.log(p)).toFixed(2)}`;
    });
    return {};
  });

  /* ------------------------------------------------------------ 1-D gradient descent */
  Deck.widget('gd1d', el => {
    const W = 600, H = 340;
    const cv = h('canvas', { role: 'img', 'aria-label': 'A ball stepping down a parabola by gradient descent' }, el);
    const ctx = U.hidpi(cv, W, H);
    const controls = h('div', { class: 'wctl' }, el);
    const sel = h('select', { 'aria-label': 'learning rate' }, controls);
    [['0.1', '\u03B7 = 0.1  (too small)'], ['0.6', '\u03B7 = 0.6  (about right)'], ['1.8', '\u03B7 = 1.8  (oscillates)'], ['2.1', '\u03B7 = 2.1  (diverges)']]
      .forEach(([v, t]) => { const o = h('option', { value: v }, sel, t); if (v === '0.6') o.selected = true; });
    const bStep = h('button', { type: 'button' }, controls, 'Step');
    const bRun = h('button', { type: 'button', class: 'primary' }, controls, 'Run 10 steps');
    const bReset = h('button', { type: 'button' }, controls, 'Reset');
    const read = h('div', { class: 'readout', style: 'margin-top:8px' }, el);
    const L = w => 0.5 * (w - 2) ** 2 + 0.3, dL = w => w - 2;
    const X = w => 50 + (w + 1.5) / 7 * 530, Y = v => 310 - v / 7 * 275;
    let path, timer;
    function reset() { clearInterval(timer); path = [-1]; draw(); }
    function step() {
      const w = path[path.length - 1];
      if (Math.abs(w) > 30) return;
      path.push(w - (+sel.value) * dL(w)); draw();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.fillRect(40, 30, 550, 280);
      ctx.strokeStyle = C.line; ctx.strokeRect(40, 30, 550, 280);
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const w = -1.5 + i * 0.035; const y = Y(L(w)); i ? ctx.lineTo(X(w), y) : ctx.moveTo(X(w), y); }
      ctx.strokeStyle = C.red; ctx.lineWidth = 3.5; ctx.stroke();
      ctx.fillStyle = C.soft; ctx.font = '15px Atkinson Hyperlegible, sans-serif';
      ctx.fillText('loss L(w)', 42, 20); ctx.fillText('weight w', 528, 332);
      ctx.save(); ctx.beginPath(); ctx.rect(40, 30, 550, 280); ctx.clip();
      // trail
      ctx.lineWidth = 1.5; ctx.strokeStyle = C.purple; ctx.setLineDash([5, 4]);
      ctx.beginPath();
      path.forEach((w, i) => { const p = [X(w), Y(L(w))]; i ? ctx.lineTo(...p) : ctx.moveTo(...p); });
      ctx.stroke(); ctx.setLineDash([]);
      path.forEach((w, i) => {
        ctx.beginPath(); ctx.arc(X(w), Y(L(w)), i === path.length - 1 ? 10 : 4.5, 0, 7);
        ctx.fillStyle = i === path.length - 1 ? C.purple : 'rgba(104,36,109,0.45)'; ctx.fill();
      });
      // tangent at current point
      const w = path[path.length - 1];
      if (Math.abs(w) < 8) {
        const g = dL(w);
        ctx.beginPath(); ctx.moveTo(X(w - 0.9), Y(L(w) - 0.9 * g)); ctx.lineTo(X(w + 0.9), Y(L(w) + 0.9 * g));
        ctx.strokeStyle = C.teal; ctx.lineWidth = 3; ctx.stroke();
      }
      ctx.restore();
      const diverged = Math.abs(w) > 8;
      read.innerHTML = `step ${path.length - 1} &nbsp; w = ${U.fmt(w, 3)} &nbsp; L = ${diverged ? '\u2014' : U.fmt(L(w), 3)} &nbsp; <span style="color:var(--teal)">slope L\u2032(w) = ${U.fmt(dL(w), 3)}</span>` + (diverged ? ' &nbsp; <b style="color:var(--red)">diverged</b>' : '');
    }
    bStep.addEventListener('click', step);
    bRun.addEventListener('click', () => { clearInterval(timer); let k = 0; timer = setInterval(() => { step(); if (++k >= 10) clearInterval(timer); }, 380); });
    bReset.addEventListener('click', reset);
    sel.addEventListener('change', reset);
    reset();
    return { leave() { clearInterval(timer); } };
  });

  /* ------------------------------------------------------------ worked example data */
  const EX = { X: [[0.1, 0.01], [0.3, 0.09], [0.6, 0.36], [0.7, 0.49]], Y: [0.2, 0.25, 0.4, 0.7] };
  EX.pred = w => EX.X.map(x => w[0] * x[0] + w[1] * x[1]);
  EX.mse = w => EX.pred(w).reduce((s, p, i) => s + (p - EX.Y[i]) ** 2, 0) / 4;
  EX.grad = w => {
    const p = EX.pred(w); const g = [0, 0];
    p.forEach((pi, i) => { const e = pi - EX.Y[i]; g[0] += 2 * e * EX.X[i][0] / 4; g[1] += 2 * e * EX.X[i][1] / 4; });
    return g;
  };
  EX.run = (n, lr = 0.3) => { let w = [0.5, 0.1]; for (let k = 0; k < n; k++) { const g = EX.grad(w); w = [w[0] - lr * g[0], w[1] - lr * g[1]]; } return w; };

  /* ------------------------------------------------------------ predicted vs actual bars */
  Deck.widget('fitbars', el => {
    const leg = h('div', { class: 'legend' }, el);
    leg.innerHTML = '<span><i style="background:var(--ink)"></i>target Y</span><span><i style="background:var(--amber)"></i>prediction \u0177</span>';
    const bars = h('div', { class: 'bars', style: 'margin-top:30px' }, el);
    const items = EX.Y.map(y => {
      const g = h('div', { class: 'grp' }, bars);
      const a = h('div', { class: 'bar', style: `background:var(--ink);height:${y / 0.8 * 100}%` }, g, `<span>${y.toFixed(2)}</span>`);
      const p = h('div', { class: 'bar', style: 'background:var(--amber)' }, g, '<span></span>');
      return p;
    });
    const xl = h('div', { class: 'bars-x' }, el);
    EX.Y.forEach((_, i) => h('div', {}, xl, 'sample ' + (i + 1)));
    const controls = h('div', { class: 'wctl' }, el);
    const iters = [0, 1, 10, 100, 1000];
    const btns = iters.map(n => {
      const b = h('button', { type: 'button' }, controls, n === 0 ? 'Iteration 0' : String(n));
      b.addEventListener('click', () => show(n));
      return b;
    });
    const read = h('div', { class: 'readout', style: 'margin-top:8px' }, el);
    function show(n) {
      const w = EX.run(n), p = EX.pred(w);
      items.forEach((b, i) => { b.style.height = (p[i] / 0.8 * 100) + '%'; b.querySelector('span').textContent = p[i].toFixed(3); });
      btns.forEach((b, i) => b.setAttribute('aria-pressed', iters[i] === n));
      read.innerHTML = `after ${n} iteration${n === 1 ? '' : 's'}: w\u2081\u2081 = ${w[0].toFixed(4)}, w\u2082\u2081 = ${w[1].toFixed(4)}, <span style="color:var(--red)">MSE = ${EX.mse(w).toFixed(4)}</span>`;
    }
    show(0);
    return { trigger(name, on) { if (name === 'fit-iter1') show(on ? 1 : 0); } };
  });

  /* ------------------------------------------------------------ loss landscape */
  Deck.widget('landscape', el => {
    el.style.display = 'grid'; el.style.gridTemplateColumns = '640px 1fr'; el.style.gap = '26px'; el.style.fontSize = '0.68em';
    const left = h('div', {}, el), right = h('div', {}, el);
    const W = 640, H = 470, px0 = 56, py0 = 10, pw = 570, ph = 410;
    const D = { a0: -0.2, a1: 1.8, b0: -1.0, b1: 1.2 };
    const cv = h('canvas', { role: 'img', 'aria-label': 'Contour map of the mean squared error over the two weights, with the gradient descent path', style: 'cursor:crosshair', 'data-prevent-swipe': '' }, left);
    const ctx = U.hidpi(cv, W, H);
    const toX = a => px0 + (a - D.a0) / (D.a1 - D.a0) * pw, toY = b => py0 + (1 - (b - D.b0) / (D.b1 - D.b0)) * ph;
    const fromX = x => D.a0 + (x - px0) / pw * (D.a1 - D.a0), fromY = y => D.b0 + (1 - (y - py0) / ph) * (D.b1 - D.b0);
    // background heat map, computed once
    const bg = document.createElement('canvas'); bg.width = pw; bg.height = ph;
    const bctx = bg.getContext('2d'), img = bctx.createImageData(pw, ph);
    const lmin = Math.log10(0.0089), lmax = Math.log10(EX.mse([D.a0, D.b0]) * 1.2);
    const vals = new Float32Array(pw * ph);
    for (let j = 0; j < ph; j++) for (let i = 0; i < pw; i++) {
      const v = (Math.log10(EX.mse([D.a0 + i / pw * (D.a1 - D.a0), D.b1 - j / ph * (D.b1 - D.b0)])) - lmin) / (lmax - lmin);
      vals[j * pw + i] = Math.max(0, Math.min(1, v));
    }
    const lerp = (a, b, t) => a + (b - a) * t;
    const stops = [[246, 247, 244], [226, 210, 228], [160, 100, 165], [104, 36, 109]];
    for (let k = 0; k < vals.length; k++) {
      const v = vals[k], s = Math.min(2.999, v * 3), si = Math.floor(s), t = s - si;
      const c0 = stops[si], c1 = stops[si + 1];
      let r = lerp(c0[0], c1[0], t), g = lerp(c0[1], c1[1], t), b = lerp(c0[2], c1[2], t);
      const i = k % pw, j = (k / pw) | 0;
      const band = Math.floor(v * 14);
      if ((i + 1 < pw && Math.floor(vals[k + 1] * 14) !== band) || (j + 1 < ph && Math.floor(vals[k + pw] * 14) !== band)) { r *= 0.72; g *= 0.72; b *= 0.72; }
      img.data[4 * k] = r; img.data[4 * k + 1] = g; img.data[4 * k + 2] = b; img.data[4 * k + 3] = 255;
    }
    bctx.putImageData(img, 0, 0);
    const wStar = [0.7978, 0.1143];

    const controls = h('div', { class: 'wctl', style: 'margin-top:0' }, right);
    const sel = h('select', { 'aria-label': 'learning rate' }, controls);
    [['0.3', '\u03B7 = 0.3 (as in the example)'], ['1.5', '\u03B7 = 1.5'], ['3.0', '\u03B7 = 3.0 (on the edge)'], ['3.1', '\u03B7 = 3.1 (diverges)']].forEach(([v, t]) => h('option', { value: v }, sel, t));
    const mLab = h('label', { style: 'margin-left:4px' }, controls);
    const mom = h('input', { type: 'checkbox' }, mLab); h('span', {}, mLab, 'momentum \u03BC = 0.9');
    const c2 = h('div', { class: 'wctl' }, right);
    const bStep = h('button', { type: 'button' }, c2, 'Step');
    const bRun = h('button', { type: 'button', class: 'primary' }, c2, 'Run 100');
    const bRun2 = h('button', { type: 'button' }, c2, 'Run 1000');
    const bReset = h('button', { type: 'button' }, c2, 'Reset');
    const read = h('div', { class: 'readout', style: 'margin-top:12px' }, right);
    const hc = h('canvas', { 'aria-hidden': 'true', style: 'margin-top:12px;border:1px solid var(--line);border-radius:6px;background:#fff' }, right);
    const hctx = U.hidpi(hc, 460, 140);
    h('div', { class: 'hint' }, right, 'Click the map to start from another point. The valley is long and narrow because X\u2082 = X\u2081\u00B2, so the two inputs are strongly correlated: a step size that is safe across the valley is tiny along it.');

    let w, v, hist, raf, start = [0.5, 0.1], diverged;
    function reset() { cancelAnimationFrame(raf); w = start.slice(); v = [0, 0]; hist = [{ w: w.slice(), L: EX.mse(w) }]; diverged = false; draw(); }
    function step() {
      if (diverged) return;
      const lr = +sel.value, mu = mom.checked ? 0.9 : 0, g = EX.grad(w);
      v = [mu * v[0] - lr * g[0], mu * v[1] - lr * g[1]];
      w = [w[0] + v[0], w[1] + v[1]];
      const L = EX.mse(w);
      if (!isFinite(L) || L > 50) diverged = true;
      hist.push({ w: w.slice(), L });
    }
    function run(n, perFrame) {
      cancelAnimationFrame(raf);
      let k = 0;
      const tick = () => { for (let i = 0; i < perFrame && k < n; i++, k++) step(); draw(); if (k < n && !diverged) raf = requestAnimationFrame(tick); };
      tick();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(bg, px0, py0, pw, ph);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(px0, py0, pw, ph);
      ctx.fillStyle = C.soft; ctx.font = '14px Atkinson Hyperlegible, sans-serif'; ctx.textAlign = 'center';
      for (let a = 0; a <= 1.81; a += 0.4) { ctx.fillText(a.toFixed(1), toX(a), py0 + ph + 20); }
      ctx.textAlign = 'right';
      for (let b = -1; b <= 1.21; b += 0.4) { ctx.fillText(b.toFixed(1), px0 - 8, toY(b) + 5); }
      ctx.textAlign = 'center'; ctx.fillStyle = C.ink; ctx.font = 'bold 16px Atkinson Hyperlegible, sans-serif';
      ctx.fillText('w\u2081\u2081', px0 + pw / 2, py0 + ph + 44);
      ctx.save(); ctx.translate(16, py0 + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('w\u2082\u2081', 0, 0); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(px0, py0, pw, ph); ctx.clip();
      // minimum
      ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
      const sx = toX(wStar[0]), sy = toY(wStar[1]);
      ctx.beginPath(); ctx.moveTo(sx - 8, sy - 8); ctx.lineTo(sx + 8, sy + 8); ctx.moveTo(sx + 8, sy - 8); ctx.lineTo(sx - 8, sy + 8); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.font = '14px Atkinson Hyperlegible, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('minimum, MSE 0.0090', sx + 12, sy + 22);
      // path
      ctx.strokeStyle = C.purple; ctx.lineWidth = 2.2; ctx.beginPath();
      hist.forEach((p, i) => { const x = toX(p.w[0]), y = toY(p.w[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      if (hist.length < 400) hist.forEach(p => { ctx.beginPath(); ctx.arc(toX(p.w[0]), toY(p.w[1]), 2.6, 0, 7); ctx.fillStyle = C.purple; ctx.fill(); });
      // start
      ctx.beginPath(); ctx.arc(toX(start[0]), toY(start[1]), 7, 0, 7); ctx.fillStyle = C.amber; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      // current + negative gradient arrow
      if (!diverged) {
        const g = EX.grad(w), cx = toX(w[0]), cy = toY(w[1]);
        const dx = -g[0] / (D.a1 - D.a0) * pw, dy = g[1] / (D.b1 - D.b0) * ph;
        const len = Math.hypot(dx, dy) || 1, s = Math.min(70, 40 + 400 * len / pw) / len;
        const ex = cx + dx * s, ey = cy + dy * s;
        ctx.strokeStyle = C.teal; ctx.fillStyle = C.teal; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
        const an = Math.atan2(ey - cy, ex - cx);
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 11 * Math.cos(an - 0.45), ey - 11 * Math.sin(an - 0.45)); ctx.lineTo(ex - 11 * Math.cos(an + 0.45), ey - 11 * Math.sin(an + 0.45)); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 7); ctx.fillStyle = C.purple; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.restore();
      // history (log scale)
      hctx.clearRect(0, 0, 460, 140);
      const n = hist.length, lo = Math.log10(0.008), hi = Math.log10(Math.max(0.05, ...hist.map(p => Math.min(p.L, 50))));
      hctx.strokeStyle = C.red; hctx.lineWidth = 2; hctx.beginPath();
      hist.forEach((p, i) => {
        const x = 34 + i / Math.max(1, n - 1) * 416, y = 125 - (Math.log10(Math.min(p.L, 50)) - lo) / (hi - lo) * 110;
        i ? hctx.lineTo(x, y) : hctx.moveTo(x, y);
      });
      hctx.stroke();
      hctx.fillStyle = C.soft; hctx.font = '13px Atkinson Hyperlegible, sans-serif'; hctx.textAlign = 'left';
      hctx.fillText('MSE (log scale) vs iteration', 40, 16);
      const last = hist[n - 1];
      read.innerHTML = diverged
        ? `iteration ${n - 1}<br><b style="color:var(--red)">Diverged.</b> The step overshoots the steep direction and grows every iteration.`
        : `iteration ${n - 1}<br><span style="color:var(--purple)">w\u2081\u2081 = ${last.w[0].toFixed(4)}, w\u2082\u2081 = ${last.w[1].toFixed(4)}</span><br><span style="color:var(--red)">MSE = ${last.L.toFixed(5)}</span>`;
    }
    cv.addEventListener('click', ev => {
      const p = U.canvasPoint(cv, ev);
      if (p.x < px0 || p.x > px0 + pw || p.y < py0 || p.y > py0 + ph) return;
      start = [fromX(p.x), fromY(p.y)]; reset();
    });
    bStep.addEventListener('click', () => { step(); draw(); });
    bRun.addEventListener('click', () => run(100, 2));
    bRun2.addEventListener('click', () => run(1000, 20));
    bReset.addEventListener('click', () => { start = [0.5, 0.1]; reset(); });
    sel.addEventListener('change', reset);
    mom.addEventListener('change', reset);
    reset();
    return { leave() { cancelAnimationFrame(raf); } };
  });

  /* ------------------------------------------------------------ MNIST drawing pad */
  Deck.widget('pad', el => {
    const N = 28, CELL = 12, S = N * CELL;
    const data = new Float32Array(N * N);
    const cv = h('canvas', { class: 'pad', role: 'img', 'aria-label': '28 by 28 pixel drawing pad', 'data-prevent-swipe': '' }, el);
    const ctx = U.hidpi(cv, S, S);
    const controls = h('div', { class: 'wctl' }, el);
    const bClear = h('button', { type: 'button' }, controls, 'Clear');
    const b7 = h('button', { type: 'button' }, controls, 'Draw a 7');
    const bNorm = h('button', { type: 'button', 'aria-pressed': 'false' }, controls, 'Scale to 0–1');
    const host = document.getElementById('strip-host') || el;
    const sw = h('div', { class: 'widget strip-wrap' }, host);
    const read = h('div', { class: 'readout', style: 'margin-bottom:12px;min-height:3.4em' }, sw);
    h('div', { class: 'small', style: 'margin-bottom:4px' }, sw, 'The same image flattened row by row into a vector of 784 numbers:');
    const strip = h('canvas', { 'aria-hidden': 'true', style: 'border:1px solid var(--ink);border-radius:3px' }, sw);
    const sctx = U.hidpi(strip, 784, 40);
    const sLab = h('div', { class: 'hint' }, sw, 'index 0 \u2026 783; ticks mark the start of each image row');
    let hover = -1, norm = false, down = false, last = null;

    function brush(fx, fy) {
      for (let r = Math.floor(fy - 2); r <= fy + 2; r++) for (let c = Math.floor(fx - 2); c <= fx + 2; c++) {
        if (r < 0 || c < 0 || r >= N || c >= N) continue;
        const d2 = (c + 0.5 - fx) ** 2 + (r + 0.5 - fy) ** 2;
        data[r * N + c] = Math.min(1, data[r * N + c] + 0.55 * Math.exp(-d2 / 0.9));
      }
    }
    function stroke(a, b) {
      const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 3));
      for (let k = 0; k <= n; k++) brush(a.x + (b.x - a.x) * k / n, a.y + (b.y - a.y) * k / n);
    }
    function seven() {
      data.fill(0);
      stroke({ x: 7, y: 7 }, { x: 21, y: 7 });
      stroke({ x: 21, y: 7 }, { x: 13, y: 23 });
      stroke({ x: 11.5, y: 15 }, { x: 18.5, y: 15 });
      draw();
    }
    function draw() {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, S, S);
      for (let k = 0; k < N * N; k++) {
        const v = Math.round(data[k] * 255);
        if (!v) continue;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect((k % N) * CELL, Math.floor(k / N) * CELL, CELL, CELL);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
      for (let i = 1; i < N; i++) {
        ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, S); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(S, i * CELL); ctx.stroke();
      }
      if (hover >= 0) {
        ctx.strokeStyle = C.amber; ctx.lineWidth = 3;
        ctx.strokeRect((hover % N) * CELL + 1.5, Math.floor(hover / N) * CELL + 1.5, CELL - 3, CELL - 3);
        ctx.strokeStyle = 'rgba(224,154,18,0.5)'; ctx.lineWidth = 1;
        ctx.strokeRect(0.5, Math.floor(hover / N) * CELL + 0.5, S - 1, CELL - 1);
      }
      sctx.fillStyle = '#000'; sctx.fillRect(0, 0, 784, 40);
      for (let k = 0; k < N * N; k++) {
        const v = Math.round(data[k] * 255);
        if (v) { sctx.fillStyle = `rgb(${v},${v},${v})`; sctx.fillRect(k, 6, 1, 34); }
      }
      sctx.fillStyle = C.amber;
      for (let r = 0; r < N; r++) sctx.fillRect(r * N, 0, 1, 5);
      if (hover >= 0) { sctx.fillStyle = C.amber; sctx.fillRect(hover - 1, 0, 3, 40); }
      const nz = data.reduce((s, v) => s + (v > 0.02 ? 1 : 0), 0);
      if (hover >= 0) {
        const r = Math.floor(hover / N), c = hover % N, v = data[hover];
        read.innerHTML = `pixel (row ${r}, column ${c}) \u2192 vector index ${r} \u00D7 28 + ${c} = <b>${hover}</b><br>value: <b style="color:var(--amber-text)">${norm ? (Math.round(v * 255) / 255).toFixed(3) + '  (float32)' : Math.round(v * 255) + '  (uint8)'}</b>`;
      } else {
        read.innerHTML = `${nz} of 784 pixels are non-zero.<br>Draw with the mouse; hover over a pixel to see its value.`;
      }
    }
    const cell = ev => { const p = U.canvasPoint(cv, ev); return { x: p.x / CELL, y: p.y / CELL }; };
    cv.addEventListener('pointerdown', ev => { down = true; cv.setPointerCapture(ev.pointerId); last = cell(ev); brush(last.x, last.y); draw(); ev.preventDefault(); ev.stopPropagation(); });
    cv.addEventListener('pointermove', ev => {
      const p = cell(ev);
      const r = Math.floor(p.y), c = Math.floor(p.x);
      hover = r >= 0 && c >= 0 && r < N && c < N ? r * N + c : -1;
      if (down) { stroke(last, p); last = p; }
      draw();
    });
    cv.addEventListener('pointerup', () => { down = false; });
    cv.addEventListener('pointerleave', () => { hover = -1; draw(); });
    bClear.addEventListener('click', () => { data.fill(0); draw(); });
    b7.addEventListener('click', seven);
    bNorm.addEventListener('click', () => {
      norm = !norm; bNorm.setAttribute('aria-pressed', norm);
      bNorm.textContent = norm ? 'Show as 0–255' : 'Scale to 0–1';
      draw();
    });
    seven();
    return {};
  });

  /* ------------------------------------------------------------ tensor cells */
  Deck.widget('tensors', el => {
    el.querySelectorAll('.cells[data-shape]').forEach(box => {
      const sh = box.dataset.shape.split(',').map(Number);
      const rows = sh.length === 2 ? sh[0] : 1, cols = sh.length === 2 ? sh[1] : sh[0];
      box.style.gridTemplateColumns = `repeat(${cols}, 26px)`;
      for (let k = 0; k < rows * cols; k++) {
        const c = h('div', { class: 'cell' }, box);
        if (rows * cols === 1) { c.textContent = '7'; c.style.cssText = 'display:grid;place-items:center;font-weight:700;color:var(--amber-text);width:40px;height:40px'; }
      }
    });
    el.querySelectorAll('.tstack[data-shape]').forEach(st => {
      const [d, r, c] = st.dataset.shape.split(',').map(Number);
      for (let k = d - 1; k >= 0; k--) {
        const g = h('div', { class: 'cells', style: `grid-template-columns:repeat(${c}, 22px);left:${k * 22}px;top:${(d - 1 - k) * 22}px` }, st);
        for (let i = 0; i < r * c; i++) h('div', { class: 'cell', style: `width:22px;height:22px;opacity:${1 - k * 0.22}` }, g);
      }
    });
    return {};
  });

  /* ------------------------------------------------------------ softmax */
  Deck.widget('softmax', el => {
    const z = [-1.2, 0.3, 1.1, 0.8, -2.0, 0.1, -1.5, 4.2, 0.6, 1.4];
    const ez = z.map(Math.exp), sum = ez.reduce((a, b) => a + b, 0), p = ez.map(e => e / sum);
    const Hh = 300;
    const wrap = h('div', { style: `position:relative;height:${Hh}px;border-left:2px solid var(--ink);margin-top:34px` }, el);
    const zero = h('div', { style: 'position:absolute;left:0;right:0;height:2px;background:var(--ink);transition:top .9s cubic-bezier(.6,0,.2,1)' }, wrap);
    const bars = z.map((_, i) => {
      const b = h('div', { style: `position:absolute;left:${3 + i * 9.6}%;width:7%;border-radius:3px;transition:top .9s cubic-bezier(.6,0,.2,1),height .9s cubic-bezier(.6,0,.2,1),background .6s;background:${i === 7 ? 'var(--amber)' : '#E9C98A'}` }, wrap);
      const lab = h('span', { style: 'position:absolute;left:50%;transform:translateX(-50%);font-size:0.95em;white-space:nowrap;font-variant-numeric:tabular-nums;transition:top .9s' }, b);
      return { b, lab };
    });
    const xl = h('div', { style: 'position:relative;height:28px' }, el);
    z.forEach((_, i) => h('div', { style: `position:absolute;left:${3 + i * 9.6}%;width:7%;text-align:center;font-weight:${i === 7 ? 700 : 400}` }, xl, String(i)));
    const controls = h('div', { class: 'wctl' }, el);
    const btn = h('button', { type: 'button', class: 'primary' }, controls, 'Apply softmax');
    const read = h('div', { class: 'readout', style: 'margin-top:8px' }, el);
    let on = false;
    function draw() {
      const lo = on ? 0 : -2.5, hi = on ? 1 : 4.5;
      const Y = v => (hi - v) / (hi - lo) * Hh;
      zero.style.top = Y(0) + 'px';
      bars.forEach(({ b, lab }, i) => {
        const v = on ? p[i] : z[i];
        const top = Math.min(Y(v), Y(0)), ht = Math.max(2, Math.abs(Y(v) - Y(0)));
        b.style.top = top + 'px'; b.style.height = ht + 'px';
        lab.textContent = on ? v.toFixed(2) : U.fmt(v, 1);
        lab.style.top = v >= 0 ? '-24px' : (ht + 4) + 'px';
      });
      btn.textContent = on ? 'Show the logits' : 'Apply softmax';
      read.innerHTML = on
        ? `probabilities, sum = ${p.reduce((a, b) => a + b, 0).toFixed(2)} &nbsp; prediction: <b>7</b> with p = <b style="color:var(--amber-text)">${p[7].toFixed(3)}</b>`
        : 'raw scores z from the last Dense layer (logits): any real number, any sum';
    }
    btn.addEventListener('click', () => { on = !on; draw(); });
    draw();
    return { trigger(name, v) { if (name === 'softmax-on') { on = v; draw(); } } };
  });

  /* ------------------------------------------------------------ epochs and batches */
  Deck.widget('batches', el => {
    const NB = 469, EP = 5;
    const track = h('div', { class: 'batch-track' }, el);
    const cv = h('canvas', { 'aria-hidden': 'true' }, track);
    const ctx = U.hidpi(cv, 1180, 46);
    const cap = h('div', { class: 'hint' }, el, '60,000 training images, cut into 469 batches of 128. Shuffled at the start of every epoch.');
    const counters = h('div', { class: 'counters' }, el);
    const mk = (label, cls) => { const d = h('div', {}, counters); const k = h('div', { class: 'k ' + cls }, d, '0'); h('div', { class: 'l' }, d, label); return k; };
    const kE = mk('epoch (of 5)', 'c-purple'), kB = mk('batch in this epoch (of 469)', 'c-amber'), kU = mk('weight updates so far', 'c-teal');
    const controls = h('div', { class: 'wctl' }, el);
    const btn = h('button', { type: 'button', class: 'primary' }, controls, 'Replay');
    let raf, done = 0, t0;
    function draw() {
      const ep = Math.min(EP, Math.floor(done / NB) + (done < NB * EP ? 1 : 0));
      const inEp = done >= NB * EP ? NB : done % NB;
      ctx.clearRect(0, 0, 1180, 46);
      const bw = 1180 / NB;
      for (let i = 0; i < NB; i++) {
        ctx.fillStyle = i < inEp ? (i % 2 ? '#C9A7D1' : '#B98FC2') : (i % 2 ? '#EEF0F2' : '#E3E7EC');
        ctx.fillRect(i * bw, 0, bw + 0.5, 46);
      }
      if (done < NB * EP) { ctx.fillStyle = C.amber; ctx.fillRect(inEp * bw - 1, 0, Math.max(4, bw + 2), 46); }
      kE.textContent = Math.max(1, ep);
      kB.textContent = done === 0 ? 0 : (inEp === 0 ? NB : inEp);
      kU.textContent = done.toLocaleString('en-GB');
    }
    function play() {
      cancelAnimationFrame(raf); done = 0; t0 = performance.now();
      if (U.reduced) { done = NB * EP; draw(); return; }
      const tick = now => {
        const t = (now - t0) / 1000;
        // start slowly so single updates are visible, then speed up
        done = Math.min(NB * EP, Math.floor(t < 2.5 ? t * 6 : 15 + (t - 2.5) ** 2 * 60));
        draw();
        if (done < NB * EP) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    btn.addEventListener('click', play);
    draw();
    return { enter() { play(); }, leave() { cancelAnimationFrame(raf); done = 0; draw(); } };
  });
})();
