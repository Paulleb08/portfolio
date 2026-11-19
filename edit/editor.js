/* Éditeur du portfolio de Paul Signe.
   Ouvre une page du site (dépôt GitHub Paulleb08/portfolio) dans un cadre sans scripts, la rend modifiable
   (texte en direct, images, blocs à dupliquer / déplacer / supprimer), puis l'enregistre sur GitHub : le site se met à jour tout seul.
   « Demander à Claude » crée un ticket GitHub (étiquette demande-claude) que Claude traite automatiquement. */
(function () {
  'use strict';
  var OWNER = 'Paulleb08', REPO = 'portfolio', BRANCH = 'main', SITE = 'https://paulleb08.github.io/portfolio/', API = 'https://api.github.com';
  var PAGES = [['index.html', 'Portfolio pro'], ['ville.html', 'Ville (vision board)'], ['cv.html', 'Page du CV']];
  var EDCSS = '.ed-sel{outline:3px solid #ff2e88!important;outline-offset:2px}' +
    '.bl-pending{opacity:1!important}' +
    // la ville : on cache le canvas et on affiche toutes les fenêtres les unes sous les autres
    '.city-main,.hud,.zoom-ui,.city-hint{display:none!important}.docs{display:block!important;padding:20px}' +
    '.docs .doc{display:block!important;border-top:6px dashed #2445b0;margin-top:40px;padding-top:20px}';
  function $(id) { return document.getElementById(id); }
  var token = null; try { token = localStorage.getItem('ed-token'); } catch (e) {}
  var cur = null, doc = null, sel = null, dirty = false, pending = {}, frame = $('frame');

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
  function setDirty(v) { dirty = v; $('saveBtn').disabled = !v; if (v) { status('Changements non enregistrés'); schedulePreview(); } }

  /* ---------- Aperçu en direct : la vraie page (scripts actifs, ville animée) avec les changements pas encore enregistrés ---------- */
  var pv = $('preview'), pvTimer = null;
  function refreshPreview() { if (pv.hidden || !doc) return; pv.srcdoc = serialize(true).replace(/<head([^>]*)>/i, '<head$1><base href="' + SITE + '">').replace(/<script src="assets\/translate\.js"><\/script>/, ''); } // sans le traducteur Google : il ne marche pas dans un cadre isolé
  function schedulePreview() { clearTimeout(pvTimer); pvTimer = setTimeout(refreshPreview, 1000); }
  $('previewBtn').addEventListener('click', function () {
    pv.hidden = !pv.hidden; $('stage').classList.toggle('split', !pv.hidden);
    this.classList.toggle('primary', !pv.hidden); refreshPreview();
  });

  /* ---------- Connexion ---------- */
  function showLogin(msg) { $('app').hidden = true; $('login').hidden = false; if (msg) { $('loginErr').textContent = msg; $('loginErr').hidden = false; } }
  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault(); token = $('token').value.trim();
    gh(repo('')).then(function (r) {
      if (r.permissions && !r.permissions.push) throw new Error('ce jeton ne peut pas modifier le dépôt (Contents : Read and write)');
      try { localStorage.setItem('ed-token', token); } catch (er) {}
      start();
    }).catch(function (er) { showLogin('Connexion impossible : ' + er.message); });
  });
  $('logoutBtn').addEventListener('click', function () { try { localStorage.removeItem('ed-token'); } catch (e) {} location.reload(); });

  function start() {
    $('login').hidden = true; $('app').hidden = false;
    var s = $('pageSel'); s.innerHTML = '';
    PAGES.forEach(function (p) { var o = document.createElement('option'); o.value = p[0]; o.textContent = p[1] + ' (' + p[0] + ')'; s.appendChild(o); });
    gh(repo('/git/trees/' + BRANCH + '?recursive=1')).then(function (t) { // autres pages et liste des fichiers
      var dl = $('fileList'); dl.innerHTML = '';
      t.tree.forEach(function (n) {
        if (n.type !== 'blob') return;
        var o = document.createElement('option'); o.value = n.path; dl.appendChild(o);
        if (/^[^/]+\.html$/.test(n.path) && !PAGES.some(function (p) { return p[0] === n.path; })) { var q = document.createElement('option'); q.value = n.path; q.textContent = n.path; s.appendChild(q); }
      });
    }).catch(function () {});
    loadPage(s.value); loadAsks();
  }

  /* ---------- Ouvrir une page ---------- */
  function loadPage(path) {
    status('Chargement de ' + path + '…');
    gh(repo('/contents/' + enc(path) + '?ref=' + BRANCH)).then(function (f) {
      cur = { path: path, sha: f.sha }; pending = {};
      var html = b64ToText(f.content).replace(/<head([^>]*)>/i, '<head$1><base id="ed-base" href="' + SITE + '"><style id="ed-style">' + EDCSS + '</style>');
      frame.onload = setup; frame.srcdoc = html; // cadre sans scripts (sandbox) : la page s'affiche telle quelle, sans animation qui la modifierait
      $('viewLink').href = SITE + (path === 'index.html' ? '' : path);
    }).catch(function (e) { if (e.status === 401) showLogin('Le jeton a expiré ou a été révoqué : crée-en un nouveau.'); else status('Impossible d\'ouvrir ' + path + ' : ' + e.message, true); });
  }
  function setup() {
    doc = frame.contentDocument; doc.designMode = 'on'; sel = null;
    doc.querySelectorAll('details:not([open])').forEach(function (d) { d.open = true; d.setAttribute('data-ed-closed', ''); });
    doc.addEventListener('click', function (e) { e.preventDefault(); select(e.target); }, true); // pas de navigation : on sélectionne
    doc.addEventListener('input', function () { setDirty(true); });
    setDirty(false); select(null); status('Prêt : ' + cur.path); refreshPreview();
  }
  $('pageSel').addEventListener('change', function () {
    if (dirty && !confirm('Des changements ne sont pas enregistrés. Les abandonner ?')) { this.value = cur.path; return; }
    loadPage(this.value);
  });
  $('reloadBtn').addEventListener('click', function () { if (!dirty || confirm('Oublier tous les changements non enregistrés ?')) loadPage(cur.path); });
  addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- Sélection et outils ---------- */
  var NAMES = { IMG: 'image', P: 'paragraphe', H1: 'titre', H2: 'titre', H3: 'titre', H4: 'titre', LI: 'élément de liste', UL: 'liste', OL: 'liste', A: 'lien', FIGURE: 'figure', FIGCAPTION: 'légende', SECTION: 'section', ARTICLE: 'carte', DIV: 'bloc', SPAN: 'texte', B: 'texte en gras', TD: 'case', TR: 'ligne de tableau', TABLE: 'tableau', BUTTON: 'bouton' };
  function describe(el) { var c = (el.getAttribute('class') || '').replace('ed-sel', '').trim().split(/\s+/)[0]; return (NAMES[el.tagName] || el.tagName.toLowerCase()) + (c ? ' « ' + c + ' »' : ''); }
  function clearSel(n) { n.classList.remove('ed-sel'); if (!n.classList.length) n.removeAttribute('class'); }
  function select(el) {
    if (sel) clearSel(sel);
    sel = el && el.nodeType === 1 && el !== doc.body && el !== doc.documentElement ? el : null;
    if (sel) sel.classList.add('ed-sel');
    $('selInfo').textContent = sel ? 'Sélection : ' + describe(sel) + '. Tape pour modifier le texte, ou utilise les boutons.' : 'Clique sur un texte pour l\'écrire directement, ou sur une image / un bloc pour le sélectionner.';
    renderFields();
  }
  function field(label, value, onChange) {
    var l = document.createElement('label'); l.textContent = label; var i = document.createElement('input'); i.value = value || '';
    i.addEventListener('change', function () { onChange(i.value); setDirty(true); }); l.appendChild(i); $('fields').appendChild(l);
  }
  function renderFields() {
    $('fields').innerHTML = ''; if (!sel) return;
    if (sel.tagName === 'IMG') field('Texte de remplacement (pour l\'accessibilité)', sel.getAttribute('alt'), function (v) { sel.setAttribute('alt', v); });
    var a = sel.closest('a'); if (a) field('Adresse du lien', a.getAttribute('href'), function (v) { a.setAttribute('href', v); });
    field('Style (avancé, ex. --c:#ff0000 pour la couleur d\'une tranche)', sel.getAttribute('style'), function (v) { if (v) sel.setAttribute('style', v); else sel.removeAttribute('style'); });
  }
  function pickImage(cb) {
    var inp = $('imgIn'); inp.value = '';
    inp.onchange = function () {
      var f = inp.files[0]; if (!f) return;
      var name = f.name.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'image';
      var keep = /svg|gif/.test(f.type), rd = new FileReader();
      rd.onload = function () {
        if (keep) return done(rd.result, f.type.indexOf('svg') >= 0 ? '.svg' : '.gif');
        var im = new Image(); im.onload = function () { // réduite à 1600 px maximum : nette mais légère
          var k = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          var png = f.type === 'image/png'; done(c.toDataURL(png ? 'image/png' : 'image/jpeg', .88), png ? '.png' : '.jpg');
        }; im.src = rd.result;
      };
      function done(url, ext) { pending[url] = { path: 'assets/uploads/' + Date.now() + '-' + name + ext, b64: url.split(',')[1] }; cb(url); setDirty(true); }
      rd.readAsDataURL(f);
    };
    inp.click();
  }
  var ACT = {
    parent: function () { if (sel.parentElement && sel.parentElement !== doc.body) select(sel.parentElement); },
    dup: function () { var c = sel.cloneNode(true); clearSel(c); sel.after(c); select(c); setDirty(true); },
    del: function () { if (!confirm('Supprimer : ' + describe(sel) + ' ?')) return; var n = sel; select(null); n.remove(); setDirty(true); },
    up: function () { var p = sel.previousElementSibling; if (p) { p.before(sel); setDirty(true); } },
    down: function () { var n = sel.nextElementSibling; if (n) { n.after(sel); setDirty(true); } },
    addP: function () { var p = doc.createElement('p'); p.textContent = 'Nouveau paragraphe'; sel.after(p); select(p); setDirty(true); },
    addImg: function () { var at = sel; pickImage(function (url) { var im = doc.createElement('img'); im.src = url; im.alt = ''; im.style.maxWidth = '100%'; im.style.height = 'auto'; at.after(im); select(im); }); },
    img: function () {
      var im = sel.tagName === 'IMG' ? sel : sel.querySelector('img');
      if (!im) return alert('Sélectionne d\'abord une image (ou le bloc qui la contient).');
      pickImage(function (url) { im.src = url; im.removeAttribute('srcset'); im.removeAttribute('width'); im.removeAttribute('height'); });
    },
    link: function () { var u = prompt('Adresse du lien (sélectionne d\'abord le texte) :', 'https://'); if (u) { frame.contentWindow.focus(); doc.execCommand('createLink', false, u); setDirty(true); } }
  };
  document.querySelectorAll('.tools [data-act], .tools [data-cmd]').forEach(function (b) {
    b.addEventListener('mousedown', function (e) { e.preventDefault(); }); // garde la sélection de texte dans la page
    b.addEventListener('click', function () {
      if (!doc) return;
      if (b.dataset.cmd) { frame.contentWindow.focus(); doc.execCommand(b.dataset.cmd); setDirty(true); return; }
      if (!sel && b.dataset.act !== 'link') return alert('Clique d\'abord sur un élément de la page.');
      ACT[b.dataset.act]();
    });
  });

  /* ---------- Enregistrer et publier ---------- */
  function serialize(keepImages) {
    var root = doc.documentElement.cloneNode(true);
    ['#ed-base', '#ed-style'].forEach(function (s) { var n = root.querySelector(s); if (n) n.remove(); });
    root.querySelectorAll('.ed-sel').forEach(clearSel);
    root.querySelectorAll('[data-ed-closed]').forEach(function (n) { n.removeAttribute('open'); n.removeAttribute('data-ed-closed'); });
    var html = '<!DOCTYPE html>\n' + root.outerHTML + '\n';
    if (!keepImages) Object.keys(pending).forEach(function (u) { html = html.split(u).join(pending[u].path); }); // images ajoutées : chemin du fichier envoyé
    return html;
  }
  $('saveBtn').addEventListener('click', function () {
    var html = serialize(), ups = Object.keys(pending).filter(function (u) { return !pending[u].sent && html.indexOf(pending[u].path) >= 0; });
    $('saveBtn').disabled = true; status('Envoi…');
    ups.reduce(function (p, u) { return p.then(function () { return put(pending[u].path, pending[u].b64, 'Éditeur : ajout de l\'image ' + pending[u].path).then(function () { pending[u].sent = true; }); }); }, Promise.resolve())
      .then(function () { return put(cur.path, textToB64(html), 'Éditeur : modification de ' + cur.path, cur.sha); })
      .then(function (r) { cur.sha = r.content.sha; setDirty(false); status('Publié ✓ — en ligne dans 1 à 2 minutes'); })
      .catch(function (e) {
        $('saveBtn').disabled = false;
        status(e.status === 409 || e.status === 422 ? 'La page a changé sur GitHub depuis son ouverture (par ex. après une demande à Claude) : clique « Annuler tout » pour la recharger, puis refais ta modification.' : 'Échec de l\'enregistrement : ' + e.message, true);
      });
  });

  /* ---------- Fichiers (CV, documents…) ---------- */
  $('filesBtn').addEventListener('click', function () { $('fileMsg').textContent = ''; $('filesDlg').showModal(); });
  $('filesClose').addEventListener('click', function () { $('filesDlg').close(); });
  $('fileSend').addEventListener('click', function () {
    var path = $('filePath').value.trim().replace(/^\/+/, ''), f = $('fileIn').files[0];
    if (!path || !f) { $('fileMsg').textContent = 'Indique le fichier du site et choisis le nouveau contenu.'; return; }
    $('fileMsg').textContent = 'Envoi…';
    f.arrayBuffer().then(function (buf) {
      return shaOf(path).then(function (sha) { return put(path, bytesToB64(new Uint8Array(buf)), 'Éditeur : ' + (sha ? 'mise à jour de ' : 'ajout de ') + path, sha); });
    }).then(function () { $('fileMsg').textContent = 'Envoyé ✓ — en ligne dans 1 à 2 minutes : ' + SITE + path; })
      .catch(function (e) { $('fileMsg').textContent = 'Échec : ' + e.message; });
  });

  /* ---------- Demander à Claude ---------- */
  $('askToggle').addEventListener('click', function () { $('ask').classList.toggle('open'); });
  $('askSend').addEventListener('click', function () {
    var t = $('askText').value.trim(); if (!t) return;
    var body = t + '\n\n---\nEnvoyé depuis l\'éditeur (page ouverte : ' + (cur ? cur.path : '?') + (sel ? ', élément sélectionné : ' + describe(sel) : '') + ').';
    var title = '[Claude] ' + t.replace(/\s+/g, ' ').slice(0, 70);
    $('askMsg').textContent = 'Envoi…';
    gh(repo('/issues'), { method: 'POST', body: { title: title, body: body, labels: ['demande-claude'] } })
      .catch(function () { return gh(repo('/issues'), { method: 'POST', body: { title: title, body: body } }); })
      .then(function () { $('askText').value = ''; $('askMsg').textContent = 'Demande envoyée ✓ Claude la traitera dans l\'heure et répondra ci-dessous.'; loadAsks(); })
      .catch(function (e) { $('askMsg').textContent = 'Échec : ' + e.message; });
  });
  function loadAsks() {
    gh(repo('/issues?state=all&per_page=30')).then(function (l) {
      var ul = $('askList'); ul.innerHTML = '';
      l.filter(function (i) { return !i.pull_request && /^\[Claude\]/.test(i.title); }).slice(0, 12).forEach(function (i) {
        var li = document.createElement('li'), a = document.createElement('a');
        a.href = i.html_url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = i.title.replace(/^\[Claude\]\s*/, '');
        li.textContent = i.state === 'closed' ? '✓ faite — ' : (i.comments ? '💬 en cours — ' : '⏳ en attente — '); li.appendChild(a); ul.appendChild(li);
      });
      if (!ul.children.length) ul.innerHTML = '<li>Aucune demande pour l\'instant.</li>';
    }).catch(function () {});
  }

  if (token) gh(repo('')).then(start, function (e) { showLogin(e.status === 401 ? 'Le jeton a expiré ou a été révoqué : crée-en un nouveau.' : 'Connexion impossible : ' + e.message); });
  else showLogin();
})();
