/* Paul Signe's City (ville.html) : ville en pixel art, vue isométrique, plein écran et « sans fin ».
   Le centre (3 × 3 pâtés) porte les bâtiments cliquables ; autour, la ville continue au-delà de l'écran.
   Chaque bâtiment ouvre une fenêtre interne ; des habitants vont de bâtiment en bâtiment selon leur profil. */
(function () {
  'use strict';
  var HW = 24, HH = 12, M = 14, BACK = -16, CORE_W = 1250, CORE_H = 615, CORE_TOP = 285;
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
  var F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '4': '101101111001001', '7': '111001010010010', '&': '011100010101011', '-': '000000111000000', "'": '010010000000000', '.': '000000000000010', ' ': '000000000000000', '3': '111001011001111', '5': '111100111001111', '6': '111100111101111', '8': '111101111101111', '9': '111101111001111', '/': '001001010100100', '!': '010010010000010', ':': '000010000010000', '+': '000010111010000', 'X': '101101010101101' };
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
  var Z = 1, TX = 0, TY = 0, Z0 = 1, VW = 0, VH = 0;
  function layout() {
    var vw = document.documentElement.clientWidth, vh = innerHeight, phone = vw < 720;
    if (titleEl && hud) titleEl.style.top = hud.offsetHeight + (phone ? 6 : 12) + 'px';
    var top = (hud ? hud.offsetHeight : 0) + 4, bottom = phone ? 6 : 46, avail = Math.max(300, vh - top - bottom);
    S = Math.min(vw / CORE_W, avail / CORE_H); // toute la bande des rubriques tient dans l'écran
    W = Math.ceil(vw / S); H = Math.ceil(vh / S); TOPA = (hud ? hud.offsetHeight : 0) / S; // haut visible du ciel, sous la barre
    OX = Math.round(W / 2); OY = Math.round(top / S + (avail / S - CORE_H) / 2 + CORE_TOP);
    cv.width = W; cv.height = H; stage.style.width = vw + 'px'; stage.style.height = vh + 'px'; VW = vw; VH = vh;
    var tb = phone && titleEl ? titleEl.getBoundingClientRect().bottom + 6 : top;
    Z0 = phone ? Math.max(1, Math.min(4, (vh - tb - 6) / (CORE_H * S))) : 1; // téléphone : on part zoomé, on fait glisser
    resetCam(tb);
  }
  /* ---------- Caméra : zoom (molette, pincement, boutons) et déplacement (glisser), sans le zoom du navigateur ---------- */
  function applyCam() {
    Z = Math.max(1, Math.min(5, Z)); TX = Math.min(0, Math.max(VW - VW * Z, TX)); TY = Math.min(0, Math.max(VH - VH * Z, TY));
    stage.style.transform = 'translate(' + TX + 'px,' + TY + 'px) scale(' + Z + ')'; stage.style.setProperty('--iz', 1 / Z);
  }
  function resetCam(tb) {
    Z = Z0; var cy = (OY - CORE_TOP + CORE_H / 2) * S, ty = tb === undefined ? (hud ? hud.offsetHeight : 0) : tb;
    TX = VW / 2 - Z * VW / 2; TY = ty + (VH - ty) / 2 - Z * cy; applyCam();
  }
  function zoomAt(cx, cy, nz) { nz = Math.max(1, Math.min(5, nz)); TX = cx - (cx - TX) * nz / Z; TY = cy - (cy - TY) * nz / Z; Z = nz; applyCam(); }
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

  /* ---------- Le plan : les rubriques s'étalent sur une bande de 18 pâtés de 4 × 4 cases (rues toutes les 5 cases) ----------
     rangée du fond (x + y du pâté = 0) : grandes tours ; rangée de devant (= 3) : bâtiments bas. */
  var B = [ // doc = fenêtre ouverte ; spot = zone cliquable ; h = hauteur en pixels ; extra = ce qui dépasse du toit
    { x: -9.2, y: 10.8, w: 2.4, d: 2.4, h: 0, draw: eiffel, extra: 272, below: 1, note: ['PARIS', "La ville où j'aimerais vivre plus tard"] },
    { x: -4, y: 5, w: 2, d: 2, h: 150, k: 'glass', doc: 'competences', draw: tower, extra: 82 },
    { x: -2, y: 5, w: 1, d: 3, h: 86, k: 'glass', draw: speakerWall },
    { x: 0, y: 0, w: 2, d: 2, h: 92, k: 'brick', doc: 'vision-board', draw: coverBoard, extra: 58 },
    { x: 2, y: 0, w: 2, d: 2, h: 70, k: 'dark', doc: 'vision-board', spot: 'vb-club', draw: club, extra: 18 },
    { x: 0, y: 2, w: 2, d: 2, h: 44, k: 'black', doc: 'vision-board', spot: 'vb-mode', draw: couture, extra: 22, below: 1 },
    { x: 2, y: 2, w: 2, d: 2, h: 58, k: 'dark', doc: 'vision-board', spot: 'vb-cinema', draw: cinema, extra: 22 },
    { x: 6, y: -4, w: 1, d: 1, h: 26, k: 'grey', doc: 'contact', draw: radio, extra: 96 },
    { x: 8, y: -5, w: 1, d: 3, h: 58, k: 'brown', draw: atelier },
    { x: 11, y: -9, w: 2, d: 2, h: 60, k: 'white', doc: 'cv', draw: billboard, extra: 50 },
    { x: -5, y: 10, w: 3, d: 3, h: 60, k: 'brick', doc: 'a-propos', draw: school, extra: 14 },
    { x: 0, y: 5, w: 2, d: 2, h: 40, k: 'white', draw: concert },
    { x: 2.25, y: 5.25, w: 1.5, d: 1.5, h: 5, draw: bandstand },
    { x: 5, y: 0, w: 3, d: 2, h: 32, k: 'grey', doc: 'projets', draw: fablab, extra: 14 },
    { x: 5, y: 2, w: 3, d: 2, h: 28, k: 'brown', draw: hifiShop, extra: 22 },
    { x: 10, y: -5, w: 3, d: 2, h: 46, k: 'white', doc: 'annexes', draw: archives, extra: 6 },
    { x: -4, y: 15, w: 3, d: 3, h: 42, k: 'grey', doc: 'la-poste', draw: factory, extra: 40, below: 1 },
    { x: 0, y: 10, w: 4, d: 4, h: 0, doc: 'animation', draw: park, extra: 26 },
    { x: 2.05, y: 10.15, w: .5, d: .3, h: 0, draw: photoshoot },
    { x: 3.45, y: 13.45, w: .3, d: .3, h: 0, draw: busker },
    { x: 5.6, y: 5.6, w: 2.8, d: 2.8, h: 24, draw: chateau, extra: 40, below: 1, note: ['NANTES', "D'où je viens · Bretagne historique et culturelle"] },
    { x: 11, y: 1, w: 2, d: 2, h: 84, k: 'dark', draw: screenTower, extra: 30 },
    { x: 1, y: 15, w: 2, d: 2, h: 30, k: 'brick', doc: 'garde', draw: house, extra: 12, below: 1 },
    { x: 0.2, y: 17.25, w: .9, d: .5, h: 7, draw: vinylStall },
    { x: 5.05, y: 10.1, w: 2.9, d: 2.6, h: 0, doc: 'vision-board', spot: 'vb-defile', draw: fashionShow, extra: 44 },
    { x: 8, y: 12, w: 1, d: 1, h: 6, doc: 'plan', draw: metro, extra: 14, below: 1 },
    { x: 15.2, y: 0.4, w: 3.6, d: 2.2, h: 44, k: 'stone', doc: 'voyage', draw: station, extra: 30, below: 1 },
    { x: 15.3, y: -4.8, w: 3.4, d: 1.3, h: 18, k: 'white', doc: 'voyage', spot: 'voyage-air', draw: airport, extra: 70 },
    { x: 10.6, y: 5.6, w: 2, d: 2, h: 30, k: 'stone', doc: 'vision-board', spot: 'vb-disques', draw: records, extra: 8 }
  ];
  var TREES = [[-9.6, 10.4], [-7.4, 10.5], [-9.5, 13.6], [-7.3, 13.5], [-4.6, 7.6], [-3.4, 8.5], [5.5, -2.4], [6.6, -1.5], [10.5, -6.6], [12.6, -6.5], [13.5, -8.4], [-1.5, 10.5], [-1.4, 12.6], [0.5, 8.5], [3.6, 8.6],
    [8.6, 0.5], [8.6, 2.6], [10.5, -2.4], [12.6, -2.5], [13.6, -4], [-1.5, 15.5], [-1.4, 17.6], [3.6, 15.5], [3.6, 17.6], [6.6, 13.5], [7.6, 12.4], [10.4, 3.6], [13.6, 0.4]];
  function blk(v) { return Math.floor(v / 5); }
  function inBand(bx, by) { var s = bx + by, d = Math.abs(bx - by); return s >= 0 && s <= 3 && d <= 4; }
  function bandDist(bx, by) { var s = bx + by, d = Math.abs(bx - by); return Math.max(0, -s, s - 3, Math.ceil((d - 4) / 2)); }
  var LAND = {}; B.forEach(function (b) { LAND[blk(b.x + .01) + ',' + blk(b.y + .01)] = 1; });
  function road(v) { return Math.round((v - 4.5) / 5) * 5 + 4.5; } // ligne de rue la plus proche
  B.forEach(function (b) { b.key = b.x + b.w / 2 + b.y + b.d / 2; b.door = b.dr || door(b); b.spot = b.spot || b.doc; });
  function door(b) { // entrée sur la rue la plus proche (devant le pâté)
    var bx = blk(b.x + .01), by = blk(b.y + .01), fy = by * 5 + 4 - (b.y + b.d), fx = bx * 5 + 4 - (b.x + b.w);
    return fy <= fx ? [b.x + b.w / 2, by * 5 + 4.5] : [bx * 5 + 4.5, b.y + b.d / 2];
  }
  var byDoc = {}, bySpot = {}; B.forEach(function (b) { if (b.doc && !byDoc[b.doc]) byDoc[b.doc] = b; if (b.doc) bySpot[b.spot] = b; });

  // Images des pochettes (vision board) reprises en pixel art sur les panneaux de la ville
  // Albums préférés de Paul (pochettes dans assets/vb/albums) : panneaux, fresques, affiches qui défilent
  var ALB = ["college-dropout", "ram", "thriller", "purple-rain", "seychelles", "astroworld", "morning-glory", "808s", "discovery", "legend", "odyssee", "saw-85-92", "1986", "54-1", "audio-video-disco", "bad", "bar-mediterraneo", "blur", "cassius-1999", "catch-a-fire", "civilisation", "comment-c-est-loin", "devil-wears-prada", "eminem-show", "euphories", "exodus", "first-light", "francafrique", "good-bad-ugly", "heroes-capes", "heroes-villains", "homework", "human-after-all", "jesus-is-king", "kaya", "le-monde-chico", "lucky-boy", "matahari", "modjo", "my-type", "natty-dread", "off-the-wall", "paradise", "pulsar", "rammstein", "shouso-strip", "story-of-espion", "takanaka", "take-care", "tasty", "three-imaginary-boys", "utopia", "watermelon-dandies", "ye"];
  var IMG = {}, SRC = { grad: 'assets/vb/graduation.jpg', sade: 'assets/vb/diamond-life.jpg', 'p-lv': 'assets/vb/louis-vuitton.jpg', 'p-hermes': 'assets/vb/hermes-sellier.jpg', 'p-dior': 'assets/vb/dior.jpg', 'p-kef': 'assets/vb/kef-ls50.jpg', 'p-beo': 'assets/vb/beosound-9000.jpg', 'p-defile': 'assets/vb/defile.jpg' };
  var FILMS = ['f-raging-bull', 'f-las-vegas-parano', 'f-37-2-le-matin', 'f-once-upon-a-time', 'f-memories-of-murder', 'f-anatomie-d-une-chute', 'f-fantastic-mr-fox', 'f-endless-summer', 'f-arrete-moi-si-tu-peux', 'f-99-francs'];
  FILMS.forEach(function (f) { SRC[f] = 'assets/vb/films/' + f.slice(2) + '.jpg'; });
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
  var BK = ['grad', 'p-lv', 'sil-pink', 'college-dropout', 'p-hermes', 'hz', 'thriller', 'sil-blue', 'p-kef', 'purple-rain', 'p-dior', 'sil-green', 'seychelles', 'p-beo', 'vinyl', 'astroworld', 'sil-orange', 'p-defile', 'runway', 'fw', 'sade', 'discovery', 'legend', '808s', 'odyssee', 'saw-85-92', 'morning-glory'];
  var MU = ['thriller', 'grad', 'sade', 'ram', 'seychelles', 'purple-rain', 'astroworld', 'college-dropout', 'legend', 'discovery'];
  var SK = ['alb', 'word', 'sil', 'photo', 'alb', 'ticker', 'word', 'photo', 'film', 'film'];
  var fill = [], deco = [];
  function genWorld() {
    fill = []; deco = [];
    for (var bx = -16; bx <= 18; bx++) for (var by = -16; by <= 18; by++) {
      var key = bx + ',' + by; if (LAND[key]) continue;
      var s = bx + by, x0 = bx * 5, y0 = by * 5; if (x0 + y0 < BACK) continue;
      var cp = P(x0 + 2, y0 + 2); if (cp[0] < -170 || cp[0] > W + 170 || cp[1] > H + 70 || cp[1] < -60) continue;
      var hs = function (n) { return hash(bx * 92.1 + by * 41.7 + n * 13.3); };
      var dist = bandDist(bx, by), band = dist === 0;
      var hmax = band ? (s <= 0 ? 150 : s === 1 ? 90 : s === 2 ? 66 : 40) : s < 0 ? 90 + Math.min(dist, 4) * 30 : s > 3 ? 32 : 70 + Math.min(dist, 3) * 25;
      var fog = band ? 0 : dist === 1 ? .3 : dist === 2 ? .45 : .58;
      if (s >= 5 && hs(1) < .3) { deco.push({ t: 'green', x: x0, y: y0, fog: fog }); continue; } // petit square arboré
      var lots = [], r = hs(2);
      if (r < .25) lots.push([0, 0, 4, 4]); else if (r < .6) lots.push.apply(lots, hs(3) < .5 ? [[0, 0, 4, 2], [0, 2, 4, 2]] : [[0, 0, 2, 4], [2, 0, 2, 4]]); else lots.push([0, 0, 2, 2], [2, 0, 2, 2], [0, 2, 2, 2], [2, 2, 2, 2]);
      lots.forEach(function (l, n) {
        var q = hs(10 + n), k = FK[(q * FK.length) | 0], big = l[2] * l[3];
        var h = Math.round(Math.max(14, Math.min(hmax, (big >= 8 ? 50 : 26) + hs(20 + n) * hmax)));
        var b = { x: x0 + l[0] + .2, y: y0 + l[1] + .2, w: l[2] - .4, d: l[3] - .4, h: h, k: k, fog: fog, seed: bx * 31 + by * 17 + n };
        if (dist >= 1 && dist <= 2 && n === lots.length - 1 && hs(7) < .22) { b.mural = MU[(hs(8) * MU.length) | 0]; b.h = Math.max(b.h, 40); } // fresque
        else if (dist >= 1 && dist <= 2 && n === 0 && hs(5) < (dist === 1 ? .5 : .3)) { b.board = BK[(hs(6) * BK.length) | 0]; b.h = Math.min(b.h, 60); }
        else if (h <= 44 && hs(30 + n) < .36) b.sign = SIGNS[(hs(40 + n) * SIGNS.length) | 0];
        if (dist <= 1 && b.h >= 34 && !b.mural && hs(50 + n) < (band ? .9 : .5)) { b.scr = { face: hs(51 + n) < .5 ? 0 : 1, kind: SK[(hs(52 + n) * SK.length) | 0], seed: (hs(53 + n) * 97) | 0 }; if (b.board && b.scr.face === 0) b.scr.face = 1; }
        if (dist <= 1 && b.h >= 26 && hs(54 + n) < (band ? .5 : .25)) b.zip = true; // bandeau défilant (Times Square)
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
      var core = inBand(bx, by), park = (bx === 0 && by === 2) || (bx === -2 && by === 2); // parc et Champ-de-Mars
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
    for (k = -4; k <= 4; k++) { var zc2 = N ? '#9a97c0' : '#ffffff', o = k * .11; quad({ x: 9.46 + o, y: 9.46 + o, w: .08, d: .08 }, zc2); quad({ x: 9.46 + o, y: 9.46 - o, w: .08, d: .08 }, zc2); } // carrefour en X, façon Shibuya
    if (N) for (var r1 = -3; r1 <= 4; r1++) for (var r2 = -3; r2 <= 4; r2++) { if (!inBand(r1, r2) && !inBand(r1 - 1, r2 - 1)) continue; var p = P(r1 * 5 - .5, r2 * 5 - .5); halo(p[0], p[1], 46, 'rgba(255,79,216,'); halo(p[0], p[1], 80, 'rgba(122,60,255,'); }
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
  function ftext2(f, u, v, s, c, k) { s = norm(s); for (var i = 0; i < s.length; i++) { var gl = F[s[i]] || F[' ']; for (var p = 0; p < 15; p++) if (gl[p] === '1') fr(f, u + (i * 4 + p % 3) * k, v + (4 - ((p / 3) | 0)) * k, k, k, c); } }
  function ticker(f, u0, v, len, txt, t, c) { // texte qui défile sur une façade (bandeau lumineux de Times Square)
    txt = norm(txt); var off = reduce ? 0 : ((t / 45) | 0) % (txt.length * 4);
    for (var i = 0; i < txt.length * 2; i++) { var u = i * 4 - off; if (u < 0 || u > len - 4) continue; var gl = F[txt[i % txt.length]] || F[' ']; for (var p = 0; p < 15; p++) if (gl[p] === '1') fr(f, u0 + u + p % 3, v + (4 - ((p / 3) | 0)), 1, 1, c); }
  }
  var TICK = 'PAUL SIGNE - ELEVE ARTS ET METIERS - RECHERCHE STAGE TECHNICIEN 12/04 - 02/07/2027 - SON + MODE - ';
  var WORDS = ['LIVE', 'SON', 'MODE', 'NYC', 'TOKYO', 'PARIS', 'NEW', 'MUSIC', '2027', 'HI-FI', 'NANTES', 'LONDON', 'BERLIN', 'PRAHA', 'WIEN', 'CINEMA'], WCOL = ['#ff2e88', '#1b2fbf', '#ffd84a', '#18c29c', '#ff7a1a', '#7a3cff'];
  var PH = ['p-lv', 'p-hermes', 'p-dior', 'p-kef', 'p-beo', 'p-defile'];
  function screenOn(f, u0, v0, sw, sh, kind, seed, t) { // contenu d'un écran publicitaire, change toutes les quelques secondes
    var tick = reduce ? 0 : (t / 3200 | 0) + seed, col = WCOL[tick % WCOL.length];
    fr(f, u0 - 1, v0 - 1, sw + 2, sh + 2, '#0a0a0a');
    if (kind === 'alb') faceCover(ALB[(seed * 7 + tick) % ALB.length], f, u0, v0, sw, sh);
    else if (kind === 'photo') faceCover(PH[(seed + tick) % PH.length], f, u0, v0, sw, sh);
    else if (kind === 'film') { fr(f, u0, v0, sw, sh, '#111'); var pw = Math.min(sw, Math.round(sh * 2 / 3)); faceCover(FILMS[(seed + tick) % FILMS.length], f, u0 + ((sw - pw) >> 1), v0, pw, sh); }
    else if (kind === 'sil' && sh >= 29 && sw >= 22) { fr(f, u0, v0, sw, sh, col); var fl = reduce ? 0 : (t / 450 | 0) % 2; silhouette(function (c, r, cc) { fr(f, u0 + ((sw - 20) >> 1) + c, v0 + sh - 1 - r - ((sh - 27) >> 1), 1, 1, cc); }, fl); }
    else if (kind === 'ticker') { fr(f, u0, v0, sw, sh, '#111'); for (var k = 0; k + 6 <= sh; k += 8) ticker(f, u0 + 1, v0 + sh - 7 - k, sw - 2, k % 16 ? TICK : WORDS.join(' - ') + ' - ', t + k * 900, k % 16 ? '#ffd84a' : '#3ef0ff'); }
    else { var w = WORDS[(seed + tick) % WORDS.length], kk = sw >= TL(w, 2) + 4 && sh >= 14 ? 2 : 1; fr(f, u0, v0, sw, sh, col); fr(f, u0, v0, sw, 2, '#ffffff'); ftext2(f, u0 + ((sw - TL(w, kk)) >> 1), v0 + ((sh - 5 * kk) >> 1), w, col === '#ffd84a' ? '#111' : '#ffffff', kk); }
  }
  function screens(b, t) { // écrans et bandeau sur les immeubles sans rôle (dessinés en direct, par-dessus l'image de l'immeuble)
    A(1 - (b.fog || 0) * .85, function () {
      if (b.scr) { var f = b.scr.face ? faceR(b) : faceL(b), sw = Math.min(f.len - 8, 44), sh = Math.min(b.h - 24, 36); if (sw >= 14 && sh >= 12) screenOn(f, ((f.len - sw) >> 1), b.h - sh - 7, sw, sh, b.scr.kind, b.scr.seed, t); }
      if (b.zip) [faceL(b), faceR(b)].forEach(function (f, i) { fr(f, 0, 12, f.len, 8, '#0a0a0a'); ticker(f, 1, 13, f.len - 2, TICK, t + i * 1300 + (b.seed || 0) * 97, i ? '#3ef0ff' : '#ffd84a'); });
    });
  }
  function screenTower(b, t) { // tour d'écrans géants façon Shibuya
    detailed(b); var L = faceL(b), Rf = faceR(b);
    screenOn(L, 4, 22, 40, 50, 'photo', 3, t); screenOn(Rf, 4, 40, 40, 34, 'sil', 2, t); screenOn(Rf, 4, 18, 40, 18, 'word', 5, t);
    [L, Rf].forEach(function (f, i) { fr(f, 0, 12, f.len, 8, '#0a0a0a'); ticker(f, 1, 13, f.len - 2, TICK, t + i * 1700, i ? '#3ef0ff' : '#ffd84a'); });
    var c = center(b, b.h); R(c[0] - 18, c[1] - 26, 36, 18, '#0a0a0a'); R(c[0] - 17, c[1] - 25, 34, 16, WCOL[(reduce ? 0 : (t / 1500 | 0)) % WCOL.length]); T('SHIBUYA', c[0] - 13, c[1] - 20, '#ffffff'); R(c[0] - 12, c[1] - 8, 2, 8, '#333'); R(c[0] + 10, c[1] - 8, 2, 8, '#333');
  }
  function W3(x, y, z) { var q = P(x, y); return [q[0], q[1] - z]; }
  function poly(pts, c) { g.fillStyle = c; g.beginPath(); pts.forEach(function (q, i) { var w = W3(q[0], q[1], q[2]); if (i) g.lineTo(w[0], w[1]); else g.moveTo(w[0], w[1]); }); g.closePath(); g.fill(); }
  function cached(b, key, fn) { // dessin statique et coûteux : rendu une fois dans une image, redessiné si le thème ou le cadrage change
    var c = corners(b), x0 = Math.floor(c.w[0]) - 70, x1 = Math.ceil(c.e[0]) + 70, y0 = Math.floor(c.n[1] - b.h - (b.extra || 0) - 50), y1 = Math.ceil(c.s[1]) + 60, k = key + N + OX + ',' + OY;
    if (b.ck !== k) { var sc = document.createElement('canvas'); sc.width = x1 - x0; sc.height = y1 - y0; var main = g; g = sc.getContext('2d'); g.translate(-x0, -y0); fn(); g = main; b.cimg = sc; b.cx0 = x0; b.cy0 = y0; b.ck = k; }
    g.drawImage(b.cimg, b.cx0, b.cy0);
  }
  /* ---------- Tour Eiffel, en isométrique (d'après photo) : 4 piliers penchés et séparés, grandes arches, 3 étages, flèche ----------
     Profil concave : demi-largeur O(z) = 0,07 + 1,08·e^(−3,1 z / EH) (en cases) ; chaque pilier a une demi-section s(z) ; ils se rejoignent au 2e étage. */
  var EH = 230, F1 = 46, F2 = 100;
  function eO(z) { return .07 + 1.08 * Math.exp(-3.1 * z / EH); }
  function eS(z) { return .17 - .03 * Math.min(1, z / F2); }
  function eiffelStatic(b) {
    var cx = b.x + b.w / 2, cy = b.y + b.d / 2, iron = N ? ['#f0b56a', '#d08f45', '#8f5a24'] : ['#b48a6c', '#8c6650', '#4f3628'], frieze = N ? '#ffe6a8' : '#d9c2ad';
    A(.22, function () { poly([[cx - 1.3, cy - 1.3, 0], [cx + 1.6, cy - 1.3, 0], [cx + 1.6, cy + 1.3, 0], [cx - 1.3, cy + 1.3, 0]], '#000'); }); // ombre
    function px(x, y, z, c) { var q = W3(x, y, z); R(q[0], q[1], 1, 1, c); }
    function tex(i, n, z, col) { // treillis : arêtes sombres, croisillons en X, entretoises horizontales
      if (i === 0 || i === n) return iron[2];
      if (z % 8 === 0) return mix(col, '#000000', .38); // entretoises
      if (((i + z) % 6 === 0) || ((i - z + 1200) % 6 === 0)) return mix(col, '#000000', .24); // croisillons
      return col;
    }
    function faceRow(x0, y0, x1, y1, z, col) { var a = W3(x0, y0, z), c = W3(x1, y1, z), n = Math.max(1, Math.round(Math.abs(c[0] - a[0]))); for (var i = 0; i <= n; i++) R(a[0] + (c[0] - a[0]) * i / n, a[1] + (c[1] - a[1]) * i / n, 1, 1, tex(i, n, z, col)); }
    function leg(sx, sy, z0, z1) { // un pilier : faces visibles (gauche = y+, droite = x+)
      for (var z = z0; z < z1; z++) { var o = eO(z), sv = eS(z), lx = cx + sx * (o - sv), ly = cy + sy * (o - sv);
        faceRow(lx - sv, ly + sv, lx + sv, ly + sv, z, iron[0]); faceRow(lx + sv, ly + sv, lx + sv, ly - sv, z, iron[1]); }
    }
    function archs(front) { // grandes arches décoratives entre les pieds, sous le 1er étage
      [[0, 1], [1, 0]].forEach(function (ax) {
        var sgn = front ? 1 : -1;
        for (var th = 0; th <= Math.PI; th += .02) {
          var zA = 6 + 34 * Math.sin(th), o = eO(zA), sv = eS(zA), ins = (eO(6) - 2 * eS(6)) * Math.cos(th), dep = sgn * (o - sv);
          for (var k = 0; k < 3; k++) { var zz = zA + k, x = ax[0] ? cx + ins : cx + dep, y = ax[0] ? cy + dep : cy + ins; px(x, y, zz, k === 0 ? iron[2] : front ? (ax[0] ? iron[0] : iron[1]) : iron[2]); }
        }
      });
    }
    function deck(z, hw, th, arcs) {
      var d = { x: cx - hw, y: cy - hw, w: 2 * hw, d: 2 * hw }; prism(d, th, iron[0], iron[1], iron[2], z);
      [faceL(d), faceR(d)].forEach(function (f, side) { fr(f, 0, z + th - 2, f.len, 1, frieze); if (arcs) for (var u = 1; u < f.len - 3; u += 5) { fr(f, u, z + 2, 1, th - 5, frieze); fr(f, u + 1, z + th - 4, 3, 1, frieze); } fr(f, 0, z, f.len, 1, iron[2]); });
      for (var u = 0; u < 2 * hw * 24; u += 3) { var a = W3(cx - hw + u / 24, cy + hw, z + th), b2 = W3(cx + hw, cy + hw - u / 24, z + th); R(a[0], a[1] - 3, 1, 3, iron[2]); R(b2[0], b2[1] - 3, 1, 3, iron[2]); } // garde-corps
    }
    leg(-1, -1, 0, F1); archs(false); leg(-1, 1, 0, F1); leg(1, -1, 0, F1); archs(true); leg(1, 1, 0, F1);
    deck(F1, eO(F1) + .07, 10, true);
    leg(-1, -1, F1 + 10, F2); leg(-1, 1, F1 + 10, F2); leg(1, -1, F1 + 10, F2); leg(1, 1, F1 + 10, F2);
    deck(F2, eO(F2) + .05, 6, false);
    for (var z = F2 + 6; z < EH; z++) { var o = eO(z); faceRow(cx - o, cy + o, cx + o, cy + o, z, iron[0]); faceRow(cx + o, cy + o, cx + o, cy - o, z, iron[1]); } // la flèche
    deck(EH, eO(EH) + .04, 4, false);
    var cab = { x: cx - .07, y: cy - .07, w: .14, d: .14 }; prism(cab, 10, iron[0], N ? '#ffd56b' : '#cfe0ee', N ? '#e8c47a' : '#a9c1d6', EH + 4); prism({ x: cx - .1, y: cy - .1, w: .2, d: .2 }, 2, iron[0], iron[1], iron[2], EH + 14);
    var tip = W3(cx, cy, EH + 16); R(tip[0], tip[1] - 24, 1, 24, '#9a9a9a'); R(tip[0] - 1, tip[1] - 12, 3, 1, '#9a9a9a'); R(tip[0] - 1, tip[1] - 25, 3, 2, '#ff3b3b');
  }
  function eiffel(b, t) {
    cached(b, 'eiffel', function () { eiffelStatic(b); });
    var cx = b.x + b.w / 2, cy = b.y + b.d / 2, k;
    if (N && !reduce) for (k = 0; k < 40; k++) if (hash(k * 7 + (t / 140 | 0)) > .72) { var zz = (hash(k) * (EH - 10)) | 0, o = eO(zz), s2 = hash(k + 3) * 2 - 1, q = W3(cx + o * s2, cy + o, zz); R(q[0], q[1], 1, 1, '#ffffff'); } // scintillement
    if (N) { var bc = W3(cx, cy, EH + 40), ang = reduce ? 0 : t / 1400; A(.18, function () { g.fillStyle = '#fff3c4'; g.beginPath(); g.moveTo(bc[0], bc[1]); g.lineTo(bc[0] + Math.cos(ang) * 140, bc[1] + Math.sin(ang) * 22 - 8); g.lineTo(bc[0] + Math.cos(ang) * 140, bc[1] + Math.sin(ang) * 22 + 8); g.fill(); }); } // phare du sommet
    function lift(z, x, y, col) { var q = W3(x, y, z); R(q[0] - 2, q[1] - 6, 5, 6, col); R(q[0] - 1, q[1] - 5, 3, 2, N ? '#ffe9a8' : '#cfe3f5'); R(q[0] - 2, q[1] - 6, 5, 1, '#3a2a22'); }
    var e1 = reduce ? .5 : .5 - .5 * Math.cos(t / 10000 * Math.PI * 2), z1 = 3 + e1 * (F1 - 6), o1 = eO(z1), s1 = eS(z1); // ascenseur du pilier : sol → 1er étage
    lift(z1, cx + (o1 - s1), cy + o1, '#c0392b');
    var e2 = reduce ? .3 : .5 - .5 * Math.cos(t / 14000 * Math.PI * 2), z2 = F2 + 8 + e2 * (EH - F2 - 14), c0 = W3(cx, cy + eO(F2 + 8), F2 + 8), c1 = W3(cx, cy + eO(EH - 4), EH - 4); // ascenseur central : 2e étage → sommet
    R(c0[0], c1[1], 1, c0[1] - c1[1], N ? '#5a4632' : '#3a2a22'); lift(z2, cx, cy + eO(z2) + .01, '#ffd23f');
    // PNL assis sur la galerie du sommet, jambes dans le vide ; Ademo (à gauche) fume
    var top = W3(cx, cy + eO(EH) + .04, EH + 4), gx = Math.round(top[0]), gy = Math.round(top[1]);
    function pnl(x, hood, skin, flip) {
      R(x, gy - 10, 4, 3, '#111'); R(x + (flip ? -1 : 4), gy - 9, 1, 1, '#111'); R(x, gy - 8, 4, 3, skin); R(x + (flip ? 0 : 3), gy - 7, 1, 1, '#1a1a1a');
      R(x - 1, gy - 5, 6, 5, hood); R(x - 1, gy - 5, 1, 5, mix(hood, '#000000', .3));
      R(x, gy, 2, 4, '#1a1a2e'); R(x + 3, gy, 2, 4, '#1a1a2e'); R(x, gy + 4, 2, 1, '#f2f2f2'); R(x + 3, gy + 4, 2, 1, '#f2f2f2');
    }
    pnl(gx - 9, '#111111', '#a8714a', false); pnl(gx + 5, '#3a3f4a', '#8d5524', true);
    R(gx - 5, gy - 7, 3, 1, '#f4f4f4'); R(gx - 2, gy - 7, 1, 1, (reduce || (t / 300 | 0) % 2) ? '#ff7a1a' : '#ffb347'); R(gx - 4, gy - 6, 1, 1, '#a8714a'); // cigarette
    if (!reduce) for (k = 0; k < 4; k++) { var ph = (t / 1600 + k / 4) % 1; A(.7 * (1 - ph), function () { R(gx - 2 + Math.sin(ph * 7 + k) * 2, gy - 9 - ph * 14, 1 + (ph > .5 ? 1 : 0), 1, '#d9d9d9'); }); }
    var fl = W3(cx, cy, EH + 16); R(fl[0] + 1, fl[1] - 22, 13, 7, '#111'); T('QLF', fl[0] + 2, fl[1] - 21, '#ffffff'); // drapeau « Que la famille »
  }
  /* ---------- Château des ducs de Bretagne, en isométrique : douves, tours rondes à mâchicoulis, remparts, Grand Logis, pont ---------- */
  function tourRonde(tx, ty, r, h, roof) {
    var c = W3(tx, ty, 0), Rx = Math.round(34 * r), Ry = 17 * r, st = N ? ['#9e98b8', '#837da3', '#68628a'] : ['#efe8d8', '#d9cfb8', '#b9ac90'];
    for (var dx = -Rx; dx <= Rx; dx++) {
      var e = Ry * Math.sqrt(Math.max(0, 1 - (dx / Rx) * (dx / Rx))), col = dx < -Rx / 3 ? st[0] : dx < Rx / 3 ? st[1] : st[2], x = c[0] + dx;
      R(x, c[1] + e - h, 1, h, col);
      for (var v = 4; v < h - 10; v += 5) R(x, c[1] + e - v, 1, 1, mix(col, '#000000', .14)); // assises de pierre
      if ((dx + 40) % 6 < 3) R(x, c[1] + e - h + 2, 1, 4, mix(col, '#000000', .3)); // mâchicoulis
      R(x, c[1] - e - h - 3, 1, 2 * e + 3, N ? '#7d7799' : '#cfc4aa'); // plateforme
      if ((dx + 40) % 5 < 3) R(x, c[1] + e - h - 5, 1, 5, col); // créneaux
    }
    for (dx = -Rx + 2; dx <= Rx - 2; dx += 9) R(c[0] + dx, c[1] + Ry * .6 - h * .55, 1, 4, '#3a3448'); // archères
    if (roof) { var tp = [c[0], c[1] - h - roof]; g.fillStyle = N ? '#2c3348' : '#4b5568'; g.beginPath(); g.moveTo(c[0] - Rx * .55, c[1] - h - 2); g.lineTo(c[0] + Rx * .55, c[1] - h - 2); g.lineTo(tp[0], tp[1]); g.fill(); }
  }
  function gable(x0, y0, w, d, h, rh, wall) { // corps de logis à toit d'ardoise très pentu (faîte dans le sens x)
    var sl = N ? ['#3c4560', '#2c3348', '#1f2535'] : ['#6b7590', '#4b5568', '#353d4f'];
    prism({ x: x0, y: y0, w: w, d: d }, h, wall[0], wall[1], wall[2]);
    poly([[x0, y0, h], [x0 + w, y0, h], [x0 + w, y0 + d / 2, h + rh], [x0, y0 + d / 2, h + rh]], sl[2]);
    poly([[x0 + w, y0, h], [x0 + w, y0 + d, h], [x0 + w, y0 + d / 2, h + rh]], wall[2]);
    poly([[x0, y0 + d, h], [x0 + w, y0 + d, h], [x0 + w, y0 + d / 2, h + rh], [x0, y0 + d / 2, h + rh]], sl[0]);
    for (var k = 1; k < 6; k++) { var a = W3(x0, y0 + d - k * d / 12, h + k * rh / 6), b2 = W3(x0 + w, y0 + d - k * d / 12, h + k * rh / 6); g.fillStyle = sl[1]; g.fillRect(a[0], a[1], b2[0] - a[0], 1); }
  }
  function chateauStatic(b) {
    var x0 = b.x, y0 = b.y, X1 = b.x + b.w, Y1 = b.y + b.d, wall = N ? ['#9e98b8', '#837da3', '#68628a'] : ['#efe8d8', '#d9cfb8', '#b9ac90'], white = N ? ['#c8c2dc', '#aba4c6', '#8f88ae'] : ['#ffffff', '#f1ede4', '#ddd6c6'];
    quad({ x: x0 - .6, y: y0 - .6, w: b.w + 1.2, d: b.d + 1.2 }, N ? '#1f4a3a' : '#6cc45e'); // pelouse
    quad({ x: x0 - .42, y: y0 - .42, w: b.w + .84, d: b.d + .84 }, N ? '#1d3a4a' : '#5f8f6e'); // douves vertes
    for (var k = 0; k < 14; k++) quad({ x: x0 - .3 + hash(k) * (b.w + .6), y: Y1 + .12 + hash(k + 5) * .2, w: .14, d: .02 }, N ? '#2f5a6e' : '#86b597');
    tourRonde(x0, y0, .42, 34); prism({ x: x0, y: y0, w: b.w, d: .25 }, 26, wall[0], wall[1], wall[2]); prism({ x: x0, y: y0, w: .25, d: b.d }, 26, wall[0], wall[1], wall[2]); // tour et remparts du fond
    gable(x0 + .45, y0 + .35, 1.9, .8, 56, 30, white); // Grand Logis
    [.55, 1.1, 1.65].forEach(function (dx) { var e = W3(x0 + .45 + dx, y0 + 1.15, 56); // lucarnes à pinacles
      R(e[0] - 4, e[1] - 12, 9, 12, white[0]); R(e[0] - 2, e[1] - 10, 5, 7, '#3a4256'); for (var r = 0; r < 7; r++) R(e[0] - 4 + Math.ceil(r * .6), e[1] - 13 - r, 9 - 2 * Math.ceil(r * .6), 1, white[0]); R(e[0], e[1] - 23, 1, 4, white[2]); R(e[0] - 5, e[1] - 16, 1, 5, white[2]); R(e[0] + 5, e[1] - 16, 1, 5, white[2]); });
    var lt = W3(x0 + .8, y0 + .75, 86); R(lt[0] - 2, lt[1] - 10, 5, 10, N ? '#2c3348' : '#4b5568'); R(lt[0] - 1, lt[1] - 15, 3, 5, N ? '#3c4560' : '#6b7590'); R(lt[0], lt[1] - 20, 1, 5, '#8a8a8a'); // lanternon
    // le Gwenn-ha-du est dessiné à part (il flotte au vent)
    tourRonde(X1, y0, .42, 34); tourRonde(x0, Y1, .42, 34);
    prism({ x: X1 - .25, y: y0, w: .25, d: b.d }, 26, wall[0], wall[1], wall[2]); // rempart droit
    var fw = { x: x0, y: Y1 - .25, w: b.w, d: .25 }; prism(fw, 26, wall[0], wall[1], wall[2]); var L = faceL(fw); // rempart de devant
    for (var u = 0; u < L.len; u += 3) fr(L, u, 22, 1, 3, wall[2]); for (u = 1; u < L.len; u += 4) fr(L, u, 26, 2, 3, wall[1]); for (var v = 4; v < 22; v += 5) fr(L, 0, v, L.len, 1, mix(wall[1], '#000000', .1));
    // pont de pierre à arches, vers la porte entre les deux tours d'entrée
    var br = { x: x0 + 1.18, y: Y1, w: .44, d: .7 }; prism(br, 9, N ? '#8e88a8' : '#d4c9ad', wall[1], wall[2]); var bf = faceR(br); for (var a3 = 0; a3 < 2; a3++) arch(bf, 2 + a3 * 9, 0, 6, 1, '#2a3a3a', '#2a3a3a');
    fr(faceL(br), 0, 9, faceL(br).len, 1, wall[2]);
    var gt = W3(x0 + 1.4, Y1, 0); for (var gv = 0; gv < 18; gv++) { var gw = gv < 12 ? 4 : Math.round(4 - (gv - 12) * .7); R(gt[0] - gw, gt[1] - gv - 9, 2 * gw, 1, '#2a2320'); } // porte
    tourRonde(x0 + 1.0, Y1, .3, 40); tourRonde(x0 + 1.8, Y1, .3, 40); tourRonde(X1, Y1, .46, 36);
  }
  var ERM = ['.#.', '###', '.#.', '#.#']; // moucheture d'hermine (3 × 4)
  function gwennHaDu(x, y, t) { // drapeau breton 30 × 18 : 9 bandes (5 noires, 4 blanches), franc-quartier blanc semé de 11 hermines, qui ondule
    var Wd = 30, Hd = 18;
    R(x - 1, y - 2, 1, Hd + 30, '#6b6b6b'); R(x - 2, y - 3, 3, 2, '#d4af37'); // mât
    for (var c = 0; c < Wd; c++) {
      var dy = reduce ? 0 : Math.round(Math.sin(t / 260 - c / 4) * 1.6 * c / Wd), sh = reduce ? 0 : Math.sin(t / 260 - c / 4) * .12;
      for (var r = 0; r < Hd; r++) {
        var canton = c < 13 && r < 10, stripe = Math.floor(r / 2), col = canton ? '#ffffff' : stripe % 2 ? '#ffffff' : '#111111';
        R(x + c, y + r + dy, 1, 1, sh > .06 ? mix(col, '#000000', .15) : col);
      }
      if (c < 13) [[1, 1], [5, 1], [9, 1], [3, 5], [7, 5]].forEach(function (q) { var ec = c - q[0]; if (ec < 0 || ec > 2) return; for (var rr = 0; rr < 4; rr++) if (ERM[rr][ec] === '#') R(x + c, y + q[1] + rr + dy, 1, 1, '#111111'); });
    }
  }
  function chateau(b, t) { cached(b, 'chateau', function () { chateauStatic(b); }); var fg = W3(b.x + b.w, b.y, 40); gwennHaDu(fg[0] + 1, fg[1] - 46, t); var sg = W3(b.x + b.w + .45, b.y + b.d + .5, 0); R(sg[0], sg[1] - 9, 1, 9, '#555'); R(sg[0] - 13, sg[1] - 16, 27, 8, N ? '#1a0f2e' : '#1b2fbf'); T('NANTES', sg[0] - 11, sg[1] - 14, '#ffffff'); }
  /* ---------- Défilé Comme des Garçons : podium, mannequins, photographes et flashs, public, Karl Lagerfeld et Anna Wintour au premier rang ---------- */
  var HEART = [ // cœur à yeux façon Comme des Garçons PLAY, 22 × 19 (r = rouge, w = blanc de l'œil, k = pupille)
    '...rrrrr......rrrrr...', '..rrrrrrr....rrrrrrr..', '.rrrrrrrrr..rrrrrrrrr.', 'rrrrwwwrrrrrrrrwwwrrrr', 'rrrwkkwwrrrrrrwkkwwrrr', 'rrrwkkwwrrrrrrwkkwwrrr', 'rrrwwwwwrrrrrrwwwwwrrr', 'rrrrwwwrrrrrrrrwwwrrrr',
    'rrrrrrrrrrrrrrrrrrrrrr', '.rrrrrrrrrrrrrrrrrrrr.', '..rrrrrrrrrrrrrrrrrr..', '...rrrrrrrrrrrrrrrr...', '....rrrrrrrrrrrrrr....', '.....rrrrrrrrrrrr.....', '......rrrrrrrrrr......', '.......rrrrrrrr.......',
    '........rrrrrr........', '.........rrrr.........', '..........rr..........'];
  function playHeart(f, u0, vTop, k) { var C = { r: '#e3262e', w: '#ffffff', k: '#111111' }; for (var r = 0; r < HEART.length; r++) for (var c = 0; c < 22; c++) { var ch = HEART[r][c]; if (ch !== '.') fr(f, u0 + c * k, vTop - r * k, k, k, C[ch]); } }
  function fashionShow(b, t) {
    var x0 = b.x, y0 = b.y, ph = reduce ? 0 : t / 1000;
    quad({ x: x0, y: y0, w: b.w, d: b.d }, N ? '#15121f' : '#2a2a30'); // sol de la salle
    var wall = { x: x0, y: y0 + .25, w: .14, d: b.d - .5 }; prism(wall, 44, '#111', '#1a1a1a', '#0d0d0d'); var wf = faceR(wall);
    playHeart(wf, (wf.len - 22) >> 1, 33, 1); ftext2(wf, 7, 6, 'COMME DES GARCONS', '#ffffff', 1); ftext2(wf, 19, 0, 'PLAY', '#e3262e', 1); // fond de scène : logo PLAY
    function row(y, fromX, looks, names, lift) { for (var k = 0; k < looks.length; k++) { var q = P(fromX + k * .48, y); R(q[0] - 5, q[1] - 6 - lift, 10, 3 + lift, '#3a3a40'); drawPerson(q[0], q[1] - 1 - lift, looks[k], k + 5, false, 0); if (names && names[k]) { R(q[0] - 8, q[1] - lift - 1, 17, 7, '#ffffff'); T(names[k], q[0] - 7, q[1] - lift, '#111'); } } }
    row(y0 + .3, x0 + .55, ['corporate', 'mode', 'etudiant', 'mode', 'corporate'], null, 10); // gradin du haut
    row(y0 + .72, x0 + .45, ['mode', 'anna', 'karl', 'corporate', 'mode'], [0, 'ANNA', 'KARL'], 0); // premier rang
    prism({ x: x0 + .3, y: y0 + 1.15, w: b.w - .45, d: .55 }, 4, '#f4f4f4', '#d9d9de', '#bdbdc4'); // podium blanc
    for (var m = 0; m < 4; m++) { // mannequins : aller sur un côté du podium, retour de l'autre
      var p2 = (ph * .09 + m / 4) % 1, out = p2 < .5, f = out ? p2 * 2 : (p2 - .5) * 2, mx = out ? x0 + .45 + f * (b.w - .7) : x0 + .45 + (1 - f) * (b.w - .7), my = y0 + (out ? 1.55 : 1.32), q = P(mx, my);
      drawPerson(q[0], q[1] - 4, ['cdgA', 'cdgB', 'cdgC', 'cdgA'][m], m + 1, !out, reduce ? 0 : ((t / 160 + m) | 0) % 4);
    }
    for (var rl = 0; rl < 9; rl++) { var rq = P(x0 + .3 + rl * .3, y0 + 2.0); R(rq[0], rq[1] - 6, 1, 6, '#888'); } var r0 = P(x0 + .3, y0 + 2.0), r1 = P(x0 + 2.7, y0 + 2.0); for (var rx = 0; rx <= r1[0] - r0[0]; rx++) R(r0[0] + rx, r0[1] - 6 + rx / 2, 1, 1, '#b9b9c0'); // barrière
    for (var k = 0; k < 4; k++) { // photographes au bout du podium, flashs au hasard
      var q2 = P(x0 + b.w - .1, y0 + 1.0 + k * .24); drawPerson(q2[0], q2[1], 'photo', k + 2, true, 0);
      if (!reduce && hash(k * 13 + (t / 120 | 0)) > .9) A(.9, function () { disc(q2[0] - 6, q2[1] - 19, 4, '#ffffff'); }); }
    if (N || !reduce) [[.6, 0], [1.4, 1], [2.2, 2]].forEach(function (s3) { var q = P(x0 + s3[0], y0 + 1.3), a = Math.sin(t / 900 + s3[1]) * .25; A(.12, function () { g.fillStyle = '#fff6c8'; g.beginPath(); g.moveTo(q[0] + Math.sin(a) * 60, q[1] - 70); g.lineTo(q[0] - 8, q[1] - 3); g.lineTo(q[0] + 8, q[1] - 3); g.fill(); }); }); // projecteurs
  }
  function arch(f, u0, v0, wd, hb, c, c2) { var r = wd / 2; for (var i = 0; i < wd; i++) { var dx = i + .5 - r, top = Math.round(Math.sqrt(Math.max(0, r * r - dx * dx))); fr(f, u0 + i, v0, 1, hb + top, (i % 4 === 0) ? c2 : c); } }
  function station(b, t) { // la gare : façade à grandes arches, horloge, panneau des départs, train qui arrive et repart
    var p = pal(b.k), L = faceL(b), Rf = faceR(b), glass = N ? '#ffd98a' : '#9ec9f0', rib = N ? '#a8873a' : '#6b7c8f';
    prism(b, b.h, p[0], p[1], p[2]);
    [L, Rf].forEach(function (f, side) { fr(f, 0, b.h - 3, f.len, 3, mix(side ? p[2] : p[1], '#000000', .25)); fr(f, 0, b.h - 4, f.len, 1, N ? '#6a6490' : '#ffffff'); });
    var vault = { x: b.x + .3, y: b.y + .25, w: b.w - .6, d: b.d - .5 }; // verrière en berceau sur le toit
    for (var k = 0; k < 7; k++) prism({ x: vault.x, y: vault.y + k * vault.d / 7, w: vault.w, d: vault.d / 7 }, Math.round(9 * Math.sin((k + .5) / 7 * Math.PI)), glass, rib, rib, b.h);
    arch(L, 6, 4, 14, 14, glass, rib); arch(L, 36, 4, 14, 14, glass, rib); arch(L, 66, 4, 14, 14, glass, rib); // grandes baies
    fr(L, 24, 0, 9, 13, '#3a2a22'); fr(L, 54, 0, 9, 13, '#3a2a22');
    fr(L, 24, 28, 38, 9, N ? '#1a0f2e' : '#1b2fbf'); ftext(L, 35, 30, 'GARE', '#ffffff');
    circleOn(L, 43, b.h - 1, 6, '#f7f2e6'); circleOn(L, 43, b.h - 1, 5, '#ffffff'); fr(L, 43, b.h - 1, 1, 4, '#111'); // horloge
    var mn = reduce ? 2 : (t / 1000 * 6 | 0) % 12; fr(L, 43 + [0, 1, 2, 3, 2, 1, 0, -1, -2, -3, -2, -1][mn], b.h - 1 + [3, 3, 2, 0, -2, -3, -3, -3, -2, 0, 2, 3][mn], 1, 1, '#c0392b');
    fr(Rf, 4, 8, 44, 32, '#0d0d12'); fr(Rf, 4, 38, 44, 2, '#333'); ftext(Rf, 7, 32, 'DEPARTS', '#ffffff'); // panneau des départs
    ['LONDON', 'AMSTERDAM', 'BERLIN', 'PRAHA', 'WIEN'].forEach(function (c, i) { var on = reduce || ((t / 600 | 0) + i) % 9; ftext(Rf, 7, 25 - i * 4.4 | 0, c, on ? '#ffd23f' : '#7a6420'); });
    // quais et train (aller-retour en 14 s)
    var ty = b.y + b.d + .22, rail = N ? '#77749a' : '#8a8f99'; quad({ x: b.x - .1, y: ty + .08, w: b.w + .2, d: .04 }, rail); quad({ x: b.x - .1, y: ty + .34, w: b.w + .2, d: .04 }, rail);
    var ph = reduce ? 6 : (t / 1000) % 14, e = function (x) { return x * x * (3 - 2 * x); }, pos = ph < 4 ? 1 - e(ph / 4) : ph < 9 ? 0 : ph < 13 ? e((ph - 9) / 4) : 1;
    if (ph < 13.5) A(pos > .85 ? (1 - pos) / .15 : 1, function () {
      var tr = { x: b.x + .05 + pos * 1.4, y: ty, w: 2.1, d: .42 }; prism(tr, 11, '#f4f4f4', '#e8e8ee', '#c9ccd3');
      var tl = faceL(tr), trr = faceR(tr); fr(tl, 0, 3, tl.len, 2, '#1b2fbf'); for (var u = 3; u < tl.len - 4; u += 6) fr(tl, u, 6, 4, 3, N ? '#ffe9a8' : '#4d6f96'); fr(trr, 1, 5, trr.len - 2, 4, '#4d6f96'); fr(trr, 0, 3, trr.len, 2, '#1b2fbf');
    });
  }
  function airport(b, t) { // l'aéroport : terminal vitré, tour de contrôle avec radar, avion au sol
    var p = pal(b.k), L = faceL(b), Rf = faceR(b);
    prism(b, b.h, p[0], p[1], p[2]); fr(L, 2, 4, L.len - 4, 9, N ? '#ffd98a' : '#9ec9f0'); fr(Rf, 2, 4, Rf.len - 4, 9, N ? '#e8c47a' : '#7fb1dc');
    fr(L, 4, b.h - 6, 38, 7, N ? '#1a0f2e' : '#1b2fbf'); ftext(L, 6, b.h - 5, 'AEROPORT', '#ffffff');
    var sh = { x: b.x + b.w - .75, y: b.y + .2, w: .45, d: .45 }; prism(sh, 62, '#e8e8ee', '#c9ccd3', '#a9afb9', b.h);
    var cab = { x: sh.x - .15, y: sh.y - .15, w: .75, d: .75 }; prism(cab, 9, '#3a4256', N ? '#ffd98a' : '#4fa3c7', N ? '#e8c47a' : '#3b88b0', b.h + 62); prism({ x: cab.x - .05, y: cab.y - .05, w: .85, d: .85 }, 2, '#c9ccd3', '#a9afb9', '#8a909b', b.h + 71);
    var c = center(cab, b.h + 73), a = reduce ? 0 : t / 500; R(c[0], c[1] - 6, 1, 6, '#555'); R(c[0] - Math.round(Math.cos(a) * 4), c[1] - 7, 1 + Math.round(Math.abs(Math.cos(a)) * 7), 2, '#e8e8ee'); // radar
    if (N && (t / 700 | 0) % 2) R(c[0], c[1] - 9, 1, 2, '#ff3b3b');
    var py = b.y + b.d + .9, px = b.x + .5; // avion au sol, face à la piste
    quad({ x: b.x - .1, y: b.y + b.d + .2, w: b.w + .2, d: 1.6 }, N ? '#2a2846' : '#b9bcc4'); for (var k = 0; k < 6; k++) quad({ x: b.x + .1 + k * .58, y: b.y + b.d + 1.65, w: .3, d: .05 }, '#f4f4f4');
    quad({ x: px + .9, y: py - .75, w: .45, d: 1.9 }, '#dfe3ea', 3); // ailes
    var fus = { x: px, y: py, w: 2.3, d: .32 }; prism(fus, 6, '#ffffff', '#f2f2f2', '#d6d9df', 1); var fl = faceL(fus); for (var u = 6; u < fl.len - 6; u += 3) fr(fl, u, 3, 1, 1, '#4d6f96'); fr(fl, 0, 1, fl.len, 1, '#1b2fbf');
    prism({ x: px, y: py + .07, w: .35, d: .18 }, 9, '#1b2fbf', '#1b2fbf', '#14248f', 7); // dérive
  }
  var TOP4 = ['f-raging-bull', 'f-las-vegas-parano', 'f-37-2-le-matin', 'f-once-upon-a-time']; // top 4 de Paul (à confirmer avec son profil Letterboxd)
  function cinema(b, t) { // le cinéma du quartier vision board : marquise, enseigne verticale, le top 4 à l'affiche
    var p = pal(b.k), L = faceL(b), Rf = faceR(b), gold = '#d4af37', on = reduce ? 0 : (t / 220 | 0) % 2;
    prism(b, b.h, p[0], p[1], p[2]); [L, Rf].forEach(function (f) { fr(f, 0, b.h - 2, f.len, 2, gold); fr(f, 0, b.h - 6, f.len, 1, mix(p[1], gold, .35)); });
    fr(L, 1, 31, L.len - 2, 19, '#0d0d12'); fr(L, 1, 49, L.len - 2, 1, gold); // vitrine du top 4
    TOP4.forEach(function (f, i) { faceCover(f, L, 3 + i * 11, 33, 10, 15); });
    fr(L, 1, 18, L.len - 2, 10, '#111'); for (var u = 1; u < L.len - 1; u += 2) { fr(L, u, 27, 1, 1, (u / 2 + on) % 2 ? '#ffe9a8' : '#7a5a10'); fr(L, u, 18, 1, 1, (u / 2 + on) % 2 ? '#7a5a10' : '#ffe9a8'); } // marquise
    ticker(L, 3, 20, L.len - 6, 'MON TOP 4 : RAGING BULL - LAS VEGAS PARANO - 37 2 LE MATIN - ONCE UPON A TIME IN HOLLYWOOD - ', t, '#ffd23f');
    fr(L, 16, 0, 16, 13, '#2a1a12'); fr(L, 16, 13, 16, 1, gold); fr(L, 3, 1, 9, 12, '#111'); fr(L, 36, 1, 9, 12, '#111');
    var tk = reduce ? 0 : (t / 4000 | 0); faceCover(FILMS[(tk + 4) % FILMS.length], L, 4, 2, 7, 10); faceCover(FILMS[(tk + 7) % FILMS.length], L, 37, 2, 7, 10);
    fr(Rf, 4, 34, 40, 14, '#111'); ftext2(Rf, 8, 37, 'TOP 4', '#ffd23f', 2); // côté : TOP 4
    for (var k = 0; k < 3; k++) faceCover(FILMS[(tk + k) % FILMS.length], Rf, 6 + k * 14, 8, 10, 15);
    var cs = corners(b).s, bx = Math.round(cs[0]) - 3, by = Math.round(cs[1]) - b.h - 20; R(bx, by, 7, 44, '#b3202f'); R(bx, by, 7, 1, gold); R(bx, by + 43, 7, 1, gold); // enseigne verticale
    'CINEMA'.split('').forEach(function (ch, i) { T(ch, bx + 2, by + 3 + i * 7, N && (on || i % 2) ? '#fff3a0' : '#ffffff'); });
    if (N) A(.25, function () { R(bx - 3, by - 3, 13, 50, '#ff7a7a'); });
  }
  function skyPlane(t) { // avion qui décolle et traverse le ciel, avec sa traînée
    if (reduce) return; var per = 24000, ph = (t % per) / per; if (ph > .55) return;
    var x = W + 40 - ph / .55 * (W + 120), y = TOPA + 130 - ph / .55 * 90;
    for (var k = 1; k < 40; k++) A(.5 * (1 - k / 40), function () { R(x + 10 + k * 3, y + 1 + k * 1.2, 3, 1, N ? '#9a97c0' : '#ffffff'); });
    R(x - 9, y, 20, 3, N ? '#c9ccd3' : '#ffffff'); R(x - 11, y + 1, 2, 2, N ? '#c9ccd3' : '#ffffff'); R(x - 3, y - 4, 6, 4, N ? '#a9afb9' : '#e8e8ee'); R(x - 2, y + 3, 7, 3, N ? '#a9afb9' : '#e8e8ee'); R(x + 8, y - 5, 3, 5, '#1b2fbf'); R(x - 6, y + 1, 12, 1, '#4d6f96');
    if (N && (t / 400 | 0) % 2) { R(x - 3, y - 5, 1, 1, '#ff3b3b'); R(x + 1, y + 6, 1, 1, '#7dff8a'); }
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
  function park(b, t) { // le jeu du parachute, en boucle : on le secoue (ballon), on le lève en dôme, deux enfants passent dessous, on le redescend
    var c = center(b, 0), cx = c[0], cy = c[1] + 4, RR = 36, cols = ['#e63946', '#f4a261', '#ffd60a', '#2a9d8f', '#4361ee', '#9b5de5'];
    disc(cx, cy, 46, N ? '#cfc2a0' : '#e9dcb5', .5); // allée de sable
    var ph = reduce ? 4 : (t / 1000) % 8, ease = function (x) { return x * x * (3 - 2 * x); };
    var lift = ph < 1.8 ? 0 : ph < 3.1 ? ease((ph - 1.8) / 1.3) : ph < 5.6 ? 1 : ph < 6.8 ? 1 - ease((ph - 5.6) / 1.2) : 0;
    var shake = 1 - lift, e = 5 + 7 * lift, hc = e + 3 + 30 * lift, run = ph > 3.3 && ph < 5.4 ? (ph - 3.3) / 2.1 : -1;
    function H(r, a) { return e + (hc - e) * (1 - (r / RR) * (r / RR)) + (r / RR) * Math.sin(a * 3 + t / 140) * 2.5 * shake; }
    function pt(r, a) { return [cx + Math.cos(a) * r, cy + Math.sin(a) * r / 2 - H(r, a)]; }
    var NK = 10, kids = [];
    for (var k = 0; k < NK; k++) {
      var a = k / NK * Math.PI * 2 + .3, gx, gy, runner = (k === 0 || k === 5) && run >= 0;
      if (runner) { var a2 = a + Math.PI, f = ease(run); gx = cx + Math.cos(a) * (RR + 3) * (1 - f) + Math.cos(a2) * (RR + 3) * f; gy = cy + (Math.sin(a) * (RR + 3) * (1 - f) + Math.sin(a2) * (RR + 3) * f) / 2; }
      else if ((k === 0 || k === 5) && ph >= 5.4 && ph < 8) { gx = cx + Math.cos(a + Math.PI) * (RR + 3); gy = cy + Math.sin(a + Math.PI) * (RR + 3) / 2; }
      else { gx = cx + Math.cos(a) * (RR + 3); gy = cy + Math.sin(a) * (RR + 3) / 2; }
      kids.push({ x: gx, y: gy, k: k, run: runner, far: gy < cy, up: lift > .5 || (shake > .5 && Math.sin(t / 140 + k) > .3) });
    }
    function kid(q) {
      var hop = q.run ? 0 : Math.round(lift > 0 && lift < 1 ? -2 * Math.sin(lift * Math.PI) : 0), fr4 = q.run ? ((t / 120) | 0) % 4 : 0;
      drawPerson(q.x, q.y + hop, ['enfant', 'kid2', 'kid3'][q.k % 3], q.k, q.x > cx, fr4);
      var sk = SKIN[q.k % SKIN.length], hy = q.y + hop - (q.up ? 17 : 11);
      if (!q.run) { R(q.x - 3, hy, 1, 3, sk); R(q.x + 3, hy, 1, 3, sk); } // bras levés ou tendus vers le bord
    }
    kids.filter(function (q) { return q.far || q.run; }).forEach(kid);
    var polys = [], RG = 6, SEG = 24;
    for (var r = 0; r < RG; r++) for (var j = 0; j < SEG; j++) {
      var r1 = RR * (1 - r / RG), r2 = RR * (1 - (r + 1) / RG), a1 = j / SEG * Math.PI * 2, a3 = (j + 1) / SEG * Math.PI * 2, am = (a1 + a3) / 2;
      polys.push({ p: [pt(r1, a1), pt(r1, a3), pt(r2, a3), pt(r2, a1)], z: Math.sin(am) * (r1 + r2) / 2, c: mix(cols[(j >> 1) % 6], '#000000', Math.max(0, Math.sin(am - 2.4)) * .22 + (N ? .25 : 0)) });
    }
    polys.sort(function (u, w) { return u.z - w.z; }).forEach(function (q) { g.fillStyle = q.c; g.beginPath(); g.moveTo(q.p[0][0], q.p[0][1]); for (var m = 1; m < 4; m++) g.lineTo(q.p[m][0], q.p[m][1]); g.closePath(); g.fill(); });
    var top = pt(0, 0); disc(top[0], top[1], 3, '#ffffff', .5); // trou central
    if (shake > .6) { var bh = Math.abs(Math.sin(t / 230)) * 18; disc(top[0], top[1] - 4 - bh, 3, '#ffffff'); R(top[0] - 3, top[1] - 4 - bh, 7, 1, '#e63946'); } // ballon qui rebondit
    kids.filter(function (q) { return !q.far && !q.run; }).forEach(kid);
    var bp = P(b.x + .6, b.y + 3.2); R(bp[0] - 6, bp[1] - 4, 12, 2, '#8a5a3c'); R(bp[0] - 6, bp[1] - 7, 12, 2, '#8a5a3c'); R(bp[0] - 5, bp[1] - 2, 1, 2, '#333'); R(bp[0] + 4, bp[1] - 2, 1, 2, '#333'); // banc
    R(cx + 54, cy - 18, 1, 14, '#6b4423'); R(cx + 48, cy - 26, TL('PARC') + 4, 8, '#2e7d32'); T('PARC', cx + 50, cy - 24, '#fff');
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
    if (inBand(blk(x), blk(y))) { var mu = (x + y) % 10 < 5; R(p[0] + 1, p[1] - 15, 4, 8, mu ? '#1b2fbf' : '#111'); R(p[0] + 1, p[1] - 8, 1, 1, mu ? '#1b2fbf' : '#111'); R(p[0] + 4, p[1] - 8, 1, 1, mu ? '#1b2fbf' : '#111');
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
    cdgA: { hair: '#111111', top: '#111111', bot: '#111111', shoe: '#111111', dress: 1 },
    cdgB: { hair: '#2b1a0e', top: '#f2f2f2', bot: '#f2f2f2', shoe: '#111111', dress: 1, long: 1 },
    cdgC: { hair: '#111111', top: '#b3202f', bot: '#111111', shoe: '#111111', coat: 1 },
    karl: { hair: '#f2f2f2', top: '#111111', bot: '#111111', shoe: '#111111', glasses: 1, collar: 1, pony: 1 },
    anna: { hair: '#6b4a2b', top: '#c9a227', bot: '#c9a227', shoe: '#111111', dress: 1, glasses: 1, bob: 1 },
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
    if (o.glasses) R(8, hy + 3, 3, 1, '#111');
    if (o.pony) R(4, hy + 2, 2, 4, o.hair);
    if (o.bob) { R(5, hy + 2, 2, 5, o.hair); R(10, hy + 1, 1, 2, o.hair); }
    if (o.cap) { R(5, hy - 1, 6, 2, o.cap); R(10, hy + 1, 2, 1, o.cap); }
    if (o.helmet) { R(5, hy - 2, 6, 3, o.helmet); R(4, hy + 1, 8, 1, mix(o.helmet, '#000000', .15)); R(6, hy - 2, 2, 1, '#fff4a8'); }
    R(7, hy + 8, 2, 1, sh); // cou
    var ty = 12 + bob, tl = o.coat || o.dress ? 10 : 7;
    if (o.hood) R(4, ty - 1, 3, 3, ts);
    if (o.pack) { R(2, ty, 3, 7, o.pack); R(2, ty, 3, 1, mix(o.pack, '#ffffff', .3)); R(3, ty + 3, 1, 2, mix(o.pack, '#000000', .3)); }
    R(5, ty, 6, tl, o.top); R(5, ty, 1, tl, ts); R(6, ty, 4, 1, hi);
    if (o.dress) { R(4, ty + 6, 8, 4, o.top); R(4, ty + 6, 1, 4, ts); R(5, ty + 4, 6, 1, mix(o.top, '#000000', .4)); }
    if (o.collar) { R(7, ty - 1, 4, 3, '#ffffff'); R(8 + sw, ty + 6, 2, 1, '#111'); }
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
    corporate: { n: 5, v: .55, go: ['competences', 'cv', 'annexes', 'vision-board', 'contact', 'voyage'] },
    etudiant: { n: 5, v: .7, go: ['a-propos', 'projets', 'vision-board', 'animation', 'annexes', 'voyage'] },
    enfant: { n: 5, v: .75, go: ['a-propos', 'animation', 'garde'] },
    commercant: { n: 3, v: .5, go: ['vision-board', 'animation', 'garde'] },
    facteur: { n: 2, v: .6, go: ['la-poste', 'garde', 'a-propos', 'annexes', 'competences'] },
    ouvrier: { n: 3, v: .55, go: ['la-poste', 'projets'] },
    mode: { n: 3, v: .6, go: ['vision-board', 'competences', 'cv'] }
  };
  var VB = ['vision-board', 'vb-club', 'vb-mode', 'vb-disques', 'vb-cinema', 'vb-defile'], VOY = ['voyage', 'voyage-air'];
  function spotOf(doc) { return doc === 'vision-board' ? VB[(Math.random() * VB.length) | 0] : doc === 'voyage' ? VOY[(Math.random() * 2) | 0] : doc; }
  function route(a, b) { // déplacement par les rues (lignes 4,5 et 9,5)
    var aV = Math.abs(a[0] - road(a[0])) < .01, bV = Math.abs(b[0] - road(b[0])) < .01, pts = [a];
    function near(v) { return road(v); }
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
    var r = [-3, -1, 0, 1, 2, 3, 4][i % 7] * 5 + 4.5, side = hash(i + 5) > .5 ? .4 : -.4;
    walkers.push({ ax: i % 2, line: r + side, s: -34 + hash(i * 3) * 80, dir: hash(i + 9) > .5 ? 1 : -1, v: .45 + hash(i) * .3, cl: LOOKS[i % LOOKS.length], k: i });
  }
  var CARC = [['#f2c230', 'taxi'], ['#f2c230', 'taxi'], ['#e63946'], ['#4361ee'], ['#f4f4f4'], ['#2b2b30'], ['#f2c230', 'taxi'], ['#2a9d8f'], ['#c0392b', 'bus']];
  for (i = 0; i < 22; i++) { var ax = i % 2, dir = hash(i + 1) > .5 ? 1 : -1; cars.push({ ax: ax, line: [-3, -2, -1, 0, 1, 2, 3][(i * 3) % 7] * 5 + 4.5 + (ax ? -dir : dir) * .22, s: -34 + hash(i * 7) * 80, s0: -34 + hash(i * 7) * 80, dir: dir, v: .8 + hash(i + 4) * .7, c: CARC[i % CARC.length] }); }
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
    for (var bx = -10; bx <= 12; bx++) for (var by = -10; by <= 12; by++) {
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
    fill.forEach(function (b) { items.push([b.key, function () { g.drawImage(b.spr, b.sx, b.sy); if (b.scr || b.zip) screens(b, t); }]); });
    crowd.forEach(function (w) { var q = crowdPos(w, t), sp = P(q[0], q[1]); if (onScreen(sp, 30)) items.push([q[0] + q[1] + .3, function () { drawPerson(sp[0], sp[1] + 2, w.cl, w.k, q[2], q[3]); }]); });
    B.forEach(function (b) { items.push([b.key, function () { (b.draw || box)(b, t); }]); });
    TREES.forEach(function (q) { items.push([q[0] + q[1], function () { tree(q[0], q[1]); }]); });
    otrees.forEach(function (q) { items.push([q[0] + q[1], function () { tree(q[0], q[1], q[2]); }]); });
    lamps.forEach(function (l) { items.push([l[0] + l[1] + .05, function () { lamp(l[0], l[1]); }]); });
    cars.forEach(function (c) { if (!reduce) c.s = -34 + mod(c.s0 + 34 + c.dir * c.v * t / 1000, 80); var b = carBox(c); if (onScreen(P(b.x, b.y), 60)) items.push([b.x + b.w / 2 + b.y + b.d / 2 + .02, function () { drawCar(c); }]); });
    walkers.forEach(function (w) { var x = w.ax ? w.line : w.s, y = w.ax ? w.s : w.line, s = P(x, y); if (onScreen(s, 30)) items.push([x + y + .3, function () { drawPerson(s[0], s[1] + 2, w.cl, w.k, w.ax ? w.dir > 0 : w.dir < 0, reduce ? 0 : ((t / 170 + w.k) | 0) % 4); }]); });
    people.forEach(function (p) { if (!p.path) return; var s = P(p.x, p.y); items.push([p.x + p.y + .3, function () { drawPerson(s[0] + (p.k % 3 - 1) * 3, s[1] + 2, p.cl === 'enfant' ? ['enfant', 'kid2', 'kid3'][p.k % 3] : p.cl, p.k, p.flip, reduce ? 0 : ((t / 170 + p.k) | 0) % 4); }]); });
    items.sort(function (a, b) { return a[0] - b[0]; }).forEach(function (it) { it[1](); });
    if (N) { g.globalCompositeOperation = 'lighter'; g.drawImage(glow, 0, 0); g.globalCompositeOperation = 'source-over'; }
    blimp(t); skyPlane(t);
    g.drawImage(vig, 0, 0);
    var hb = hover && bySpot[hover];
    if (hb && hb.box) {
      var r = hb.box, ph = reduce ? 0 : (t / 90 | 0) % 4;
      for (var x = r[0]; x < r[0] + r[2]; x++) if ((x + ph) % 4 < 2) { R(x, r[1], 1, 1, '#ffd84a'); R(x, r[1] + r[3] - 1, 1, 1, '#ffd84a'); }
      for (var y = r[1]; y < r[1] + r[3]; y++) if ((y + ph) % 4 < 2) { R(r[0], y, 1, 1, '#ffd84a'); R(r[0] + r[2] - 1, y, 1, 1, '#ffd84a'); }
    }
  }
  // carrefour en X façon Shibuya (9,5 ; 9,5) : la foule traverse dans tous les sens, par vagues
  var CR = [[8.85, 8.85], [10.15, 8.85], [10.15, 10.15], [8.85, 10.15]], crowd = [];
  for (var ci = 0; ci < 16; ci++) crowd.push({ a: ci % 4, b: (ci % 4 + 1 + (ci % 3)) % 4, d: hash(ci + 40) * 2.2, k: ci + 3, cl: LOOKS[ci % LOOKS.length], o: [hash(ci) * .3 - .15, hash(ci + 9) * .3 - .15] });
  function crowdPos(w, t) {
    var T0 = reduce ? 0 : t / 1000, cyc = Math.floor(T0 / 14), ph = T0 - cyc * 14, a = CR[cyc % 2 ? w.b : w.a], b = CR[cyc % 2 ? w.a : w.b], k = Math.max(0, Math.min(1, (ph - w.d) / 4.5)), moving = k > 0 && k < 1;
    var x = a[0] + (b[0] - a[0]) * k + w.o[0], y = a[1] + (b[1] - a[1]) * k + w.o[1];
    return [x, y, (b[0] - a[0]) < 0 || (b[1] - a[1]) > 0, moving ? ((T0 * 6 + w.k) | 0) % 4 : 0];
  }
  function blimp(t) { // dirigeable qui traverse le ciel, clin d'œil à Scarface : « THE WORLD IS YOURS »
    var span = W + 320, x = reduce ? W * .72 : (t / 70 + W * .62) % span - 160, y = Math.round(TOPA + 78), body = N ? '#5a5478' : '#d9dce2', sh = N ? '#3d3a5c' : '#a9afb9';
    disc(x, y, 48, sh, .3); disc(x - 2, y - 2, 46, body, .27); R(x - 30, y - 9, 60, 1, N ? '#77749a' : '#f4f4f4');
    R(x + 44, y - 10, 7, 3, sh); R(x + 44, y + 7, 7, 3, sh); R(x + 46, y - 3, 7, 6, sh); R(x - 7, y + 12, 14, 4, '#2b2b30'); R(x - 5, y + 13, 2, 2, N ? '#ffd56b' : '#9ec9f0'); R(x + 1, y + 13, 2, 2, N ? '#ffd56b' : '#9ec9f0');
    var msg = 'THE WORLD IS YOURS', tw = TL(msg); R(x - tw / 2 - 3, y - 5, tw + 6, 9, '#14102a'); // bandeau lumineux
    T(msg, x - tw / 2, y - 3, N ? ((reduce || (t / 400 | 0) % 2) ? '#ffd84a' : '#fff3a0') : '#ffd84a');
    if (N && (t / 500 | 0) % 2) { R(x - 48, y - 1, 2, 2, '#ff3b3b'); R(x + 52, y - 1, 2, 2, '#7dff8a'); }
  }
  function loop(now) { var dt = Math.min(now - last, 200); if (dt > 66) { stepPeople(dt); last = now; draw(now); } requestAnimationFrame(loop); }

  /* ---------- Zones cliquables et étiquettes des rubriques ---------- */
  function placeSpots() {
    B.forEach(function (b) {
      if (b.note) { // repère expliqué par une étiquette (Tour Eiffel, château)
        var cn = corners(b), nt = b.ntag;
        if (!nt) { nt = b.ntag = document.createElement('span'); nt.className = 'tag note'; nt.setAttribute('role', 'note'); nt.innerHTML = '<span class="t1"></span><small></small>'; nt.firstChild.textContent = b.note[0]; nt.lastChild.textContent = b.note[1]; stage.appendChild(nt); }
        nt.style.left = ((cn.w[0] + cn.e[0]) / 2 / W * 100) + '%'; nt.style.top = ((b.below ? cn.s[1] + 4 : cn.n[1] - b.h - (b.extra || 0)) / H * 100) + '%'; nt.classList.toggle('below', !!b.below);
      }
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
  var ptrs = {}, pan = null, pinch = null, dragged = false;
  scroller.addEventListener('wheel', function (e) { e.preventDefault(); zoomAt(e.clientX, e.clientY, Z * Math.exp(-e.deltaY * (e.deltaMode ? .05 : .0015))); }, { passive: false });
  scroller.addEventListener('pointerdown', function (e) {
    ptrs[e.pointerId] = [e.clientX, e.clientY]; var ids = Object.keys(ptrs);
    if (ids.length === 1) { pan = { x: e.clientX, y: e.clientY, tx: TX, ty: TY, moved: false }; dragged = false; }
    else if (ids.length === 2) { var a = ptrs[ids[0]], b = ptrs[ids[1]]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: Z }; pan = null; }
  });
  addEventListener('pointermove', function (e) {
    if (!ptrs[e.pointerId]) return; ptrs[e.pointerId] = [e.clientX, e.clientY]; var ids = Object.keys(ptrs);
    if (pinch && ids.length >= 2) { var a = ptrs[ids[0]], b = ptrs[ids[1]]; zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, pinch.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d); dragged = true; return; }
    if (!pan) return; var dx = e.clientX - pan.x, dy = e.clientY - pan.y;
    if (!pan.moved && Math.hypot(dx, dy) > 6) { pan.moved = dragged = true; scroller.classList.add('dragging'); }
    if (pan.moved) { TX = pan.tx + dx; TY = pan.ty + dy; applyCam(); }
  });
  function up(e) { delete ptrs[e.pointerId]; if (Object.keys(ptrs).length < 2) pinch = null; if (!Object.keys(ptrs).length) { pan = null; scroller.classList.remove('dragging'); } }
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  document.addEventListener('click', function (e) { if (dragged && scroller.contains(e.target)) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true); // un glisser n'ouvre pas de fenêtre
  [['zoomIn', 1.4], ['zoomOut', 1 / 1.4]].forEach(function (q) { var bt = document.getElementById(q[0]); if (bt) bt.addEventListener('click', function () { zoomAt(VW / 2, VH / 2, Z * q[1]); }); });
  var zr = document.getElementById('zoomReset'); if (zr) zr.addEventListener('click', function () { resetCam(); });
  addEventListener('keydown', function (e) {
    if (win.open || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    var k = e.key, st = 80;
    if (k === '+' || k === '=') zoomAt(VW / 2, VH / 2, Z * 1.25); else if (k === '-') zoomAt(VW / 2, VH / 2, Z / 1.25); else if (k === '0') resetCam();
    else if (k === 'ArrowLeft') { TX += st; applyCam(); } else if (k === 'ArrowRight') { TX -= st; applyCam(); } else if (k === 'ArrowUp') { TY += st; applyCam(); } else if (k === 'ArrowDown') { TY -= st; applyCam(); } else return;
    e.preventDefault();
  });
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
    var sc = from && from.dataset && { 'vb-cinema': '.vb-cine', 'vb-mode': '.vb-side.mode', 'vb-defile': '.vb-side.mode', 'vb-club': '.vb-side.son', 'vb-disques': '.vb-albums' }[from.dataset.spot]; if (sc) { var el2 = body.querySelector(sc); if (el2) setTimeout(function () { el2.scrollIntoView({ block: 'start' }); }, 30); }
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
