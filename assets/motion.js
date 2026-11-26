// Animations du portfolio pro, façon Shopify Editions (demandé par Paul le 26/11/2026), en style affiche soviétique :
// intro tracée au compas, fusées en parallaxe, chapitres plein écran collants dont le titre monte et grandit au défilement,
// blocs qui glissent à l'arrivée. Rien ne bouge si l'utilisateur réduit les animations ; tout est visible à l'impression.
(function () {
  var root = document.documentElement, on = root.classList.contains('mo');
  var chapters = [].slice.call(document.querySelectorAll('.chapter'));
  var fly = [].slice.call(document.querySelectorAll('.fly > span'));

  // Blocs qui arrivent en glissant (et ceux déjà dépassés s'affichent tout de suite : un défilement rapide ne doit rien sauter)
  var REV = '.cartouche,.toc>li,.about-title,.about p,.about figure,.strengths article,.stats>div,.pitch,.banner p,.hero-band,.pick,.panel:not([hidden]) .sheet,.panel:not([hidden]).sheet,.table-wrap,.annexes article,.contact-box,footer .disp';
  var items = on ? [].slice.call(document.querySelectorAll(REV)) : [];
  items.forEach(function (el, i) { el.classList.add('rv'); el.style.setProperty('--d', (i % 4) * 70 + 'ms'); });
  function showAll() { items.forEach(function (el) { el.classList.add('in'); }); }
  if (items.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else showAll();
  addEventListener('beforeprint', showAll);

  // Défilement : progression de chaque chapitre (0 → 1 pendant qu'il reste collé) et parallaxe des fusées
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = innerHeight, y = scrollY;
    chapters.forEach(function (c) {
      var r = c.getBoundingClientRect(), run = Math.max(1, r.height - vh);
      var p = Math.min(1, Math.max(0, -r.top / run));
      if (r.top > 0) p = Math.max(0, 1 - r.top / vh) * 0.25; // le titre commence à monter quand le chapitre arrive
      c.style.setProperty('--p', p.toFixed(3));
    });
    fly.forEach(function (f) { f.style.setProperty('--sy', (y * (+f.style.getPropertyValue('--k') || 1) * -0.35).toFixed(1) + 'px'); });
    document.querySelectorAll('.rv:not(.in)').forEach(function (el) { if (el.getBoundingClientRect().bottom < 0) el.classList.add('in'); });
  }
  function ask() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  if (on) { addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask); frame(); }
  else chapters.forEach(function (c) { c.style.setProperty('--p', 1); });

  // Intro : écran bleu nuit, épure au compas qui se trace, nom, puis rideau qui se lève (une fois par visite)
  var seen; try { seen = sessionStorage.getItem('intro'); } catch (e) {}
  if (!on || seen || location.hash.length > 1) return;
  try { sessionStorage.setItem('intro', '1'); } catch (e) {}
  var o = document.createElement('div'); o.className = 'mo-intro'; o.setAttribute('aria-hidden', 'true');
  o.innerHTML = '<svg viewBox="0 0 800 500" fill="none" stroke="#f2b705" stroke-width="1.4">' +
    '<circle cx="400" cy="250" r="170"/><circle cx="400" cy="250" r="110"/><path d="M80 420 L720 80"/><path d="M80 80 L720 420"/>' +
    '<path d="M400 20 V480"/><path d="M60 250 H740"/><path d="M230 250 A170 170 0 0 1 570 250" stroke="#c8331f" stroke-width="3"/>' +
    '<path d="M400 250 L560 120" stroke="#c8331f" stroke-width="3"/></svg><p class="disp notranslate">Paul Signe</p><small>Portfolio 2026 – 2027</small>';
  document.body.appendChild(o);
  function close() { o.classList.add('out'); setTimeout(function () { o.remove(); }, 900); }
  o.addEventListener('click', close);
  setTimeout(close, 2300);
})();
