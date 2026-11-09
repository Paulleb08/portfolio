// Animation « le portfolio se construit » : des curseurs d'agents (façon logiciel de CAO / design)
// sélectionnent chaque bloc, affichent ses cotes, le tapent puis le posent, section par section au défilement.
// Désactivée si l'utilisateur réduit les animations, s'il a cliqué « Passer » pendant la visite, ou à l'impression.
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('bl-init')) return;

  var LAYERS = [
    '.pill', '.pill .kicker', '.pill h1', '.pill .role', '.pill .btn', '.cartouche',
    '.head h2', '.head p', '.head .btn', '.toc > li',
    '.about-title h2', '.about-title p', '.about p', '.about figure',
    '.strengths article', '.stats > div', '.pitch', '.banner p', '.banner small',
    '.cv', '.hero-band', '.pick', '.hint',
    '.panel:not([hidden]) .xp-head', '.panel:not([hidden]) .xp-band', '.panel:not([hidden]) .sheet', '.panel:not([hidden]) .tools-strip',
    '.panel:not([hidden]).sheet', '.table-wrap', '.annexes article', '.vcard', '.road li',
    '.contact-box h2', '.contact-box .lead', '.contact-box li', '.contact-box form', 'footer .disp'
  ].join(',');
  var TEXT = 'H1,H2,H3,P,LI,SMALL';
  var AGENTS = [['CAO', '#ff5c8a'], ['Usinage', '#ffb020'], ['Méca', '#22c55e'], ['Élec', '#38bdf8'], ['Qualité', '#a78bfa']];

  var layers = Array.prototype.slice.call(document.querySelectorAll(LAYERS));
  layers.forEach(function (el) { el.classList.add('bl-pending'); });
  root.classList.remove('bl-init');
  var total = layers.length, done = 0, queue = [], finished = false;

  var stage = document.createElement('div'); stage.className = 'bl-stage'; stage.setAttribute('aria-hidden', 'true');
  document.body.appendChild(stage);
  var hud = document.createElement('div'); hud.className = 'bl-hud';
  hud.innerHTML = '<span class="bl-dots">' + AGENTS.map(function (a) { return '<i style="background:' + a[1] + '">' + a[0][0] + '</i>'; }).join('') +
    '</span><b>' + AGENTS.length + '</b>&nbsp;agents<span class="bl-sep"></span><b class="bl-n">0</b>&nbsp;/ ' + total + ' calques' +
    '<span class="bl-bar"><span></span></span><button type="button">Passer ✕</button>';
  document.body.appendChild(hud);
  var nEl = hud.querySelector('.bl-n'), bar = hud.querySelector('.bl-bar span');

  function box(el) { var r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }
  function add(cls, b, html) {
    var d = document.createElement('div'); d.className = cls;
    if (b) { d.style.left = b.x + 'px'; d.style.top = b.y + 'px'; d.style.width = b.w + 'px'; d.style.height = b.h + 'px'; }
    if (html) d.innerHTML = html;
    stage.appendChild(d); return d;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function progress() { nEl.textContent = done; bar.style.width = (100 * done / total) + '%'; }

  var cursors = AGENTS.map(function (a, i) {
    var c = add('bl-cursor', null, '<svg viewBox="0 0 16 20" width="16" height="20"><path d="M1 1 L1 16 L5 12 L8 19 L11 18 L8 11 L14 11 Z" fill="' + a[1] + '" stroke="#fff" stroke-width="1.2"/></svg><span style="background:' + a[1] + '">' + a[0] + '</span>');
    c.style.transform = 'translate(' + (innerWidth * (0.2 + 0.15 * i)) + 'px,' + (scrollY + innerHeight - 60) + 'px)';
    return { el: c, busy: false, color: a[1] };
  });

  async function build(agent, el) {
    if (finished || !el.classList.contains('bl-pending')) return;
    var b = box(el), r = el.getBoundingClientRect();
    // Bloc vide ou déjà sorti de l'écran (défilement rapide) : affiché tout de suite, sans animation
    if (!b.w || !b.h || r.bottom < 0 || r.top > innerHeight) { reveal(el); return; }
    var ghost = add('bl-ghost', b);
    agent.el.style.transform = 'translate(' + (b.x + Math.min(b.w - 8, 24)) + 'px,' + (b.y + Math.min(b.h - 8, 18)) + 'px)';
    await wait(430);
    if (finished) return;
    var sel = add('bl-sel', b, '<i></i><i></i><i></i><i></i><em>' + Math.round(b.w) + ' × ' + Math.round(b.h) + '</em>');
    sel.style.setProperty('--c', agent.color);
    var isText = TEXT.indexOf(el.tagName) > -1;
    if (isText) { el.classList.add('bl-typing'); sel.classList.add('bl-caret'); }
    el.classList.remove('bl-pending');
    el.classList.add('bl-in');
    await wait(isText ? 650 : 480);
    var mark = add('bl-mark', { x: b.x + b.w - 7, y: b.y - 7, w: 14, h: 14 }); mark.style.color = agent.color;
    ghost.remove(); sel.remove(); setTimeout(function () { mark.remove(); }, 900);
    reveal(el);
  }
  function reveal(el) {
    if (el.blDone) return;
    el.blDone = true;
    el.classList.remove('bl-pending', 'bl-typing');
    setTimeout(function () { el.classList.remove('bl-in'); }, 700);
    done++; progress();
    if (done >= total) finish();
  }

  function pump() {
    cursors.forEach(function (agent) {
      if (agent.busy || !queue.length || finished) return;
      agent.busy = true;
      (async function loop() {
        agent.el.style.opacity = 1;
        while (queue.length && !finished) await build(agent, queue.shift());
        agent.busy = false;
        // Plus rien à construire à l'écran : le curseur disparaît pour ne pas gêner la lecture
        agent.el.style.opacity = 0;
      })();
    });
    hud.classList.toggle('bl-active', !finished);
  }

  // Un bloc qui entre à l'écran rejoint la file, dans l'ordre du document
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      queue.push(e.target);
    });
    queue.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
    pump();
  }, { rootMargin: '0px 0px -8% 0px' });
  layers.forEach(function (el) { io.observe(el); });

  // Un défilement rapide peut sauter un bloc sans qu'il soit jamais « à l'écran » : on affiche ceux déjà dépassés
  var ticking = false;
  addEventListener('scroll', function () {
    if (ticking || finished) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      layers.forEach(function (el) {
        if (!el.classList.contains('bl-pending') || el.getBoundingClientRect().bottom >= 0) return;
        io.unobserve(el);
        var i = queue.indexOf(el); if (i > -1) queue.splice(i, 1);
        reveal(el);
      });
    });
  }, { passive: true });

  function finish() {
    if (finished) return;
    finished = true; io.disconnect(); queue = [];
    document.querySelectorAll('.bl-pending,.bl-typing').forEach(function (el) { el.classList.remove('bl-pending', 'bl-typing'); });
    hud.classList.remove('bl-active');
    setTimeout(function () { stage.remove(); hud.remove(); }, 500);
  }
  hud.querySelector('button').addEventListener('click', function () {
    try { sessionStorage.setItem('bl-skip', '1'); } catch (e) {}
    finish();
  });
  window.addEventListener('beforeprint', finish);
  window.blFinish = finish;
  progress(); pump();
})();
