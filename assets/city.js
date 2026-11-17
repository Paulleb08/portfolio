/* Paul Signe's City (ville.html) : ville en pixel art, vue isométrique, plein écran et « sans fin ».
   Le centre (3 × 3 pâtés) porte les bâtiments cliquables ; autour, la ville continue au-delà de l'écran.
   Chaque bâtiment ouvre une fenêtre interne ; des habitants vont de bâtiment en bâtiment selon leur profil. */
(function () {
  'use strict';
  var HW = 24, HH = 12, M = 14, BACK = -16, CORE_W = 760, CORE_H = 610, CORE_TOP = 250;
  var cv = document.getElementById('city');
  if (!cv) return;
  var g = cv.getContext('2d'), stage = cv.parentNode, scroller = stage.parentNode, hud = document.querySelector('.hud'), titleEl = document.querySelector('.city-title');
  var W = 960, H = 600, OX = 480, OY = 250, S = 1, TOPA = 40;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, root = document.documentElement, N = false;

  function night() { return root.getAttribute('data-theme') === 'dark'; }
  function R(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function A(a, f) { var o = g.globalAlpha; g.globalAlpha = o * a; f(); g.globalAlpha = o; }
  function hash(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function mod(a, n) { return ((a % n) + n) % n; }
  function disc(cx, cy, r, c, sy) { sy = sy || 1; var ry = Math.max(1, Math.round(r * sy)); for (var dy = -ry; dy <= ry; dy++) { var w = Math.round(r * Math.sqrt(Math.max(0, 1 - (dy / ry) * (dy / ry)))); R(cx - w, cy + dy, 2 * w + 1, 1, c); } }
  function P(x, y) { return [OX + (x - y) * HW, OY + (x + y) * HH]; }
  function mix(a, b, f) { // mélange de deux couleurs #rrggbb
    var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), r = (x >> 16) + (((y >> 16) - (x >> 16)) * f), gg = ((x >> 8) & 255) + ((((y >> 8) & 255) - ((x >> 8) & 255)) * f), bb = (x & 255) + (((y & 255) - (x & 255)) * f);
    return '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(gg) << 8) | Math.round(bb)).toString(16).slice(1);
  }

  // Police pixel 3×5 pour les enseignes
  var F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '4': '101101111001001', '7': '111001010010010', '&': '011100010101011', '-': '000000111000000', "'": '010010000000000', '.': '000000000000010', ' ': '000000000000000' };
  function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase(); }
  function T(s, x, y, c, k) { k = k || 1; s = norm(s); for (var i = 0; i < s.length; i++) { var gl = F[s[i]] || F[' ']; for (var p = 0; p < 15; p++) if (gl[p] === '1') R(x + (i * 4 + p % 3) * k, y + ((p / 3) | 0) * k, k, k, c); } }
  function TL(s, k) { return s.length * 4 * (k || 1) - (k || 1); }

  /* ---------- Géométrie isométrique ---------- */
  function corners(b) { return { n: P(b.x, b.y), e: P(b.x + b.w, b.y), s: P(b.x + b.w, b.y + b.d), w: P(b.x, b.y + b.d) }; }
  // Faces visibles : gauche (coin ouest → sud) et droite (coin sud → est) ; u = abscisse le long de la face, v = hauteur
  function faceL(b) { var c = corners(b); return { x: c.w[0], y: c.w[1], dir: 1, len: c.s[0] - c.w[0] }; }
  function faceR(b) { var c = corners(b); return { x: c.s[0], y: c.s[1], dir: -1, len: c.e[0] - c.s[0] }; }
  function fr(f, u, v, ww, hh, c) { for (var i = 0; i < ww; i++) R(f.x + u + i, Math.floor(f.y + f.dir * (u + i) / 2) - v - hh, 1, hh, c); }
  function ftext(f, u, v, s, c) {
    s = norm(s);
    for (var i = 0; i < s.length; i++) { var gl = F[s[i]] || F[' ']; for (var p = 0; p < 15; p++) if (gl[p] === '1') { var gx = i * 4 + p % 3; R(f.x + u + gx, Math.floor(f.y + f.dir * (u + gx) / 2) - v - (5 - ((p / 3) | 0)), 1, 1, c); } }
  }
  function quad(b, c, z) { // losange au sol (ou toit à la hauteur z)
    z = z || 0; var k = corners(b);
    for (var X = k.w[0]; X <= k.e[0]; X++) {
      var up = X <= k.n[0] ? k.w[1] - (X - k.w[0]) / 2 : k.n[1] + (X - k.n[0]) / 2, lo = X <= k.s[0] ? k.w[1] + (X - k.w[0]) / 2 : k.s[1] - (X - k.s[0]) / 2;
      if (lo - up >= 0) R(X, Math.floor(up) - z, 1, Math.ceil(lo - up) + 1, c);
    }
  }
  function prism(b, h, top, l, r, z) {
    z = z || 0; var c = corners(b), X, yb;
    for (X = c.w[0]; X < c.s[0]; X++) { yb = c.w[1] + (X - c.w[0]) / 2 - z; R(X, yb - h, 1, h, l); }
    for (X = c.s[0]; X < c.e[0]; X++) { yb = c.s[1] - (X - c.s[0]) / 2 - z; R(X, yb - h, 1, h, r); }
    quad(b, top, z + h);
    R(c.s[0], c.s[1] - z - h, 1, h, N ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.35)'); // arête éclairée
  }
  function center(b, h) { var c = corners(b); return [(c.w[0] + c.e[0]) / 2, (c.n[1] + c.s[1]) / 2 - h]; }

  /* ---------- Cadrage : la ville remplit tout l'écran, le centre reste entier et lisible ---------- */
  function layout() {
    var vw = document.documentElement.clientWidth, vh = innerHeight, phone = vw < 720;
    if (titleEl && hud) titleEl.style.top = hud.offsetHeight + (phone ? 6 : 12) + 'px';
    var top = (phone && titleEl ? titleEl.getBoundingClientRect().bottom : (hud ? hud.offsetHeight : 0)) + 4, bottom = phone ? 6 : 46;
    var avail = Math.max(300, vh - top - bottom);
    S = Math.min(vw / CORE_W, avail / CORE_H);
    if (phone) S = Math.min(avail / CORE_H, 1.15); // sur téléphone : on fait glisser la ville
    var sw = Math.max(vw, Math.round(CORE_W * S));
    W = Math.ceil(sw / S); H = Math.ceil(vh / S); TOPA = (hud ? hud.offsetHeight : 0) / S; // haut visible du ciel, sous la barre
    OX = Math.round(W / 2); OY = Math.round(top / S + (avail / S - CORE_H) / 2 + CORE_TOP);
    cv.width = W; cv.height = H; stage.style.width = sw + 'px'; stage.style.height = vh + 'px';
    if (sw > vw) scroller.scrollLeft = (sw - vw) / 2;
  }

  /* ---------- Couleurs ---------- */
  var PAL = { // [jour, nuit] : dessus, face gauche, face droite
    glass: [['#bfe3f3', '#7fb8d8', '#5f9cc4'], ['#3a3270', '#2a2458', '#1f1a45']],
    white: [['#f4f4f0', '#dcdcd6', '#bdbdb6'], ['#4a4570', '#38345c', '#2a2748']],
    brick: [['#d9826a', '#b5523d', '#94402f'], ['#6e3446', '#552838', '#421f2c']],
    brown: [['#b98a6a', '#8f5e45', '#744a36'], ['#5a3a46', '#452c38', '#35212c']],
    stone: [['#efe2c4', '#d6c39b', '#b9a47c'], ['#5c5070', '#463d5a', '#362f47']],
    grey: [['#c9ccd3', '#9aa0ab', '#7c828d'], ['#3d3a5c', '#2f2c4a', '#24223b']],
    dark: [['#3a3448', '#2a2536', '#1e1a28'], ['#1f1832', '#171126', '#100c1c']],
    teal: [['#a8e6d8', '#5fbfa8', '#449e88'], ['#244a5a', '#1b3a48', '#142c37']],
    black: [['#2b2b30', '#1c1c21', '#111114'], ['#1a1626', '#120f1c', '#0b0912']]
  };
  function pal(n) { return PAL[n][N ? 1 : 0]; }
  var GLASSY = { glass: 1, teal: 1, dark: 1 };

  /* ---------- Le centre : 3 × 3 pâtés de 4 × 4 cases, rues sur les lignes 4 et 9 (et toutes les 5 cases au-delà) ---------- */
  var B = [ // doc = fenêtre ouverte ; spot = zone cliquable ; h = hauteur en pixels ; extra = ce qui dépasse du toit
    { x: 0, y: 2, w: 2, d: 2, h: 60, k: 'white', doc: 'cv', draw: billboard, extra: 50 },
    { x: 2, y: 0, w: 2, d: 2, h: 150, k: 'glass', doc: 'competences', draw: tower, extra: 82 },
    { x: 0, y: 0, w: 1, d: 1, h: 26, k: 'grey', doc: 'contact', draw: radio, extra: 96, dr: [0.5, 4.5] },
    { x: 5, y: 0, w: 2, d: 2, h: 92, k: 'brick', doc: 'vision-board', draw: coverBoard, extra: 58 },
    { x: 7, y: 0, w: 2, d: 2, h: 70, k: 'dark', doc: 'vision-board', spot: 'vb-club', draw: club, extra: 18 },
    { x: 5, y: 2, w: 2, d: 2, h: 44, k: 'black', doc: 'vision-board', spot: 'vb-mode', draw: couture, extra: 22 },
    { x: 7, y: 2, w: 2, d: 2, h: 30, k: 'stone', doc: 'vision-board', spot: 'vb-disques', draw: records, extra: 8 },
    { x: 10, y: 1, w: 3, d: 3, h: 60, k: 'brick', doc: 'a-propos', draw: school, extra: 14 },
    { x: 13, y: 0, w: 1, d: 3, h: 86, k: 'glass', draw: speakerWall },
    { x: 1, y: 5, w: 3, d: 3, h: 42, k: 'grey', doc: 'la-poste', draw: factory, extra: 40, below: 1 },
    { x: 5, y: 5, w: 4, d: 4, h: 0, doc: 'animation', draw: park, extra: 26 },
    { x: 10, y: 5, w: 3, d: 2, h: 46, k: 'white', doc: 'annexes', draw: archives, extra: 6, below: 1 },
    { x: 13, y: 5, w: 1, d: 3, h: 58, k: 'brown', draw: atelier },
    { x: 1, y: 10, w: 3, d: 2, h: 32, k: 'grey', doc: 'projets', draw: fablab, extra: 14 },
    { x: 5, y: 10, w: 3, d: 2, h: 28, k: 'brown', draw: hifiShop, extra: 22 },
    { x: 10, y: 10, w: 2, d: 2, h: 30, k: 'brick', doc: 'garde', draw: house, extra: 12, below: 1 },
    { x: 12, y: 10, w: 2, d: 2, h: 40, k: 'white', draw: concert },
    { x: 2.25, y: 2.25, w: 1.5, d: 1.5, h: 5, draw: bandstand },
    { x: 7.05, y: 5.15, w: .5, d: .3, h: 0, draw: photoshoot },
    { x: 8.45, y: 8.45, w: .3, d: .3, h: 0, draw: busker },
    { x: 5.2, y: 12.25, w: .9, d: .5, h: 7, draw: vinylStall },
    { x: 8, y: 12, w: 1, d: 1, h: 6, doc: 'plan', draw: metro, extra: 14, below: 1 }
  ];
  var TREES = [[1.4, 1.3], [3.8, 2.1], [2.1, 3.8], [0.5, 8.5], [2.5, 8.6], [11.5, 7.6], [10.5, 8.5], [12.6, 8.5], [0.5, 12.6], [2, 12.8], [3.5, 12.6], [6.8, 12.6], [10.5, 12.8], [12.5, 12.7], [13.5, 13.4]];
  B.forEach(function (b) { b.key = b.x + b.w / 2 + b.y + b.d / 2; b.door = b.dr || door(b); b.spot = b.spot || b.doc; });
  function door(b) { // entrée côté rue la plus proche
    if (b.x + b.w === 4 || b.x + b.w === 9) return [b.x + b.w + .5, b.y + b.d / 2];
    if (b.y + b.d === 4 || b.y + b.d === 9) return [b.x + b.w / 2, b.y + b.d + .5];
    if (b.x === 5 || b.x === 10) return [b.x - .5, b.y + b.d / 2];
    if (b.y === 5 || b.y === 10) return [b.x + b.w / 2, b.y - .5];
    return [b.x + b.w / 2, b.y + b.d + .5];
  }
  var byDoc = {}, bySpot = {}; B.forEach(function (b) { if (b.doc && !byDoc[b.doc]) byDoc[b.doc] = b; if (b.doc) bySpot[b.spot] = b; });

  // Images des pochettes (vision board) reprises en pixel art sur les panneaux de la ville
  // Albums préférés de Paul (pochettes dans assets/vb/albums) : panneaux, fresques, affiches qui défilent
  var ALB = ["college-dropout", "ram", "thriller", "purple-rain", "seychelles", "astroworld", "morning-glory", "808s", "discovery", "legend", "odyssee", "saw-85-92", "1986", "54-1", "audio-video-disco", "bad", "bar-mediterraneo", "blur", "cassius-1999", "catch-a-fire", "civilisation", "comment-c-est-loin", "devil-wears-prada", "eminem-show", "euphories", "exodus", "first-light", "francafrique", "good-bad-ugly", "heroes-capes", "heroes-villains", "homework", "human-after-all", "jesus-is-king", "kaya", "le-monde-chico", "lucky-boy", "matahari", "modjo", "my-type", "natty-dread", "off-the-wall", "paradise", "pulsar", "rammstein", "shouso-strip", "story-of-espion", "takanaka", "take-care", "tasty", "three-imaginary-boys", "utopia", "watermelon-dandies", "ye"];
  var IMG = {}, SRC = { grad: 'assets/vb/graduation.jpg', sade: 'assets/vb/diamond-life.jpg', 'p-lv': 'assets/vb/louis-vuitton.jpg', 'p-hermes': 'assets/vb/hermes-sellier.jpg', 'p-dior': 'assets/vb/dior.jpg', 'p-kef': 'assets/vb/kef-ls50.jpg', 'p-beo': 'assets/vb/beosound-9000.jpg', 'p-defile': 'assets/vb/defile.jpg' };
  function img(name) { // chargée à la première demande
    var im = IMG['_' + name]; if (im) return im;
    im = IMG['_' + name] = new Image(); im.onload = function () { IMG[name] = {}; im.ok = 1; fill.forEach(function (b) { if (b.board === name || b.mural === name) b.redo = dirty = true; }); }; im.src = SRC[name] || 'assets/vb/albums/' + name + '.jpg'; return im; // on ne redessine que l'immeuble qui porte cette pochette
  }
  function pix(name, w, h) { // pochette réduite (lissée) puis dessinée en gros pixels
    var im = img(name); if (!im.ok) return null; var key = w + 'x' + h;
    if (!IMG[name][key]) { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; var sw = im.naturalWidth, sh = im.naturalHeight, cw = Math.min(sw, sh * w / h), ch = cw * h / w; x.drawImage(im, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, w, h); IMG[name][key] = c; } // recadrée au centre
    return IMG[name][key];
  }
  function cover(name, x, y, w, h) { var c = pix(name, w, h); if (c) g.drawImage(c, Math.round(x), Math.round(y)); else R(x, y, w, h, '#555'); }
  function faceCover(name, f, u, v, w, h) { // pochette plaquée sur une façade (inclinée comme elle)
    var c = pix(name, w, h); if (!c) return fr(f, u, v, w, h, '#555');
    for (var i = 0; i < w; i++) g.drawImage(c, i, 0, 1, h, f.x + u + i, Math.floor(f.y + f.dir * (u + i) / 2) - v - h, 1, h);
  }
  var dirty = true;

  /* ---------- La ville continue hors de l'écran : pâtés générés autour du centre ---------- */
  function isRoad(i, j) { return mod(i, 5) === 4 || mod(j, 5) === 4; }
  var FK = ['brick', 'brown', 'stone', 'grey', 'glass', 'teal', 'white', 'brick', 'brown', 'dark'];
  // Enseignes et panneaux de la ville sur les thèmes du vision board (peu nombreux : ça reste un outil pro)
  var SIGNS = ['VINYL', 'HI-FI', 'ATELIER', 'RECORDS', 'COUTURE', 'STUDIO', 'JAZZ', 'BOUTIQUE', 'DISQUES', 'TAILLEUR', 'VINTAGE', 'SOUND'];
  var MURALS = { '-1,0': 'thriller', '0,-1': 'grad', '3,1': 'sade', '1,3': 'ram', '-2,1': 'seychelles', '1,-2': 'purple-rain', '4,1': 'astroworld', '1,4': 'college-dropout' };
  var BOARDS = { '-1,1': 'grad', '3,-1': 'sade', '-2,2': 'hz', '4,0': 'vinyl', '-1,4': 'p-defile', '3,2': 'p-beo', '-3,3': 'p-kef', '5,-1': 'p-lv', '-2,5': 'sil-green', '2,-2': 'sil-pink', '4,4': 'morning-glory', '-3,0': 'discovery', '-1,3': 'legend', '3,-2': 'odyssee', '5,1': '808s', '-2,4': 'saw-85-92', '2,5': 'sil-orange', '-4,2': 'p-hermes', '4,-3': 'sil-blue', '0,-3': 'p-dior', '-4,4': 'runway', '6,0': 'fw' };
  var fill = [], deco = [];
  function genWorld() {
    fill = []; deco = [];
    var bx0 = Math.floor(((-OX / HW) + BACK) / 10) - 2, bx1 = Math.ceil(((W - OX) / HW + (H - OY) / HH) / 10) + 2;
    for (var bx = bx0 - 6; bx <= bx1 + 2; bx++) for (var by = bx0 - 6; by <= bx1 + 2; by++) {
      if (bx >= 0 && bx <= 2 && by >= 0 && by <= 2) continue;
      var s = bx + by, x0 = bx * 5, y0 = by * 5; if (x0 + y0 < BACK) continue;
      var cp = P(x0 + 2, y0 + 2); if (cp[0] < -170 || cp[0] > W + 170 || cp[1] > H + 70 || cp[1] < -60) continue;
      var hs = function (n) { return hash(bx * 92.1 + by * 41.7 + n * 13.3); };
      var cheb = Math.max(-bx, bx - 2, -by, by - 2, 0), side = Math.abs(bx - by) >= 4;
      var hmax = side || s <= 0 ? 70 + Math.min(cheb, 4) * 35 : s >= 5 ? 30 : 40;
      var fog = cheb <= 1 ? .3 : cheb === 2 ? .45 : .58, key = bx + ',' + by;
      if (s >= 5 && hs(1) < .3) { deco.push({ t: 'green', x: x0, y: y0, fog: fog }); continue; } // petit square arboré
      var lots = [], r = hs(2);
      if (r < .25) lots.push([0, 0, 4, 4]); else if (r < .6) lots.push.apply(lots, hs(3) < .5 ? [[0, 0, 4, 2], [0, 2, 4, 2]] : [[0, 0, 2, 4], [2, 0, 2, 4]]); else lots.push([0, 0, 2, 2], [2, 0, 2, 2], [0, 2, 2, 2], [2, 2, 2, 2]);
      lots.forEach(function (l, n) {
        var q = hs(10 + n), k = FK[(q * FK.length) | 0], big = l[2] * l[3];
        var h = Math.round(Math.max(14, Math.min(hmax, (big >= 8 ? 50 : 26) + hs(20 + n) * hmax)));
        var b = { x: x0 + l[0] + .2, y: y0 + l[1] + .2, w: l[2] - .4, d: l[3] - .4, h: h, k: k, fog: fog, seed: bx * 31 + by * 17 + n };
        if (n === lots.length - 1 && MURALS[key]) { b.mural = MURALS[key]; b.h = Math.max(b.h, 40); } // fresque sur l'immeuble de devant, bien visible
        else if (n === 0 && BOARDS[key]) { b.board = BOARDS[key]; b.h = Math.min(b.h, 60); }
        else if (h <= 44 && hs(30 + n) < .36) b.sign = SIGNS[(hs(40 + n) * SIGNS.length) | 0];
        b.key = b.x + b.w / 2 + b.y + b.d / 2; fill.push(b);
      });
    }
  }

  /* ---------- Fond : ciel, silhouettes lointaines, sol et rues (mis en cache) ---------- */
  var bg = document.createElement('canvas'), bgKey = '';
  var SKY = { n: ['#07041c', '#0b0626', '#120a33', '#1a0d40', '#24104d', '#31145a', '#401866', '#521d70', '#682374', '#7f2a74', '#9a3270', '#b53c6a'], d: ['#2f6cc4', '#3878cc', '#4384d4', '#4f90dc', '#5c9ce3', '#6aa8e9', '#79b4ee', '#89c0f2', '#9acbf5', '#acd6f8', '#bfe0fa', '#d3e9fb'] };
  function isoLine(a, b, c) { var n = Math.max(1, Math.abs(b[0] - a[0])); for (var k = 0; k <= n; k++) R(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n, 1, 1, c); }
  function buildBg() {
    bg.width = W; bg.height = H; var main = g; g = bg.getContext('2d');
    var sky = N ? SKY.n : SKY.d, yH = OY + BACK * HH, bh = Math.max(8, Math.ceil((yH + 40) / sky.length)), x, k, z;
    sky.forEach(function (c, k) { R(0, k * bh, W, bh, c); if (k) for (var xx = 0; xx < W; xx += 2) { R(xx + (k % 2), k * bh, 1, 1, sky[k - 1]); if (xx % 4 === 0) R(xx + 1, k * bh + 1, 1, 1, sky[k - 1]); } });
    R(0, sky.length * bh, W, H, sky[sky.length - 1]);
    var mx = W - 110;
    if (N) { disc(mx, 46, 18, '#f6edd0'); disc(mx - 6, 41, 3, '#e3d6b0'); disc(mx + 6, 52, 2, '#e3d6b0'); for (k = 0; k < 160; k++) { var sx = hash(k) * W, sy = hash(k + 99) * yH; R(sx, sy, 1, 1, k % 9 ? '#ffffff' : '#ff9ae6'); if (k % 13 === 0) { R(sx - 1, sy, 3, 1, '#c9b8ff'); R(sx, sy - 1, 1, 3, '#c9b8ff'); } } }
    else { A(.35, function () { disc(mx, 46, 26, '#fff1a8'); }); disc(mx, 46, 18, '#ffd84a'); disc(mx - 4, 42, 10, '#ffe57a'); for (k = 0; k < 5; k++) { var cx = hash(k + 7) * W, cy = 20 + hash(k + 3) * (yH - 40); [[0, 0, 26], [14, -6, 18], [26, 2, 20]].forEach(function (q) { disc(cx + q[0], cy + q[1], q[2] / 3 | 0, 'rgba(255,255,255,.75)', .5); }); } }
    [[N ? '#1f1647' : '#a8bfe2', yH + 30, 1.4], [N ? '#150f35' : '#8ea9d4', yH + 60, 1]].forEach(function (L, li) { // gratte-ciel lointains
      for (x = -10; x < W;) {
        var w = 14 + (hash(x + li * 50) * 30 | 0), h = 60 + (hash(x * 3 + li) * 190 | 0) / L[2]; R(x, L[1] - h, w, h + 200, L[0]);
        if (hash(x + 7) > .7) { R(x + w / 2 - 1, L[1] - h - 16, 2, 16, L[0]); if (N) R(x + w / 2 - 1, L[1] - h - 18, 2, 2, '#ff3b3b'); }
        for (var yy = L[1] - h + 5; yy < L[1] + 40; yy += 7) for (var xx = x + 3; xx < x + w - 3; xx += 5) if (hash(xx * 13 + yy + li) > (N ? .72 : .62)) R(xx, yy, 2, 3, N ? (hash(xx + yy) > .8 ? '#5ef2ff' : '#ffd56b') : '#c3d4ee');
        x += w + 1;
      }
    });
    var road = N ? '#1d1b33' : '#5b6170', walk = N ? '#3a3658' : '#e4e1da', curb = N ? '#55507a' : '#ffffff', mark = '#e8c547';
    R(0, yH, W, H - yH, road);
    var i0 = Math.floor(BACK / 5) - 1, span = Math.ceil((W / HW + (H - OY) / HH) / 5) + 4;
    for (var bx = i0 - span; bx <= span + 2; bx++) for (var by = i0 - span; by <= span + 2; by++) {
      var x0 = bx * 5, y0 = by * 5; if (x0 + y0 + 4 < BACK) continue;
      var cp = P(x0 + 2, y0 + 2); if (cp[0] < -150 || cp[0] > W + 150 || cp[1] > H + 80 || cp[1] < yH - 70) continue;
      var core = bx >= 0 && bx <= 2 && by >= 0 && by <= 2, park = bx === 1 && by === 1;
      quad({ x: x0, y: y0, w: 4, d: 4 }, walk);
      var c = corners({ x: x0, y: y0, w: 4, d: 4 }); isoLine(c.w, c.s, curb); isoLine(c.s, c.e, curb);
      for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { // dalles du trottoir et des cours
        var lot = { x: x0 + i + .12, y: y0 + j + .12, w: .76, d: .76 };
        if (park) quad({ x: x0 + i, y: y0 + j, w: 1, d: 1 }, (i + j) % 2 ? (N ? '#1f4a3a' : '#79cf6a') : (N ? '#1b4234' : '#6cc45e'));
        else if (core) quad(lot, (i + j) % 2 ? (N ? '#2a2846' : '#d7d9de') : (N ? '#26243f' : '#cfd2d8'));
        else quad(lot, N ? '#2d2a4a' : '#d3d0c8');
      }
      if (x0 + y0 + 4 >= BACK) for (k = 0; k < 4; k++) { // marquage et passages piétons
        var a = P(x0 + k + .5, y0 + 4.5), b = P(x0 + 4.5, y0 + k + .5);
        if (k === 1 || k === 2) for (var q = -3; q <= 3; q++) { R(a[0] + q, a[1] + q / 2, 1, 1, mark); R(b[0] + q, b[1] - q / 2, 1, 1, mark); }
      }
      for (z = 0; z < 4; z++) [.12, 3.12].forEach(function (o) { // passages piétons aux deux bouts de chaque rue
        var zc = N ? '#77749a' : '#f4f4f4'; quad({ x: x0 + o + z * .21, y: y0 + 4.08, w: .1, d: .84 }, zc); quad({ x: x0 + 4.08, y: y0 + o + z * .21, w: .84, d: .1 }, zc);
      });
    }
    if (N) for (var r1 = 0; r1 <= 3; r1++) for (var r2 = 0; r2 <= 3; r2++) { var p = P(r1 * 5 - .5, r2 * 5 - .5); halo(p[0], p[1], 46, 'rgba(255,79,216,'); halo(p[0], p[1], 80, 'rgba(122,60,255,'); }
    g = main; bgKey = N + ':' + W + 'x' + H;
  }

  /* ---------- Immeubles détaillés (façades, vitrines, toits new-yorkais) ---------- */
  var AWN = ['#c0392b', '#1b2fbf', '#2a9d8f', '#d4af37', '#6a1b9a'];
  var LIT = .5; function lit(n) { var r = hash(n); return N ? (r > LIT ? (r > .95 ? '#ff7ad9' : r > .88 ? '#5ef2ff' : r > .7 ? '#ffe9a8' : '#ffd56b') : '#241d44') : null; }
  function detailed(b) {
    var p = pal(b.k), h = b.h, L = faceL(b), Rf = faceR(b), glassy = GLASSY[b.k], sd = b.seed || (b.x * 17 + b.y * 7), u, v;
    LIT = .5 + (b.fog || 0) * .7;
    prism(b, h, p[0], p[1], p[2]);
    var frame = N ? '#5a5478' : (glassy ? '#e8f4fb' : '#efe6d6');
    [L, Rf].forEach(function (f, side) {
      if (h > 16) { fr(f, 0, h - 3, f.len, 3, side ? mix(p[2], '#000000', .25) : mix(p[1], '#000000', .2)); fr(f, 0, h - 4, f.len, 1, N ? '#6a6490' : '#ffffff'); } // corniche
      if (glassy) { // bandeaux vitrés
        for (v = 13; v <= h - 9; v += 8) { fr(f, 1, v, f.len - 2, 5, N ? '#1c1640' : (side ? '#86c0e4' : '#a9d7f2')); for (u = 2; u < f.len - 3; u += 6) { var c = lit(sd * 7 + side * 3 + u + v * 5); if (c) fr(f, u, v + 1, 5, 3, c); else if (!N && (u + v) % 18 === 0) fr(f, u, v + 3, 2, 1, '#ffffff'); } }
      } else { // fenêtres à encadrement, une par travée
        for (v = 13; v <= h - 10; v += 10) for (u = 3; u <= f.len - 7; u += 8) {
          fr(f, u, v, 5, 7, frame); var cc = lit(sd * 7 + side * 3 + u + v * 5);
          fr(f, u + 1, v + 1, 3, 5, cc || (side ? '#4d6f96' : '#6a8fb8')); if (!cc) fr(f, u + 1, v + 4, 3, 2, side ? '#3b5878' : '#54769c');
          fr(f, u, v - 1, 5, 1, N ? '#2e2a48' : mix(side ? p[2] : p[1], '#000000', .3));
        }
        if (side && (b.k === 'brick' || b.k === 'brown') && h >= 40) for (v = 12; v <= h - 12; v += 10) { var u0 = Math.max(4, f.len - 22); fr(f, u0, v - 1, 15, 1, '#1a1622'); fr(f, u0, v + 3, 15, 1, '#1a1622'); for (var k = 0; k < 10; k++) fr(f, u0 + 3 + k, v + k, 1, 1, '#2a2632'); } // escaliers de secours
      }
      fr(f, 2, 0, f.len - 4, 9, N ? '#14102a' : '#3b4252'); // rez-de-chaussée
      for (u = 4; u < f.len - 7; u += 8) fr(f, u, 1, 6, 6, N ? (hash(sd + u + side * 9) > .4 ? '#ffcf73' : '#2a2450') : '#8fb8d8');
      if (!glassy && hash(sd + side * 5) > .45) { var aw = AWN[(hash(sd + side) * AWN.length) | 0]; for (u = 2; u < f.len - 2; u++) fr(f, u, 9, 1, 2, (u >> 1) % 2 ? aw : '#f5f1e8'); }
    });
    roof(b, sd);
    if (b.mural) { var mf = L.len >= Rf.len ? L : Rf, ms = Math.min(34, h - 16, mf.len - 10), mu = Math.round((mf.len - ms) / 2); fr(mf, mu - 2, 10, ms + 4, ms + 4, N ? '#0d0a18' : '#f7f2e6'); faceCover(b.mural, mf, mu, 12, ms, ms); }
    if (b.sign) {
      var fashion = /COUTURE|BOUTIQUE|TAILLEUR|ATELIER|VINTAGE/.test(b.sign);
      for (var wu = 5; wu < Math.min(L.len - 8, 40); wu += 9) if (fashion) { fr(L, wu + 2, 1, 2, 5, ['#c0182e', '#111', '#d4af37', '#2a9d8f'][(wu / 9 | 0) % 4]); fr(L, wu + 2, 6, 2, 1, '#e0c9a6'); }
      else { fr(L, wu + 1, 2, 4, 4, '#111'); fr(L, wu + 2, 3, 2, 2, ['#e63946', '#ffd60a', '#3ef0ff'][(wu / 9 | 0) % 3]); }
    }
    if (b.sign) { var sl = TL(b.sign) + 6, on = N ? '#ff4fd8' : '#ffffff', bgc = N ? '#1a0f2e' : '#1b2fbf'; fr(L, 5, 12, sl, 8, bgc); ftext(L, 8, 13, b.sign, N && hash(sd) > .5 ? '#3ef0ff' : on); }
    if (b.board) roofBoard(b, b.board);
  }
  function roof(b, sd) {
    var h = b.h, c = center(b, h), r = hash(sd + 3);
    if ((b.k === 'brick' || b.k === 'brown' || b.k === 'stone') && h >= 34 && r > .4 && !b.board) waterTower(c[0] - 6, c[1] - 1);
    if (r < .7) prism({ x: b.x + b.w * .6, y: b.y + b.d * .2, w: .3, d: .3 }, 4, N ? '#55507a' : '#d9dce2', N ? '#3d3a5c' : '#a9afb9', N ? '#2f2c4a' : '#8a909b', h);
    if (GLASSY[b.k] && h > 110) { R(c[0], c[1] - 22, 1, 22, '#c9ccd3'); R(c[0] - 1, c[1] - 24, 3, 3, N ? '#ff3b3b' : '#d23b3b'); }
  }
  function waterTower(x, y) { // château d'eau en bois sur pilotis, typique de New York
    var wd = N ? '#6a4a3a' : '#9a6a48', sh = N ? '#4a3228' : '#74492f', band = '#2b1e16';
    R(x - 3, y - 5, 1, 5, '#2b2b2b'); R(x + 3, y - 5, 1, 5, '#2b2b2b'); R(x, y - 5, 1, 4, '#2b2b2b'); R(x - 3, y - 3, 7, 1, '#2b2b2b');
    R(x - 4, y - 15, 9, 10, wd); R(x + 1, y - 15, 4, 10, sh); R(x - 4, y - 12, 9, 1, band); R(x - 4, y - 8, 9, 1, band);
    for (var k = 0; k < 5; k++) R(x - k, y - 16 - (4 - k), 2 * k + 1, 1, k % 2 ? '#3d2b20' : '#4e3829');
  }
  function roofBoard(b, kind) { // panneau publicitaire sur le toit, face à la rue
    var c = center(b, b.h), bw = 38, bh = 26, x = Math.round(c[0] - bw / 2), y = Math.round(c[1] - bh - 10);
    if (kind.indexOf('sil-') === 0) { var sx = Math.round(c[0] - 15), sy = Math.round(c[1] - 50); R(sx + 6, sy + 38, 2, 12, '#3a3a3a'); R(sx + 22, sy + 38, 2, 12, '#3a3a3a'); R(sx - 1, sy - 1, 32, 40, '#111'); R(sx, sy, 30, 38, SILC[kind.slice(4)]); silhouette(function (cc, r, col) { R(sx + 5 + cc, sy + 6 + r, 1, 1, col); }, false); if (N) A(.2, function () { R(sx - 3, sy - 3, 36, 44, '#fff6c8'); }); return; }
    R(x + 6, y + bh, 2, 10, '#3a3a3a'); R(x + bw - 8, y + bh, 2, 10, '#3a3a3a'); R(x + 4, y + bh + 4, bw - 8, 1, '#3a3a3a');
    R(x - 1, y - 1, bw + 2, bh + 2, '#111'); R(x, y, bw, bh, N ? '#1a1430' : '#f7f2e6');
    if (kind.indexOf('p-') === 0) { R(x - 1, y - 1, bw + 2, bh + 2, '#111'); cover(kind, x, y, bw, bh); if (N) A(.15, function () { R(x - 3, y - 3, bw + 6, bh + 6, '#fff6c8'); }); return; }
    if (ALB.indexOf(kind) > -1) { R(x + 3, y - 3, 32, 32, '#111'); cover(kind, x + 4, y - 2, 30, 30); R(x - 1, y - 1, 0, 0, '#111'); if (N) A(.18, function () { R(x, y - 6, 38, 38, '#fff6c8'); }); return; }
    if (kind === 'grad' || kind === 'sade') { cover(kind, x + 1, y + 1, bh - 2, bh - 2); T(kind === 'grad' ? 'NOW' : 'SADE', x + bh + 1, y + 3, N ? '#ff4fd8' : '#c0392b'); T(kind === 'grad' ? 'ON' : '84', x + bh + 1, y + 10, N ? '#3ef0ff' : '#1b2fbf'); R(x + bh + 2, y + 18, 7, 4, '#d4af37'); }
    else if (kind === 'hz') { T('20 HZ', x + 9, y + 2, N ? '#3ef0ff' : '#1b2fbf'); for (var i = 0; i < bw - 6; i++) R(x + 3 + i, y + 13 + Math.round(Math.sin(i * (0.25 + i / 60)) * 4), 1, 1, N ? '#ff4fd8' : '#c0392b'); T('20 KHZ', x + 7, y + 19, N ? '#3ef0ff' : '#1b2fbf'); }
    else if (kind === 'vinyl') { disc(x + 13, y + 13, 10, '#111'); disc(x + 13, y + 13, 7, '#2a2a2a'); disc(x + 13, y + 13, 3, N ? '#ff4fd8' : '#e63946'); R(x + 13, y + 13, 1, 1, '#eee'); T('LP', x + 27, y + 10, N ? '#ffe14f' : '#111'); }
    else if (kind === 'runway') { T('PARIS', x + 9, y + 3, N ? '#d4af37' : '#111'); R(x + 4, y + 20, bw - 8, 2, N ? '#f5f5f5' : '#333'); R(x + 18, y + 10, 2, 3, '#e0ac69'); R(x + 17, y + 13, 4, 5, N ? '#ff2e88' : '#111'); R(x + 17, y + 18, 1, 2, '#e0ac69'); R(x + 20, y + 18, 1, 2, '#e0ac69'); }
    else if (kind === 'kef') { T('KEF', x + 4, y + 9, N ? '#ffffff' : '#111', 2); R(x + 27, y + 3, 9, 20, '#1c1c21'); disc(x + 31, y + 9, 2, '#9aa1ad'); disc(x + 31, y + 17, 3, '#5f6672'); R(x + 31, y + 17, 1, 1, '#d4af37'); }
    else if (kind === 'trunk') { R(x + 4, y + 6, 18, 14, '#7a4a2a'); R(x + 4, y + 11, 18, 1, '#d4af37'); R(x + 9, y + 6, 2, 14, '#4a2c18'); R(x + 15, y + 6, 2, 14, '#4a2c18'); [[4, 6], [20, 6], [4, 18], [20, 18]].forEach(function (q) { R(x + q[0], y + q[1], 2, 2, '#d4af37'); }); R(x + 11, y + 3, 4, 3, '#4a2c18'); T('MALLE', x + 24 - 9, y + 21, N ? '#d4af37' : '#5a3a1a'); }
    else if (kind === 'notes') { T('LIVE', x + 4, y + 4, N ? '#ff4fd8' : '#c0392b', 2); [[24, 8], [31, 4]].forEach(function (q) { R(x + q[0] + 2, y + q[1], 1, 9, N ? '#3ef0ff' : '#1b2fbf'); disc(x + q[0], y + q[1] + 9, 2, N ? '#3ef0ff' : '#1b2fbf'); R(x + q[0] + 3, y + q[1], 3, 1, N ? '#3ef0ff' : '#1b2fbf'); }); T('MUSIC', x + 6, y + 19, N ? '#ffe14f' : '#111'); }
    else if (kind === 'fw') { T('FASHION', x + 5, y + 4, N ? '#d4af37' : '#111'); T('WEEK', x + 11, y + 11, N ? '#ff2e88' : '#c0392b'); R(x + 18, y + 18, 1, 2, '#888'); for (var k = 0; k < 7; k++) { R(x + 18 - k, y + 20 + k / 2, 1, 1, '#888'); R(x + 18 + k, y + 20 + k / 2, 1, 1, '#888'); } R(x + 11, y + 23, 15, 1, '#888'); }
    else if (kind === 'beo') { T('B&O', x + 13, y + 4, N ? '#ffffff' : '#111'); disc(x + 19, y + 17, 5, N ? '#9aa1ad' : '#b9bec7'); disc(x + 19, y + 17, 2, '#5f6672'); }
    if (N) A(.18, function () { R(x - 4, y - 4, bw + 8, bh + 8, '#fff6c8'); });
  }
  var FOG = { d: '#c5dbf2', n: '#1a0f3a' };
  var SILC = { pink: '#ff5fa2', green: '#7ed957', blue: '#4fc3f7', orange: '#ffa726', purple: '#b388ff' };
  var SIL = [ // danseuse en ombre chinoise, 20 × 27 : # = corps, w = fil blanc et baladeur
    '........####........', '.......######.......', '.......######.......', '.......#####w#......', '........####w.......', '.##.......#w........', '..##.....###w.......', '...##...####w##.....', '....##.#####w.##....',
    '.....#######w..##...', '......######w...##..', '.......#####w....#..', '.......#####.w..ww..', '.......#####..w.ww..', '.......######..www..', '......#######.......', '......########......', '.....####..####.....',
    '.....###....####....', '....###.......###...', '....###........###..', '...###..........##..', '...###...........##.', '..###............##.', '..##..............##', '.###................', '####................'];
  function silhouette(px, flip) { // px(colonne, rangée, couleur) ; flip = miroir (la danseuse change de côté)
    for (var r = 0; r < SIL.length; r++) for (var c = 0; c < 20; c++) { var ch = SIL[r][c]; if (ch !== '.') px(flip ? 19 - c : c, r, ch === '#' ? '#111' : '#f4f4f4'); }
  }
  function sprite(b) { // immeuble lointain dessiné une fois dans sa propre image, voilé par la brume
    var c = corners(b), x0 = Math.floor(c.w[0]) - 24, x1 = Math.ceil(c.e[0]) + 24, y0 = Math.floor(c.n[1] - b.h - 50), y1 = Math.ceil(c.s[1]) + 2;
    var sc = document.createElement('canvas'); sc.width = x1 - x0; sc.height = y1 - y0; var main = g; g = sc.getContext('2d'); g.translate(-x0, -y0);
    detailed(b); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = b.fog; g.fillStyle = N ? FOG.n : FOG.d; g.fillRect(0, 0, sc.width, sc.height);
    g = main; b.spr = sc; b.sx = x0; b.sy = y0;
  }

  /* ---------- Bâtiments remarquables du centre ---------- */
  function box(b) { detailed(b); }
  function ribbons(b, h, z, sd) { [faceL(b), faceR(b)].forEach(function (f, side) { for (var v = 6; v <= h - 6; v += 8) { fr(f, 1, v + z, f.len - 2, 4, N ? '#1c1640' : (side ? '#86c0e4' : '#a9d7f2')); for (var u = 2; u < f.len - 3; u += 6) { var c = lit(sd + side * 3 + u + v * 5); if (c) fr(f, u, v + z + 1, 5, 2, c); } } }); }
  function tower(b, t) {
    var p = pal(b.k), t2 = { x: b.x + .35, y: b.y + .35, w: 1.3, d: 1.3 }, t3 = { x: b.x + .65, y: b.y + .65, w: .7, d: .7 };
    detailed(b); prism(t2, 34, p[0], p[1], p[2], b.h); ribbons(t2, 34, b.h, 41); prism(t3, 18, p[0], p[1], p[2], b.h + 34); ribbons(t3, 18, b.h + 34, 77);
    var c = center(t3, b.h + 52); R(c[0], c[1] - 26, 1, 26, '#d0d4dc'); if (reduce || (t / 700 | 0) % 2) R(c[0] - 1, c[1] - 29, 3, 3, '#ff3b3b');
    var f = faceR(b); fr(f, 2, 18, 48, 9, '#1b2fbf'); ftext(f, 4, 20, 'COMPETENCES', '#ffffff');
    var Lt = faceL(b), beat = reduce ? 0 : (t / 450 | 0) % 2, bgc = ['#ff5fa2', '#4fc3f7', '#7ed957', '#ffa726'][reduce ? 0 : (t / 3600 | 0) % 4];
    fr(Lt, 2, 76, 44, 62, '#111'); fr(Lt, 3, 77, 42, 60, bgc); silhouette(function (c, r, col) { fr(Lt, 4 + c * 2, 130 - r * 2, col === '#111' ? 2 : 1, 2, col); }, beat);
    if (N) fr(Lt, 4, 134, 40, 1, '#fff6c8');
  }
  function radio(b, t) {
    detailed(b); var c = center(b, b.h), top = c[1] - 92;
    for (var y = top; y < c[1]; y++) { var lw = 1 + ((y - top) / 92 * 7 | 0), col = ((y / 9) | 0) % 2 ? '#e8e8ee' : '#d23b3b'; R(c[0] - lw, y, 1, 1, col); R(c[0] + lw, y, 1, 1, col); if ((y - top) % 10 === 0) R(c[0] - lw, y, lw * 2 + 1, 1, col); }
    if (reduce || (t / 600 | 0) % 2) R(c[0] - 1, top - 3, 3, 3, '#ff3b3b');
    if (!reduce) for (var j = 0; j < 3; j++) { var ph = (t / 1400 + j / 3) % 1, r = 4 + ph * 18; A(1 - ph, function () { for (var a = -.9; a <= .9; a += .1) { R(c[0] + Math.cos(a) * r, top + Math.sin(a) * r, 1, 1, '#fff'); R(c[0] - Math.cos(a) * r, top + Math.sin(a) * r, 1, 1, '#fff'); } }); }
    var f = faceR(b); fr(f, 1, 12, 22, 8, '#f4f1ea'); ftext(f, 2, 13, 'RADIO', '#c62828');
  }
  function billboard(b, t) {
    detailed(b); var c = center(b, b.h), bw = 62, bh = 32, x = c[0] - bw / 2, y = c[1] - bh - 12;
    R(c[0] - 16, y + bh, 2, 14, '#444'); R(c[0] + 14, y + bh, 2, 14, '#444'); R(c[0] - 18, y + bh + 6, 36, 1, '#444');
    R(x - 1, y - 1, bw + 2, bh + 2, '#111'); R(x + 1, y + 1, bw - 2, bh - 2, '#f7f2e6'); R(x + 1, y + 1, bw - 2, 3, '#1b2fbf');
    T('PAUL SIGNE', x + (bw - TL('PAUL SIGNE')) / 2, y + 7, '#1b2fbf'); T('CV', x + (bw - TL('CV', 2)) / 2, y + 15, '#d62828', 2);
    if (N) A(.22, function () { R(x - 4, y - 4, bw + 8, bh + 8, '#fff6c8'); });
  }
  function coverBoard(b, t) { // grand panneau du quartier des passions : pochettes (son) et mode
    detailed(b); var Lw = faceL(b), tick = reduce ? 0 : (t / 2600 | 0);
    fr(Lw, 3, 45, 42, 46, N ? '#0d0a18' : '#2b2b30'); ftext(Lw, 6, 83, 'MES ALBUMS', N ? '#ffe14f' : '#ffffff'); // mur de pochettes, au-dessus du toit de la couture
    for (var gi = 0; gi < 9; gi++) faceCover(ALB[(gi * 7 + (gi % 3 === tick % 3 ? tick : 0)) % ALB.length], Lw, 6 + (gi % 3) * 13, 47 + (2 - ((gi / 3) | 0)) * 12, 11, 11); var c = center(b, b.h), bw = 76, bh = 46, x = Math.round(c[0] - bw / 2), y = Math.round(c[1] - bh - 12);
    R(x + 10, y + bh, 2, 12, '#3a3a3a'); R(x + bw - 12, y + bh, 2, 12, '#3a3a3a'); R(x + 8, y + bh + 5, bw - 16, 1, '#3a3a3a');
    R(x - 2, y - 2, bw + 4, bh + 4, '#111'); R(x, y, bw, bh, N ? '#140f24' : '#f7f2e6');
    cover('grad', x + 2, y + 2, 42, 42); cover('sade', x + 46, y + 2, 28, 28);
    T('SON', x + 48, y + 33, N ? '#3ef0ff' : '#1b2fbf'); T('MODE', x + 48, y + 39, N ? '#ff4fd8' : '#c0392b');
    if (N) { A(.2, function () { R(x - 5, y - 5, bw + 10, bh + 10, '#fff6c8'); }); for (var k = 0; k < bw; k += 6) R(x + k, y - 3, 2, 1, (k / 6 + (reduce ? 0 : t / 300 | 0)) % 2 ? '#ffe14f' : '#ff4fd8'); }
  }
  function club(b, t) {
    var p = pal(b.k), on = reduce || hash(t / 180 | 0) > .08, beat = reduce ? 0 : (t / 250 | 0) % 2;
    prism(b, b.h, p[0], p[1], p[2]); fr(faceL(b), 0, b.h - 3, faceL(b).len, 3, '#ff4fd8'); fr(faceR(b), 0, b.h - 3, faceR(b).len, 3, '#3ef0ff');
    var L = faceL(b), Rf = faceR(b), cols = ['#ff4fd8', '#3ef0ff', '#ffe14f', '#7dff8a'];
    for (var u = 4; u < L.len - 6; u += 8) fr(L, u, 30, 5, 28, cols[((u / 8 | 0) + (reduce ? 0 : t / 300 | 0)) % 4]); // baies de la piste de danse
    for (u = 6; u < L.len - 8; u += 10) { var up = reduce ? 0 : (Math.sin(t / 160 + u) > 0 ? 1 : 0); fr(L, u + 1, 33 + up, 2, 6, '#120c1f'); fr(L, u + 1, 39 + up, 2, 2, '#120c1f'); } // danseurs
    fr(Rf, 3, 46, 42, 11, '#120c1f'); ftext(Rf, 5, 49, 'CLUB', on ? '#ff4fd8' : '#5a2a55'); ftext(Rf, 25, 49, 'NIGHT', on ? '#3ef0ff' : '#21505a');
    fr(L, 3, 4, 40, 20, '#1d5a63'); ftext(L, 6, 16, 'VINYL', '#3ef0ff');
    for (var k = 0; k < 3; k++) { var X = L.x + 28 + k * 5, Y = Math.floor(L.y + (28 + k * 5) / 2) - 9; disc(X, Y, 2, '#111'); R(X, Y, 1, 1, cols[k]); }
    fr(Rf, 24, 0, 8, 14, on ? '#ff4fd8' : '#3b1d3a');
    var c = center(b, b.h); // projecteurs et enceintes sur le toit
    if (N || !reduce) cols.slice(0, 3).forEach(function (col, i) { var a = -Math.PI / 2 + Math.sin(t / 800 + i * 2) * .5; A(.4, function () { for (var l = 3; l < 50; l++) R(c[0] + Math.cos(a) * l, c[1] + Math.sin(a) * l, 2, 1, col); }); });
    drawPerson(c[0], c[1] - 3, 'dj', 1, false, beat); R(c[0] - 6, c[1] - 9, 12, 5, '#222'); R(c[0] - 6, c[1] - 9, 12, 1, '#555'); disc(c[0] - 3, c[1] - 7, 1, '#888'); disc(c[0] + 3, c[1] - 7, 1, '#888'); R(c[0], c[1] - 8, 1, 1, N ? '#3ef0ff' : '#e63946');
    R(c[0] - 13, c[1] - 7, 6, 8, '#0a0a0a'); R(c[0] + 7, c[1] - 7, 6, 8, '#0a0a0a'); disc(c[0] - 10, c[1] - 4, 1 + beat, '#777'); disc(c[0] + 10, c[1] - 4, 1 + beat, '#777'); R(c[0] - 10, c[1] - 6, 1, 1, '#ccc'); R(c[0] + 10, c[1] - 6, 1, 1, '#ccc');
    if (!reduce) for (var j = 0; j < 3; j++) { var ph = (t / 2600 + j / 3) % 1, nx = c[0] - 16 + j * 14 + Math.sin(ph * 6) * 3, ny = c[1] - 10 - ph * 34; A(1 - ph, function () { R(nx, ny, 1, 5, '#ffe14f'); R(nx - 2, ny + 4, 3, 2, '#ffe14f'); R(nx + 1, ny, 2, 1, '#ffe14f'); }); }
  }
  function couture(b, t) {
    var p = pal(b.k), gold = '#d4af37', L = faceL(b), Rf = faceR(b); prism(b, b.h, p[0], p[1], p[2]);
    fr(L, 0, b.h - 2, L.len, 2, gold); fr(Rf, 0, b.h - 2, Rf.len, 2, gold);
    fr(L, 4, 29, 40, 9, '#111'); ftext(L, 9, 31, 'COUTURE', gold);
    for (var k = 0; k < 2; k++) { var u = 6 + k * 20; fr(L, u, 3, 15, 22, N ? '#ffe9c4' : '#f6ead3'); fr(L, u + 7, 19, 1, 4, '#999'); fr(L, u + 5, 9, 5, 10, ['#c0182e', '#1d1d1d'][k]); fr(L, u + 6, 19, 3, 1, ['#c0182e', '#1d1d1d'][k]); fr(L, u + 6, 6, 3, 3, '#c9a27a'); fr(L, u + 1, 3, 13, 1, gold); }
    for (k = 0; k < Rf.len / 4; k++) fr(Rf, k * 4, 24, 4, 3, k % 2 ? '#fff' : '#111');
    fr(Rf, 16, 0, 12, 20, '#2b2a33'); fr(Rf, 21, 0, 1, 20, gold);
    var a = P(b.x + .3, b.y + b.d / 2), e = P(b.x + b.w - .3, b.y + b.d / 2); // podium du défilé sur le toit
    for (var s = 0; s <= 1; s += .01) R(a[0] + (e[0] - a[0]) * s - 1, a[1] + (e[1] - a[1]) * s - b.h - 1, 3, 2, '#f5f5f5');
    for (s = 0; s <= 1; s += .25) { var q = [a[0] + (e[0] - a[0]) * s, a[1] + (e[1] - a[1]) * s - b.h]; R(q[0] - 4, q[1] - 6, 1, 6, '#555'); if (N) A(.5, function () { R(q[0] - 5, q[1] - 7, 3, 2, '#fff6c8'); }); }
    var m = reduce ? .5 : .5 - .5 * Math.cos(t / 2600), mx = a[0] + (e[0] - a[0]) * m, my = a[1] + (e[1] - a[1]) * m - b.h;
    if (N) A(.25, function () { disc(mx, my - 9, 11, '#fff6c8'); });
    drawPerson(mx, my, 'model', 1, Math.sin(t / 2600) < 0, reduce ? 0 : (t / 180 | 0) % 4);
    if (!reduce && hash(t / 400 | 0) > .7) R(e[0] - 4, e[1] - b.h - 12, 2, 2, '#fff');
  }
  function records(b, t) { // disquaire : pochettes en vitrine et vinyle géant qui tourne sur le toit
    detailed(b); var L = faceL(b), Rf = faceR(b), c = center(b, b.h);
    fr(L, 3, 1, 42, 17, N ? '#2a1f3f' : '#f0e6d2'); var rt = reduce ? 0 : (t / 3500 | 0); faceCover(rt % 2 ? ALB[(rt * 3 + 5) % ALB.length] : 'sade', L, 5, 3, 13, 13); faceCover(rt % 2 ? 'grad' : ALB[(rt * 3 + 9) % ALB.length], L, 20, 3, 13, 13);
    for (var k = 0; k < 4; k++) fr(L, 35 + k * 2, 3, 1, 9, ['#c0392b', '#1b2fbf', '#d4af37', '#111'][k]);
    fr(L, 3, 19, 42, 7, '#111'); ftext(L, 6, 20, 'DISQUAIRE', N ? '#ffe14f' : '#ffffff');
    fr(Rf, 6, 0, 9, 14, '#3b2a22'); fr(Rf, 18, 12, 24, 8, N ? '#1a0f2e' : '#c0392b'); ftext(Rf, 21, 13, 'VINYL', N ? '#3ef0ff' : '#ffffff');
    var rot = reduce ? 0 : t / 600, cy = c[1] - 7; R(c[0] - 1, cy, 2, 7, '#333');
    disc(c[0], cy, 9, '#111', .5); disc(c[0], cy, 6, '#262626', .5); disc(c[0], cy, 2, N ? '#ff4fd8' : '#e63946', .5);
    for (k = 0; k < 2; k++) { var a = rot + k * Math.PI; R(c[0] + Math.cos(a) * 7, cy + Math.sin(a) * 3.5, 1, 1, '#777'); }
  }
  function circleOn(f, cu, cv, r, c) { for (var du = -r; du <= r; du++) for (var dv = -r; dv <= r; dv++) if (du * du + dv * dv <= r * r) fr(f, cu + du, cv + dv, 1, 1, c); }
  function speakerWall(b, t) { // façade peinte en enceinte hi-fi ; le haut-parleur bat au rythme
    detailed(b); var Rf = faceR(b), beat = reduce ? 0 : (t / 260 | 0) % 2;
    fr(Rf, 18, 14, 36, 62, '#1c1c21'); fr(Rf, 18, 75, 36, 1, '#3a3a44'); fr(Rf, 19, 15, 1, 60, '#2c2c34');
    circleOn(Rf, 36, 60, 6, '#9aa1ad'); circleOn(Rf, 36, 60, 3, '#2a2a30'); circleOn(Rf, 36, 34, 13 + beat, '#4a4f5a'); circleOn(Rf, 36, 34, 9, '#2a2a30'); circleOn(Rf, 36, 34, 4, N ? '#ff4fd8' : '#d4af37');
    fr(Rf, 22, 17, 28, 7, '#111'); ftext(Rf, 26, 18, 'SOUND', N ? '#3ef0ff' : '#ffffff');
  }
  function atelier(b, t) { // malletier : la malle, de la mécanique de précision
    detailed(b); var Rf = faceR(b), tr = { x: b.x + .12, y: b.y + .5, w: .76, d: 1.8 };
    fr(Rf, 6, 12, 44, 9, '#2b1a12'); ftext(Rf, 9, 14, 'MALLETIER', '#d4af37');
    prism(tr, 15, '#8a5a34', '#7a4a2a', '#5e3820', b.h);
    [faceL(tr), faceR(tr)].forEach(function (f) { fr(f, 0, b.h + 7, f.len, 1, '#d4af37'); fr(f, 0, b.h, 2, 15, '#d4af37'); fr(f, f.len - 2, b.h, 2, 15, '#d4af37'); });
    var Rt = faceR(tr); fr(Rt, Math.round(Rt.len / 3), b.h, 2, 15, '#4a2c18'); fr(Rt, Math.round(Rt.len * 2 / 3), b.h, 2, 15, '#4a2c18'); var c = center(tr, b.h + 15); R(c[0] - 2, c[1] - 2, 4, 2, '#4a2c18');
  }
  function concert(b, t) { // salle de concert : marquise lumineuse et affiches des pochettes
    detailed(b); var L = faceL(b), Rf = faceR(b), on = reduce ? 0 : (t / 300 | 0) % 2;
    fr(L, 4, 12, 40, 11, '#111'); for (var u = 4; u < 44; u += 3) { fr(L, u, 22, 1, 1, (u / 3 + on) % 2 ? '#ffe14f' : '#7a5a10'); fr(L, u, 12, 1, 1, (u / 3 + on) % 2 ? '#7a5a10' : '#ffe14f'); }
    ftext(L, 9, 14, 'LIVE', N ? '#ff4fd8' : '#ff4fd8'); ftext(L, 27, 14, 'CE SOIR', '#ffffff');
    var ct = reduce ? 0 : (t / 3000 | 0); faceCover(ALB[(ct * 2) % ALB.length], Rf, 6, 13, 14, 14); faceCover(ALB[(ct * 2 + 1) % ALB.length], Rf, 26, 13, 14, 14); fr(Rf, 5, 12, 16, 1, '#111'); fr(Rf, 25, 12, 16, 1, '#111');
  }
  function bandstand(b, t) { // kiosque à musique : guitariste, chanteuse et batteur
    prism(b, b.h, N ? '#6a4a3a' : '#c8945a', N ? '#4a3228' : '#a8763e', N ? '#3a2620' : '#8a5e30');
    var back = { x: b.x + .05, y: b.y + .05, w: 1.4, d: .1 }; prism(back, 22, '#2a2a30', '#1c1c21', '#111114', b.h);
    var f = function (u, v) { return P(b.x + u, b.y + v); }, fr4 = function (k) { return reduce ? 0 : ((t / 220 + k) | 0) % 4; };
    var dr = f(.45, .45); drawPerson(dr[0], dr[1] - b.h - 2, 'batteur', 2, false, fr4(0)); // batteur assis derrière sa batterie
    R(dr[0] - 6, dr[1] - b.h - 8, 12, 8, '#c0392b'); R(dr[0] - 6, dr[1] - b.h - 8, 12, 1, '#eee'); disc(dr[0], dr[1] - b.h - 4, 3, '#eee'); R(dr[0] - 9, dr[1] - b.h - 14, 4, 1, '#d4af37'); R(dr[0] + 6, dr[1] - b.h - 13, 4, 1, '#d4af37'); R(dr[0] - 7, dr[1] - b.h - 13, 1, 5, '#555'); R(dr[0] + 8, dr[1] - b.h - 12, 1, 4, '#555');
    var gp = f(.5, 1.1); drawPerson(gp[0], gp[1] - b.h, 'guitare', 1, false, fr4(1));
    var sp = f(1.1, .55); R(sp[0] + 5, sp[1] - b.h - 18, 1, 18, '#555'); R(sp[0] + 4, sp[1] - b.h - 19, 3, 2, '#222'); drawPerson(sp[0], sp[1] - b.h, 'chanteuse', 4, true, fr4(2));
    [[.15, 1.3], [1.3, .15]].forEach(function (q) { var a = f(q[0], q[1]); R(a[0] - 3, a[1] - b.h - 10, 6, 10, '#111'); disc(a[0], a[1] - b.h - 4, 2, '#555'); });
    if (!reduce) for (var j = 0; j < 3; j++) { var ph = (t / 2400 + j / 3) % 1, c = f(.75, .75), nx = c[0] - 10 + j * 10 + Math.sin(ph * 6) * 3, ny = c[1] - b.h - 26 - ph * 30; A(1 - ph, function () { R(nx, ny, 1, 5, N ? '#ffe14f' : '#1b2fbf'); R(nx - 2, ny + 4, 3, 2, N ? '#ffe14f' : '#1b2fbf'); }); }
  }
  function photoshoot(b, t) { // séance photo de mode au bord du parc
    var m = P(b.x + .1, b.y + .15), ph = P(b.x + .45, b.y + .3), flash = !reduce && (t / 150 | 0) % 17 === 0;
    for (var k = 0; k < 9; k++) R(m[0] - 13 + k, m[1] - 24 + Math.abs(k - 4), 1, 2, '#f5f5f5'); R(m[0] - 9, m[1] - 22, 1, 22, '#888'); // réflecteur
    drawPerson(m[0], m[1], 'model', 3, false, 0); drawPerson(ph[0], ph[1], 'photo', 0, true, 0);
    if (flash || N) A(flash ? .8 : .18, function () { disc(ph[0] - 6, ph[1] - 18, flash ? 6 : 3, '#ffffff'); });
  }
  function hifiShop(b, t) { // boutique hi-fi : enceintes en vitrine, casque géant sur le toit
    detailed(b); var L = faceL(b), Rf = faceR(b), c = center(b, b.h);
    fr(L, 4, 1, 64, 16, N ? '#1a1430' : '#e8edf2');
    for (var k = 0; k < 4; k++) { var u = 8 + k * 15; fr(L, u, 2, 8, 13, '#1c1c21'); fr(L, u + 2, 9, 4, 4, '#5f6672'); fr(L, u + 3, 10, 2, 2, '#c9a227'); fr(L, u + 3, 4, 2, 2, '#9aa1ad'); }
    fr(L, 4, 18, 30, 8, '#111'); ftext(L, 8, 19, 'HI-FI', N ? '#3ef0ff' : '#ffe14f');
    fr(Rf, 8, 0, 9, 14, '#2b1a12');
    var hx = c[0], hy = c[1] - 4; for (var a = Math.PI; a <= 2 * Math.PI; a += .05) R(hx + Math.cos(a) * 12, hy - 8 + Math.sin(a) * 12, 2, 2, '#222');
    R(hx - 15, hy - 10, 6, 10, '#222'); R(hx + 9, hy - 10, 6, 10, '#222'); R(hx - 14, hy - 9, 4, 8, N ? '#ff4fd8' : '#c0392b'); R(hx + 10, hy - 9, 4, 8, N ? '#ff4fd8' : '#c0392b');
    if (!reduce) { var ph = (t / 1800) % 1; A(1 - ph, function () { R(hx - 1, hy - 26 - ph * 14, 1, 4, '#ffe14f'); R(hx - 3, hy - 23 - ph * 14, 3, 2, '#ffe14f'); }); }
  }
  function school(b, t) {
    detailed(b); var L = faceL(b), Rf = faceR(b), c = center(b, b.h);
    fr(L, 4, b.h - 16, 66, 11, '#f7f2e6'); fr(L, 4, b.h - 16, 66, 1, '#1b2fbf'); ftext(L, 7, b.h - 14, 'ARTS ET METIERS', '#1b2fbf');
    for (var k = 0; k < 4; k++) { // élèves derrière les fenêtres de la salle de cours
      var u2 = 8 + k * 16; fr(Rf, u2, 26, 10, 10, N ? '#ffe3a3' : '#d4e8fb'); fr(Rf, u2 + 3, 28, 3, 3, ['#3b2a1a', '#d9a066', '#6b4423', '#2b1d14'][k]); fr(Rf, u2 + 2, 26, 5, 2, ['#c0392b', '#2e86de', '#27ae60', '#8e44ad'][k]); fr(Rf, u2, 26, 10, 1, '#5a3a2a');
      if (!reduce && (t / 700 + k) % 3 < 1) fr(Rf, u2 + 7, 31, 1, 3, '#d9a066');
    }
    fr(Rf, 36, 26, 12, 10, '#24412e'); fr(Rf, 38, 30, 6, 1, '#ffffff'); fr(Rf, 38, 33, 4, 1, '#ffffff'); // tableau
    fr(Rf, 30, 0, 10, 14, '#3b2a22'); fr(Rf, 29, 14, 12, 2, '#efe6d6');
    var wv = reduce ? 0 : (t / 300 | 0) % 2; R(c[0] + 20, c[1] - 24, 1, 24, '#ddd'); R(c[0] + 21, c[1] - 24, 3, 5 - wv, '#1b2fbf'); R(c[0] + 24, c[1] - 24, 3, 5, '#fff'); R(c[0] + 27, c[1] - 24 + wv, 3, 5 - wv, '#d62828');
  }
  function smoke(x, y, t, off) { for (var i = 0; i < 5; i++) { var ph = reduce ? i / 5 : (t / 2200 + off + i / 5) % 1, s = 2 + ph * 7; A(.85 * (1 - ph), function () { R(x + ph * 16 - s / 2, y - ph * 44 - s / 2, s, s, N ? '#8d86a3' : '#f2f2f6'); }); } }
  function factory(b, t) {
    detailed(b); var Rf = faceR(b), L = faceL(b), p = pal(b.k);
    for (var k = 0; k < 3; k++) prism({ x: b.x + .3 + k * .9, y: b.y + .2, w: .6, d: 2.6 }, 8, p[1], N ? '#ffd56b' : '#9ec3e6', p[2], b.h); // toits en sheds
    [[b.x + 2.4, b.y + .4, 40], [b.x + 2.4, b.y + 1.2, 30]].forEach(function (q, i) { var cc = { x: q[0], y: q[1], w: .4, d: .4 }; prism(cc, q[2], '#6d3a2c', '#8a4b3a', '#6d3a2c', b.h); var cp = center(cc, b.h + q[2]); smoke(cp[0], cp[1] - 2, t, i * .5); });
    fr(Rf, 6, 22, 62, 14, '#ffcd00'); ftext(Rf, 16, 26, 'LA POSTE', '#003da5');
    fr(L, 6, 1, 60, 12, N ? '#ffe29a' : '#cfe3f5'); fr(L, 6, 3, 60, 1, '#555'); for (var j = 0; j < 7; j++) fr(L, 6 + ((t / 30 + j * 9) % 56 | 0), 4, 3, 2, j % 3 ? '#fff' : '#ffcd00'); // plis sur le convoyeur
    var truck = { x: b.x + b.w + .1, y: b.y + 2.2, w: .7, d: .35 }; prism(truck, 10, '#ffcd00', '#e6b800', '#c99f00'); fr(faceR(truck), 1, 6, 5, 3, '#9ec9f0');
  }
  function park(b, t) {
    var c = center(b, 0), cols = ['#e63946', '#f4a261', '#ffd60a', '#2a9d8f', '#4361ee', '#9b5de5'], ry = reduce ? 9 : 7 + Math.round(3 * Math.sin(t / 380));
    disc(c[0], c[1] + 4, 40, N ? '#cfc2a0' : '#e9dcb5', .5); // allée
    for (var dy = -ry; dy <= 0; dy++) { var hw = Math.round(30 * Math.sqrt(1 - (dy / ry) * (dy / ry))); for (var xx = -hw; xx < hw; xx++) R(c[0] + xx, c[1] + 4 + dy, 1, 1, cols[((xx + 30) / 10 | 0) % 6]); }
    for (var k = 0; k < 8; k++) { var a = k / 8 * Math.PI * 2, kx = c[0] + Math.cos(a) * 36, ky = c[1] + 4 + Math.sin(a) * 18; drawPerson(kx, ky, ['enfant', 'kid2', 'kid3'][k % 3], k, k % 2, reduce ? 0 : ((t / 250 + k) | 0) % 4); }
    var bp = P(b.x + .6, b.y + 3.2); R(bp[0] - 6, bp[1] - 4, 12, 2, '#8a5a3c'); R(bp[0] - 6, bp[1] - 7, 12, 2, '#8a5a3c'); R(bp[0] - 5, bp[1] - 2, 1, 2, '#333'); R(bp[0] + 4, bp[1] - 2, 1, 2, '#333'); // banc
    R(c[0] + 52, c[1] - 14, 1, 14, '#6b4423'); R(c[0] + 46, c[1] - 22, TL('PARC') + 4, 8, '#2e7d32'); T('PARC', c[0] + 48, c[1] - 20, '#fff');
  }
  function archives(b, t) {
    var p = pal(b.k), L = faceL(b), Rf = faceR(b); prism(b, b.h, p[0], p[1], p[2]);
    [L, Rf].forEach(function (f) { fr(f, 0, b.h - 3, f.len, 3, N ? '#2e2a48' : '#c9c4b8'); for (var u = 2; u < f.len - 2; u += 8) { fr(f, u, 4, 4, b.h - 16, N ? '#6a6488' : '#ffffff'); fr(f, u + 4, 6, 4, b.h - 18, N ? '#3a2e24' : '#6d5b49'); for (var v = 8; v < b.h - 14; v += 6) fr(f, u + 4, v, 4, 4, ['#c0392b', '#2e86de', '#27ae60', '#f39c12'][(u + v) % 4]); } });
    fr(L, 4, b.h - 12, 64, 8, N ? '#4a4660' : '#bdb4a0'); ftext(L, 18, b.h - 11, 'ARCHIVES', N ? '#ffd56b' : '#5a4a3a');
  }
  function fablab(b, t) {
    detailed(b); var L = faceL(b), Rf = faceR(b), c = center(b, b.h);
    fr(L, 8, 0, 30, 18, N ? '#f0c879' : '#e1dacb'); fr(L, 8, 14, 30, 4, '#8d94a1');
    fr(L, 12, 2, 10, 4, '#4d5a6a'); fr(L, 12, 6, 3, 5, '#3d6a8a'); fr(L, 15 + (reduce ? 0 : (t / 90 | 0) % 2), 7, 6, 2, '#d9dde3'); // tour
    fr(L, 28, 2, 7, 9, '#2a2a2a'); fr(L, 29, 3, 5, 2 + (reduce ? 2 : (t / 900 | 0) % 4), '#ff7a1a'); // imprimante 3D
    fr(Rf, 6, 18, 30, 9, '#ff7a1a'); ftext(Rf, 9, 20, 'FABLAB', '#fff');
    var rot = reduce ? 0 : t / 800; disc(c[0], c[1] - 8, 4, '#9aa1ad'); disc(c[0], c[1] - 8, 1, '#383d48');
    for (var k = 0; k < 8; k++) { var a = k * Math.PI / 4 + rot; R(c[0] + Math.cos(a) * 5.5 - 1, c[1] - 8 + Math.sin(a) * 5.5 - 1, 2, 2, '#9aa1ad'); }
  }
  function house(b, t) {
    detailed(b); var L = faceL(b), Rf = faceR(b), c = center(b, b.h);
    prism({ x: b.x + .1, y: b.y + .1, w: b.w - .2, d: b.d - .2 }, 6, N ? '#7a2e3a' : '#c0392b', N ? '#5a2230' : '#a33025', N ? '#461a26' : '#8a281f', b.h);
    fr(L, 10, 12, 18, 14, '#fff3d6'); [['#e63946', 0, 0], ['#4361ee', 9, 0], ['#2a9d8f', 0, 7], ['#ffd60a', 9, 7]].forEach(function (q) { fr(L, 11 + q[1], 13 + q[2], 6, 5, q[0]); }); // pictogrammes
    fr(Rf, 8, 0, 8, 14, '#2b1a12');
    var hx = c[0] - 2, hy = c[1] - 18; [[1, 0, 2], [4, 0, 2], [0, 1, 7], [0, 2, 7], [1, 3, 5], [2, 4, 3], [3, 5, 1]].forEach(function (q) { R(hx + q[0], hy + q[1], q[2], 1, '#ff5c8a'); });
  }
  function metro(b, t) {
    var c = center(b, 0), gl = N || reduce || (t / 900 | 0) % 2 ? '#7dff8a' : '#4fd15e';
    R(c[0] - 14, c[1] - 6, 28, 8, '#151515'); R(c[0] - 15, c[1] - 7, 30, 2, '#1f6b3a'); R(c[0] - 15, c[1] - 7, 2, 9, '#1f6b3a'); R(c[0] + 13, c[1] - 7, 2, 9, '#1f6b3a');
    for (var k = 0; k < 4; k++) R(c[0] - 10 + k * 2, c[1] - 4 + k, 20 - k * 4, 1, '#3a3a3a');
    disc(c[0] - 14, c[1] - 11, 2, gl); disc(c[0] + 14, c[1] - 11, 2, gl); if (N) A(.25, function () { disc(c[0], c[1] - 8, 14, gl, .6); });
    R(c[0] - 11, c[1] - 18, 22, 9, '#111'); T('PLAN', c[0] - 7, c[1] - 16, '#fff');
  }
  function tree(x, y, fog) {
    var p = P(x, y), dk = N ? '#1e5631' : '#2e8b57', md = N ? '#2a6b3f' : '#3cb371', lt = N ? '#3a8a52' : '#7fe08f';
    if (fog) { dk = mix(dk, N ? FOG.n : FOG.d, fog); md = mix(md, N ? FOG.n : FOG.d, fog); lt = mix(lt, N ? FOG.n : FOG.d, fog); }
    A(.25, function () { disc(p[0], p[1], 6, '#000', .5); }); R(p[0] - 1, p[1] - 10, 2, 10, '#6b4423'); disc(p[0], p[1] - 15, 7, dk); disc(p[0] - 2, p[1] - 17, 5, md); R(p[0] - 3, p[1] - 20, 2, 2, lt); R(p[0] + 2, p[1] - 15, 1, 1, lt);
  }
  function lamp(x, y) {
    var p = P(x, y); R(p[0], p[1] - 18, 1, 18, N ? '#77749a' : '#4a4f5a'); R(p[0] - 3, p[1] - 19, 4, 2, N ? '#77749a' : '#4a4f5a'); R(p[0] - 3, p[1] - 17, 3, 1, N ? '#fff3a0' : '#e6e6e6');
    if (x > -2 && x < 15 && y > -2 && y < 15) { var mu = (x + y) % 10 < 5; R(p[0] + 1, p[1] - 15, 4, 8, mu ? '#1b2fbf' : '#111'); R(p[0] + 1, p[1] - 8, 1, 1, mu ? '#1b2fbf' : '#111'); R(p[0] + 4, p[1] - 8, 1, 1, mu ? '#1b2fbf' : '#111');
      if (mu) { R(p[0] + 3, p[1] - 14, 1, 4, '#ffd84a'); R(p[0] + 2, p[1] - 11, 1, 1, '#ffd84a'); } else { R(p[0] + 2, p[1] - 13, 2, 1, '#d4af37'); R(p[0] + 1, p[1] - 12, 4, 1, '#d4af37'); } } // note de musique ou cintre
  }
  function busker(b, t) { // saxophoniste au coin du parc, étui ouvert devant lui
    var p = P(b.x, b.y), fr4 = reduce ? 0 : ((t / 400) | 0) % 2; R(p[0] + 4, p[1] - 2, 7, 3, '#4a2c18'); R(p[0] + 5, p[1] - 1, 5, 1, '#7a1a2a'); R(p[0] + 6, p[1] - 1, 1, 1, '#ffd84a'); R(p[0] + 8, p[1] - 1, 1, 1, '#ffd84a');
    drawPerson(p[0], p[1], 'sax', 3, false, fr4 * 2 + 1);
    if (!reduce) for (var j = 0; j < 2; j++) { var ph = (t / 2000 + j / 2) % 1, nx = p[0] + 6 + ph * 10, ny = p[1] - 20 - ph * 22; A(1 - ph, function () { R(nx, ny, 1, 4, N ? '#ffe14f' : '#1b2fbf'); R(nx - 2, ny + 3, 2, 2, N ? '#ffe14f' : '#1b2fbf'); }); }
  }
  function vinylStall(b, t) { // stand de vinyles d'occasion sur le trottoir
    prism(b, b.h, '#8a5a3c', '#74492f', '#5e3a24'); var L = faceL(b);
    for (var k = 0; k < 5; k++) { var q = P(b.x + .15 + k * .15, b.y + .25); R(q[0] - 2, q[1] - b.h - 5, 4, 5, ['#e63946', '#111', '#ffd60a', '#2a9d8f', '#d4af37'][k]); R(q[0] - 1, q[1] - b.h - 4, 2, 2, '#f5f5f5'); }
    fr(L, 2, 1, 16, 4, '#f7f2e6'); ftext(L, 3, 0, 'LP', '#c0392b');
    var c = center(b, b.h); R(c[0], c[1] - 20, 1, 20, '#555'); for (var r = 0; r < 4; r++) R(c[0] - 4 - r * 3, c[1] - 22 + r * 2, 9 + r * 6, 2, r % 2 ? '#f5f1e8' : '#c0392b');
    drawPerson(c[0] + 12, c[1] + 8, 'commercant', 2, true, 0);
  }

  /* ---------- Habitants : sprites 16 × 28 avec contour, 4 images de marche ---------- */
  var SKIN = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
  var LOOK = {
    corporate: { hair: '#2b1d14', top: '#1f3a5f', bot: '#1a2d4a', shoe: '#3a2414', shirt: '#e8eef5', tie: '#b3202f', case: '#6b3e1f' },
    etudiant: { hair: '#6b4423', top: '#e76f51', bot: '#3a5a8c', shoe: '#f2f2f2', hood: 1, pack: '#2a9d8f', phones: '#e63946' },
    dj: { hair: '#111111', top: '#ff4fd8', bot: '#1a1a2e', shoe: '#ffffff', cap: '#111111', phones: '#3ef0ff' },
    sax: { hair: '#1a1a1a', top: '#4a2c6a', bot: '#1a1a2e', shoe: '#3a2414', hat: '#1a1a1a', sax: 1 },
    enfant: { hair: '#3b2a1a', top: '#ffd60a', bot: '#4361ee', shoe: '#e63946', cap: '#e63946', kid: 1 },
    commercant: { hair: '#111111', top: '#f1faee', bot: '#333333', shoe: '#222222', apron: '#2a9d8f' },
    facteur: { hair: '#4a3020', top: '#ffcd00', bot: '#003da5', shoe: '#222222', cap: '#003da5', satchel: '#003da5', stripe: '#003da5' },
    ouvrier: { hair: '#222222', top: '#ff8c1a', bot: '#2e4057', shoe: '#5a3a1a', helmet: '#ffd60a', vest: 1 },
    mode: { hair: '#e2c26b', top: '#111111', bot: '#111111', shoe: '#b3202f', coat: 1, long: 1, glasses: 1, bag: '#d4af37' },
    model: { hair: '#2b1a0e', top: '#ff2e88', bot: '#ff2e88', shoe: '#111111', dress: 1, long: 1 },
    guitare: { hair: '#2b1d14', top: '#b3202f', bot: '#1a1a2e', shoe: '#111111', guitar: 1 },
    chanteuse: { hair: '#111111', top: '#d4af37', bot: '#d4af37', shoe: '#111111', dress: 1, long: 1 },
    batteur: { hair: '#6b4423', top: '#2a9d8f', bot: '#1a1a2e', shoe: '#111111', cap: '#111111' },
    photo: { hair: '#111111', top: '#2b2b30', bot: '#3a5a8c', shoe: '#111111', camera: 1 },
    kid2: { hair: '#8d5524', top: '#e63946', bot: '#2a9d8f', shoe: '#ffffff', kid: 1 },
    kid3: { hair: '#111111', top: '#4361ee', bot: '#ffd60a', shoe: '#222222', kid: 1, cap: '#ffd60a' }
  };
  var SPR = {};
  function paintSprite(o, s, fr4) { // dessine le personnage tourné vers la droite (pieds en y = 25)
    var sh = mix(s, '#000000', .2), ts = mix(o.top, '#000000', .28), bs = mix(o.bot, '#000000', .3), hi = mix(o.top, '#ffffff', .25);
    var bob = fr4 % 2 ? -1 : 0, st = fr4 === 0 ? 1 : fr4 === 2 ? -1 : 0, sw = st;
    if (o.kid) {
      var y0 = 12 + bob;
      R(6, y0 + 1, 4, 4, s); R(9, y0 + 2, 1, 1, '#1a1a2e'); R(10, y0 + 3, 1, 1, sh); R(6, y0, 4, 2, o.hair); R(5, y0 + 1, 2, 3, o.hair);
      if (o.cap) { R(5, y0 - 1, 5, 2, o.cap); R(9, y0, 3, 1, o.cap); }
      R(6, y0 + 5, 5, 5, o.top); R(6, y0 + 5, 1, 5, ts); R(7, y0 + 5, 3, 1, hi); R(8 + sw, y0 + 9, 1, 1, s);
      R(6 - st, 22, 2, 3, bs); R(8 + st, 22, 2, 3, o.bot); R(6 - st, 25, 2, 1, o.shoe); R(8 + st, 25, 3, 1, o.shoe);
      return;
    }
    var hy = 3 + bob;
    if (o.long) { R(5, hy + 2, 3, 10, o.hair); }
    R(6, hy + 2, 5, 5, s); R(7, hy + 7, 3, 1, s); R(7, hy + 3, 1, 2, sh); R(11, hy + 4, 1, 1, s);
    R(9, hy + 3, 1, 1, '#1a1a2e'); R(9, hy + 5, 1, 1, mix(s, '#7a3b2e', .5));
    R(6, hy, 5, 2, o.hair); R(5, hy + 1, 2, 4, o.hair); R(10, hy + 1, 1, 1, o.hair);
    if (o.glasses) R(9, hy + 3, 2, 1, '#111');
    if (o.cap) { R(5, hy - 1, 6, 2, o.cap); R(10, hy + 1, 2, 1, o.cap); }
    if (o.helmet) { R(5, hy - 2, 6, 3, o.helmet); R(4, hy + 1, 8, 1, mix(o.helmet, '#000000', .15)); R(6, hy - 2, 2, 1, '#fff4a8'); }
    R(7, hy + 8, 2, 1, sh); // cou
    var ty = 12 + bob, tl = o.coat || o.dress ? 10 : 7;
    if (o.hood) R(4, ty - 1, 3, 3, ts);
    if (o.pack) { R(2, ty, 3, 7, o.pack); R(2, ty, 3, 1, mix(o.pack, '#ffffff', .3)); R(3, ty + 3, 1, 2, mix(o.pack, '#000000', .3)); }
    R(5, ty, 6, tl, o.top); R(5, ty, 1, tl, ts); R(6, ty, 4, 1, hi);
    if (o.dress) { R(4, ty + 6, 8, 4, o.top); R(4, ty + 6, 1, 4, ts); R(5, ty + 4, 6, 1, mix(o.top, '#000000', .4)); }
    if (o.shirt) { R(9, ty, 2, 2, o.shirt); R(10, ty + 1, 1, 4, o.tie); R(8, ty + 2, 1, 1, ts); }
    if (o.apron) { R(7, ty + 2, 4, 8, o.apron); R(8, ty, 1, 2, o.apron); R(7, ty + 4, 4, 1, mix(o.apron, '#ffffff', .3)); }
    if (o.vest) { R(5, ty + 3, 6, 1, '#e8f0e8'); R(5, ty + 5, 6, 1, '#e8f0e8'); }
    if (o.stripe) R(5, ty + 4, 6, 1, o.stripe);
    if (o.satchel) { for (var k = 0; k < 6; k++) R(6 + k * .8, ty + k, 1, 1, o.satchel); R(9, ty + 5, 3, 3, o.satchel); }
    if (o.coat) { R(9, ty + 1, 1, 8, mix(o.top, '#ffffff', .15)); R(5, ty + 8, 6, 2, o.top); }
    R(8, ty + 1, 2, 5, ts); R(8 + sw, ty + 6, 2, 1, s); // bras et main
    if (o.guitar) { R(6, ty + 4, 5, 4, '#c8782a'); R(7, ty + 5, 2, 2, '#3a2414'); R(11, ty + 3, 4, 1, '#5a3a1a'); R(14, ty + 2, 1, 2, '#2a1a0a'); R(5, ty, 1, 4, '#111'); }
    if (o.phones) { R(6, hy - 1, 5, 1, '#222'); R(6, hy + 2, 2, 3, o.phones); R(6, hy + 2, 1, 3, '#222'); }
    if (o.hat) { R(4, hy - 1, 8, 1, o.hat); R(6, hy - 3, 5, 2, o.hat); R(6, hy - 2, 5, 1, '#b3202f'); }
    if (o.sax) { R(10, ty - 1, 1, 2, '#d4af37'); R(11, ty + 1, 1, 6, '#d4af37'); R(9, ty + 6, 3, 2, '#d4af37'); R(8, ty + 5, 2, 2, '#e9c44f'); R(10, ty + 3, 1, 1, '#8a6d1f'); }
    if (o.camera) { R(9, ty + 1, 4, 3, '#111'); R(12, ty + 2, 1, 1, '#9ec9f0'); R(10, ty, 2, 1, '#333'); }
    if (o.case) { R(8 + sw, ty + 7, 4, 3, o.case); R(9 + sw, ty + 6, 2, 1, '#2a1a0a'); }
    if (o.bag) { R(8 + sw, ty + 6, 3, 3, o.bag); R(8 + sw, ty + 5, 1, 1, o.bag); }
    var ly = ty + tl, lh = 25 - ly;
    if (o.dress) { R(6 - st, ly, 1, lh, s); R(9 + st, ly, 1, lh, sh); }
    else { R(6 - st, ly, 2, lh, bs); R(8 + st, ly, 2, lh, o.bot); R(6, ly, 4, 1, bs); }
    R(5 - st, 25, 3, 1, o.shoe); R(8 + st, 25, 3, 1, o.shoe);
  }
  function getSpr(cls, k, fr4, flip) {
    var key = cls + k + fr4 + (flip ? 'f' : ''); if (SPR[key]) return SPR[key];
    var a = document.createElement('canvas'); a.width = 16; a.height = 28; var main = g; g = a.getContext('2d'); paintSprite(LOOK[cls], SKIN[k % SKIN.length], fr4); g = main;
    var sil = document.createElement('canvas'); sil.width = 16; sil.height = 28; var x = sil.getContext('2d'); x.drawImage(a, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#1b1530'; x.fillRect(0, 0, 16, 28);
    var o = document.createElement('canvas'); o.width = 16; o.height = 28; x = o.getContext('2d');
    if (flip) { x.translate(16, 0); x.scale(-1, 1); }
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { x.drawImage(sil, d[0], d[1]); }); x.drawImage(a, 0, 0);
    return (SPR[key] = o);
  }
  function drawPerson(x, y, cls, k, flip, fr4) {
    x = Math.round(x); y = Math.round(y);
    A(.28, function () { R(x - 4, y - 1, 9, 2, '#000'); });
    g.drawImage(getSpr(cls, k, fr4 || 0, flip), x - 8, y - 26);
  }

  /* ---------- Qui va où : chaque profil a ses bâtiments ---------- */
  var CLASSES = {
    corporate: { n: 5, v: .55, go: ['competences', 'cv', 'annexes', 'vision-board', 'contact'] },
    etudiant: { n: 5, v: .7, go: ['a-propos', 'projets', 'vision-board', 'animation', 'annexes'] },
    enfant: { n: 5, v: .75, go: ['a-propos', 'animation', 'garde'] },
    commercant: { n: 3, v: .5, go: ['vision-board', 'animation', 'garde'] },
    facteur: { n: 2, v: .6, go: ['la-poste', 'garde', 'a-propos', 'annexes', 'competences'] },
    ouvrier: { n: 3, v: .55, go: ['la-poste', 'projets'] },
    mode: { n: 3, v: .6, go: ['vision-board', 'competences', 'cv'] }
  };
  var VB = ['vision-board', 'vb-club', 'vb-mode', 'vb-disques'];
  function spotOf(doc) { return doc === 'vision-board' ? VB[(Math.random() * VB.length) | 0] : doc; }
  function route(a, b) { // déplacement par les rues (lignes 4,5 et 9,5)
    var RD = [4.5, 9.5], aV = RD.indexOf(a[0]) > -1, bV = RD.indexOf(b[0]) > -1, pts = [a];
    function near(v) { return Math.abs(v - 4.5) < Math.abs(v - 9.5) ? 4.5 : 9.5; }
    if (aV && bV) { if (a[0] !== b[0]) { var r = near((a[1] + b[1]) / 2); pts.push([a[0], r], [b[0], r]); } }
    else if (!aV && !bV) { if (a[1] !== b[1]) { var q = near((a[0] + b[0]) / 2); pts.push([q, a[1]], [q, b[1]]); } }
    else if (aV) pts.push([a[0], b[1]]); else pts.push([b[0], a[1]]);
    pts.push(b); return pts;
  }
  var people = [], seedK = 0;
  Object.keys(CLASSES).forEach(function (cl) {
    var C = CLASSES[cl];
    for (var i = 0; i < C.n; i++) { var at = spotOf(C.go[(i + seedK) % C.go.length]), d = bySpot[at].door; people.push({ cl: cl, c: C, at: at, x: d[0], y: d[1], path: null, wait: 500 + hash(seedK * 7) * 8000, k: seedK++, flip: false }); }
  });
  function nextStop(p) {
    if (N && (p.cl === 'corporate' || p.cl === 'etudiant' || p.cl === 'mode') && Math.random() < .5) return 'vb-club'; // la nuit, direction le club
    var go = p.c.go.filter(function (x) { return x !== p.at; }); return spotOf(go[Math.floor(Math.random() * go.length)]);
  }
  function stepPeople(dt) {
    people.forEach(function (p) {
      if (!p.path) { p.wait -= dt; if (p.wait > 0) return; var to = nextStop(p); if (to === p.at) { p.wait = 2000; return; } p.path = route(bySpot[p.at].door, bySpot[to].door); p.to = to; p.i = 1; return; }
      var tg = p.path[p.i], dx = tg[0] - p.x, dy = tg[1] - p.y, dist = Math.hypot(dx, dy), mv = p.c.v * dt / 1000;
      if (dist > .01) p.flip = (dx < 0 && Math.abs(dx) > Math.abs(dy)) || (dy > 0 && Math.abs(dy) >= Math.abs(dx));
      if (dist <= mv) { p.x = tg[0]; p.y = tg[1]; p.i++; if (p.i >= p.path.length) { p.path = null; p.at = p.to; p.wait = 2500 + Math.random() * 7000; } }
      else { p.x += dx / dist * mv; p.y += dy / dist * mv; }
    });
    walkers.forEach(function (w) { w.s += w.dir * w.v * dt / 1000; if (w.s > 46) w.s = -34; if (w.s < -34) w.s = 46; });
  }
  // Passants et voitures dans le reste de la ville : ils sortent de l'écran et reviennent
  var LOOKS = ['corporate', 'etudiant', 'commercant', 'mode', 'facteur', 'ouvrier'], walkers = [], cars = [];
  for (var i = 0; i < 26; i++) {
    var r = [-2, -1, 0, 1, 2, 3, 4][i % 7] * 5 + 4.5, side = hash(i + 5) > .5 ? .4 : -.4;
    walkers.push({ ax: i % 2, line: r + side, s: -34 + hash(i * 3) * 80, dir: hash(i + 9) > .5 ? 1 : -1, v: .45 + hash(i) * .3, cl: LOOKS[i % LOOKS.length], k: i });
  }
  var CARC = [['#f2c230', 'taxi'], ['#f2c230', 'taxi'], ['#e63946'], ['#4361ee'], ['#f4f4f4'], ['#2b2b30'], ['#f2c230', 'taxi'], ['#2a9d8f'], ['#c0392b', 'bus']];
  for (i = 0; i < 22; i++) { var ax = i % 2, dir = hash(i + 1) > .5 ? 1 : -1; cars.push({ ax: ax, line: [-2, -1, 0, 1, 2, 3, 4][(i * 3) % 7] * 5 + 4.5 + (ax ? -dir : dir) * .22, s: -34 + hash(i * 7) * 80, s0: -34 + hash(i * 7) * 80, dir: dir, v: .8 + hash(i + 4) * .7, c: CARC[i % CARC.length] }); }
  function carBox(c) { var long = c.c[1] === 'bus' ? 1.5 : .8; return c.ax ? { x: c.line - .17, y: c.s - long / 2, w: .34, d: long } : { x: c.s - long / 2, y: c.line - .17, w: long, d: .34 }; }
  function drawCar(c) {
    var b = carBox(c), col = c.c[0], dk = mix(col, '#000000', .25), dd = mix(col, '#000000', .4), bus = c.c[1] === 'bus';
    prism(b, bus ? 10 : 5, col, dk, dd);
    var L = faceL(b), Rf = faceR(b);
    if (bus) { [L, Rf].forEach(function (f) { for (var u = 2; u < f.len - 3; u += 5) fr(f, u, 5, 3, 3, N ? '#ffe9a8' : '#9ec9f0'); }); }
    else { var cab = c.ax ? { x: b.x + .03, y: b.y + .22, w: .28, d: .38 } : { x: b.x + .22, y: b.y + .03, w: .38, d: .28 }; prism(cab, 4, col, '#9ec9f0', '#7fb1dc', 5); if (c.c[1] === 'taxi') { var tc = center(cab, 9); R(tc[0] - 2, tc[1] - 2, 4, 2, '#fff7c2'); } }
    var w1 = L.len > 6 ? [2, L.len - 4] : [1], w2 = Rf.len > 6 ? [2, Rf.len - 4] : [1];
    w1.forEach(function (u) { fr(L, u, -1, 2, 2, '#111'); }); w2.forEach(function (u) { fr(Rf, u, -1, 2, 2, '#111'); });
    if (N) { var fc = center(b, 2); A(.3, function () { disc(fc[0] + (c.ax ? -c.dir : c.dir) * 10, fc[1] + c.dir * 5, 6, '#fff3a0', .5); }); }
  }

  /* ---------- Image complète ---------- */
  var hover = null, last = 0, lamps = [], otrees = [], glow = document.createElement('canvas'), vig = document.createElement('canvas');
  function extras() { // lampadaires, arbres des squares et halos de nuit (recalculés au redimensionnement)
    lamps = []; otrees = [];
    for (var bx = -6; bx <= 9; bx++) for (var by = -6; by <= 9; by++) {
      var x0 = bx * 5, y0 = by * 5, p = P(x0 + 4, y0 + 4); if (x0 + y0 + 4 < BACK || p[0] < -40 || p[0] > W + 40 || p[1] > H + 30 || p[1] < 0) continue;
      lamps.push([x0 + 3.9, y0 + 3.9]);
    }
    deco.forEach(function (d) { for (var k = 0; k < 5; k++) otrees.push([d.x + .6 + hash(d.x * 7 + d.y + k) * 2.8, d.y + .6 + hash(d.y * 5 + d.x + k * 3) * 2.8, d.fog]); });
    vig.width = W; vig.height = H; var vx = vig.getContext('2d'), c0 = P(7, 7), vg = vx.createRadialGradient(c0[0], c0[1] - 60, 220, c0[0], c0[1] - 60, Math.max(W, H) * .75);
    vg.addColorStop(0, N ? 'rgba(10,5,30,0)' : 'rgba(225,236,248,0)'); vg.addColorStop(1, N ? 'rgba(10,5,30,.55)' : 'rgba(225,236,248,.45)'); vx.fillStyle = vg; vx.fillRect(0, 0, W, H);
    glow.width = W; glow.height = H; var main = g; g = glow.getContext('2d');
    if (N) lamps.forEach(function (l) { var p = P(l[0], l[1]); halo(p[0] - 2, p[1] - 3, 20, 'rgba(255,214,130,'); A(.35, function () { disc(p[0] - 2, p[1] - 17, 3, '#fff3a0'); }); });
    g = main;
  }
  function halo(x, y, r, rgba) { g.save(); g.translate(x, y); g.scale(1, .5); var gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, rgba + '.32)'); gr.addColorStop(1, rgba + '0)'); g.fillStyle = gr; g.fillRect(-r, -r, 2 * r, 2 * r); g.restore(); }
  function rebuild() {
    layout(); genWorld(); N = night(); buildBg(); deco.forEach(function (d) { var main = g; g = bg.getContext('2d'); quad({ x: d.x + .12, y: d.y + .12, w: 3.76, d: 3.76 }, mix(N ? '#1f4a3a' : '#79cf6a', N ? FOG.n : FOG.d, d.fog)); g = main; });
    fill.forEach(sprite); extras(); placeSpots();
  }
  function onScreen(p, m) { return p[0] > -m && p[0] < W + m && p[1] > -10 && p[1] < H + m; }
  function draw(t) {
    if (night() !== N) rebuild();
    if (dirty) { dirty = false; fill.forEach(function (b) { if (b.redo) { b.redo = false; sprite(b); } }); }
    g.imageSmoothingEnabled = false; g.drawImage(bg, 0, 0);
    var items = [];
    fill.forEach(function (b) { items.push([b.key, function () { g.drawImage(b.spr, b.sx, b.sy); }]); });
    B.forEach(function (b) { items.push([b.key, function () { (b.draw || box)(b, t); }]); });
    TREES.forEach(function (q) { items.push([q[0] + q[1], function () { tree(q[0], q[1]); }]); });
    otrees.forEach(function (q) { items.push([q[0] + q[1], function () { tree(q[0], q[1], q[2]); }]); });
    lamps.forEach(function (l) { items.push([l[0] + l[1] + .05, function () { lamp(l[0], l[1]); }]); });
    cars.forEach(function (c) { if (!reduce) c.s = -34 + mod(c.s0 + 34 + c.dir * c.v * t / 1000, 80); var b = carBox(c); if (onScreen(P(b.x, b.y), 60)) items.push([b.x + b.w / 2 + b.y + b.d / 2 + .02, function () { drawCar(c); }]); });
    walkers.forEach(function (w) { var x = w.ax ? w.line : w.s, y = w.ax ? w.s : w.line, s = P(x, y); if (onScreen(s, 30)) items.push([x + y + .3, function () { drawPerson(s[0], s[1] + 2, w.cl, w.k, w.ax ? w.dir > 0 : w.dir < 0, reduce ? 0 : ((t / 170 + w.k) | 0) % 4); }]); });
    people.forEach(function (p) { if (!p.path) return; var s = P(p.x, p.y); items.push([p.x + p.y + .3, function () { drawPerson(s[0] + (p.k % 3 - 1) * 3, s[1] + 2, p.cl === 'enfant' ? ['enfant', 'kid2', 'kid3'][p.k % 3] : p.cl, p.k, p.flip, reduce ? 0 : ((t / 170 + p.k) | 0) % 4); }]); });
    items.sort(function (a, b) { return a[0] - b[0]; }).forEach(function (it) { it[1](); });
    if (N) { g.globalCompositeOperation = 'lighter'; g.drawImage(glow, 0, 0); g.globalCompositeOperation = 'source-over'; }
    blimp(t);
    g.drawImage(vig, 0, 0);
    var hb = hover && bySpot[hover];
    if (hb && hb.box) {
      var r = hb.box, ph = reduce ? 0 : (t / 90 | 0) % 4;
      for (var x = r[0]; x < r[0] + r[2]; x++) if ((x + ph) % 4 < 2) { R(x, r[1], 1, 1, '#ffd84a'); R(x, r[1] + r[3] - 1, 1, 1, '#ffd84a'); }
      for (var y = r[1]; y < r[1] + r[3]; y++) if ((y + ph) % 4 < 2) { R(r[0], y, 1, 1, '#ffd84a'); R(r[0] + r[2] - 1, y, 1, 1, '#ffd84a'); }
    }
  }
  function blimp(t) { // dirigeable publicitaire qui traverse le ciel
    var span = W + 260, x = reduce ? W * .72 : (t / 70 + W * .62) % span - 130, y = Math.round(TOPA + 78), body = N ? '#5a5478' : '#d9dce2', sh = N ? '#3d3a5c' : '#a9afb9';
    disc(x, y, 34, sh, .32); disc(x - 2, y - 2, 32, body, .28); R(x - 20, y - 4, 40, 1, N ? '#77749a' : '#f4f4f4');
    R(x + 30, y - 9, 6, 3, sh); R(x + 30, y + 6, 6, 3, sh); R(x + 32, y - 3, 6, 6, sh); R(x - 6, y + 9, 12, 4, '#2b2b30'); R(x - 4, y + 10, 2, 2, N ? '#ffd56b' : '#9ec9f0'); R(x + 1, y + 10, 2, 2, N ? '#ffd56b' : '#9ec9f0');
    R(x - 24, y - 4, 48, 9, '#1b2fbf'); T('SON & MODE', x - 19, y - 2, '#ffd84a');
    if (N && (t / 500 | 0) % 2) { R(x - 34, y - 1, 2, 2, '#ff3b3b'); R(x + 37, y - 1, 2, 2, '#7dff8a'); }
  }
  function loop(now) { var dt = Math.min(now - last, 200); if (dt > 66) { stepPeople(dt); last = now; draw(now); } requestAnimationFrame(loop); }

  /* ---------- Zones cliquables et étiquettes des rubriques ---------- */
  function placeSpots() {
    B.forEach(function (b) {
      if (!b.doc) return; var c = corners(b), top = c.n[1] - b.h - (b.extra || 0);
      b.box = [c.w[0], top, c.e[0] - c.w[0], c.s[1] - top];
      var el = b.el || (b.el = document.querySelector('.hs[data-spot="' + b.spot + '"]')); if (!el) return;
      el.style.left = b.box[0] / W * 100 + '%'; el.style.top = b.box[1] / H * 100 + '%'; el.style.width = b.box[2] / W * 100 + '%'; el.style.height = b.box[3] / H * 100 + '%';
      // Zone cliquable = silhouette du bâtiment en perspective (les rectangles se chevauchent en vue isométrique)
      var hh = c.n[1] - top, pts = [[c.w[0], c.w[1]], [c.s[0], c.s[1]], [c.e[0], c.e[1]], [c.e[0], c.e[1] - hh], [c.n[0], top], [c.w[0], c.w[1] - hh]];
      el.style.clipPath = 'polygon(' + pts.map(function (q) { return ((q[0] - b.box[0]) / b.box[2] * 100).toFixed(2) + '% ' + ((q[1] - b.box[1]) / b.box[3] * 100).toFixed(2) + '%'; }).join(',') + ')';
      el.style.zIndex = Math.round(b.key * 10);
      var tag = b.tag || (b.tag = el.querySelector('.tag'));
      if (tag) { if (tag.parentNode === el) stage.appendChild(tag); tag.style.left = ((c.w[0] + c.e[0]) / 2 / W * 100) + '%'; tag.style.top = ((b.below ? c.s[1] + 4 : top) / H * 100) + '%'; tag.classList.toggle('below', !!b.below); }
      if (b.wired) return; b.wired = true;
      function on() { hover = b.spot; if (b.tag) b.tag.classList.add('on'); if (reduce) draw(0); }
      function off() { if (hover === b.spot) hover = null; if (b.tag) b.tag.classList.remove('on'); if (reduce) draw(0); }
      [el, tag].forEach(function (x) { if (!x) return; x.addEventListener('mouseenter', on); x.addEventListener('mouseleave', off); }); el.addEventListener('focus', on); el.addEventListener('blur', off);
    });
  }
  rebuild();
  if (reduce) { draw(0); setInterval(function () { if (dirty) draw(0); }, 700); } // sans animation : on redessine quand une pochette arrive
  else requestAnimationFrame(function (t) { last = t; loop(t); });
  var rz; function later() { clearTimeout(rz); rz = setTimeout(function () { rebuild(); if (reduce) draw(0); }, 150); }
  addEventListener('resize', later);
  if (window.ResizeObserver && hud) new ResizeObserver(later).observe(hud); // la barre change de hauteur quand le menu de traduction arrive

  /* ---------- Fenêtres internes ---------- */
  var win = document.getElementById('win'), body = document.getElementById('winBody'), wt = document.getElementById('winTitle'), cur = null, home = null;
  function openDoc(id, from) {
    if (id === 'hifi' || id === 'mode') id = 'vision-board'; // anciens liens vers les deux vision boards
    var d = document.getElementById(id);
    if (!d || !d.classList.contains('doc')) return false;
    if (cur) home.replaceWith(cur);
    home = document.createComment(''); d.before(home);
    cur = d; body.appendChild(d); body.scrollTop = 0;
    wt.innerHTML = ''; wt.append(d.dataset.building); var sm = document.createElement('small'); sm.textContent = d.dataset.title; wt.appendChild(sm);
    if (!win.open) {
      win.showModal();
      if (!reduce && from && win.animate) {
        var a = from.getBoundingClientRect(), r = win.getBoundingClientRect();
        win.style.transformOrigin = (a.left + a.width / 2 - r.left) + 'px ' + (a.top + a.height / 2 - r.top) + 'px';
        win.animate([{ transform: 'scale(.08)', opacity: .2 }, { transform: 'scale(1)', opacity: 1 }], { duration: 320, easing: 'steps(7, end)' });
      }
    }
    history.replaceState(null, '', '#' + id);
    if (id === 'cv') renderCV();
    return true;
  }
  win.addEventListener('close', function () { if (cur) { home.replaceWith(cur); cur = null; } history.replaceState(null, '', location.pathname + location.search); });
  win.addEventListener('click', function (e) { if (e.target === win) win.close(); });
  document.getElementById('winClose').addEventListener('click', function () { win.close(); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-doc]');
    if (b) { e.preventDefault(); openDoc(b.dataset.doc, b); return; }
    var a = e.target.closest('a[href^="#"]');
    if (a && a.getAttribute('href').length > 1 && openDoc(a.getAttribute('href').slice(1), a)) e.preventDefault();
  });

  // Plan de la ville = sommaire automatique, construit à partir des fenêtres
  var list = document.getElementById('planList');
  if (list) document.querySelectorAll('#docs .doc').forEach(function (d, k) {
    if (d.id === 'plan') return;
    var li = document.createElement('li'), a = document.createElement('a');
    a.href = '#' + d.id; a.innerHTML = '<span class="n"></span><b></b><em></em>';
    a.querySelector('.n').textContent = String(k).padStart(2, '0');
    a.querySelector('b').textContent = d.dataset.title; a.querySelector('em').textContent = d.dataset.building;
    li.appendChild(a);
    var subs = d.querySelectorAll('[data-toc-sub]');
    if (subs.length) { var ol = document.createElement('ol'); subs.forEach(function (s) { var x = document.createElement('li'); x.textContent = s.dataset.tocSub; ol.appendChild(x); }); li.appendChild(ol); }
    list.appendChild(li);
  });
  if (location.hash.length > 1) openDoc(location.hash.slice(1));

  // CV : la page 1 du PDF dessinée par PDF.js (réexporter le PDF suffit à mettre l'aperçu à jour)
  var cvDone = false;
  function renderCV() {
    var c = document.getElementById('cvCanvas'), fb = document.getElementById('cvFallback');
    if (cvDone || !c) return; cvDone = true;
    if (!window.pdfjsLib) { c.remove(); fb.hidden = false; return; }
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    pdfjsLib.getDocument('assets/CV-Paul-Signe.pdf').promise
      .then(function (pdf) { return pdf.getPage(1); })
      .then(function (pg) { var vp = pg.getViewport({ scale: 2.2 }); c.width = vp.width; c.height = vp.height; return pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise; })
      .catch(function () { c.remove(); fb.hidden = false; });
  }
  setTimeout(renderCV, 2500);

  // Jour / nuit (choix mémorisé)
  var tb = document.getElementById('themeBtn');
  function paint() { var d = night(); tb.textContent = d ? 'Jour' : 'Nuit'; tb.setAttribute('aria-label', d ? 'Passer en mode jour' : 'Passer en mode nuit'); }
  tb.addEventListener('click', function () {
    var t = night() ? 'light' : 'dark'; root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) {}
    paint(); if (reduce) draw(0);
  });
  paint();

  // Formulaire de contact : site statique, le message s'ouvre dans la messagerie du visiteur
  var form = document.getElementById('contactForm');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = form.message.value + '\n\n— ' + form.name.value + ' (' + form.email.value + ')';
    location.href = 'mailto:paul.signe@ensam.eu?subject=' + encodeURIComponent('Contact portfolio — ' + form.name.value) + '&body=' + encodeURIComponent(msg);
  });

  // Impression : la ville devient l'image de la page de garde, toutes les fenêtres s'impriment à la suite
  addEventListener('beforeprint', function () {
    if (win.open) win.close();
    draw(0); var img = document.getElementById('printCity'); if (img) img.src = cv.toDataURL();
    document.querySelectorAll('#docs details').forEach(function (d) { d.open = true; });
  });
})();
