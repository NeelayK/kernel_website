(() => {
  /* ===== Settings ===== */
  const SPIN_MS     = 500;
  const PAUSE_MS    = 400;
  const MIN_SPINS   = 2;
  const ORBIT       = 60;
  const OPEN_MS     = 1100;
  const BOX_MS      = 500;
  const BOX_START   = 0.6;
  const HOLD_MS     = 200;
  const STAGGER_MS  = 60;
  const WAVE_MS     = 320;
  const CUTOFF_DIST = 40;

  const $ = id => document.getElementById(id);
  const pre = $('kernel-preloader'), svg = $('kernel-logo');
  const pair = $('kernel-pair'), chevL = $('kernel-chev-l'), chevR = $('kernel-chev-r');
  const box = $('kernel-box'), mid = $('kernel-mid'), clipRect = $('kernel-reveal-rect');
  const waves = [$('kernel-w-l'), ...mid.querySelectorAll('.kernel-w'), $('kernel-w-r')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = t => Math.min(1, Math.max(0, t));
  const easeIO  = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  const easeIn  = t => t*t*t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const tween = (dur, fn) => new Promise(res => {
    const t0 = performance.now();
    const step = now => { const t = clamp((now - t0) / dur); fn(t); t < 1 ? requestAnimationFrame(step) : res(); };
    requestAnimationFrame(step);
  });

  /* ===== Inverted ink layer =====
     Layers (bottom -> top):
       1. red box
       2. base letters, MASKED to hide them wherever the box is
       3. ink letters (inverted colour), CLIPPED to the box
     Since the base letters are removed under the box, no light edge
     pixels bleed through around the inverted letters. */
  const NS = 'http://www.w3.org/2000/svg';
  const twin = new Map();
  let boxClipShape = null, boxMaskShape = null;

  const ensureDefs = () => {
    let d = svg.querySelector('defs');
    if (!d) { d = document.createElementNS(NS, 'defs'); svg.prepend(d); }
    return d;
  };
  const link = (a, b) => {
    twin.set(a, b);
    for (let i = 0; i < a.children.length; i++) link(a.children[i], b.children[i]);
  };
  const setT = (el, v) => {
    el.setAttribute('transform', v);
    const c = twin.get(el);
    if (c) c.setAttribute('transform', v);
  };
  const dropClip = el => {
    el.removeAttribute('clip-path');
    const c = twin.get(el);
    if (c) c.removeAttribute('clip-path');
  };
  const shapeFromBox = () => {
    const s = box.cloneNode(false);
    s.removeAttribute('id');
    s.removeAttribute('opacity');
    return s;
  };

  function setupInk() {
    const defs = ensureDefs();

    // clip for the ink layer = box shape
    const clip = document.createElementNS(NS, 'clipPath');
    clip.setAttribute('id', 'kernel-ink-clip');
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    boxClipShape = shapeFromBox();
    clip.appendChild(boxClipShape);
    defs.appendChild(clip);

    // mask for the base layer = everything except the box shape
    const mask = document.createElementNS(NS, 'mask');
    mask.setAttribute('id', 'kernel-base-mask');
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    mask.setAttribute('x', -2000); mask.setAttribute('y', -2000);
    mask.setAttribute('width', 6000); mask.setAttribute('height', 6000);
    const white = document.createElementNS(NS, 'rect');
    white.setAttribute('x', -2000); white.setAttribute('y', -2000);
    white.setAttribute('width', 6000); white.setAttribute('height', 6000);
    white.style.fill = '#fff';
    boxMaskShape = shapeFromBox();
    boxMaskShape.style.fill = '#000';
    mask.append(white, boxMaskShape);
    defs.appendChild(mask);

    const base = document.createElementNS(NS, 'g');
    base.setAttribute('id', 'kernel-base');
    base.setAttribute('mask', 'url(#kernel-base-mask)');

    const ink = document.createElementNS(NS, 'g');
    ink.setAttribute('id', 'kernel-ink');
    ink.setAttribute('clip-path', 'url(#kernel-ink-clip)');
    ink.setAttribute('pointer-events', 'none');

    const sources = Array.from(svg.children).filter(n => n !== defs && n !== box);
    sources.forEach(src => {
      const copy = src.cloneNode(true);
      link(src, copy);
      base.appendChild(src);
      ink.appendChild(copy);
    });
    ink.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));

    svg.append(box, base, ink);   // box under letters
  }

  /* ===== Geometry ===== */
  const bL = chevL.getBBox(), bR = chevR.getBBox();
  const cxL = bL.x + bL.width / 2, cxR = bR.x + bR.width / 2;
  const CX = (cxL + cxR) / 2;
  const CY = bL.y + bL.height / 2;
  const startL = CX - ORBIT - cxL;
  const startR = CX + ORBIT - cxR;
  const halfFinal = CX - (bL.x + bL.width);
  const BX = parseFloat(box.getAttribute('x'));

  setupInk();

  const setPose = (angle, e) => {
    setT(pair, `rotate(${angle} ${CX} ${CY})`);
    setT(chevL, `translate(${startL * (1 - e)} 0)`);
    setT(chevR, `translate(${startR * (1 - e)} 0)`);
    const half = halfFinal * e;
    clipRect.setAttribute('x', CX - half);
    clipRect.setAttribute('width', half * 2);
  };
  const setBox = (p, y = 0, o = 1) => {
    const tf = `translate(0 ${y}) translate(${BX} 0) scale(${p} 1) translate(${-BX} 0)`;
    box.setAttribute('transform', tf);
    box.setAttribute('opacity', o);
    boxClipShape.setAttribute('transform', tf);
    boxMaskShape.setAttribute('transform', tf);
  };

  let glyphDistances = [];
  let boxTravel = 0;

  function setupExitCutoff() {
    svg.style.overflow = 'visible';
    const defs = ensureDefs();

    const svgBounds = svg.getBBox();
    const cutoffY = svgBounds.y - CUTOFF_DIST;

    const clip = document.createElementNS(NS, 'clipPath');
    clip.setAttribute('id', 'kernel-exit-clip');
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');

    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', svgBounds.x - 200);
    rect.setAttribute('y', cutoffY);
    rect.setAttribute('width', svgBounds.width + 400);
    rect.setAttribute('height', svgBounds.height + Math.max(0, CUTOFF_DIST) + 500);
    clip.appendChild(rect);
    defs.appendChild(clip);

    const stage = document.createElementNS(NS, 'g');
    stage.setAttribute('clip-path', 'url(#kernel-exit-clip)');

    const children = Array.from(svg.childNodes).filter(node => node !== defs);
    children.forEach(node => stage.appendChild(node));
    svg.appendChild(stage);

    const baseTravel = svgBounds.height + 40;
    glyphDistances = waves.map(() => baseTravel);
    boxTravel = baseTravel;
  }

  /* ===== Ready signal ===== */
  let ready = false, onReady = () => {}, spins = 0;
  const loaded = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise(r => addEventListener('load', r, { once: true }));
  const manual = new Promise(r => { window.kernelPreloader = { done: r }; });
  Promise.race([loaded, manual]).then(() => { ready = true; onReady(); });

  const canFinish = () => ready && spins >= MIN_SPINS;
  const pause = () => new Promise(r => {
    const id = setTimeout(r, PAUSE_MS);
    onReady = () => { if (spins >= MIN_SPINS) { clearTimeout(id); r(); } };
  });

  /* ===== Phases ===== */
  async function loadingPhase() {
    while (true) {
      await tween(SPIN_MS, t => setPose(180 * (spins + easeIO(t)), 0));
      spins++;
      if (canFinish()) break;
      await pause();
      if (canFinish()) break;
    }
    setPose(0, 0);
  }

  async function openPhase() {
    await wait(150);
    await Promise.all([
      tween(OPEN_MS, t => setPose(0, easeIO(t))),
      wait(OPEN_MS * BOX_START).then(() => tween(BOX_MS, t => setBox(easeOut(t)))),
    ]);
    dropClip(mid);
    await wait(HOLD_MS);
  }

  async function exitPhase() {
    // Which glyphs overlap the box? They must rise in lockstep with it,
    // otherwise they cross the box edge and visibly flip colour.
    const bb = box.getBoundingClientRect();
    const covered = waves.map(g => {
      const r = g.getBoundingClientRect();
      return r.right > bb.left && r.left < bb.right && r.bottom > bb.top && r.top < bb.bottom;
    });
    const firstCovered = covered.indexOf(true);
    const syncIdx = firstCovered === -1 ? 2 : firstCovered;
    const startIdx = waves.map((_, i) => covered[i] ? syncIdx : i);

    setupExitCutoff();

    const n = waves.length;
    const total = (n - 1) * STAGGER_MS + WAVE_MS;
    const boxStart = syncIdx * STAGGER_MS;   // same timing as covered glyphs
    const boxDur   = WAVE_MS;

    await tween(total, T => {
      const ms = T * total;
      waves.forEach((g, i) => {
        const t = clamp((ms - startIdx[i] * STAGGER_MS) / WAVE_MS);
        setT(g, `translate(0 ${-glyphDistances[i] * easeIn(t)})`);
      });

      const tb = clamp((ms - boxStart) / boxDur);
      setBox(1, -boxTravel * easeIn(tb), 1);
      pre.style.opacity = 1 - clamp((T - 0.7) / 0.3);
    });

    finish();
  }

  function finish() {
    pre.remove();
    document.documentElement.classList.add('kernel-loaded');
    document.dispatchEvent(new Event('kernel:loaded'));
  }

  /* ===== Run ===== */
  (async () => {
    svg.style.visibility = 'visible';
    setBox(0);
    if (reduced) {
      setPose(0, 1); setBox(1); dropClip(mid);
      await Promise.race([loaded, manual]);
      pre.style.transition = 'opacity .4s'; pre.style.opacity = 0;
      await wait(400); finish();
      return;
    }
    setPose(0, 0);
    await loadingPhase();
    await openPhase();
    await exitPhase();
  })();
})();