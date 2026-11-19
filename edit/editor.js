/* Éditeur du portfolio de Paul Signe (adresse : /portfolio/edit/).
   Ouvre une page du site (dépôt GitHub Paulleb08/portfolio) dans un cadre sans scripts, la rend modifiable,
   puis la republie telle quelle par l'API GitHub (ses scripts d'origine restent intacts).
   Clic sur un objet (album, film, vêtement, carte, image…) → barre d'outils flottante ; « Modifier » ouvre sa fiche.
   « Demander un changement à Claude » crée un ticket GitHub [Claude]. */
(function () {
  'use strict';
  var OWNER = 'Paulleb08', REPO = 'portfolio', BRANCH = 'main', SITE = 'https://paulleb08.github.io/portfolio/', API = 'https://api.github.com';
  var PAGES = [['index.html', 'Portfolio pro'], ['ville.html', 'Ville (vision board)'], ['cv.html', 'Page CV']];
  // objets que l'on sélectionne d'un clic (le plus proche de l'endroit cliqué)
  var ITEM = '.book, .hanger, .gear, .tile, .insp, .card, figure, article, .fiche, li, p, h1, h2, h3, h4, img, a, td';
  var EDCSS = '.ed-sel{outline:3px solid #ff2e88!important;outline-offset:3px}.ed-hov{outline:2px dashed #ff2e88!important;outline-offset:3px;cursor:pointer}' +
    '.bl-pending{opacity:1!important}' +
    '.city-main,.hud,.zoom-ui,.city-hint{display:none!important}.docs{display:block!important;padding:20px}' +
    '.docs .doc{display:block!important;border-top:6px dashed #2445b0;margin-top:40px;padding-top:20px}';
  function $(id) { return document.getElementById(id); }
  var token = null; try { token = localStorage.getItem('ed-token'); } catch (e) {}
  var cur = null, doc = null, sel = null, hov = null, dirty = false, pending = {}, frame = $('frame'), pv = $('preview'), pvTimer = null;

  /* ---------- GitHub ---------- */
  function gh(path, opt) {
    opt = opt || {};
    return fetch(API + path, { method: opt.method || 'GET', cache: 'no-store', headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, body: opt.body ? JSON.stringify(opt.body) : undefined })
      .then(function (r) {
        if (r.ok) return r.status === 204 ? null : r.json();
        return r.json().catch(function () { return {}; }).then(function (j) { var e = new Error((j.message || 'erreur') + ' (' + r.status + ')'); e.status = r.status; throw e; });
      });
  }
  function repo(p) { return '/repos/' + OWNER + '/' + REPO + p; }
  function enc(path) { return path.split('/').map(encodeURIComponent).join('/'); }
  function b64ToText(b) { var bin = atob(b.replace(/\s/g, '')), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new TextDecoder().decode(u); }
  function bytesToB64(u) { var s = ''; for (var i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
  function textToB64(t) { return bytesToB64(new TextEncoder().encode(t)); }
  function put(path, b64, msg, sha) { return gh(repo('/contents/' + enc(path)), { method: 'PUT', body: { message: msg, content: b64, branch: BRANCH, sha: sha } }); }
  function shaOf(path) { return gh(repo('/contents/' + enc(path) + '?ref=' + BRANCH)).then(function (f) { return f.sha; }, function (e) { if (e.status === 404) return undefined; throw e; }); }

  function status(t, err) { var s = $('status'); s.textContent = t; s.classList.toggle('err', !!err); }
  function setDirty(v) {
    dirty = v; $('saveBtn').disabled = !v; $('saveBtn').classList.toggle('ready', v);
    if (v) { status('● Pas encore publié'); clearTimeout(pvTimer); pvTimer = setTimeout(refreshPreview, 1000); }
  }

  /* ---------- Connexion ---------- */
  function showLogin(msg) { $('app').hidden = true; $('login').hidden = false; if (msg) { $('loginErr').textContent = msg; $('loginErr').hidden = false; } }
  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault(); token = $('token').value.trim();
    gh(repo('')).then(function (r) {
      if (r.permissions && !r.permissions.push) throw new Error('ce code ne permet pas de modifier le site');
      try { localStorage.setItem('ed-token', token); } catch (er) {}
      start();
    }).catch(function (er) { showLogin('Ça n\'a pas marché : ' + er.message + '. Vérifie que tu as bien copié tout le code.'); });
  });
  $('logoutBtn').addEventListener('click', function () { try { localStorage.removeItem('ed-token'); } catch (e) {} location.reload(); });

  function start() {
    $('login').hidden = true; $('app').hidden = false;
    var tabs = $('tabs'); tabs.innerHTML = '';
    PAGES.forEach(function (p) { var b = document.createElement('button'); b.type = 'button'; b.textContent = p[1]; b.dataset.page = p[0]; b.addEventListener('click', function () { goPage(p[0]); }); tabs.appendChild(b); });
    gh(repo('/git/trees/' + BRANCH + '?recursive=1')).then(function (t) {
      var dl = $('fileList'); t.tree.forEach(function (n) { if (n.type === 'blob') { var o = document.createElement('option'); o.value = n.path; dl.appendChild(o); } });
    }).catch(function () {});
    loadPage(PAGES[1][0]); loadAsks();
  }
  function goPage(p) {
    if (cur && p === cur.path) return;
    if (dirty && !confirm('Tu as des changements pas encore publiés sur cette page. Les abandonner ?')) return;
    loadPage(p);
  }

  /* ---------- Ouvrir une page ---------- */
  function loadPage(path) {
    status('Ouverture…'); hideFloat();
    document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.page === path); });
    gh(repo('/contents/' + enc(path) + '?ref=' + BRANCH)).then(function (f) {
      cur = { path: path, sha: f.sha }; pending = {};
      frame.onload = setup;
      frame.srcdoc = b64ToText(f.content).replace(/<head([^>]*)>/i, '<head$1><base id="ed-base" href="' + SITE + '"><style id="ed-style">' + EDCSS + '</style>');
      $('viewLink').href = SITE + (path === 'index.html' ? '' : path);
    }).catch(function (e) { if (e.status === 401) showLogin('Ton code d\'accès a expiré : crées-en un nouveau (bouton 1).'); else status('Impossible d\'ouvrir la page : ' + e.message, true); });
  }
  function setup() {
    doc = frame.contentDocument; doc.designMode = 'on'; sel = null;
    doc.querySelectorAll('details:not([open])').forEach(function (d) { d.open = true; d.setAttribute('data-ed-closed', ''); });
    doc.addEventListener('click', function (e) { e.preventDefault(); select(pick(e.target)); }, true);
    doc.addEventListener('mouseover', function (e) { var it = pick(e.target); if (hov && hov !== it) hov.classList.remove('ed-hov'); hov = it; if (it && it !== sel) it.classList.add('ed-hov'); });
    doc.addEventListener('input', function () { setDirty(true); placeFloat(); });
    doc.addEventListener('scroll', placeFloat, true); frame.contentWindow.addEventListener('scroll', placeFloat);
    buildToc(); setDirty(false); select(null); status('✓ À jour'); refreshPreview();
  }
  function pick(t) { if (t && t.nodeType !== 1) t = t.parentElement; return t ? t.closest(ITEM) : null; }
  function buildToc() {
    var ul = $('toc'); ul.innerHTML = '';
    var list = doc.querySelectorAll('.docs .doc[data-title]');
    if (!list.length) list = doc.querySelectorAll('section[id]');
    [].forEach.call(list, function (s) {
      var h = s.querySelector('h1,h2'), name = s.getAttribute('data-title') || (h && h.textContent); if (!name) return;
      var li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.textContent = name.trim().slice(0, 48);
      b.addEventListener('click', function () { s.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      li.appendChild(b); ul.appendChild(li);
    });
  }
  $('undoBtn').addEventListener('click', function () { if (!dirty || confirm('Annuler tous les changements pas encore publiés ?')) loadPage(cur.path); });
  addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- Ce qu'on a cliqué ---------- */
  function kind(el) {
    if (el.matches('.book')) return el.closest('.records') ? 'Album' : 'Film';
    if (el.matches('.hanger')) return 'Vêtement';
    if (el.matches('.gear')) return 'Matériel';
    if (el.matches('.tile, figure, img')) return 'Image';
    if (el.matches('.insp, .card, article, .fiche')) return 'Carte';
    if (el.matches('h1,h2,h3,h4')) return 'Titre';
    if (el.matches('p')) return 'Paragraphe';
    if (el.matches('a')) return 'Lien';
    return 'Élément';
  }
  var ADD = { Album: 'un album', Film: 'un film', 'Vêtement': 'un vêtement', Carte: 'une carte', Image: 'une image', Paragraphe: 'un paragraphe', Titre: 'un titre', 'Matériel': 'du matériel' };
  function clearSel(n) { n.classList.remove('ed-sel'); n.classList.remove('ed-hov'); if (!n.classList.length) n.removeAttribute('class'); }
  function select(el) {
    if (sel) clearSel(sel);
    sel = el && el !== doc.body && el !== doc.documentElement ? el : null;
    if (!sel) return hideFloat();
    sel.classList.remove('ed-hov'); sel.classList.add('ed-sel');
    var f = $('float'), k = kind(sel), img = sel.matches('img') ? sel : sel.querySelector('img');
    f.hidden = false; $('floatName').textContent = k;
    f.querySelector('[data-act=img]').hidden = !img;
    f.querySelector('[data-act=edit]').hidden = !(textNodes(sel).length || img || sel.closest('a'));
    f.querySelector('[data-act=up]').hidden = !sel.previousElementSibling;
    f.querySelector('[data-act=down]').hidden = !sel.nextElementSibling;
    f.querySelector('[data-act=add]').textContent = '＋ Ajouter ' + (ADD[k] || 'un élément');
    placeFloat();
  }
  function hideFloat() { $('float').hidden = true; }
  function placeFloat() {
    if (!sel || $('float').hidden) return;
    var fr = frame.getBoundingClientRect(), r = sel.getBoundingClientRect(), f = $('float'), h = f.offsetHeight || 40;
    var top = fr.top + r.top - h - 8; if (top < fr.top + 4) top = fr.top + Math.min(Math.max(r.bottom, 0) + 8, fr.height - h - 4);
    var left = Math.max(fr.left + 4, Math.min(fr.left + r.left, fr.right - f.offsetWidth - 8));
    f.style.top = top + 'px'; f.style.left = left + 'px';
  }
  addEventListener('resize', placeFloat);

  /* ---------- Fiche d'un objet : un champ par texte, l'image, le lien ---------- */
  function textNodes(el) {
    var w = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT), out = [], n;
    while ((n = w.nextNode())) {
      if (!n.nodeValue.trim()) continue;
      if (n.parentElement.closest('.hanger .spine')) continue; // copie du nom du vêtement : mise à jour toute seule
      out.push(n);
    }
    return out;
  }
  function labelOf(n, i) {
    var p = n.parentElement, c = p.getAttribute('class') || '';
    if (/\byr\b/.test(c)) return 'Année';
    if (/\bstars\b/.test(c) || /^[★½\s]+$/.test(n.nodeValue.trim())) return 'Étoiles (★ et ½)';
    if (/\blabel\b/.test(c)) return 'Petit titre';
    if (p.closest('.records .spine') && p.tagName === 'I') return 'Artiste';
    if (/^(B|H1|H2|H3|H4|STRONG)$/.test(p.tagName)) return 'Titre';
    if (p.tagName === 'P') return 'Texte';
    return i ? 'Texte ' + (i + 1) : 'Texte';
  }
  var form = { nodes: [], img: null, newImg: null, a: null };
  function openForm(el, isNew) {
    var box = $('itemFields'); box.innerHTML = '';
    form = { nodes: textNodes(el), img: el.matches('img') ? el : el.querySelector('img'), newImg: null, a: el.matches('a') ? el : el.querySelector('a') || el.closest('a') };
    $('itemTitle').textContent = isNew ? 'Nouvel élément : remplace les textes et l\'image' : 'Modifier : ' + kind(el).toLowerCase();
    $('itemImgBox').hidden = !form.img; if (form.img) $('itemImg').src = form.img.src;
    form.nodes.forEach(function (n, i) {
      var long = n.nodeValue.trim().length > 70, l = document.createElement('label'), inp = document.createElement(long ? 'textarea' : 'input');
      l.textContent = labelOf(n, i); inp.value = n.nodeValue.trim(); if (long) inp.rows = 4; inp.dataset.i = i; l.appendChild(inp); box.appendChild(l);
    });
    if (form.a) { var l2 = document.createElement('label'); l2.textContent = 'Adresse du lien'; var i2 = document.createElement('input'); i2.value = form.a.getAttribute('href') || ''; i2.dataset.href = '1'; l2.appendChild(i2); box.appendChild(l2); }
    $('itemDlg').returnValue = ''; $('itemDlg').showModal();
    var first = box.querySelector('input,textarea'); if (first) { first.focus(); first.select(); }
  }
  $('itemImgBtn').addEventListener('click', function () { pickImage(function (url) { form.newImg = url; $('itemImg').src = url; }); });
  $('itemDlg').addEventListener('close', function () {
    if ($('itemDlg').returnValue !== 'ok' || !sel) return;
    var el = sel, changed = false;
    $('itemFields').querySelectorAll('[data-i]').forEach(function (inp) {
      var n = form.nodes[+inp.dataset.i], old = n.nodeValue, lead = old.match(/^\s*/)[0], tail = old.match(/\s*$/)[0];
      if (inp.value !== old.trim()) { n.nodeValue = lead + inp.value + tail; changed = true; }
    });
    var h = $('itemFields').querySelector('[data-href]'); if (h && form.a && h.value !== form.a.getAttribute('href')) { form.a.setAttribute('href', h.value); changed = true; }
    if (form.newImg) { setImage(el, form.img, form.newImg); changed = true; }
    if (changed) { syncItem(el); setDirty(true); }
    select(el);
  });
  function setImage(el, img, url) {
    img.src = url; img.removeAttribute('srcset');
    if (el.matches('.book, .hanger')) dominant(url, function (c, t) { el.style.setProperty('--c', c); el.style.setProperty('--t', t); refreshPreview(); });
  }
  function syncItem(el) { // garde cohérents les textes en double (accessibilité, tranche du vêtement)
    var tb = el.querySelector('figcaption b, .spine b, .garment b, h3, h2'), title = tb && tb.textContent.trim();
    if (!title) return;
    if (el.matches('.hanger')) { var s = el.querySelector('.spine b'); if (s) s.textContent = title; }
    if (el.matches('.book')) { var sub = ((el.querySelector('.spine i') || {}).textContent || '').trim(); el.setAttribute('aria-label', title + (sub ? ', ' + sub : '')); var c = el.querySelector('img'); if (c) c.alt = (el.closest('.records') ? 'Pochette de ' : 'Affiche de ') + title; }
  }
  function dominant(url, cb) { // couleur la plus présente de l'image, et texte lisible dessus
    var im = new Image(); im.onload = function () {
      var c = document.createElement('canvas'); c.width = c.height = 32; var x = c.getContext('2d'); x.drawImage(im, 0, 0, 32, 32);
      var d = x.getImageData(0, 0, 32, 32).data, m = {}, best = null;
      for (var i = 0; i < d.length; i += 4) { var k = (d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4), e = m[k] || (m[k] = { n: 0, r: 0, g: 0, b: 0 }); e.n++; e.r += d[i]; e.g += d[i + 1]; e.b += d[i + 2]; if (!best || e.n > best.n) best = e; }
      var r = best.r / best.n | 0, g = best.g / best.n | 0, b = best.b / best.n | 0, hex = '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
      cb(hex, (.299 * r + .587 * g + .114 * b) / 255 > .58 ? '#141634' : '#ffffff');
    }; im.src = url;
  }
  function pickImage(cb) {
    var inp = $('imgIn'); inp.value = '';
    inp.onchange = function () {
      var f = inp.files[0]; if (!f) return;
      var name = f.name.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'image', rd = new FileReader();
      rd.onload = function () {
        if (/svg|gif/.test(f.type)) return done(rd.result, f.type.indexOf('svg') >= 0 ? '.svg' : '.gif');
        var im = new Image(); im.onload = function () { // réduite à 1600 px maximum : nette mais légère
          var k = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); var png = f.type === 'image/png'; done(c.toDataURL(png ? 'image/png' : 'image/jpeg', .88), png ? '.png' : '.jpg');
        }; im.src = rd.result;
      };
      function done(url, ext) { pending[url] = { path: 'assets/uploads/' + Date.now() + '-' + name + ext, b64: url.split(',')[1] }; cb(url); }
      rd.readAsDataURL(f);
    };
    inp.click();
  }

  /* ---------- Barre d'outils ---------- */
  var ACT = {
    edit: function () { openForm(sel, false); },
    img: function () { var el = sel, img = el.matches('img') ? el : el.querySelector('img'); pickImage(function (url) { setImage(el, img, url); setDirty(true); select(el); }); },
    add: function () {
      var c = sel.cloneNode(true); clearSel(c); c.querySelectorAll('.ed-sel, .ed-hov').forEach(clearSel); sel.after(c); select(c); setDirty(true);
      c.scrollIntoView({ block: 'nearest' }); if (textNodes(c).length || c.querySelector('img')) openForm(c, true);
    },
    up: function () { var p = sel.previousElementSibling; if (p) { p.before(sel); setDirty(true); select(sel); } },
    down: function () { var n = sel.nextElementSibling; if (n) { n.after(sel); setDirty(true); select(sel); } },
    parent: function () { var p = sel.parentElement && sel.parentElement.closest(ITEM + ', section, .cat, .doc, div'); if (p && p !== doc.body) select(p); },
    del: function () { if (!confirm('Supprimer cet élément (' + kind(sel).toLowerCase() + ') ?')) return; var n = sel; select(null); n.remove(); setDirty(true); }
  };
  document.querySelectorAll('#float [data-act]').forEach(function (b) {
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () { if (sel) ACT[b.dataset.act](); });
  });

  /* ---------- Aperçu : la vraie page animée, avec les changements pas encore publiés ---------- */
  function refreshPreview() { // sans le traducteur Google : il ne marche pas dans un cadre isolé
    if (pv.hidden || !doc) return;
    pv.srcdoc = serialize(true).replace(/<head([^>]*)>/i, '<head$1><base href="' + SITE + '">').replace(/<script src="assets\/translate\.js"><\/script>/, '');
  }
  $('previewBtn').addEventListener('click', function () { pv.hidden = !pv.hidden; $('stage').classList.toggle('split', !pv.hidden); this.classList.toggle('on', !pv.hidden); refreshPreview(); setTimeout(placeFloat, 50); });

  /* ---------- Publier ---------- */
  function serialize(keepImages) {
    var root = doc.documentElement.cloneNode(true);
    ['#ed-base', '#ed-style'].forEach(function (s) { var n = root.querySelector(s); if (n) n.remove(); });
    root.querySelectorAll('.ed-sel, .ed-hov').forEach(clearSel);
    root.querySelectorAll('[data-ed-closed]').forEach(function (n) { n.removeAttribute('open'); n.removeAttribute('data-ed-closed'); });
    var html = '<!DOCTYPE html>\n' + root.outerHTML + '\n';
    if (!keepImages) Object.keys(pending).forEach(function (u) { html = html.split(u).join(pending[u].path); });
    return html;
  }
  $('saveBtn').addEventListener('click', function () {
    var html = serialize(), ups = Object.keys(pending).filter(function (u) { return !pending[u].sent && html.indexOf(pending[u].path) >= 0; });
    $('saveBtn').disabled = true; status('Publication…');
    ups.reduce(function (p, u) { return p.then(function () { return put(pending[u].path, pending[u].b64, 'Éditeur : ajout de l\'image ' + pending[u].path).then(function () { pending[u].sent = true; }); }); }, Promise.resolve())
      .then(function () { return put(cur.path, textToB64(html), 'Éditeur : modification de ' + cur.path, cur.sha); })
      .then(function (r) { cur.sha = r.content.sha; setDirty(false); status('✓ Publié — en ligne dans 1 minute'); })
      .catch(function (e) {
        $('saveBtn').disabled = false;
        status(e.status === 409 || e.status === 422 ? 'La page a changé entre-temps (par exemple après une demande à Claude) : « Tout annuler » pour la recharger, puis refais ta modification.' : 'La publication a échoué : ' + e.message, true);
      });
  });

  /* ---------- Menu ⋯ et fichiers ---------- */
  $('moreBtn').addEventListener('click', function (e) { e.stopPropagation(); $('moreMenu').hidden = !$('moreMenu').hidden; });
  document.addEventListener('click', function () { $('moreMenu').hidden = true; });
  $('filesBtn').addEventListener('click', function () { $('fileMsg').textContent = ''; $('filesDlg').showModal(); });
  $('filesClose').addEventListener('click', function () { $('filesDlg').close(); });
  document.querySelectorAll('[data-file]').forEach(function (b) { b.addEventListener('click', function () { $('filePath').value = b.dataset.file; $('fileIn').click(); }); });
  $('fileIn').addEventListener('change', function () { if ($('filePath').value && this.files[0]) $('fileMsg').textContent = 'Prêt : ' + this.files[0].name + ' → ' + $('filePath').value + '. Clique « Envoyer ».'; });
  $('fileSend').addEventListener('click', function () {
    var path = $('filePath').value.trim().replace(/^\/+/, ''), f = $('fileIn').files[0];
    if (!path || !f) { $('fileMsg').textContent = 'Choisis le fichier à remplacer et le nouveau fichier.'; return; }
    $('fileMsg').textContent = 'Envoi…';
    f.arrayBuffer().then(function (buf) { return shaOf(path).then(function (sha) { return put(path, bytesToB64(new Uint8Array(buf)), 'Éditeur : ' + (sha ? 'mise à jour de ' : 'ajout de ') + path, sha); }); })
      .then(function () { $('fileMsg').textContent = '✓ Envoyé — en ligne dans 1 minute.'; })
      .catch(function (e) { $('fileMsg').textContent = 'Échec : ' + e.message; });
  });

  /* ---------- Demander un changement à Claude ---------- */
  $('askToggle').addEventListener('click', function () { $('ask').classList.toggle('open'); });
  $('askSend').addEventListener('click', function () {
    var t = $('askText').value.trim(); if (!t) return;
    var body = t + '\n\n---\nEnvoyé depuis l\'éditeur (page ouverte : ' + (cur ? cur.path : '?') + (sel ? ', élément sélectionné : ' + kind(sel) : '') + ').';
    var title = '[Claude] ' + t.replace(/\s+/g, ' ').slice(0, 70);
    $('askMsg').textContent = 'Envoi…';
    gh(repo('/issues'), { method: 'POST', body: { title: title, body: body, labels: ['demande-claude'] } })
      .catch(function () { return gh(repo('/issues'), { method: 'POST', body: { title: title, body: body } }); })
      .then(function () { $('askText').value = ''; $('askMsg').textContent = '✓ Envoyé. Claude te répondra ici.'; loadAsks(); })
      .catch(function (e) { $('askMsg').textContent = 'Échec : ' + e.message; });
  });
  function loadAsks() {
    gh(repo('/issues?state=all&per_page=30')).then(function (l) {
      var ul = $('askList'); ul.innerHTML = '';
      l.filter(function (i) { return !i.pull_request && /^\[Claude\]/.test(i.title); }).slice(0, 8).forEach(function (i) {
        var li = document.createElement('li'), a = document.createElement('a');
        a.href = i.html_url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = i.title.replace(/^\[Claude\]\s*/, '');
        li.textContent = i.state === 'closed' ? '✓ ' : (i.comments ? '💬 ' : '⏳ '); li.appendChild(a); ul.appendChild(li);
      });
    }).catch(function () {});
  }

  if (token) gh(repo('')).then(start, function (e) { showLogin(e.status === 401 ? 'Ton code d\'accès a expiré : crées-en un nouveau (bouton 1).' : 'Connexion impossible : ' + e.message); });
  else showLogin();
})();
