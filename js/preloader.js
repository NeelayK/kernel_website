(() => {
  /* ===== Settings ===== */
  const SPIN_MS     = 500;   // one 180° orbit
  const PAUSE_MS    = 400;   // wait between spins
  const MIN_SPINS   = 2;     // spins always shown, even if the page loads instantly
  const ORBIT       = 60;    // distance of < and > from the pivot while loading
  const OPEN_MS     = 1100;  // < > move apart, letters revealed
  const BOX_MS      = 500;   // box wipe-in duration
  const BOX_START   = 0.6;   // box starts at this fraction of OPEN_MS
  const HOLD_MS     = 200;   // full logo stays visible
  const STAGGER_MS  = 60;    // delay between glyphs in the exit wave
  const WAVE_MS     = 320;   // duration of each glyph's rise
  const CUTOFF_DIST = 40;    // distance of cut-off line ABOVE the highest glyph (positive = higher, negative = lower)

  const $ = id => document.getElementById(id);
  const pre = $('kernel-preloader'), svg =$('kernel-logo');
  const pair = $('kernel-pair'), chevL = $('kernel-chev-l'), chevR =$('kernel-chev-r');
  const box = $('kernel-box'), mid = $('kernel-mid'), clipRect =$('kernel-reveal-rect');
  const waves = [$('kernel-w-l'), ...mid.querySelectorAll('.kernel-w'),$('kernel-w-r')];
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

  /* ===== Geometry ===== */
  const bL = chevL.getBBox(), bR = chevR.getBBox();
  const cxL = bL.x + bL.width / 2, cxR = bR.x + bR.width / 2;
  const CX = (cxL + cxR) / 2;     
  const CY = bL.y + bL.height / 2;
  const startL = CX - ORBIT - cxL;   
  const startR = CX + ORBIT - cxR;
  const halfFinal = CX - (bL.x + bL.width);    
  const BX = parseFloat(box.getAttribute('x'));

  const setPose = (angle, e) => {
    pair.setAttribute('transform', `rotate(${angle} ${CX} ${CY})`);
    chevL.setAttribute('transform', `translate(${startL * (1 - e)} 0)`);
    chevR.setAttribute('transform', `translate(${startR * (1 - e)} 0)`);
    const half = halfFinal * e;
    clipRect.setAttribute('x', CX - half);
    clipRect.setAttribute('width', half * 2);
  };
  const setBox = (p, y = 0, o = 1) => {
    box.setAttribute('transform', `translate(0 ${y}) translate(${BX} 0) scale(${p} 1) translate(${-BX} 0)`);
    box.setAttribute('opacity', o);
  };

  let glyphDistances = [];
  let boxTravel = 0;

  function setupExitCutoff() {
    svg.style.overflow = 'visible';

    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.prepend(defs);
    }

    const svgBounds = svg.getBBox();
    const cutoffY = svgBounds.y - CUTOFF_DIST;

    const clip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clip.setAttribute('id', 'kernel-exit-clip');
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');

    // The visible window stays strictly BELOW cutoffY
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', svgBounds.x - 200);
    rect.setAttribute('y', cutoffY);
    rect.setAttribute('width', svgBounds.width + 400);
    rect.setAttribute('height', svgBounds.height + Math.max(0, CUTOFF_DIST) + 500);

    clip.appendChild(rect);
    defs.appendChild(clip);

    const stage = document.createElementNS('http://www.w3.org/2000/svg', 'g');
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
    mid.removeAttribute('clip-path');
    await wait(HOLD_MS);
  }

  async function exitPhase() {
    setupExitCutoff();

    const n = waves.length;
    const total = (n - 1) * STAGGER_MS + WAVE_MS;
    const boxStart = 2 * STAGGER_MS;  
    const boxDur   = WAVE_MS + 2 * STAGGER_MS; 

    await tween(total, T => {
      const ms = T * total;
      waves.forEach((g, i) => {
        const t = clamp((ms - i * STAGGER_MS) / WAVE_MS);
        const dist = glyphDistances[i];
        g.setAttribute('transform', `translate(0 ${-dist * easeIn(t)})`);
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
      setPose(0, 1); setBox(1); mid.removeAttribute('clip-path');
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
