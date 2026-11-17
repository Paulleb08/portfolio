/* Paul Signe's City (ville.html) : ville en pixel art, vue isométrique (canvas 960×600).
   Chaque bâtiment ouvre une fenêtre interne ; des habitants se déplacent seuls de bâtiment en bâtiment selon leur profil. */
(function () {
  'use strict';
  var W = 960, H = 600, HW = 24, HH = 12, OX = 480, OY = 170, M = 14, ROADS = [4.5, 9.5];
  var cv = document.getElementById('city');
  if (!cv) return;
  var g = cv.getContext('2d');
  cv.width = W; cv.height = H;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, root = document.documentElement, N = false;

  function night() { return root.getAttribute('data-theme') === 'dark'; }
  function R(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function A(a, f) { g.globalAlpha = a; f(); g.globalAlpha = 1; }
  function hash(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function disc(cx, cy, r, c, sy) { sy = sy || 1; for (var dy = -r; dy <= r; dy++) { var w = Math.round(Math.sqrt(r * r - dy * dy)); R(cx - w, cy + dy * sy, 2 * w + 1, Math.max(1, sy), c); } }
  function P(x, y) { return [OX + (x - y) * HW, OY + (x + y) * HH]; }

  // Police pixel 3×5 pour les enseignes
  var F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '7': '111001010010010', '&': '010101010101011', '-': '000000111000000', "'": '010010000000000', ' ': '000000000000000' };
  function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase(); }
  function T(s, x, y, c, k) { k = k || 1; s = norm(s); for (var i = 0; i < s.length; i++) { var gl = F[s[i]] || F[' ']; for (var p = 0; p < 15; p++) if (gl[p] === '1') R(x + (i * 4 + p % 3) * k, y + ((p / 3) | 0) * k, k, k, c); } }
  function TL(s, k) { return s.length * 4 * (k || 1) - (k || 1); }

  /* ---------- Géométrie isométrique ---------- */
  function corners(b) { return { n: P(b.x, b.y), e: P(b.x + b.w, b.y), s: P(b.x + b.w, b.y + b.d), w: P(b.x, b.y + b.d) }; }
  // Faces visibles : gauche (coin ouest → sud) et droite (coin sud → est)
  function faceL(b) { var c = corners(b); return { x: c.w[0], y: c.w[1], dir: 1, len: c.s[0] - c.w[0] }; }
  function faceR(b) { var c = corners(b); return { x: c.s[0], y: c.s[1], dir: -1, len: c.e[0] - c.s[0] }; }
  function fr(f, u, v, ww, hh, c) { for (var i = 0; i < ww; i++) R(f.x + u + i, Math.floor(f.y + f.dir * (u + i) / 2) - v - hh, 1, hh, c); }
  function ftext(f, u, v, s, c) {
    s = norm(s);
    for (var i = 0; i < s.length; i++) { var gl = F[s[i]] || F[' ']; for (var p = 0; p < 15; p++) if (gl[p] === '1') { var gx = i * 4 + p % 3; R(f.x + u + gx, Math.floor(f.y + f.dir * (u + gx) / 2) - v - (5 - ((p / 3) | 0)), 1, 1, c); } }
  }
  function prism(b, h, top, l, r, z) {
    z = z || 0; var c = corners(b), X, yb;
    for (X = c.w[0]; X < c.s[0]; X++) { yb = c.w[1] + (X - c.w[0]) / 2 - z; R(X, yb - h, 1, h, l); }
    for (X = c.s[0]; X < c.e[0]; X++) { yb = c.s[1] - (X - c.s[0]) / 2 - z; R(X, yb - h, 1, h, r); }
    for (X = c.w[0]; X <= c.e[0]; X++) {
      var up = X <= c.n[0] ? c.w[1] - (X - c.w[0]) / 2 : c.n[1] + (X - c.n[0]) / 2, lo = X <= c.s[0] ? c.w[1] + (X - c.w[0]) / 2 : c.s[1] - (X - c.s[0]) / 2;
      R(X, Math.floor(up) - z - h, 1, Math.ceil(lo - up) + 1, top);
    }
    R(c.s[0], c.s[1] - z - h, 1, h, N ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.35)');
  }
  function windows(b, h, k, z, opt) {
    opt = opt || {}; z = z || 0;
    var su = opt.su || 8, sv = opt.sv || 10, ww = opt.ww || 4, wh = opt.wh || 5;
    [faceL(b), faceR(b)].forEach(function (f, side) {
      for (var u = 4; u <= f.len - ww - 3; u += su) for (var v = (opt.v0 || 8); v <= h - wh - 4; v += sv) {
        var r = hash(k * 31 + side * 7 + u * 3 + v), c;
        if (N) c = r > .45 ? (r > .93 ? '#ff7ad9' : r > .82 ? '#5ef2ff' : '#ffd56b') : '#241d44';
        else c = side ? '#8fc3e6' : '#b6dcf5';
        fr(f, u, v + z, ww, wh, c);
      }
    });
  }
  function center(b, h) { var c = corners(b); return [(c.w[0] + c.e[0]) / 2, (c.n[1] + c.s[1]) / 2 - h]; }

  /* ---------- Plan de la ville (cases 14×14, routes sur les lignes 4 et 9) ---------- */
  var PAL = { // couleurs [jour, nuit] : dessus, face gauche, face droite
    glass: [['#bfe3f3', '#7fb8d8', '#5f9cc4'], ['#3a3270', '#2a2458', '#1f1a45']],
    white: [['#f4f4f0', '#dcdcd6', '#bdbdb6'], ['#4a4570', '#38345c', '#2a2748']],
    brick: [['#d9826a', '#b5523d', '#94402f'], ['#6e3446', '#552838', '#421f2c']],
    grey: [['#c9ccd3', '#9aa0ab', '#7c828d'], ['#3d3a5c', '#2f2c4a', '#24223b']],
    dark: [['#3a3448', '#2a2536', '#1e1a28'], ['#1f1832', '#171126', '#100c1c']],
    teal: [['#a8e6d8', '#5fbfa8', '#449e88'], ['#244a5a', '#1b3a48', '#142c37']],
    black: [['#2b2b30', '#1c1c21', '#111114'], ['#1a1626', '#120f1c', '#0b0912']]
  };
  function pal(n) { return PAL[n][N ? 1 : 0]; }
  var B = [ // doc = fenêtre ouverte ; h = hauteur en pixels
    { x: 0, y: 0, w: 2, d: 2, h: 104, k: 'teal', id: 'g1' },
    { x: 2, y: 0, w: 2, d: 2, h: 150, k: 'glass', doc: 'competences', draw: tower },
    { x: 0, y: 3, w: 1, d: 1, h: 26, k: 'grey', doc: 'contact', draw: radio, extra: 96 },
    { x: 5, y: 0, w: 2, d: 2, h: 96, k: 'white', doc: 'cv', draw: billboard, extra: 44 },
    { x: 7, y: 0, w: 2, d: 2, h: 70, k: 'dark', doc: 'hifi', draw: club, extra: 18 },
    { x: 5, y: 2, w: 2, d: 2, h: 62, k: 'glass', id: 'g2' },
    { x: 7, y: 2, w: 2, d: 2, h: 44, k: 'white', id: 'g3' },
    { x: 10, y: 1, w: 3, d: 3, h: 60, k: 'brick', doc: 'a-propos', draw: school, extra: 14 },
    { x: 13, y: 0, w: 1, d: 3, h: 86, k: 'glass', id: 'g4' },
    { x: 1, y: 5, w: 3, d: 3, h: 42, k: 'grey', doc: 'la-poste', draw: factory, extra: 40 },
    { x: 5, y: 5, w: 4, d: 4, h: 0, doc: 'animation', draw: park, extra: 26 },
    { x: 10, y: 5, w: 3, d: 2, h: 46, k: 'white', doc: 'annexes', draw: archives, extra: 6 },
    { x: 13, y: 5, w: 1, d: 3, h: 58, k: 'teal', id: 'g5' },
    { x: 1, y: 10, w: 3, d: 2, h: 32, k: 'grey', doc: 'projets', draw: fablab, extra: 14 },
    { x: 5, y: 10, w: 3, d: 2, h: 44, k: 'black', doc: 'mode', draw: couture, extra: 22 },
    { x: 10, y: 10, w: 2, d: 2, h: 30, k: 'brick', doc: 'garde', draw: house, extra: 12 },
    { x: 12, y: 10, w: 2, d: 2, h: 40, k: 'white', id: 'g6' },
    { x: 8, y: 12, w: 1, d: 1, h: 6, doc: 'plan', draw: metro, extra: 14 }
  ];
  var TREES = [[0.5, 8.5], [2.5, 8.6], [3.5, 3.5], [11.5, 7.6], [10.5, 8.5], [12.6, 8.5], [0.5, 12.6], [2, 12.8], [3.5, 12.6], [5.5, 12.8], [6.8, 12.6], [10.5, 12.8], [12.5, 12.7], [13.5, 13.4]];
  B.forEach(function (b) { b.key = b.x + b.w / 2 + b.y + b.d / 2; b.door = door(b); });
  function door(b) {
    if (b.x + b.w === 4 || b.x + b.w === 9) return [b.x + b.w + .5, b.y + b.d / 2];
    if (b.y + b.d === 4 || b.y + b.d === 9) return [b.x + b.w / 2, b.y + b.d + .5];
    if (b.x === 5 || b.x === 10) return [b.x - .5, b.y + b.d / 2];
    if (b.y === 5 || b.y === 10) return [b.x + b.w / 2, b.y - .5];
    return null;
  }
  var byDoc = {}; B.forEach(function (b) { if (b.doc) byDoc[b.doc] = b; });

  /* ---------- Fond fixe : ciel, skyline lointaine, dalle de la ville ---------- */
  var bg = document.createElement('canvas'), bgN = null; bg.width = W; bg.height = H;
  var SKY = { n: ['#07041c', '#0b0626', '#120a33', '#1a0d40', '#24104d', '#31145a', '#401866', '#521d70', '#682374', '#7f2a74', '#9a3270', '#b53c6a'], d: ['#2f6cc4', '#3878cc', '#4384d4', '#4f90dc', '#5c9ce3', '#6aa8e9', '#79b4ee', '#89c0f2', '#9acbf5', '#acd6f8', '#bfe0fa', '#d3e9fb'] };
  function tile(i, j, c) { var n = P(i, j); for (var X = n[0] - HW; X < n[0] + HW; X++) { var hh = HH - Math.abs(X + .5 - n[0]) / 2; R(X, n[1] + HH - hh, 1, hh * 2, c); } }
  function isRoad(i, j) { return i === 4 || i === 9 || j === 4 || j === 9; }
  function buildBg() {
    var main = g; g = bg.getContext('2d');
    var sky = N ? SKY.n : SKY.d, bh = 30, x, k;
    sky.forEach(function (c, k) { R(0, k * bh, W, bh, c); if (k) for (var xx = 0; xx < W; xx += 2) { R(xx + (k % 2), k * bh, 1, 1, sky[k - 1]); if (xx % 4 === 0) R(xx + 1, k * bh + 1, 1, 1, sky[k - 1]); } });
    R(0, sky.length * bh, W, H, sky[sky.length - 1]);
    if (N) { disc(840, 70, 22, '#f6edd0'); disc(832, 64, 3, '#e3d6b0'); disc(848, 78, 2, '#e3d6b0'); for (k = 0; k < 110; k++) { var sx = hash(k) * W, sy = hash(k + 99) * 260; R(sx, sy, 1, 1, k % 9 ? '#ffffff' : '#ff9ae6'); if (k % 13 === 0) { R(sx - 1, sy, 3, 1, '#c9b8ff'); R(sx, sy - 1, 1, 3, '#c9b8ff'); } } }
    else { A(.35, function () { disc(840, 70, 30, '#fff1a8'); }); disc(840, 70, 21, '#ffd84a'); disc(836, 66, 12, '#ffe57a'); }
    [[N ? '#1f1647' : '#a8bfe2', 300, 1.6], [N ? '#150f35' : '#8ea9d4', 340, 1.2]].forEach(function (L, li) { // deux couches de gratte-ciel lointains
      for (x = 0; x < W;) {
        var w = 16 + (hash(x + li * 50) * 30 | 0), h = 50 + (hash(x * 3 + li) * 150 | 0) / L[2]; R(x, L[1] - h, w, h + 200, L[0]);
        if (hash(x + 7) > .7) R(x + w / 2 - 1, L[1] - h - 14, 2, 14, L[0]);
        for (var yy = L[1] - h + 5; yy < L[1] + 40; yy += 7) for (var xx = x + 3; xx < x + w - 3; xx += 5) if (hash(xx * 13 + yy + li) > (N ? .7 : .6)) R(xx, yy, 2, 3, N ? (hash(xx + yy) > .8 ? '#5ef2ff' : '#ffd56b') : '#c3d4ee');
        x += w + 1;
      }
    });
    var c0 = P(0, M), c1 = P(M, M), c2 = P(M, 0);
    for (x = c0[0]; x < c1[0]; x++) R(x, c0[1] + (x - c0[0]) / 2, 1, 18, N ? '#2a1d4a' : '#8a5a3c'); // épaisseur de la dalle
    for (x = c1[0]; x < c2[0]; x++) R(x, c1[1] - (x - c1[0]) / 2, 1, 18, N ? '#1d1436' : '#6e4630');
    for (var i = 0; i < M; i++) for (var j = 0; j < M; j++) {
      if (isRoad(i, j)) tile(i, j, N ? '#1d1b33' : '#5b6170');
      else if (i >= 5 && i <= 8 && j >= 5 && j <= 8) tile(i, j, (i + j) % 2 ? (N ? '#1f4a3a' : '#79cf6a') : (N ? '#1b4234' : '#6cc45e'));
      else tile(i, j, (i + j) % 2 ? (N ? '#2a2846' : '#d7d9de') : (N ? '#26243f' : '#cfd2d8'));
    }
    for (k = 0; k < M; k++) ROADS.forEach(function (r) { // marquage au sol
      if (k === 4 || k === 9) return;
      var a = P(k + .5, r), b = P(r, k + .5);
      for (var q = -4; q <= 4; q++) { R(a[0] + q, a[1] + q / 2, 1, 1, '#e8c547'); R(b[0] + q, b[1] - q / 2, 1, 1, '#e8c547'); }
    });
    if (N) ROADS.forEach(function (r) { ROADS.forEach(function (s) { var p = P(r, s); A(.18, function () { disc(p[0], p[1], 34, '#ff4fd8', .5); }); A(.12, function () { disc(p[0], p[1], 60, '#7a3cff', .5); }); }); });
    g = main; bgN = N;
  }

  /* ---------- Bâtiments remarquables ---------- */
  function box(b) { var p = pal(b.k); prism(b, b.h, p[0], p[1], p[2]); windows(b, b.h, b.x * 17 + b.y); }
  function tower(b, t) {
    var p = pal(b.k), t2 = { x: b.x + .35, y: b.y + .35, w: 1.3, d: 1.3 }, t3 = { x: b.x + .65, y: b.y + .65, w: .7, d: .7 };
    prism(b, b.h, p[0], p[1], p[2]); windows(b, b.h, 3, 0, { su: 6, sv: 8, ww: 3, wh: 5 });
    prism(t2, 34, p[0], p[1], p[2], b.h); windows(t2, 34, 4, b.h, { su: 6, sv: 8, ww: 3, wh: 4 });
    prism(t3, 18, p[0], p[1], p[2], b.h + 34);
    var c = center(t3, b.h + 52); R(c[0], c[1] - 26, 1, 26, '#d0d4dc'); if (reduce || (t / 700 | 0) % 2) R(c[0] - 1, c[1] - 29, 3, 3, '#ff3b3b');
    var f = faceR(b); fr(f, 2, 8, 46, 9, '#1b2fbf'); ftext(f, 3, 10, 'COMPETENCES', '#ffffff');
  }
  function radio(b, t) {
    box(b); var c = center(b, b.h), top = c[1] - 92;
    for (var y = top; y < c[1]; y++) { var lw = 1 + ((y - top) / 92 * 7 | 0), col = ((y / 9) | 0) % 2 ? '#e8e8ee' : '#d23b3b'; R(c[0] - lw, y, 1, 1, col); R(c[0] + lw, y, 1, 1, col); if ((y - top) % 10 === 0) R(c[0] - lw, y, lw * 2 + 1, 1, col); }
    if (reduce || (t / 600 | 0) % 2) R(c[0] - 1, top - 3, 3, 3, '#ff3b3b');
    if (!reduce) for (var j = 0; j < 3; j++) { var ph = (t / 1400 + j / 3) % 1, r = 4 + ph * 18; A(1 - ph, function () { for (var a = -.9; a <= .9; a += .1) { R(c[0] + Math.cos(a) * r, top + Math.sin(a) * r, 1, 1, '#fff'); R(c[0] - Math.cos(a) * r, top + Math.sin(a) * r, 1, 1, '#fff'); } }); }
    var f = faceR(b); fr(f, 1, 9, 22, 8, '#f4f1ea'); ftext(f, 2, 10, 'RADIO', '#c62828');
  }
  function billboard(b, t) {
    box(b); var c = center(b, b.h), bw = 60, bh = 30, x = c[0] - bw / 2, y = c[1] - bh - 12;
    R(c[0] - 14, y + bh, 2, 14, '#444'); R(c[0] + 12, y + bh, 2, 14, '#444');
    R(x, y, bw, bh, '#111'); R(x + 2, y + 2, bw - 4, bh - 4, '#f7f2e6');
    T('PAUL SIGNE', x + (bw - TL('PAUL SIGNE')) / 2, y + 5, '#1b2fbf'); T('CV', x + (bw - TL('CV', 2)) / 2, y + 14, '#d62828', 2);
    if (N) A(.25, function () { R(x - 4, y - 4, bw + 8, bh + 8, '#fff6c8'); });
  }
  function club(b, t) {
    var p = pal(b.k), on = reduce || hash(t / 180 | 0) > .08, beat = reduce ? 0 : (t / 250 | 0) % 2;
    prism(b, b.h, p[0], p[1], p[2]);
    var L = faceL(b), Rf = faceR(b), cols = ['#ff4fd8', '#3ef0ff', '#ffe14f', '#7dff8a'];
    for (var u = 4; u < L.len - 6; u += 8) fr(L, u, 30, 5, 30, cols[((u / 8 | 0) + (reduce ? 0 : t / 300 | 0)) % 4]); // baies de la piste de danse
    for (u = 6; u < L.len - 8; u += 10) { var up = reduce ? 0 : (Math.sin(t / 160 + u) > 0 ? 1 : 0); fr(L, u + 1, 33 + up, 2, 6, '#120c1f'); } // danseurs en ombre chinoise
    fr(Rf, 3, 46, 42, 11, '#120c1f'); ftext(Rf, 5, 49, 'CLUB', on ? '#ff4fd8' : '#5a2a55'); ftext(Rf, 25, 49, 'NIGHT', on ? '#3ef0ff' : '#21505a');
    fr(L, 3, 4, 40, 18, '#1d5a63'); ftext(L, 6, 14, 'VINYL', '#3ef0ff');
    for (var k = 0; k < 3; k++) { var X = L.x + 28 + k * 5, Y = Math.floor(L.y + (28 + k * 5) / 2) - 8; disc(X, Y, 2, '#111'); R(X, Y, 1, 1, cols[k]); }
    fr(Rf, 24, 0, 8, 14, on ? '#ff4fd8' : '#3b1d3a');
    var c = center(b, b.h); // projecteurs et enceintes sur le toit
    if (N || !reduce) cols.slice(0, 3).forEach(function (col, i) { var a = -Math.PI / 2 + Math.sin(t / 800 + i * 2) * .5; A(.4, function () { for (var l = 3; l < 46; l++) R(c[0] + Math.cos(a) * l, c[1] + Math.sin(a) * l, 2, 1, col); }); });
    R(c[0] - 12, c[1] - 6, 5, 7, '#0a0a0a'); R(c[0] + 7, c[1] - 6, 5, 7, '#0a0a0a'); disc(c[0] - 10, c[1] - 3, 1 + beat, '#666'); disc(c[0] + 9, c[1] - 3, 1 + beat, '#666');
    if (!reduce) for (var j = 0; j < 3; j++) { var ph = (t / 2600 + j / 3) % 1, nx = c[0] - 16 + j * 14 + Math.sin(ph * 6) * 3, ny = c[1] - 10 - ph * 34; A(1 - ph, function () { R(nx, ny, 1, 5, '#ffe14f'); R(nx - 2, ny + 4, 3, 2, '#ffe14f'); R(nx + 1, ny, 2, 1, '#ffe14f'); }); }
  }
  function school(b, t) {
    box(b); var L = faceL(b), Rf = faceR(b), c = center(b, b.h);
    for (var v = 2; v < b.h - 2; v += 4) for (var u = (v / 4) % 2 ? 1 : 4; u < L.len; u += 6) fr(L, u, v, 2, 1, '#83352a');
    fr(L, 4, b.h - 13, 64, 10, '#f7f2e6'); ftext(L, 6, b.h - 11, 'ARTS ET METIERS', '#1b2fbf');
    for (var k = 0; k < 4; k++) { // élèves derrière les fenêtres
      var u2 = 8 + k * 16; fr(Rf, u2, 26, 9, 9, N ? '#ffe3a3' : '#d4e8fb'); fr(Rf, u2 + 2, 28, 2, 2, ['#3b2a1a', '#d9a066', '#6b4423', '#2b1d14'][k]); fr(Rf, u2 + 2, 26, 3, 2, ['#c0392b', '#2e86de', '#27ae60', '#8e44ad'][k]);
      if (!reduce && (t / 700 + k) % 3 < 1) fr(Rf, u2 + 5, 31, 1, 3, '#d9a066');
    }
    fr(Rf, 30, 0, 10, 14, '#3b2a22');
    var wv = reduce ? 0 : (t / 300 | 0) % 2; R(c[0] + 20, c[1] - 22, 1, 22, '#ddd'); R(c[0] + 21, c[1] - 22, 3, 5 - wv, '#1b2fbf'); R(c[0] + 24, c[1] - 22, 3, 5, '#fff'); R(c[0] + 27, c[1] - 22 + wv, 3, 5 - wv, '#d62828');
  }
  function smoke(x, y, t, off) { for (var i = 0; i < 5; i++) { var ph = reduce ? i / 5 : (t / 2200 + off + i / 5) % 1, s = 2 + ph * 7; A(.85 * (1 - ph), function () { R(x + ph * 16 - s / 2, y - ph * 44 - s / 2, s, s, N ? '#8d86a3' : '#f2f2f6'); }); } }
  function factory(b, t) {
    box(b); var Rf = faceR(b), L = faceL(b), p = pal(b.k);
    for (var k = 0; k < 3; k++) prism({ x: b.x + .3 + k * .9, y: b.y + .2, w: .6, d: 2.6 }, 8, p[1], N ? '#ffd56b' : '#9ec3e6', p[2], b.h); // toits en sheds
    [[b.x + 2.4, b.y + .4, 40], [b.x + 2.4, b.y + 1.2, 30]].forEach(function (q, i) { var cc = { x: q[0], y: q[1], w: .4, d: .4 }; prism(cc, q[2], '#6d3a2c', '#8a4b3a', '#6d3a2c', b.h); var cp = center(cc, b.h + q[2]); smoke(cp[0], cp[1] - 2, t, i * .5); });
    fr(Rf, 6, 22, 62, 14, '#ffcd00'); ftext(Rf, 16, 26, 'LA POSTE', '#003da5');
    fr(L, 6, 6, 60, 10, N ? '#ffe29a' : '#cfe3f5'); for (var j = 0; j < 7; j++) fr(L, 6 + ((t / 30 + j * 9) % 56 | 0), 7, 3, 2, j % 3 ? '#fff' : '#ffcd00'); // plis sur le convoyeur
    var truck = { x: b.x + b.w + .1, y: b.y + 2.2, w: .7, d: .35 }; prism(truck, 9, '#ffcd00', '#e6b800', '#c99f00');
  }
  function park(b, t) {
    var c = center(b, 0), cols = ['#e63946', '#f4a261', '#ffd60a', '#2a9d8f', '#4361ee', '#9b5de5'], ry = reduce ? 9 : 7 + Math.round(3 * Math.sin(t / 380));
    for (var dy = -ry; dy <= 0; dy++) { var hw = Math.round(30 * Math.sqrt(1 - (dy / ry) * (dy / ry))); for (var xx = -hw; xx < hw; xx++) R(c[0] + xx, c[1] + 4 + dy, 1, 1, cols[((xx + 30) / 10 | 0) % 6]); }
    for (var k = 0; k < 8; k++) { var a = k / 8 * Math.PI * 2, kx = c[0] + Math.cos(a) * 36, ky = c[1] + 4 + Math.sin(a) * 18; person(kx, ky, KID[k % KID.length], t, k, k % 2, reduce ? 0 : ((t / 250 + k) % 2 < 1 ? 1 : 0)); }
    R(c[0] + 52, c[1] - 14, 1, 14, '#6b4423'); R(c[0] + 46, c[1] - 22, TL('PARC') + 4, 8, '#2e7d32'); T('PARC', c[0] + 48, c[1] - 20, '#fff');
  }
  function archives(b, t) {
    var p = pal(b.k), L = faceL(b), Rf = faceR(b); prism(b, b.h, p[0], p[1], p[2]);
    [L, Rf].forEach(function (f) { R(0, 0, 0, 0, ''); for (var u = 2; u < f.len - 2; u += 8) { fr(f, u, 4, 4, b.h - 16, N ? '#6a6488' : '#ffffff'); fr(f, u + 4, 6, 4, b.h - 18, N ? '#3a2e24' : '#6d5b49'); for (var v = 8; v < b.h - 14; v += 6) fr(f, u + 4, v, 4, 4, ['#c0392b', '#2e86de', '#27ae60', '#f39c12'][(u + v) % 4]); } });
    fr(L, 4, b.h - 10, 64, 8, N ? '#4a4660' : '#bdb4a0'); ftext(L, 18, b.h - 9, 'ARCHIVES', N ? '#ffd56b' : '#5a4a3a');
  }
  function fablab(b, t) {
    box(b); var L = faceL(b), Rf = faceR(b), c = center(b, b.h);
    fr(L, 8, 0, 30, 18, N ? '#f0c879' : '#e1dacb'); fr(L, 8, 14, 30, 4, '#8d94a1');
    fr(L, 12, 2, 10, 4, '#4d5a6a'); fr(L, 12, 6, 3, 5, '#3d6a8a'); fr(L, 15 + (reduce ? 0 : (t / 90 | 0) % 2), 7, 6, 2, '#d9dde3'); // tour
    fr(L, 28, 2, 7, 9, '#2a2a2a'); fr(L, 29, 3, 5, 2 + (reduce ? 2 : (t / 900 | 0) % 4), '#ff7a1a'); // imprimante 3D
    fr(Rf, 6, 18, 30, 9, '#ff7a1a'); ftext(Rf, 9, 20, 'FABLAB', '#fff');
    var rot = reduce ? 0 : t / 800; disc(c[0], c[1] - 8, 4, '#9aa1ad'); disc(c[0], c[1] - 8, 1, '#383d48');
    for (var k = 0; k < 8; k++) { var a = k * Math.PI / 4 + rot; R(c[0] + Math.cos(a) * 5.5 - 1, c[1] - 8 + Math.sin(a) * 5.5 - 1, 2, 2, '#9aa1ad'); }
  }
  function couture(b, t) {
    var p = pal(b.k), gold = '#d4af37', L = faceL(b), Rf = faceR(b); prism(b, b.h, p[0], p[1], p[2]);
    fr(L, 0, b.h - 2, L.len, 2, gold); fr(Rf, 0, b.h - 2, Rf.len, 2, gold);
    fr(L, 8, 28, 56, 9, '#111'); ftext(L, 18, 30, 'COUTURE', gold);
    for (var k = 0; k < 3; k++) { var u = 8 + k * 20; fr(L, u, 4, 14, 20, '#f6ead3'); fr(L, u + 6, 16, 2, 2, '#e9d3b8'); fr(L, u + 5, 8, 4, 8, ['#c0182e', gold, '#1d1d1d'][k]); fr(L, u + 6, 5, 2, 3, '#999'); }
    for (k = 0; k < Rf.len / 4; k++) fr(Rf, k * 4, 24, 4, 3, k % 2 ? '#fff' : '#111');
    fr(Rf, 14, 0, 12, 20, '#2b2a33');
    var a = P(b.x + .4, b.y + b.d / 2), e = P(b.x + b.w - .4, b.y + b.d / 2); // podium du défilé sur le toit
    for (var s = 0; s <= 1; s += .01) R(a[0] + (e[0] - a[0]) * s - 1, a[1] + (e[1] - a[1]) * s - b.h - 1, 3, 2, '#f5f5f5');
    var m = reduce ? .5 : .5 - .5 * Math.cos(t / 2600), mx = a[0] + (e[0] - a[0]) * m, my = a[1] + (e[1] - a[1]) * m - b.h;
    if (N) A(.25, function () { disc(mx, my - 8, 10, '#fff6c8'); });
    person(mx, my, MODEL, t, 1, Math.sin(t / 2600) < 0, reduce ? 0 : (t / 180 | 0) % 2);
    if (!reduce && hash(t / 400 | 0) > .7) R(e[0] - 4, e[1] - b.h - 10, 2, 2, '#fff');
  }
  function house(b, t) {
    box(b); var L = faceL(b), Rf = faceR(b), c = center(b, b.h);
    prism({ x: b.x + .1, y: b.y + .1, w: b.w - .2, d: b.d - .2 }, 6, N ? '#7a2e3a' : '#c0392b', N ? '#5a2230' : '#a33025', N ? '#461a26' : '#8a281f', b.h);
    fr(L, 10, 10, 18, 14, '#fff3d6'); [['#e63946', 0, 0], ['#4361ee', 9, 0], ['#2a9d8f', 0, 7], ['#ffd60a', 9, 7]].forEach(function (q) { fr(L, 11 + q[1], 11 + q[2], 6, 5, q[0]); }); // pictogrammes
    fr(Rf, 8, 0, 8, 14, '#2b1a12');
    var hx = c[0] - 2, hy = c[1] - 16; [[1, 0, 2], [4, 0, 2], [0, 1, 7], [0, 2, 7], [1, 3, 5], [2, 4, 3], [3, 5, 1]].forEach(function (q) { R(hx + q[0], hy + q[1], q[2], 1, '#ff5c8a'); });
  }
  function metro(b, t) {
    var c = center(b, 0), gl = N || reduce || (t / 900 | 0) % 2 ? '#7dff8a' : '#4fd15e';
    R(c[0] - 14, c[1] - 6, 28, 8, '#151515'); R(c[0] - 15, c[1] - 7, 30, 2, '#1f6b3a'); R(c[0] - 15, c[1] - 7, 2, 9, '#1f6b3a'); R(c[0] + 13, c[1] - 7, 2, 9, '#1f6b3a');
    disc(c[0] - 14, c[1] - 11, 2, gl); disc(c[0] + 14, c[1] - 11, 2, gl); if (N) A(.25, function () { disc(c[0], c[1] - 8, 14, gl, .6); });
    R(c[0] - 10, c[1] - 17, 20, 8, '#111'); T('PLAN', c[0] - 7, c[1] - 15, '#fff');
  }
  function tree(x, y) { var p = P(x, y); R(p[0] - 1, p[1] - 10, 2, 10, '#6b4423'); disc(p[0], p[1] - 15, 7, N ? '#1e5631' : '#2e8b57'); disc(p[0] - 2, p[1] - 17, 4, N ? '#2a6b3f' : '#3cb371'); R(p[0] + 2, p[1] - 19, 2, 2, N ? '#3a8a52' : '#7fe08f'); }

  /* ---------- Habitants : chacun va de bâtiment en bâtiment selon son profil ---------- */
  var SKIN = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
  var CLASSES = {
    corporate: { n: 5, v: .55, go: ['competences', 'cv', 'annexes', 'hifi', 'contact'], o: { hair: '#2b1d14', top: '#1f3a5f', sh: '#152a46', bot: '#1a2d4a', shoe: '#4a2c1a', shirt: '#e8eef5', tie: '#b3202f', bag: '#6b3e1f' } },
    etudiant: { n: 5, v: .7, go: ['a-propos', 'projets', 'hifi', 'animation', 'annexes'], o: { hair: '#6b4423', top: '#e76f51', sh: '#b9553d', bot: '#3a5a8c', shoe: '#eeeeee', pack: '#2a9d8f' } },
    enfant: { n: 5, v: .75, kid: 1, go: ['a-propos', 'animation', 'garde'], o: { hair: '#3b2a1a', top: '#ffd60a', sh: '#d4ad00', bot: '#4361ee', shoe: '#e63946', cap: '#e63946' } },
    commercant: { n: 3, v: .5, go: ['mode', 'hifi', 'animation'], o: { hair: '#111111', top: '#f1faee', sh: '#cdd5cc', bot: '#333333', shoe: '#222222', apron: '#2a9d8f' } },
    facteur: { n: 2, v: .6, go: ['la-poste', 'garde', 'a-propos', 'annexes', 'competences'], o: { hair: '#4a3020', top: '#ffcd00', sh: '#d9ae00', bot: '#003da5', shoe: '#222222', cap: '#003da5', bag: '#003da5' } },
    ouvrier: { n: 3, v: .55, go: ['la-poste', 'projets'], o: { hair: '#222222', top: '#ff8c1a', sh: '#d96f00', bot: '#2e4057', shoe: '#3a2a1a', helmet: '#ffd60a' } },
    mode: { n: 3, v: .6, go: ['mode', 'hifi', 'competences'], o: { hair: '#c9a227', top: '#111111', sh: '#000000', bot: '#111111', shoe: '#b3202f', coat: 1, bag: '#d4af37' } }
  };
  var KID = [{ hair: '#3b2a1a', top: '#ffd60a', sh: '#d4ad00', bot: '#4361ee', shoe: '#e63946', kid: 1, cap: '#e63946' }, { hair: '#8d5524', top: '#e63946', sh: '#b52a35', bot: '#2a9d8f', shoe: '#ffffff', kid: 1 }, { hair: '#111111', top: '#4361ee', sh: '#3350c4', bot: '#ffd60a', shoe: '#222222', kid: 1 }];
  var MODEL = { hair: '#2b1a0e', top: '#ff2e88', sh: '#c41f68', bot: '#ff2e88', shoe: '#111111', dress: 1 };

  // Personnage en pixels (pieds au point x,y) : 7×16 pour un adulte, plus petit pour un enfant
  function person(x, y, o, t, k, flip, step) {
    x = Math.round(x); y = Math.round(y); var s = SKIN[k % SKIN.length], d = flip ? -1 : 1;
    if (o.kid) {
      R(x - 1, y - 11, 3, 2, o.cap || o.hair); if (o.cap) R(x + (flip ? -2 : 2), y - 10, 1, 1, o.cap);
      R(x - 1, y - 9, 3, 3, s); R(x + d, y - 8, 1, 1, '#1a1a2e');
      R(x - 2, y - 6, 5, 3, o.top); R(x + 1, y - 6, 1, 3, o.sh);
      R(x - 1, y - 3, 1, 2 + (step ? 1 : 0), o.bot); R(x + 1, y - 3, 1, 3 - (step ? 1 : 0), o.bot); R(x - 1, y - 1, 1, 1, o.shoe); R(x + 1, y - 1, 1, 1, o.shoe);
      return;
    }
    if (o.helmet) R(x - 3, y - 17, 7, 2, o.helmet); else R(x - 2, y - 16, 5, 2, o.hair);
    if (o.cap) { R(x - 2, y - 17, 5, 2, o.cap); R(x + d * 2, y - 15, 2, 1, o.cap); }
    R(x - 2, y - 14, 5, 3, s); R(x + d, y - 13, 1, 1, '#1a1a2e'); R(x - 2 + (flip ? 4 : 0), y - 15, 1, 2, o.hair);
    R(x - 1, y - 11, 3, 1, s);
    var tall = o.coat || o.dress ? 7 : 5;
    R(x - 3, y - 10, 7, tall, o.top); R(x + 2, y - 10, 1, tall, o.sh);
    if (o.shirt) { R(x - 1, y - 10, 3, 3, o.shirt); R(x, y - 10, 1, 4, o.tie); }
    if (o.apron) R(x - 2, y - 9, 5, 5, o.apron);
    if (o.top === '#ff8c1a') { R(x - 3, y - 7, 7, 1, '#e8f0e8'); }
    var sw = step ? 1 : 0; R(x - 3, y - 6 + sw, 1, 2, s); R(x + 3, y - 6 - sw + 1, 1, 2, s); // mains
    if (o.bag) R(x + (flip ? -5 : 4), y - 6, 2, 3, o.bag);
    if (o.pack) R(x + (flip ? 3 : -4), y - 10, 2, 5, o.pack);
    var ly = y - 5 + (tall - 5);
    if (o.dress) { R(x - 1, ly, 1, y - ly - 1, s); R(x + 1, ly, 1, y - ly - 1, s); }
    else { R(x - 2, ly, 2, (y - ly - 1) - (step ? 0 : 1), o.bot); R(x + 1, ly, 2, (y - ly - 1) - (step ? 1 : 0), o.bot); }
    R(x - 2, y - 1, 2, 1, o.shoe); R(x + 1, y - 1, 2, 1, o.shoe);
  }

  function route(a, b) { // déplacement par les routes (lignes x ou y = 4,5 et 9,5)
    var aV = ROADS.indexOf(a[0]) > -1, bV = ROADS.indexOf(b[0]) > -1, pts = [a];
    function near(v) { return Math.abs(v - 4.5) < Math.abs(v - 9.5) ? 4.5 : 9.5; }
    if (aV && bV) { if (a[0] !== b[0]) { var r = near((a[1] + b[1]) / 2); pts.push([a[0], r], [b[0], r]); } }
    else if (!aV && !bV) { if (a[1] !== b[1]) { var q = near((a[0] + b[0]) / 2); pts.push([q, a[1]], [q, b[1]]); } }
    else if (aV) pts.push([a[0], b[1]]); else pts.push([b[0], a[1]]);
    pts.push(b); return pts;
  }
  var people = [], seedK = 0;
  Object.keys(CLASSES).forEach(function (cl) {
    var C = CLASSES[cl];
    for (var i = 0; i < C.n; i++) { var at = C.go[(i + seedK) % C.go.length], d = byDoc[at].door; people.push({ c: C, at: at, x: d[0], y: d[1], path: null, wait: 500 + hash(seedK * 7) * 8000, k: seedK++, flip: false }); }
  });
  function nextStop(p) {
    var go = p.c.go.filter(function (x) { return x !== p.at; });
    if (N && (p.c === CLASSES.corporate || p.c === CLASSES.etudiant || p.c === CLASSES.mode) && Math.random() < .5) return 'hifi'; // la nuit, direction le club
    return go[Math.floor(Math.random() * go.length)];
  }
  function stepPeople(dt) {
    people.forEach(function (p) {
      if (!p.path) { p.wait -= dt; if (p.wait > 0) return; var to = nextStop(p); if (to === p.at) { p.wait = 2000; return; } p.path = route(byDoc[p.at].door, byDoc[to].door); p.to = to; p.i = 1; return; }
      var tg = p.path[p.i], dx = tg[0] - p.x, dy = tg[1] - p.y, dist = Math.hypot(dx, dy), mv = p.c.v * dt / 1000;
      if (dist > .01) p.flip = (dx < 0 && Math.abs(dx) > Math.abs(dy)) || (dy > 0 && Math.abs(dy) >= Math.abs(dx));
      if (dist <= mv) { p.x = tg[0]; p.y = tg[1]; p.i++; if (p.i >= p.path.length) { p.path = null; p.at = p.to; p.wait = 2500 + Math.random() * 7000; } }
      else { p.x += dx / dist * mv; p.y += dy / dist * mv; }
    });
  }
  var cars = [[4.5, 0, 0, 1, '#f2c230'], [9.5, 6, 0, -1, '#f2c230'], [3, 4.5, 1, 0, '#e63946'], [11, 9.5, -1, 0, '#4361ee'], [7, 9.5, 1, 0, '#f2c230']];
  function drawCar(c, t) {
    var s = reduce ? 0 : t / 1000 * .9, x = c[0], y = c[1];
    if (c[2]) x = ((c[0] + c[2] * s) % M + M) % M; else y = ((c[1] + c[3] * s) % M + M) % M;
    var off = c[2] ? (c[2] > 0 ? .18 : -.18) : (c[3] > 0 ? -.18 : .18), b = c[2] ? { x: x - .35, y: y + off - .18, w: .7, d: .36 } : { x: x + off - .18, y: y - .35, w: .36, d: .7 };
    prism(b, 5, c[4], c[4], c[4]); var cc = center(b, 5); R(cc[0] - 3, cc[1] - 3, 6, 3, '#9ec9f0');
    if (N) A(.3, function () { disc(cc[0], cc[1] + 4, 7, '#fff3a0', .5); });
    return [b.x + b.w / 2 + b.y + b.d / 2, b];
  }

  /* ---------- Image complète ---------- */
  var hover = null, last = 0;
  function draw(t) {
    N = night(); if (bgN !== N) buildBg();
    g.drawImage(bg, 0, 0);
    var items = [];
    B.forEach(function (b) { items.push([b.key, function () { (b.draw || box)(b, t); }]); });
    TREES.forEach(function (q) { items.push([q[0] + q[1], function () { tree(q[0], q[1]); }]); });
    cars.forEach(function (c) { var r = null; items.push([c[0] + c[1] + .01, function () { drawCar(c, t); }]); });
    people.forEach(function (p) { if (!p.path) return; var s = P(p.x, p.y); items.push([p.x + p.y + .3, function () { person(s[0] + (p.k % 3 - 1) * 3, s[1] + 2, p.c.kid ? Object.assign({ kid: 1 }, p.c.o) : p.c.o, t, p.k, p.flip, reduce ? 0 : ((t / 170 + p.k) | 0) % 2); }]); });
    items.sort(function (a, b) { return a[0] - b[0]; }).forEach(function (it) { it[1](); });
    if (hover && byDoc[hover]) {
      var r = byDoc[hover].box, ph = reduce ? 0 : (t / 90 | 0) % 4;
      for (var x = r[0]; x < r[0] + r[2]; x++) if ((x + ph) % 4 < 2) { R(x, r[1], 1, 1, '#ffd84a'); R(x, r[1] + r[3] - 1, 1, 1, '#ffd84a'); }
      for (var y = r[1]; y < r[1] + r[3]; y++) if ((y + ph) % 4 < 2) { R(r[0], y, 1, 1, '#ffd84a'); R(r[0] + r[2] - 1, y, 1, 1, '#ffd84a'); }
    }
  }
  function loop(now) { var dt = Math.min(now - last, 200); if (dt > 66) { stepPeople(dt); last = now; draw(now); } requestAnimationFrame(loop); }
  if (reduce) draw(0); else requestAnimationFrame(function (t) { last = t; loop(t); });

  // Zones cliquables posées sur chaque bâtiment (en % du canvas)
  B.forEach(function (b) {
    if (!b.doc) return; var c = corners(b), top = c.n[1] - b.h - (b.extra || 0) - (b.doc === 'competences' ? 82 : 0);
    b.box = [c.w[0], top, c.e[0] - c.w[0], c.s[1] - top];
    var el = document.querySelector('.hs[data-doc="' + b.doc + '"]'); if (!el) return;
    el.style.left = b.box[0] / W * 100 + '%'; el.style.top = b.box[1] / H * 100 + '%'; el.style.width = b.box[2] / W * 100 + '%'; el.style.height = b.box[3] / H * 100 + '%';
    // Zone cliquable = silhouette du bâtiment en perspective (les rectangles se chevauchent en vue isométrique)
    var hh = c.n[1] - top, pts = [[c.w[0], c.w[1]], [c.s[0], c.s[1]], [c.e[0], c.e[1]], [c.e[0], c.e[1] - hh], [c.n[0], top], [c.w[0], c.w[1] - hh]];
    el.style.clipPath = 'polygon(' + pts.map(function (q) { return ((q[0] - b.box[0]) / b.box[2] * 100).toFixed(2) + '% ' + ((q[1] - b.box[1]) / b.box[3] * 100).toFixed(2) + '%'; }).join(',') + ')';
    el.style.zIndex = Math.round(b.key * 10);
    var tag = el.querySelector('.tag'); if (tag) { el.parentNode.appendChild(tag); tag.style.left = (c.n[0] / W * 100) + '%'; tag.style.top = (top / H * 100) + '%'; tag.style.zIndex = 300; }
    function on() { hover = b.doc; if (tag) tag.classList.add('on'); if (reduce) draw(0); }
    function off() { if (hover === b.doc) hover = null; if (tag) tag.classList.remove('on'); if (reduce) draw(0); }
    el.addEventListener('mouseenter', on); el.addEventListener('focus', on); el.addEventListener('mouseleave', off); el.addEventListener('blur', off);
  });

  /* ---------- Fenêtres internes ---------- */
  var win = document.getElementById('win'), body = document.getElementById('winBody'), wt = document.getElementById('winTitle'), cur = null, home = null;
  function openDoc(id, from) {
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
