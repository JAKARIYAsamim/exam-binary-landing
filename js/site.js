/* Exam Binary landing page.
   Without this file (or with reduced motion) the page is fully readable at rest: the dashboard is
   assembled, every portal is listed, the Monday is a swipe row. With it, the page becomes one scene. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ok = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const anim = ok && !calm && root.classList.contains('anim');
  if (!anim) root.classList.remove('anim');

  /* ─────────── assistant demo (works with or without GSAP) ─────────── */
  const promptEl = $('#aiPrompt'), resultEl = $('#aiResult'), sendEl = $('.send'), picks = $$('.pick');
  const SCENES = [
    { ask: 'Remind every family with overdue fees', html: `<div class="res"><p class="res-title">13 reminders ready to send</p>
      <div class="res-row"><span>Khan family</span><b>£378.00</b><small>22 days overdue</small></div>
      <div class="res-row"><span>Osei family</span><b>£210.00</b><small>9 days overdue</small></div>
      <div class="res-row dim"><span>and 11 more</span></div>
      <div class="res-actions"><span class="res-btn go" data-then="Sent to 13 families ✓">Send 13 reminders</span><span class="res-btn">Cancel</span></div></div>` },
    { ask: 'Write a 10-question quiz on quadratics for Year 10', html: `<div class="res"><p class="res-title">Quadratics check-in · 10 questions</p>
      <div class="res-row"><i class="qn">Q1</i><span>Solve x² − 5x + 6 = 0</span></div>
      <div class="res-row"><i class="qn">Q2</i><span>Factorise 2x² + 7x + 3</span></div>
      <div class="res-row"><i class="qn">Q3</i><span>Find the turning point of y = x² − 4x + 1</span></div>
      <div class="res-row dim"><span>and 7 more</span></div>
      <div class="res-actions"><span class="res-btn go" data-then="Set for Year 10 ✓">Set for Year 10 Mathematics</span><span class="res-btn">Edit first</span></div></div>` },
    { ask: 'How was attendance this week?', html: `<div class="res"><p class="res-title">96% this week · 1 student below 85%</p>
      <div class="bars">${[['Mon', 97], ['Tue', 94], ['Wed', 98], ['Thu', 95], ['Fri', 96]].map(([d, v]) => `<div class="bar"><b>${v}%</b><i style="height:${(v - 88) * 7}%"></i>${d}</div>`).join('')}</div></div>` },
  ];
  let run = 0;
  const wait = (ms, id) => new Promise((res) => setTimeout(() => id === run && res(), ms));
  const showResult = (scene) => {
    resultEl.innerHTML = scene.html;
    if (!anim) return;
    gsap.from(resultEl.firstElementChild, { y: 24, opacity: 0, duration: 0.6, ease: 'power3.out' });
    gsap.from($$('.res-row, .res-actions', resultEl), { y: 14, opacity: 0, duration: 0.45, stagger: 0.09, delay: 0.15, ease: 'power2.out' });
    gsap.from($$('.bar i', resultEl), { scaleY: 0, duration: 0.8, stagger: 0.08, delay: 0.2, ease: 'power3.out' });
  };
  const play = async (i, auto) => {
    const id = ++run, scene = SCENES[i];
    picks.forEach((p, n) => { p.classList.toggle('on', n === i); p.setAttribute('aria-selected', n === i); });
    if (calm) { promptEl.textContent = scene.ask; showResult(scene); return; }
    resultEl.style.opacity = 0.25;
    promptEl.textContent = '';
    for (const ch of scene.ask) { promptEl.textContent += ch; await wait(24 + Math.random() * 30, id); }
    await wait(350, id);
    sendEl.classList.add('hit');
    await wait(180, id);
    sendEl.classList.remove('hit');
    resultEl.style.opacity = 1;
    showResult(scene);
    const go = $('.res-btn.go', resultEl);
    if (go) { await wait(1900, id); go.classList.add('press'); await wait(220, id); go.classList.remove('press'); go.classList.add('done'); go.textContent = go.dataset.then; }
    if (auto) { await wait(3200, id); play((i + 1) % SCENES.length, true); }
  };
  picks.forEach((p, i) => p.addEventListener('click', () => play(i, false)));

  /* ─────────── waitlist: saved to the page's own store on claude.ai, posted to the form service on a
     normal host, or handed to the visitor's email app when neither is possible ─────────── */
  const WAITLIST_ENDPOINT = 'https://formsubmit.co/ajax/hello@exambinary.co.uk'; // change to the real address
  const WAITLIST_TO = 'hello@exambinary.co.uk';
  const waitForm = $('#waitForm');
  if (waitForm) {
    const err = $('#waitError'), btn = $('.wait-btn', waitForm), done = $('#waitDone');
    const field = (id) => $(id, waitForm);
    const sendEntry = async (entry) => {
      try {
        const db = await claude.use('db'), user = await claude.use('user');
        if (db && user) { await db.collection('waitlist').doc(await user.id()).set({ ...entry, at: new Date().toISOString() }); return 'saved'; }
      } catch (e) { /* not on claude.ai, or no permission: fall through */ }
      try {
        const r = await fetch(WAITLIST_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ ...entry, _subject: 'Exam Binary waitlist' }) });
        if (r.ok) return 'sent';
      } catch (e) { /* blocked or offline: fall through */ }
      return 'mailto';
    };
    waitForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const entry = { name: field('#wName').value.trim(), email: field('#wEmail').value.trim(), centre: field('#wCentre').value.trim(), role: (waitForm.querySelector('input[name="role"]:checked') || {}).value || '' };
      field('#wName').setAttribute('aria-invalid', !entry.name);
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email);
      field('#wEmail').setAttribute('aria-invalid', !emailOk);
      if (!entry.name || !emailOk) { err.textContent = !entry.name ? 'Add your name so we know who to write to.' : 'That email address does not look right.'; err.hidden = false; return; }
      err.hidden = true;
      btn.disabled = true; btn.querySelector('span').textContent = 'Joining…';
      const how = await sendEntry(entry);
      btn.disabled = false; btn.querySelector('span').textContent = 'Book a demo';
      waitForm.classList.add('is-done'); done.hidden = false;
      const title = $('#doneTitle'), text = $('#doneText'), mail = $('#doneMail');
      if (how === 'mailto') {
        title.textContent = 'One more tap.';
        text.textContent = 'This copy of the page cannot send on its own. Send your details from your email app and you are on the list.';
        const body = `Please add me to the Exam Binary waitlist.\n\nName: ${entry.name}\nEmail: ${entry.email}\nCentre: ${entry.centre || '-'}\nRole: ${entry.role}`;
        mail.href = `mailto:${WAITLIST_TO}?subject=${encodeURIComponent('Exam Binary waitlist')}&body=${encodeURIComponent(body)}`;
        mail.hidden = false;
      } else {
        title.textContent = "You're on the list.";
        text.textContent = `We'll email ${entry.email} when a place opens for ${entry.centre || 'your centre'}.`;
      }
      if (anim) gsap.from(done, { y: 16, opacity: 0, duration: 0.6, ease: 'power3.out' });
    });
  }

  /* ─────────── copy the address ─────────── */
  $('#copyMail').addEventListener('click', async () => {
    const state = $('#copyState');
    try { await navigator.clipboard.writeText($('#mailText').textContent); state.textContent = 'Copied'; }
    catch { getSelection().selectAllChildren($('#mailText')); state.textContent = 'Selected'; }
    setTimeout(() => (state.textContent = 'Copy'), 1800);
  });

  if (!anim) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]'), to = a && $(a.getAttribute('href'));
      if (to) { e.preventDefault(); to.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' }); }
    });
    play(0, true);
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);
  if (typeof MotionPathPlugin !== 'undefined') gsap.registerPlugin(MotionPathPlugin);
  gsap.defaults({ ease: 'power3.out' });

  // SplitText moves words out of their <em>, which loses the gradient: unwrap first, then mark the words.
  const splitGlow = (sel, opts = { type: 'lines,words', mask: 'lines' }) => {
    const el = $(sel), runs = [];
    $$('.glow', el).forEach((em) => { runs.push(em.textContent.trim().split(/\s+/)); em.replaceWith(...em.childNodes); });
    const split = new SplitText(el, opts);
    // mark each run where it appears as a whole, so a word like "the" elsewhere in the sentence stays plain
    const texts = split.words.map((w) => w.textContent.trim());
    runs.forEach((run) => {
      for (let i = 0; i <= texts.length - run.length; i++) {
        if (run.every((w, k) => texts[i + k] === w)) { run.forEach((_, k) => split.words[i + k].classList.add('glow')); break; }
      }
    });
    return split;
  };

  /* ─────────── smooth scroll ─────────── */
  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const glideTo = (target, offset = 0) => { if (lenis) lenis.scrollTo(target, { offset, duration: 1.4 }); else if (typeof target === 'number') scrollTo({ top: target, behavior: 'smooth' }); else target.scrollIntoView({ behavior: 'smooth' }); };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'), to = a && $(a.getAttribute('href'));
    if (to) { e.preventDefault(); glideTo(to); }
  });

  /* ─────────── background morphs between acts ─────────── */
  $$('.act').forEach((sec) => {
    const to = { '--bg': sec.dataset.bg, '--fg': sec.dataset.fg, '--fg2': sec.dataset.fg2 };
    const go = () => gsap.to(root, { ...to, duration: 0.9, ease: 'power2.inOut', overwrite: 'auto' });
    ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onEnter: go, onEnterBack: go });
  });

  /* ─────────── cursor + magnetic ─────────── */
  if (fine) {
    const cur = $('.cursor'), label = $('.cur-label');
    const cx = gsap.quickTo(cur, 'x', { duration: 0.18, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: 0.18, ease: 'power3' });
    addEventListener('pointermove', (e) => {
      cx(e.clientX); cy(e.clientY);
      const t = e.target.closest('[data-cur]');
      const kind = t ? t.dataset.cur : '';
      cur.classList.toggle('is-link', kind === 'link');
      cur.classList.toggle('is-drag', kind === 'drag');
      if (kind === 'drag') label.textContent = 'Drag';
    }, { passive: true });
    $$('.mag').forEach((el) => {
      const inner = el.firstElementChild || el;
      const mx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' }), my = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      const ix = gsap.quickTo(inner, 'x', { duration: 0.5, ease: 'power3' }), iy = gsap.quickTo(inner, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const b = el.getBoundingClientRect();
        const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2);
        mx(dx * 0.32); my(dy * 0.32); ix(dx * 0.12); iy(dy * 0.12);
      });
      el.addEventListener('pointerleave', () => { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)' }); gsap.to(inner, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)' }); });
    });
  }

  /* ─────────── ACT 1 · the hero assembles ─────────── */
  const frame = $('.frame'), frameWrap = $('.frame-wrap'), frags = $$('.frag'), copy = $('.hero-copy');
  const vw = () => innerWidth, vh = () => innerHeight;
  const phone = () => vw() < 800;
  // Every piece has a home in the frame (CSS percentages) and a resting place around it (data-f, as fractions
  // of the frame; data-fm on phones). Both are frame-local, so the frame can scale freely.
  const placeFrags = () => {
    const W = frameWrap.clientWidth, H = frameWrap.clientHeight;
    frags.forEach((f) => {
      if (getComputedStyle(f).display === 'none') { f._start = null; return; }
      const [pos, look] = phone() && f.dataset.fm ? f.dataset.fm.split('|') : [f.dataset.f, f.dataset.s];
      const [fx, fy] = pos.split(',').map(Number), [s, r] = look.split(',').map(Number);
      const img = f.querySelector('img');
      const hx = parseFloat(f.style.getPropertyValue('--x')) / 100 * W, hy = parseFloat(f.style.getPropertyValue('--y')) / 100 * H;
      const hw = parseFloat(f.style.getPropertyValue('--w')) / 100 * W, hh = hw * Number(img.getAttribute('height')) / Number(img.getAttribute('width'));
      f._start = { x: fx * W - (hx + hw / 2), y: fy * H - (hy + hh / 2), scale: s, rotate: r };
      f._depth = 0.4 + Math.abs(fx - 0.5); // the outer pieces move most with the mouse
      if (f.classList.contains('fly')) f._end = { x: W / 2 - (hx + hw / 2), y: H / 2 - (hy + hh / 2) };
    });
  };
  // at rest the frame is small and its top sits a little past the middle of the screen
  const frameScale = () => (phone() ? 0.9 : 0.7);
  const frameStart = () => (phone() ? 0.56 : 0.58) * vh() - (vh() - frameWrap.clientHeight) / 2;
  const heroTl = gsap.timeline({ scrollTrigger: { trigger: '.hero-pin', start: 'top top', end: '+=210%', pin: true, scrub: 0.25, anticipatePin: 1, invalidateOnRefresh: true } });
  let assembled = 0, heroWords = null;
  const buildHero = () => {
    placeFrags();
    heroTl.clear();
    // the copy drifts up and fades as one block (no per-word exit: the line masks would cut the letters)
    heroTl.to(copy, { y: () => -vh() * 0.14, opacity: 0, ease: 'power1.out', duration: 0.3 }, 0); // reacts from the first pixel of scroll
    heroTl.to('.hero-bg', { opacity: 0, ease: 'none', duration: 0.55 }, 0.15); // the glow is gone by the time the dashboard is whole
    heroTl.fromTo(frame, { scale: () => frameScale(), y: () => frameStart() }, { scale: 1, y: 0, ease: 'power2.out', duration: 0.62, immediateRender: true }, 0);
    let li = 0, fi = 0;
    frags.forEach((f) => {
      if (!f._start) return;
      if (f.classList.contains('land')) {
        heroTl.fromTo(f, { x: () => f._start.x, y: () => f._start.y, scale: () => f._start.scale, rotate: () => f._start.rotate }, { x: 0, y: 0, scale: 1, rotate: 0, ease: 'power2.inOut', duration: 0.62, immediateRender: true }, (li++) * 0.04); // moves with the zoom from the first pixel of scroll
      } else {
        const t0 = (fi++) * 0.04;
        heroTl.fromTo(f, { x: () => f._start.x, y: () => f._start.y, scale: () => f._start.scale, rotate: () => f._start.rotate }, { x: () => f._end.x, y: () => f._end.y, scale: 0.25, rotate: 0, ease: 'power2.in', duration: 0.46, immediateRender: true }, t0);
        heroTl.fromTo(f, { opacity: 1 }, { opacity: 0, duration: 0.12, ease: 'none' }, t0 + 0.34);
      }
    });
    heroTl.fromTo('.base-full', { opacity: 0 }, { opacity: 1, duration: 0.1, ease: 'none' }, 0.86);
    // once the whole dashboard is showing, the landed pieces fade so the final frame is one clean screenshot
    heroTl.to(frags.filter((f) => f.classList.contains('land')), { opacity: 0, duration: 0.05, ease: 'none' }, 0.965);
    heroTl.to({}, { duration: 0.12 }); // a short hold at the end
    heroTl.eventCallback('onUpdate', () => { assembled = heroTl.progress(); applyParallax(); });
  };

  // mouse parallax on the loose pieces, fading out as they assemble (re-applied on scroll too, so a piece
  // never lands a few pixels off because the mouse happened to stop moving)
  let applyParallax = () => {};
  if (fine) {
    const movers = new Map();
    let px = 0, py = 0;
    frags.forEach((f) => { const p = f.querySelector('.p'); movers.set(f, { x: gsap.quickTo(p, 'x', { duration: 0.6, ease: 'power3' }), y: gsap.quickTo(p, 'y', { duration: 0.6, ease: 'power3' }) }); });
    applyParallax = () => {
      const k = 1 - Math.min(1, assembled / 0.6);
      frags.forEach((f) => { if (!f._start) return; const m = movers.get(f); m.x(px * 36 * f._depth * k); m.y(py * 26 * f._depth * k); });
    };
    addEventListener('pointermove', (e) => { px = e.clientX / vw() - 0.5; py = e.clientY / vh() - 0.5; if (assembled < 0.95) applyParallax(); }, { passive: true });
  }

  /* ─────────── ACT 2 · four stages ─────────── */
  const stages = $$('.stage'), giants = $$('.giant span'), countN = $('.count-n'), flood = $('.flood'), scrollHint = $('.scroll-hint'), portalsPin = $('.portals-pin');
  const FLOODS = ['rgba(30,136,229,0.45)', 'rgba(32,182,136,0.42)', 'rgba(124,92,240,0.45)', 'rgba(240,138,36,0.42)'];
  stages.forEach((s) => s.classList.toggle('is-on', s === stages[0]));
  const stageTl = gsap.timeline({ scrollTrigger: { trigger: portalsPin, start: 'top top', end: '+=' + stages.length * 100 + '%', pin: true, scrub: 0.6, anticipatePin: 1,
    onUpdate: (self) => {
      const i = Math.min(stages.length - 1, Math.floor(self.progress * stages.length));
      if (portalsPin.dataset.active != i) {
        portalsPin.dataset.active = i;
        countN.textContent = String(i + 1).padStart(2, '0');
        gsap.to(flood, { '--flood': FLOODS[i], duration: 0.8, ease: 'power2.inOut' });
        stages.forEach((s, n) => s.classList.toggle('is-on', Math.abs(n - i) <= 1));
      }
      scrollHint.classList.toggle('off', self.progress > 0.9); // the hint bows out on the last stage
    } } });
  stages.forEach((s, i) => {
    const shot = $('.shot', s), cap = $$('.cap > *', s), f1 = $('.f1', s), f2 = $('.f2', s), g = giants[i];
    const at = i; // one unit per stage
    if (i > 0) {
      stageTl.fromTo(shot, { clipPath: 'inset(100% 0 0 0 round 26px)', y: 80 }, { clipPath: 'inset(0% 0 0 0 round 26px)', y: 0, duration: 0.45, ease: 'power3.inOut' }, at - 0.22);
      stageTl.fromTo(cap, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.05, duration: 0.3, ease: 'power3.out' }, at - 0.05);
      stageTl.fromTo([f1, f2], { scale: 0.5, opacity: 0, y: 60 }, { scale: 1, opacity: 1, y: 0, stagger: 0.06, duration: 0.3, ease: 'back.out(1.6)' }, at);
      stageTl.fromTo(g, { opacity: 0, xPercent: 6 }, { opacity: 1, xPercent: 0, duration: 0.3, ease: 'power2.out' }, at - 0.1);
    } else {
      stageTl.set(g, { opacity: 1 }, 0);
    }
    stageTl.to(g, { xPercent: -8, duration: 1, ease: 'none' }, at);
    stageTl.to(shot, { y: () => -innerHeight * 0.08, duration: 1, ease: 'none' }, at); // slow drift while on
    if (i < stages.length - 1) {
      stageTl.to(shot, { scale: 0.9, opacity: 0, duration: 0.3, ease: 'power2.in' }, at + 0.8);
      stageTl.to(cap, { yPercent: -60, opacity: 0, stagger: 0.03, duration: 0.22, ease: 'power2.in' }, at + 0.8);
      stageTl.to([f1, f2], { scale: 0.7, opacity: 0, y: -40, duration: 0.22, ease: 'power2.in' }, at + 0.8);
      stageTl.to(g, { opacity: 0, xPercent: -14, duration: 0.25, ease: 'power2.in' }, at + 0.78);
    }
  });
  if (fine) {
    const movers = $$('.float').map((el) => ({ el, d: Number(el.dataset.depth), x: gsap.quickTo(el, 'x', { duration: 1, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 1, ease: 'power3' }) }));
    addEventListener('pointermove', (e) => { const nx = e.clientX / vw() - 0.5, ny = e.clientY / vh() - 0.5; movers.forEach((m) => { m.x(nx * m.d * 2.2); m.y(ny * m.d * 1.6); }); }, { passive: true });
  }

  /* ─────────── ACT 3 · one tap ripples to every screen ─────────── */
  const wire = $('.wire'), wires = $$('.wires .w'), pulses = $$('.pulse'), src = $('.src'), tgts = $$('.tgt'), upds = $$('.upd'), tap = $('.tap'), feed = $$('.feed-item');
  wires.forEach((p) => { const len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len; });
  const buildFlow = (scrub) => {
    const tl = gsap.timeline({ scrollTrigger: scrub
      ? { trigger: '.flow-pin', start: 'top top', end: '+=150%', pin: true, scrub: 0.6, anticipatePin: 1 }
      : { trigger: wire, start: 'top 75%', once: true } });
    tl.from(src, { scale: 0.92, opacity: 0.4, duration: 0.2, ease: 'power2.out' }, 0);
    tl.fromTo(tap, { opacity: 1, scale: 0.3 }, { opacity: 0, scale: 1.7, duration: 0.2, ease: 'power2.out' }, 0.14);
    wires.forEach((p, i) => {
      const at = 0.3 + i * 0.08;
      tl.to(p, { strokeDashoffset: 0, duration: 0.35, ease: 'none' }, at);
      if (pulses[i] && typeof MotionPathPlugin !== 'undefined') {
        tl.fromTo(pulses[i], { opacity: 0 }, { opacity: 1, duration: 0.04 }, at);
        tl.to(pulses[i], { motionPath: { path: p, align: p, alignOrigin: [0.5, 0.5] }, duration: 0.35, ease: 'none' }, at);
        tl.to(pulses[i], { opacity: 0, duration: 0.05 }, at + 0.33);
      }
      tl.fromTo(tgts[i], { opacity: 0.35, scale: 0.96, filter: 'saturate(0.3)' }, { opacity: 1, scale: 1, filter: 'saturate(1)', duration: 0.15, ease: 'power2.out' }, at + 0.3);
      tl.to(upds[i], { scale: 1, duration: 0.18, ease: 'back.out(2.2)' }, at + 0.36);
      if (feed[i]) tl.fromTo(feed[i], { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: 0.16, ease: 'power2.out' }, at + 0.36);
    });
    tl.to({}, { duration: 0.15 });
    return tl;
  };
  const mmFlow = gsap.matchMedia();
  mmFlow.add('(min-width: 801px) and (min-height: 560px)', () => { const tl = buildFlow(true); return () => tl.scrollTrigger && tl.scrollTrigger.kill(); });
  mmFlow.add('(max-width: 800px), (max-height: 559px)', () => { const tl = buildFlow(false); return () => tl.kill(); });

  /* ─────────── ACT 1b · about: the statement lights up word by word, the figures count up ─────────── */
  const manifesto = splitGlow('.manifesto', { type: 'words', wordsClass: 'w' });
  gsap.fromTo(manifesto.words, { opacity: 0.16 }, { opacity: 1, stagger: 0.03, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top 78%', end: 'bottom 48%', scrub: true } });
  gsap.from('.about-head > *', { y: 24, opacity: 0, stagger: 0.1, duration: 0.9, scrollTrigger: { trigger: '.about', start: 'top 75%' } });
  gsap.from('.facts li', { y: 40, opacity: 0, stagger: 0.1, duration: 0.9, scrollTrigger: { trigger: '.facts', start: 'top 85%' } });
  $$('.facts b[data-n]').forEach((b) => {
    const n = { v: 0 }, to = Number(b.dataset.n);
    ScrollTrigger.create({ trigger: b, start: 'top 85%', once: true, onEnter: () => gsap.to(n, { v: to, duration: 1.4, ease: 'power3.out', onUpdate: () => { b.textContent = Math.round(n.v); } }) });
  });

  /* ─────────── ACT 4 · assistant ─────────── */
  const aiSplit = splitGlow('.ai-copy .h-big');
  gsap.from(aiSplit.words, { yPercent: 110, stagger: 0.04, duration: 1, scrollTrigger: { trigger: '.ai-copy', start: 'top 75%' } });
  gsap.from(['.ai-line', '.also li'], { y: 30, opacity: 0, stagger: 0.08, duration: 0.9, scrollTrigger: { trigger: '.ai-copy', start: 'top 70%' } });
  gsap.from('.mini-ring .ring', { strokeDashoffset: 113, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: '.also', start: 'top 85%' } });
  gsap.from('.chat', { y: 80, opacity: 0, scale: 0.96, duration: 1.1, scrollTrigger: { trigger: '.ai-demo', start: 'top 80%' } });
  gsap.from('.orb', { opacity: 0, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: '.ai-demo', start: 'top 85%' } }); // opacity only: the orb's own CSS animation owns its transform
  ScrollTrigger.create({ trigger: '.chat', start: 'top 75%', once: true, onEnter: () => play(0, true) });

  /* ─────────── band: endless, and it leans with the scroll ─────────── */
  // Each word moves on its own and wraps around one set's width (gsap.utils.wrap), instead of sliding one
  // 12,000px-wide row: giant composited layers tear on some GPUs, small ones never do.
  $$('.band-row').forEach((row) => {
    const dir = Number(row.dataset.dir);
    const items = $$('.band-set > *', row);
    const setWidth = () => row.children[0].getBoundingClientRect().width / (gsap.getProperty(row, 'scaleX') || 1);
    let total = setWidth();
    const loop = gsap.to(items, { x: () => (dir < 0 ? '-=' : '+=') + total, ease: 'none', duration: 26, repeat: -1, modifiers: { x: gsap.utils.unitize((x) => gsap.utils.wrap(-total, 0, parseFloat(x))) } });
    addEventListener('resize', () => { total = setWidth(); loop.invalidate(); });
    // leans and speeds up with the scroll, then settles back once the scrolling stops
    let settle = 0;
    ScrollTrigger.create({ trigger: '.band', start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        const v = gsap.utils.clamp(-1, 1, self.getVelocity() / 2600);
        gsap.to(loop, { timeScale: 1 + Math.abs(v) * 3, duration: 0.3, overwrite: true });
        gsap.to(items, { skewX: -v * 10, duration: 0.3, overwrite: 'auto' });
        clearTimeout(settle);
        settle = setTimeout(() => { gsap.to(loop, { timeScale: 1, duration: 0.8, overwrite: true }); gsap.to(items, { skewX: 0, duration: 0.8, ease: 'power2.out', overwrite: 'auto' }); }, 180);
      } });
  });

  /* ─────────── close + footer ─────────── */
  gsap.from('.wait-copy > *', { y: 30, opacity: 0, stagger: 0.08, duration: 0.9, scrollTrigger: { trigger: '.wait', start: 'top 75%' } });
  gsap.from('.wait-card', { y: 60, opacity: 0, scale: 0.97, duration: 1, scrollTrigger: { trigger: '.wait-card', start: 'top 85%' } });
  const ctaSplit = splitGlow('.h-cta');
  gsap.from(ctaSplit.words, { yPercent: 110, stagger: 0.035, duration: 1.1, scrollTrigger: { trigger: '.demo', start: 'top 70%' } });
  gsap.from('.demo-line, .demo-actions', { y: 30, opacity: 0, stagger: 0.1, duration: 0.9, scrollTrigger: { trigger: '.demo-actions', start: 'top 92%' } });
  // the crew gathers: each face slides in from its own side and settles into the group
  gsap.from('.crew-m', { x: (i) => (i - 1.5) * 90, y: 40, opacity: 0, scale: 0.7, stagger: 0.08, duration: 1, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.demo-panel', start: 'top 80%' } });
  gsap.from('.demo-panel', { y: 60, scale: 0.97, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.demo-panel', start: 'top 88%' } });
  gsap.from('.wordmark span', { yPercent: 70, opacity: 0, stagger: 0.08, duration: 1.2, scrollTrigger: { trigger: '.foot', start: 'top 92%' } });

  /* ─────────── loader, then the hero intro ─────────── */
  const loader = $('#loader'), ldN = $('.ld-n'), ldBar = $('.ld-bar i'), bits = $('.ld-bits');
  const count = { n: 0 };
  const bitsTick = setInterval(() => { bits.textContent = Array.from({ length: 8 }, () => (Math.random() > 0.5 ? '1' : '0')).join(''); }, 70);
  const ready = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((res) => { const img = $('.base img'); if (img.complete) res(); else { img.onload = res; img.onerror = res; } }),
    new Promise((res) => setTimeout(res, 1300)),
  ]);
  gsap.to(count, { n: 100, duration: 1.4, ease: 'power2.inOut', onUpdate: () => { ldN.textContent = Math.round(count.n); gsap.set(ldBar, { scaleX: count.n / 100 }); } });

  const intro = () => {
    clearInterval(bitsTick);
    bits.textContent = '00000001';
    const split = splitGlow('.h-hero');
    heroWords = split.words;
    buildHero();
    gsap.set(frags, { opacity: 1 });
    const loose = frags.filter((f) => f._start).map((f) => f.querySelector('.p'));
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to(ldN, { yPercent: -110, duration: 0.5, ease: 'power3.in' })
      .to(loader, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '-=0.15')
      .from(split.words, { yPercent: 110, stagger: 0.05, duration: 1.1 }, '-=0.45')
      .from(['.hero-line', '.hero-cta'], { y: 20, opacity: 0, stagger: 0.08, duration: 0.8 }, '-=0.8')
      .from('.base-empty', { y: 90, opacity: 0, duration: 1.2 }, '-=0.9')
      .from(loose, { y: 60, opacity: 0, scale: 0.8, stagger: { each: 0.05, from: 'center' }, duration: 0.9, ease: 'back.out(1.5)' }, '-=1.0')
      .add(() => loader.remove(), '-=0.6');
    // let the page scroll as soon as the loader has lifted, not when the intro ends; the first scroll
    // finishes the intro at once so it never fights the scroll animation
    tl.add(() => {
      ScrollTrigger.refresh(); // measure before the first scroll, so a refresh never swallows it
      if (lenis) lenis.start();
      const skip = () => { if (tl.progress() < 1) tl.progress(1); removeEventListener('wheel', skip); removeEventListener('touchmove', skip); removeEventListener('keydown', skip); };
      addEventListener('wheel', skip, { passive: true }); addEventListener('touchmove', skip, { passive: true }); addEventListener('keydown', skip);
    }, 1.1);
  };
  ready.then(() => requestAnimationFrame(intro));

  ScrollTrigger.addEventListener('refreshInit', () => { if (heroWords) placeFrags(); });
  addEventListener('load', () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
})();
