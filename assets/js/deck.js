/* Shared deck setup for ENGI 48915.
   Each week page registers widgets with Deck.widget(name, initFn).
   initFn(el) may return { enter(), leave(), trigger(name, on) }.
   - enter/leave run when the slide holding the widget is shown/hidden.
   - A fragment with data-trigger="name" calls trigger(name, true|false)
     when it is shown/hidden, so a clicker can drive the animations.        */
(function () {
  const registry = {};
  const instances = [];

  window.Deck = {
    widget(name, init) { registry[name] = init; },

    start(options = {}) {
      const deck = Reveal;
      deck.initialize(Object.assign({
        width: 1280,
        height: 720,
        margin: 0.04,
        center: false,
        hash: true,
        slideNumber: 'c/t',
        transition: 'slide',
        backgroundTransition: 'fade',
        pdfSeparateFragments: false,
        katex: {
          local: '../assets/vendor/katex',
          delimiters: [
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false }
          ],
          ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
        },
        plugins: [RevealHighlight, RevealMath.KaTeX, RevealNotes]
      }, options));

      deck.on('ready', () => {
        document.querySelectorAll('[data-widget]').forEach(el => {
          const init = registry[el.dataset.widget];
          if (!init) { console.warn('No widget named', el.dataset.widget); return; }
          const api = init(el) || {};
          api.el = el;
          api.slide = el.closest('section');
          instances.push(api);
        });
        onSlide(deck.getCurrentSlide(), null);
      });

      deck.on('slidechanged', e => onSlide(e.currentSlide, e.previousSlide));
      deck.on('fragmentshown', e => fire(e.fragment, true));
      deck.on('fragmenthidden', e => fire(e.fragment, false));

      function onSlide(current, previous) {
        // footer shows the part of the nearest preceding slide carrying data-part
        const slides = deck.getSlides();
        let partName = '';
        for (let i = slides.indexOf(current); i >= 0; i--) {
          if (slides[i].dataset.part) { partName = slides[i].dataset.part; break; }
        }
        const label = document.querySelector('.deck-footer .part');
        if (label) label.textContent = partName;
        document.body.classList.toggle('dark', !!(current && current.dataset.dark !== undefined));
        instances.forEach(w => {
          if (previous && w.slide === previous && w.leave) w.leave();
          if (current && w.slide === current && w.enter) w.enter();
        });
      }

      function fire(fragment, on) {
        const name = fragment.dataset.trigger;
        if (!name) return;
        instances.forEach(w => { if (w.trigger) w.trigger(name, on); });
      }
    }
  };

  /* small helpers shared by widgets */
  window.DeckUtil = {
    css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); },
    svg(tag, attrs = {}, parent) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(el);
      return el;
    },
    rng(seed) { // deterministic so diagrams look the same every lecture
      let s = seed >>> 0;
      return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    },
    ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    fmt(x, d = 3) { return (x < 0 ? '\u2212' : '') + Math.abs(x).toFixed(d); },
    /* pointer position in canvas pixels, robust to Reveal's CSS scaling */
    canvasPoint(canvas, ev) {
      const r = canvas.getBoundingClientRect();
      const w = canvas._lw || canvas.width, h = canvas._lh || canvas.height;
      return { x: (ev.clientX - r.left) * w / r.width, y: (ev.clientY - r.top) * h / r.height };
    },
    hidpi(canvas, w, h) {
      const k = 2;
      canvas.width = w * k; canvas.height = h * k; canvas._lw = w; canvas._lh = h;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      const ctx = canvas.getContext('2d');
      ctx.setTransform(k, 0, 0, k, 0, 0);
      return ctx;
    }
  };
})();
