/* Paul Signe's City (ville.html) : une ville de style New York en pixel art, dessinée sur un canvas de 880×360 pixels.
   La ville sert de menu : chaque bâtiment (bouton .hs posé dessus) ouvre une fenêtre interne avec une partie du portfolio. */
(function () {
  'use strict';
  var W = 880, H = 360, GY = 300; // largeur, hauteur logiques, niveau du trottoir
  var cv = document.getElementById('city');
  if (!cv) return;
  var g = cv.getContext('2d');
  cv.width = W; cv.height = H;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var N = false, LIT = '', DW = '';

  function night() { return root.getAttribute('data-theme') === 'dark'; }
  function R(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function A(a, f) { g.globalAlpha = a; f(); g.globalAlpha = 1; }
  var seed = 11;
  function rnd() { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; }
  function hash(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function disc(cx, cy, r, c) { for (var dy = -r; dy <= r; dy++) { var w = Math.round(Math.sqrt(r * r - dy * dy)); R(cx - w, cy + dy, 2 * w + 1, 1, c); } }
  function box(x, y, w, h, c) { R(x, y, w, 1, c); R(x, y + h - 1, w, 1, c); R(x, y, 1, h, c); R(x + w - 1, y, 1, h, c); }
  function arc(cx, cy, r, c) { for (var a = -0.9; a <= 0.9; a += 0.1) { R(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1, 1, c); R(cx - Math.cos(a) * r, cy + Math.sin(a) * r, 1, 1, c); } }

  // Police pixel 3×5 pour les enseignes
  var F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110', '&': '010101010101011', '-': '000000111000000', '.': '000000000000010', "'": '010010000000000', ' ': '000000000000000' };
  function T(s, x, y, c, k) {
    k = k || 1; s = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
    for (var i = 0; i < s.length; i++) { var gl = F[s[i]] || F[' ']; for (var p = 0; p < 15; p++) if (gl[p] === '1') R(x + (i * 4 + p % 3) * k, y + ((p / 3) | 0) * k, k, k, c); }
  }
  function TW(s, k) { k = k || 1; return s.length * 4 * k - k; }

  /* ---------- Fond fixe (ciel, skyline lointaine), redessiné seulement au changement jour/nuit ---------- */
  var SKY = { n: ['#090522', '#0e0730', '#150a3d', '#1e0d4b', '#2a1158', '#391563', '#4b1a6b', '#621f70', '#7e2670', '#9c306c', '#bd3f66', '#de5a5e'],
              d: ['#2f6cc4', '#3878cc', '#4384d4', '#4f90dc', '#5c9ce3', '#6aa8e9', '#79b4ee', '#89c0f2', '#9acbf5', '#acd6f8', '#bfe0fa', '#d3e9fb'] };
  var far = [], mid = [], stars = [], i, x, w;
  for (x = 0; x < W;) { w = 14 + (rnd() * 24 | 0); far.push([x, w, 70 + (rnd() * 110 | 0)]); x += w - 3; }
  for (x = -6; x < W;) { w = 16 + (rnd() * 28 | 0); mid.push([x, w, 45 + (rnd() * 105 | 0), rnd() < .3]); x += w + 2; }
  for (i = 0; i < 90; i++) stars.push([rnd() * W | 0, rnd() * 190 | 0, rnd() * 6.3, rnd() < .15]);
  var bg = document.createElement('canvas'), bgN = null;
  bg.width = W; bg.height = H;

  function stepped(cx, tiers, spire, c) { var y = GY; tiers.forEach(function (q) { R(cx - q[0] / 2, y - q[1], q[0], q[1], c); y -= q[1]; }); if (spire) R(cx, y - spire, 1, spire, c); return y; }
  function buildBg() {
    var main = g; g = bg.getContext('2d');
    var n = N, sky = n ? SKY.n : SKY.d, bh = 22;
    sky.forEach(function (c, k) {
      R(0, k * bh, W, bh, c);
      if (k) for (var xx = 0; xx < W; xx += 2) { R(xx + (k % 2), k * bh, 1, 1, sky[k - 1]); if (xx % 4 === 0) R(xx + 1, k * bh + 1, 1, 1, sky[k - 1]); }
    });
    R(0, sky.length * bh, W, H, sky[sky.length - 1]);
    if (n) { disc(800, 62, 20, '#f6edd0'); disc(793, 56, 3, '#e3d6b0'); disc(806, 70, 2, '#e3d6b0'); disc(808, 52, 1, '#e3d6b0'); }
    else { A(.35, function () { disc(800, 62, 27, '#fff1a8'); }); disc(800, 62, 19, '#ffd84a'); disc(797, 59, 11, '#ffe57a'); }
    var fc = n ? '#2c1d5e' : '#9db5da', fw = n ? '#5d47a0' : '#b6cae8';
    far.forEach(function (b) {
      R(b[0], GY - b[2], b[1], b[2], fc);
      for (var yy = GY - b[2] + 4; yy < GY; yy += 6) for (var xx = b[0] + 2; xx < b[0] + b[1] - 2; xx += 4) if (hash(xx * 3 + yy) > .72) R(xx, yy, 1, 2, fw);
    });
    var lc = n ? '#36256f' : '#b3c7e6';
    stepped(612, [[34, 112], [24, 30], [16, 22], [9, 14], [5, 10]], 24, lc); // silhouette type Empire State
    var top = stepped(150, [[24, 124], [18, 22]], 0, lc); // silhouette type Chrysler
    for (var k = 0; k < 6; k++) R(150 - (12 - k * 2) / 2, top - (k + 1) * 4, 12 - k * 2, 4, lc);
    R(150, top - 44, 1, 20, lc);
    var mc = n ? '#150c33' : '#6f8fc4', mw = n ? '#241650' : '#5978ad', ml = n ? '#ffd36e' : '#9fbbe3';
    mid.forEach(function (b, j) {
      var x0 = b[0], w0 = b[1], h0 = b[2];
      R(x0, GY - h0, w0, h0, mc); R(x0, GY - h0, w0, 1, n ? '#2a1d55' : '#89a7d6');
      for (var yy = GY - h0 + 4; yy < GY - 2; yy += 5) for (var xx = x0 + 2; xx < x0 + w0 - 2; xx += 4)
        R(xx, yy, 2, 3, hash(xx * 13 + yy * 7 + j) > (n ? .6 : .2) ? (n && hash(xx + yy) > .93 ? '#ff7ad9' : ml) : mw);
      if (b[3]) { var tx = x0 + w0 / 2 - 4, ty = GY - h0; R(tx + 1, ty - 4, 1, 4, mc); R(tx + 6, ty - 4, 1, 4, mc); R(tx, ty - 12, 8, 8, mc); R(tx - 1, ty - 14, 10, 2, mc); R(tx + 3, ty - 16, 2, 2, mc); } // château d'eau
    });
    g = main; bgN = n;
  }

  /* ---------- Bâtiments ---------- */
  function radio(t) { // Contact
    var x = 8, y = 250, w = 34, cx = x + w / 2, top = 108;
    R(x, y, w, GY - y, N ? '#2d3446' : '#56627a'); R(x, y - 2, w, 2, N ? '#1c2130' : '#3e475a');
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) R(x + 4 + c * 10, y + 14 + r * 11, 6, 6, hash(r * 3 + c + 50) > .35 ? LIT : DW);
    R(x + 5, y + 3, TW('RADIO') + 4, 8, '#f4f1ea'); T('RADIO', x + 7, y + 4, '#c62828');
    for (var yy = top; yy < y; yy++) {
      var lw = 1 + ((yy - top) / (y - top) * 9 | 0), col = ((yy / 10) | 0) % 2 ? '#e8e8ee' : '#d23b3b';
      R(cx - lw, yy, 1, 1, col); R(cx + lw, yy, 1, 1, col);
      if ((yy - top) % 12 === 0) R(cx - lw, yy, lw * 2 + 1, 1, col);
      var k = (yy - top) % 12; R(cx - lw + Math.round(k / 12 * lw * 2), yy, 1, 1, '#9aa0b0');
    }
    R(cx, top - 10, 1, 10, '#e8e8ee');
    if (reduce || (t / 600 | 0) % 2) R(cx - 1, top - 12, 3, 3, '#ff3b3b');
    if (!reduce) for (var j = 0; j < 3; j++) { var ph = (t / 1400 + j / 3) % 1; A(1 - ph, function () { arc(cx, top - 11, 4 + ph * 18, '#ffffff'); }); }
  }

  function classroom(x, y, w, h, i, t) {
    R(x - 1, y - 1, w + 2, h + 2, '#e7dcc3'); R(x, y, w, h, N ? '#ffe3a3' : '#d4e8fb'); R(x + (w / 2 | 0), y, 1, h, '#e7dcc3');
    if (i % 3 === 0) { // tableau + professeur
      R(x + 2, y + 2, 11, 6, '#2f5d3a'); R(x + 3, y + 3, 5, 1, '#e8f0e8'); R(x + 3, y + 5, 7, 1, '#e8f0e8');
      var px = x + 17 + (reduce ? 0 : Math.round(Math.sin(t / 900 + i) * 4)); R(px, y + 6, 2, 2, '#e2b38f'); R(px, y + 8, 2, 5, '#33415c');
    } else { // élèves à leurs tables
      for (var d = 0; d < 3; d++) {
        var dx = x + 2 + d * 8;
        R(dx, y + h - 4, 6, 1, '#8b5a2b'); R(dx + 2, y + h - 8, 2, 2, ['#3b2a1a', '#d9a066', '#6b4423'][(i + d) % 3]);
        R(dx + 1, y + h - 6, 4, 2, ['#c0392b', '#2e86de', '#27ae60', '#8e44ad'][(i + d) % 4]);
      }
      if (i % 3 === 2 && !reduce && (t / 700 + i) % 3 < 1.2) R(x + 5, y + h - 12, 1, 3, '#d9a066'); // main levée
    }
  }
  function school(t) { // À propos
    var x = 44, y = 184, w = 106, cx = x + w / 2;
    R(x, y, w, GY - y, '#9b4232');
    for (var yy = y + 2; yy < GY; yy += 4) for (var xx = x + ((yy >> 2) % 2 ? 1 : 4); xx < x + w; xx += 6) R(xx, yy, 2, 1, '#83352a');
    R(x - 3, y - 5, w + 6, 5, '#d8c9ab'); R(x - 3, y - 6, w + 6, 1, '#efe4cc'); R(x - 3, y, w + 6, 1, '#a8977a');
    var s = 'ARTS ET METIERS', sw = TW(s), sx = x + (w - sw) / 2 | 0;
    R(sx - 3, y - 12, 1, 6, '#555'); R(sx + sw + 2, y - 12, 1, 6, '#555');
    R(sx - 5, y - 23, sw + 10, 12, '#f7f2e6'); box(sx - 5, y - 23, sw + 10, 12, '#1b2fbf'); T(s, sx, y - 20, '#1b2fbf');
    for (var f = 0; f < 4; f++) for (var c = 0; c < 3; c++) classroom(x + 7 + c * 33, y + 7 + f * 24, 27, 16, f * 3 + c, t);
    R(cx - 6, GY - 13, 12, 13, '#3b2a22'); R(cx - 5, GY - 12, 4, 11, '#5a3f30'); R(cx + 1, GY - 12, 4, 11, '#5a3f30');
    R(cx - 12, GY - 2, 24, 2, '#d8c9ab');
    var fx = x + w - 4, wv = reduce ? 0 : (t / 300 | 0) % 2;
    R(fx, y - 22, 1, 17, '#ddd'); R(fx + 1, y - 22, 3, 5 - wv, '#1b2fbf'); R(fx + 4, y - 22, 3, 5, '#fff'); R(fx + 7, y - 22 + wv, 3, 5 - wv, '#d62828');
  }

  function fablab(t) { // Projets
    var x = 154, y = 238, w = 60, dx = x + 5, dy = y + 18, dw = w - 10;
    R(x, y, w, GY - y, '#5c6371'); for (var xx = x + 1; xx < x + w; xx += 3) R(xx, y, 1, GY - y, '#4e5562');
    R(x - 1, y - 3, w + 2, 3, '#383d48');
    var s = 'FABLAB', sw = TW(s); R(x + (w - sw) / 2 - 3, y + 4, sw + 6, 9, '#ff7a1a'); T(s, x + (w - sw) / 2, y + 6, '#fff');
    R(dx, dy, dw, GY - dy, N ? '#f0c879' : '#e1dacb'); R(dx, GY - 1, dw, 1, '#6b6157');
    R(dx, dy, dw, 7, '#8d94a1'); for (var r = 1; r < 4; r++) R(dx, dy + r * 2, dw, 1, '#757c89'); // rideau à moitié levé
    // tour conventionnel : banc, poupée qui tourne, pièce en aluminium
    R(dx + 2, GY - 8, 21, 3, '#4d5a6a'); R(dx + 3, GY - 5, 2, 4, '#4d5a6a'); R(dx + 19, GY - 5, 2, 4, '#4d5a6a');
    R(dx + 2, GY - 15, 6, 7, '#3d6a8a'); R(dx + 18, GY - 13, 4, 5, '#3d6a8a');
    var fr = reduce ? 0 : (t / 90 | 0) % 2; R(dx + 8, GY - 14 + fr, 2, 4, '#c9ced6'); R(dx + 10, GY - 12, 8, 2, '#d9dde3');
    if (!reduce && hash(t / 120 | 0) > .6) R(dx + 12 + (hash(t) * 4 | 0), GY - 15, 1, 1, '#ffd84a'); // copeau
    R(dx + 24, GY - 14, 2, 2, '#c68642'); R(dx + 24, GY - 12, 2, 6, '#2e5aa8'); // technicien
    // imprimante 3D : tête qui va et vient, pièce qui monte
    box(dx + 30, GY - 21, 16, 16, '#2a2a2a'); R(dx + 31, GY - 7, 14, 1, '#555');
    var ph = reduce ? .5 : (t / 4000) % 1, hp = Math.round(ph * 5), hx = dx + 32 + Math.round((Math.sin(t / 220) * .5 + .5) * 9);
    R(dx + 35, GY - 8 - hp, 6, hp + 1, '#ff7a1a'); R(dx + 31, GY - 17, 14, 1, '#777'); R(hx, GY - 16, 3, 2, '#e0e0e0');
    // engrenage sur le toit
    var gx = x + w - 10, gy = y - 10, rot = reduce ? 0 : t / 800;
    R(gx, gy + 5, 2, 5, '#383d48'); disc(gx, gy, 4, '#9aa1ad'); disc(gx, gy, 1, '#383d48');
    for (var k = 0; k < 8; k++) { var a = k * Math.PI / 4 + rot; R(gx + Math.cos(a) * 5.5 - 1, gy + Math.sin(a) * 5.5 - 1, 2, 2, '#9aa1ad'); }
  }

  function smoke(cx, cy, t, off) {
    for (var i = 0; i < 5; i++) {
      var ph = reduce ? i / 5 : (t / 2200 + off + i / 5) % 1, s = 2 + ph * 6;
      A(.85 * (1 - ph), function () { R(cx + ph * 14 - s / 2, cy - ph * 40 - s / 2, s, s, N ? '#8d86a3' : '#eeeef4'); });
    }
  }
  function factory(t) { // Stage La Poste
    var x = 218, y = 228, w = 112;
    R(x, y, w, GY - y, N ? '#5d5a66' : '#bdb7ab');
    for (var xx = x; xx < x + w - 2; xx += 14) { for (var k = 0; k < 6; k++) R(xx + k * 2, y - k - 1, 2, k + 1, N ? '#46434f' : '#8e8a80'); R(xx + 12, y - 6, 2, 6, N ? '#ffd56b' : '#9ec3e6'); }
    R(x + w - 26, y - 44, 7, 44, '#8a4b3a'); R(x + w - 27, y - 46, 9, 3, '#6d3a2c'); R(x + w - 26, y - 34, 7, 2, '#e8e8e8');
    R(x + w - 14, y - 34, 6, 34, '#8a4b3a'); R(x + w - 15, y - 36, 8, 3, '#6d3a2c');
    smoke(x + w - 23, y - 48, t, 0); smoke(x + w - 11, y - 38, t, .5);
    var s = 'LA POSTE', sw = TW(s, 2); R(x + 6, y + 4, sw + 8, 14, '#ffcd00'); box(x + 6, y + 4, sw + 8, 14, '#003da5'); T(s, x + 10, y + 7, '#003da5', 2);
    var gx = x + 6, gy = y + 23, gw = w - 12, gh = 20;
    R(gx, gy, gw, gh, N ? '#ffe29a' : '#cfe3f5'); for (var m = gx + 12; m < gx + gw; m += 12) R(m, gy, 1, gh, '#8e8a80');
    R(gx, gy + gh - 5, gw, 2, '#3a3d48'); for (m = gx + 3; m < gx + gw; m += 6) R(m, gy + gh - 3, 1, 1, '#3a3d48');
    for (var j = 0; j < 9; j++) R(gx + ((t / 25 + j * 12) % (gw - 4)), gy + gh - 8, 4, 3, j % 3 ? '#ffffff' : '#ffcd00'); // plis sur le convoyeur
    R(gx + 20, gy + 5, 2, 2, '#e0ac69'); R(gx + 20, gy + 7, 2, 5, '#003da5'); R(gx + 62, gy + 5, 2, 2, '#8d5524'); R(gx + 62, gy + 7, 2, 5, '#ffcd00');
    for (m = 0; m < 6; m++) R(x + 44 + m * 8, y + 50, 4, 5, LIT);
    R(x + w - 34, GY - 22, 26, 22, '#3a3d48'); for (var r = 0; r < 5; r++) R(x + w - 34, GY - 20 + r * 4, 26, 1, '#4b4f5c');
    R(x + 6, GY - 12, 22, 9, '#ffcd00'); R(x + 28, GY - 10, 7, 7, '#ffcd00'); R(x + 30, GY - 9, 4, 3, '#9ec3e6'); R(x + 6, GY - 8, 22, 1, '#003da5');
    R(x + 9, GY - 3, 4, 3, '#111'); R(x + 27, GY - 3, 4, 3, '#111');
  }

  function tower(t) { // Compétences
    var base = N ? '#3d3756' : '#cfc5b0', dark = N ? '#2a2540' : '#a99f8a';
    var tiers = [[334, 62, 150], [341, 48, 104], [348, 34, 74], [354, 22, 56], [359, 12, 44]];
    tiers.forEach(function (q, k) {
      var x = q[0], w = q[1], y = q[2], b = k ? tiers[k - 1][2] : GY;
      R(x, y, w, b - y, base); R(x + w - 2, y, 2, b - y, dark); R(x, y, w, 1, N ? '#5a5280' : '#e7decb');
      for (var xx = x + 3; xx < x + w - 3; xx += 4) for (var yy = y + 3; yy < b - 3; yy += 4) {
        var on = N && hash(xx * 7 + yy + (hash(xx + yy) > .9 ? (t / 5000 | 0) : 0)) > .55;
        R(xx, yy, 2, 2, on ? LIT : (N ? '#221d38' : '#8e9fbd'));
      }
    });
    R(364, 22, 2, 22, '#cfd3da'); if (reduce || (t / 700 | 0) % 2) R(363, 18, 4, 3, '#ff3b3b');
    var s = 'COMPETENCES', sw = TW(s); R(365 - sw / 2 - 4, GY - 27, sw + 8, 9, '#1b2fbf'); T(s, 365 - sw / 2, GY - 25, '#fff');
    R(358, GY - 13, 14, 13, '#2a2540'); box(357, GY - 14, 16, 14, '#d4af37');
  }

  function club(t) { // Vision board : le son
    var x = 398, y = 198, w = 96, beat = reduce ? 0 : (t / 250 | 0) % 2;
    R(x, y, w, GY - y, '#1f1730'); R(x, y - 2, w, 2, '#120c1f');
    var s = 'NIGHT CLUB', sw = TW(s), on = reduce || hash(t / 180 | 0) > .08;
    R(x + (w - sw) / 2 - 4, y - 14, sw + 8, 11, '#120c1f'); T(s, x + (w - sw) / 2, y - 11, on ? '#ff4fd8' : '#5a2a55');
    var ix = x + 5, iy = y + 6, iw = w - 10, ih = 54, cx = ix + iw / 2;
    R(ix, iy, iw, ih, ['#2b0f4c', '#0f2b4c', '#4c0f3a'][reduce ? 0 : (t / 500 | 0) % 3]);
    ['#ff4fd8', '#3ef0ff', '#ffe14f'].forEach(function (c, b) {
      var a = Math.PI / 2 + Math.sin(t / 700 + b * 2) * .8;
      A(.45, function () { for (var l = 4; l < 48; l += 1) R(cx + Math.cos(a) * l, iy + 4 + Math.sin(a) * l, 2, 1, c); });
    });
    R(cx, iy, 1, 2, '#888'); disc(cx, iy + 4, 2, '#d9d9e6'); if (!reduce) R(cx - 2 + (t / 120 | 0) % 4, iy + 3, 1, 1, '#fff');
    [ix + 1, ix + iw - 9].forEach(function (sx) { R(sx, iy + ih - 24, 8, 24, '#0a0a0a'); disc(sx + 4, iy + ih - 18, 2 + beat, '#555'); disc(sx + 4, iy + ih - 7, 2 + beat, '#555'); });
    for (var d = 0; d < 7; d++) {
      var dx = ix + 13 + d * 9, up = reduce ? 0 : (Math.sin(t / 160 + d * 1.3) > 0 ? 1 : 0), dy = iy + ih - 12 - up;
      R(dx, dy, 2, 2, ['#e0ac69', '#8d5524', '#f1c27d', '#c68642'][d % 4]); R(dx, dy + 2, 2, 4, ['#ff4fd8', '#3ef0ff', '#ffe14f', '#7dff8a'][d % 4]);
      if (up) { R(dx - 1, dy - 1, 1, 2, '#e0ac69'); R(dx + 2, dy - 1, 1, 2, '#e0ac69'); }
      R(dx, dy + 6, 1, 3 + up, '#222'); R(dx + 1, dy + 6, 1, 3 + up, '#222');
    }
    for (var k = 0; k < iw; k += 6) R(ix + k, iy + ih - 3, 6, 3, ['#ff4fd8', '#3ef0ff', '#ffe14f', '#7dff8a'][((k / 6) + (reduce ? 0 : t / 300 | 0)) % 4]);
    // séparation + rez-de-chaussée : vinyl shop et entrée du club
    var vy = y + 62; R(x, vy, w, 7, '#3b2d52'); T('VINYL SHOP', x + 3, vy + 1, '#3ef0ff');
    var sy = vy + 7; R(x, sy, 52, GY - sy, '#1d5a63');
    for (k = 0; k < 13; k++) R(x + k * 4, sy, 4, 5, k % 2 ? '#fff' : '#d62839'); R(x, sy + 5, 52, 1, '#8a1c26');
    R(x + 4, sy + 8, 44, GY - sy - 10, '#f3e6c8');
    ['#e63946', '#ffd60a', '#2a9d8f', '#4361ee'].forEach(function (c, k) { disc(x + 10 + k * 11, sy + 15, 4, '#111'); disc(x + 10 + k * 11, sy + 15, 1, c); });
    R(x + 6, GY - 7, 16, 4, '#5a4636'); disc(x + 13, GY - 8, 3, '#222');
    var ang = reduce ? 0 : t / 120; R(x + 13 + Math.cos(ang) * 2, GY - 8 + Math.sin(ang) * 2, 1, 1, '#ddd');
    R(x + 34, GY - 10, 2, 2, '#c68642'); R(x + 34, GY - 8, 2, 4, '#e76f51'); // client
    R(x + 52, sy, 44, GY - sy, '#2a1f3d'); R(x + 70, GY - 18, 12, 18, '#0d0a14'); R(x + 68, GY - 21, 16, 2, on ? '#ff4fd8' : '#5a2a55');
    R(x + 58, GY - 6, 1, 6, '#d4af37'); R(x + 66, GY - 6, 1, 6, '#d4af37'); R(x + 59, GY - 5, 7, 1, '#c0392b');
    R(x + 86, GY - 11, 3, 2, '#6b4423'); R(x + 86, GY - 9, 3, 9, '#111'); // videur
    if (!reduce) for (var j = 0; j < 4; j++) { // notes de musique
      var ph = (t / 2600 + j / 4) % 1, nx = x + 14 + j * 22 + Math.sin(ph * 6) * 3, ny = y - 18 - ph * 26;
      A(1 - ph, function () { R(nx, ny, 1, 5, '#ffe14f'); R(nx - 2, ny + 4, 3, 2, '#ffe14f'); R(nx + 1, ny, 2, 1, '#ffe14f'); });
    }
  }

  function mannequin(x, y, col) { R(x, y, 2, 2, '#e9d3b8'); R(x, y + 2, 2, 3, col); R(x - 1, y + 5, 4, 3, col); R(x - 2, y + 8, 6, 4, col); R(x, y + 12, 2, 5, '#999'); R(x - 2, y + 17, 6, 1, '#777'); }
  function couture(t) { // Vision board : mode et luxe
    var x = 496, y = 240, w = 82, gold = '#d4af37';
    R(x, y, w, GY - y, '#17161c'); R(x, y, w, 2, gold); R(x, GY - 2, w, 2, gold);
    var s = 'COUTURE', sw = TW(s, 2); T(s, x + (w - sw) / 2, y + 5, gold, 2);
    for (var k = 0; k < w / 4; k++) R(x + k * 4, y + 18, 4, 4, k % 2 ? '#fff' : '#111'); R(x, y + 22, w, 1, '#000');
    var vy = y + 25, vh = GY - 4 - vy;
    R(x + 5, vy, 28, vh, '#f6ead3'); R(x + 49, vy, 28, vh, '#f6ead3');
    mannequin(x + 12, vy + 5, '#c0182e'); mannequin(x + 25, vy + 5, gold); mannequin(x + 57, vy + 5, '#1d1d1d');
    R(x + 64, vy + vh - 5, 10, 5, '#ddd'); R(x + 66, vy + vh - 10, 6, 5, '#8b4513'); R(x + 67, vy + vh - 12, 4, 1, '#8b4513'); R(x + 67, vy + vh - 12, 1, 2, '#8b4513'); R(x + 70, vy + vh - 12, 1, 2, '#8b4513');
    R(x + 35, vy, 12, vh + 4, '#2b2a33'); R(x + 36, vy + 1, 4, vh + 2, '#4a4a58'); R(x + 42, vy + 1, 4, vh + 2, '#4a4a58'); R(x + 40, vy + vh / 2, 2, 2, gold);
    // défilé sur le toit
    var ry = y - 3; R(x + 2, ry, w - 4, 3, '#f5f5f5'); R(x + 2, ry + 3, w - 4, 1, '#999');
    R(x + 3, ry - 14, 1, 14, '#888'); R(x + 2, ry - 16, 4, 3, '#333'); R(x + w - 4, ry - 14, 1, 14, '#888'); R(x + w - 6, ry - 16, 4, 3, '#333');
    var mx = x + 9 + Math.round((w - 22) * (0.5 - 0.5 * Math.cos(reduce ? 1 : t / 2400)));
    if (N) A(.22, function () { R(mx - 5, ry - 14, 12, 14, '#fff6c8'); });
    var st = reduce ? 0 : (t / 180 | 0) % 2;
    R(mx, ry - 12, 2, 1, '#2b1a0e'); R(mx, ry - 11, 2, 2, '#e0ac69'); R(mx - 1, ry - 9, 4, 4, '#ff2e88'); R(mx - 2, ry - 5, 6, 2, '#ff2e88');
    R(mx + (st ? 0 : 1), ry - 3, 1, 3, '#2b1a0e'); R(mx + (st ? 2 : 1), ry - 3, 1, 3, '#2b1a0e');
    for (k = 0; k < 5; k++) { R(x + 5 + k * 3, ry - 3, 2, 2, ['#e0ac69', '#8d5524', '#f1c27d', '#c68642'][k % 4]); R(x + w - 20 + k * 3, ry - 3, 2, 2, ['#c68642', '#f1c27d', '#8d5524', '#e0ac69'][k % 4]); }
    if (!reduce && hash(t / 400 | 0) > .7) R(x + w - 12, ry - 7, 2, 2, '#fff'); // flash du photographe
  }

  function billboard(t) { // CV
    var x = 582, y = 178, w = 50;
    R(x, y, w, GY - y, '#6e4639');
    for (var yy = y + 2; yy < GY; yy += 4) for (var xx = x + ((yy >> 2) % 2 ? 1 : 4); xx < x + w; xx += 6) R(xx, yy, 2, 1, '#5c3a2f');
    for (var r = 0; r < 6; r++) for (var c = 0; c < 3; c++) R(x + 4 + c * 15, y + 8 + r * 18, 8, 10, hash(r * 5 + c + 9) > .4 ? LIT : DW);
    for (r = 0; r < 6; r++) { var py = y + 19 + r * 18; R(x + 28, py, 18, 1, '#232328'); if (r < 5) for (var k = 0; k < 18; k++) R(x + 29 + k * .9, py + k, 1, 1, '#232328'); }
    var bx = x - 6, by = 130, bw = w + 12, bh = 34;
    R(x + 8, by + bh, 2, y - by - bh, '#444'); R(x + w - 10, by + bh, 2, y - by - bh, '#444');
    R(bx, by, bw, bh, '#111'); R(bx + 2, by + 2, bw - 4, bh - 4, '#f7f2e6');
    T('PAUL SIGNE', bx + (bw - TW('PAUL SIGNE')) / 2, by + 6, '#1b2fbf'); T('CV', bx + (bw - TW('CV', 3)) / 2, by + 14, '#d62828', 3);
    for (k = 0; k < 3; k++) { R(bx + 8 + k * 20, by - 3, 3, 2, '#888'); if (N) A(.3, function () { R(bx + 6 + k * 20, by + 2, 7, 10, '#fff6c8'); }); }
  }

  function tree(x, y) { R(x - 1, y - 10, 2, 10, '#6b4423'); disc(x, y - 16, 7, N ? '#1e5631' : '#2e8b57'); disc(x - 2, y - 18, 4, N ? '#2a6b3f' : '#3cb371'); }
  function kid(x, y, c, up) { R(x, y - 8 - up, 2, 2, '#e0ac69'); R(x, y - 6 - up, 2, 3, c); R(x, y - 3 - up, 1, 3, '#2b2d42'); R(x + 1, y - 3 - up, 1, 3, '#2b2d42'); }
  function park(t) { // Animateur
    var x = 634, w = 80, cx = x + 40, base = GY - 9;
    R(x, GY - 8, w, 8, N ? '#1f4a2a' : '#4a9d4f'); for (var k = 0; k < w; k += 3) R(x + k, GY - 9, 1, 1, N ? '#2d6b3d' : '#6cc26f');
    tree(x + 7, GY - 8); tree(x + w - 7, GY - 8);
    var ry = reduce ? 11 : 9 + Math.round(3 * Math.sin(t / 380)), cols = ['#e63946', '#f4a261', '#ffd60a', '#2a9d8f', '#4361ee', '#9b5de5'];
    for (var dy = 0; dy <= ry; dy++) { var hw = Math.round(18 * Math.sqrt(1 - (dy / ry) * (dy / ry))); for (var xx = -hw; xx < hw; xx++) R(cx + xx, base - dy, 1, 1, cols[((xx + 18) / 6 | 0) % 6]); }
    [-20, -14, -7, 7, 14, 20].forEach(function (o, i) { kid(cx + o, GY - 1, cols[(i + 2) % 6], reduce ? 0 : ((t / 250 + i) % 2 < 1 ? 1 : 0)); });
    if (!reduce) kid(cx - 14 + ((t / 30) % 28), GY - 1, '#ffffff', 0); // enfant qui court sous le parachute
    R(x + 66, GY - 20, 1, 12, '#6b4423'); R(x + 61, GY - 27, TW('PARC') + 4, 8, '#2e7d32'); T('PARC', x + 63, GY - 25, '#fff');
  }

  function house(t) { // Garde d'enfant
    var x = 716, y = 236, w = 54;
    R(x, y, w, GY - y, '#7a4a37'); R(x - 1, y - 3, w + 2, 3, '#5a3426'); R(x - 1, y - 4, w + 2, 1, '#9c6a52');
    R(x + 6, y + 8, 10, 14, LIT); R(x + 6, y + 15, 10, 1, '#5a3426');
    R(x + 26, y + 6, 22, 20, '#fff3d6'); box(x + 25, y + 5, 24, 22, '#e7dcc3');
    [['#e63946', 0, 0], ['#4361ee', 9, 0], ['#2a9d8f', 0, 9], ['#ffd60a', 9, 9]].forEach(function (p) { R(x + 29 + p[1], y + 9 + p[2], 6, 6, '#fff'); R(x + 30 + p[1], y + 10 + p[2], 4, 4, p[0]); }); // pictogrammes
    var hy = y + 30; R(x + 11, hy, 2, 1, '#ff5c8a'); R(x + 14, hy, 2, 1, '#ff5c8a'); R(x + 10, hy + 1, 7, 2, '#ff5c8a'); R(x + 11, hy + 3, 5, 1, '#ff5c8a'); R(x + 12, hy + 4, 3, 1, '#ff5c8a'); R(x + 13, hy + 5, 1, 1, '#ff5c8a');
    R(x + 9, GY - 16, 10, 16, '#2b1a12'); R(x + 5, GY - 3, 18, 3, '#9c8a7a'); R(x + 7, GY - 6, 14, 3, '#b09c8a');
    R(x + 28, y + 36, 18, 14, LIT); R(x + 28, y + 42, 18, 1, '#5a3426');
    R(x + 30, GY - 5, 14, 5, '#5a3426'); for (var k = 0; k < 4; k++) R(x + 31 + k * 4, GY - 7, 2, 2, ['#ff5c8a', '#ffd60a', '#e63946', '#9b5de5'][k]);
  }

  function archives(t) { // Annexes
    var x = 772, y = 222, w = 104, st = N ? '#5f5a72' : '#ddd6c6', sh = N ? '#4a4660' : '#bdb4a0';
    for (var k = 0; k < 14; k++) R(x + k * 3.7, y - k - 1, w - k * 7.4, 1, st);
    R(x - 2, y, w + 4, 4, sh); R(x, y + 4, w, 9, st); T('ARCHIVES', x + (w - TW('ARCHIVES')) / 2, y + 6, N ? '#ffd56b' : '#5a4a3a');
    var c0 = y + 13, c1 = GY - 7;
    R(x + 2, c0, w - 4, c1 - c0, N ? '#3a2e24' : '#6d5b49');
    var books = ['#c0392b', '#2e86de', '#27ae60', '#f39c12', '#8e44ad', '#ecf0f1'];
    for (var yy = c0 + 3; yy < c1 - 6; yy += 8) { R(x + 2, yy + 6, w - 4, 1, '#4a3b2e'); for (var xx = x + 3; xx < x + w - 3; xx += 3) if (hash(xx + yy) > .2) R(xx, yy + 1 + (hash(xx * yy) > .7 ? 1 : 0), 2, 5 - (hash(xx * yy) > .7 ? 1 : 0), books[(hash(xx * 3 + yy) * 6) | 0]); }
    for (var c = 0; c < 7; c++) { var cx = x + 2 + c * 16.5; R(cx, c0, 5, c1 - c0, st); R(cx + 4, c0, 1, c1 - c0, sh); R(cx - 1, c0, 7, 2, st); R(cx - 1, c1 - 2, 7, 2, st); }
    R(x - 4, GY - 7, w + 8, 3, sh); R(x - 6, GY - 4, w + 12, 4, st);
  }

  /* ---------- Rue ---------- */
  var cars = [[0, .045, GY + 6, '#f2c230', 1], [300, .045, GY + 6, '#f2c230', 1], [600, .05, GY + 6, '#e63946', 0], [150, -.04, GY + 20, '#f2c230', 1], [500, -.035, GY + 20, '#4361ee', 0], [760, -.04, GY + 20, '#f2c230', 1]];
  var people = [];
  for (i = 0; i < 14; i++) people.push([rnd() * W, (rnd() < .5 ? -1 : 1) * (.008 + rnd() * .012), i % 2 ? GY + 3 : GY + 46, ['#e63946', '#4361ee', '#2a9d8f', '#f4a261', '#9b5de5', '#111111', '#ffd60a'][i % 7], ['#f1c27d', '#c68642', '#8d5524', '#e0ac69'][i % 4]]);
  function street() {
    R(0, GY, W, 3, N ? '#5c5e70' : '#a3a5b5'); R(0, GY + 3, W, 1, N ? '#3a3b48' : '#6d6f80');
    R(0, GY + 4, W, 30, N ? '#1c1d27' : '#3a3c4a');
    for (var x = 0; x < W; x += 24) R(x + 4, GY + 18, 12, 1, '#e8c547');
    R(0, GY + 34, W, 2, N ? '#5c5e70' : '#a3a5b5'); R(0, GY + 36, W, H - GY - 36, N ? '#34354a' : '#7d7f92');
    for (x = 0; x < W; x += 16) R(x, GY + 36, 1, H - GY - 36, N ? '#2b2c3e' : '#717385');
  }
  function subway(t) { // Plan de la ville (sommaire)
    var x = 298, y = GY + 36, gl = N || reduce || (t / 900 | 0) % 2 ? '#7dff8a' : '#4fd15e';
    R(x + 6, y + 4, 32, H - y - 4, '#151515'); for (var k = 0; k < 4; k++) R(x + 8, y + 7 + k * 4, 28, 1, '#3a3a3a');
    R(x + 2, y + 2, 40, 2, '#1f6b3a'); R(x + 2, y + 2, 2, H - y, '#1f6b3a'); R(x + 40, y + 2, 2, H - y, '#1f6b3a');
    R(x + 1, y - 6, 1, 8, '#1f6b3a'); R(x + 42, y - 6, 1, 8, '#1f6b3a'); disc(x + 1, y - 8, 2, gl); disc(x + 42, y - 8, 2, gl);
    R(x + 12, y - 5, 20, 8, '#111'); T('PLAN', x + 14, y - 3, '#fff');
  }
  function car(c, t) {
    var x = ((c[0] + c[1] * t) % (W + 40) + W + 40) % (W + 40) - 20, y = c[2], d = c[1] > 0;
    R(x, y + 3, 20, 5, c[3]); R(x + 4, y, 11, 3, c[3]); R(x + 5, y + 1, 4, 2, '#9ec9f0'); R(x + 10, y + 1, 4, 2, '#9ec9f0');
    if (c[4]) { R(x + 8, y - 1, 4, 1, '#fff'); for (var k = 0; k < 10; k++) R(x + k * 2, y + 5, 1, 1, k % 2 ? '#111' : c[3]); }
    R(x + 3, y + 8, 4, 2, '#111'); R(x + 13, y + 8, 4, 2, '#111');
    R(d ? x + 19 : x, y + 4, 1, 1, '#fff7c2'); R(d ? x : x + 19, y + 4, 1, 1, '#ff3b3b');
    if (N) A(.35, function () { R(d ? x + 20 : x - 10, y + 3, 10, 3, '#fff3a0'); });
  }
  function lamps() {
    [52, 186, 420, 640, 832].forEach(function (x) {
      R(x, GY + 14, 1, 40, '#2b2b33'); R(x, GY + 14, 5, 1, '#2b2b33'); R(x + 4, GY + 15, 3, 2, N ? '#ffe066' : '#c9c9c9');
      if (N) A(.22, function () { disc(x + 5, GY + 22, 7, '#ffe066'); });
    });
  }
  function person(p, t) {
    var x = ((p[0] + p[1] * t) % W + W) % W, y = p[2], st = reduce ? 0 : ((t / 160 + p[0]) | 0) % 2;
    R(x, y - 8, 2, 2, p[4]); R(x, y - 6, 2, 3, p[3]); R(x + (st ? 0 : 1), y - 3, 1, 3, '#2b2d42'); R(x + (st ? 1 : 0), y - 3, 1, 2, '#2b2d42');
  }

  /* ---------- Image complète ---------- */
  var clouds = [[0, 40, 46, .006], [300, 22, 34, .004], [560, 74, 52, .005], [760, 30, 30, .007]];
  var hover = null, rects = {};
  function draw(t) {
    N = night(); LIT = N ? '#ffd56b' : '#d8ecff'; DW = N ? '#2a2240' : '#7fa5d4';
    if (bgN !== N) buildBg();
    g.drawImage(bg, 0, 0);
    if (N) stars.forEach(function (s) { if (reduce || Math.sin(t / 700 + s[2]) > -.4) { R(s[0], s[1], 1, 1, '#fff'); if (s[3]) { R(s[0] - 1, s[1], 3, 1, '#c9b8ff'); R(s[0], s[1] - 1, 1, 3, '#c9b8ff'); } } });
    clouds.forEach(function (c) {
      var cx = ((c[0] + t * c[3]) % (W + 80)) - 60, cy = c[1], cw = c[2], col = N ? 'rgba(170,120,210,.28)' : '#ffffff', sh = N ? 'rgba(120,80,170,.2)' : '#d6e6f7';
      R(cx, cy + 4, cw, 5, col); R(cx + 5, cy, cw - 14, 4, col); R(cx + 10, cy - 3, cw / 3, 3, col); R(cx + 2, cy + 9, cw - 4, 1, sh);
    });
    radio(t); school(t); fablab(t); factory(t); tower(t); club(t); couture(t); billboard(t); park(t); house(t); archives(t);
    street(); subway(t); cars.forEach(function (c) { car(c, t); }); lamps(); people.forEach(function (p) { person(p, t); });
    if (hover && rects[hover]) { // contour pointillé animé autour du bâtiment survolé
      var r = rects[hover], ph = reduce ? 0 : (t / 90 | 0) % 4, per = 2 * (r[2] + r[3]);
      for (var p = 0; p < per; p++) if ((p + ph) % 4 < 2) {
        var px, py;
        if (p < r[2]) { px = r[0] + p; py = r[1]; }
        else if (p < r[2] + r[3]) { px = r[0] + r[2] - 1; py = r[1] + p - r[2]; }
        else if (p < 2 * r[2] + r[3]) { px = r[0] + r[2] - 1 - (p - r[2] - r[3]); py = r[1] + r[3] - 1; }
        else { px = r[0]; py = r[1] + r[3] - 1 - (p - 2 * r[2] - r[3]); }
        R(px, py, 1, 1, '#ffd84a');
      }
    }
  }
  var last = -1e9;
  function loop(now) { if (now - last > 66) { last = now; draw(now); } requestAnimationFrame(loop); }
  if (reduce) draw(0); else requestAnimationFrame(loop);

  document.querySelectorAll('.hs').forEach(function (b) {
    rects[b.dataset.doc] = b.dataset.rect.split(',').map(Number);
    function on() { hover = b.dataset.doc; if (reduce) draw(0); }
    function off() { if (hover === b.dataset.doc) hover = null; if (reduce) draw(0); }
    b.addEventListener('mouseenter', on); b.addEventListener('focus', on);
    b.addEventListener('mouseleave', off); b.addEventListener('blur', off);
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
    var body = form.message.value + '\n\n— ' + form.name.value + ' (' + form.email.value + ')';
    location.href = 'mailto:paul.signe@ensam.eu?subject=' + encodeURIComponent('Contact portfolio — ' + form.name.value) + '&body=' + encodeURIComponent(body);
  });

  // Impression : la ville devient l'image de la page de garde, toutes les fenêtres s'impriment à la suite
  addEventListener('beforeprint', function () {
    if (win.open) win.close();
    draw(0); var img = document.getElementById('printCity'); if (img) img.src = cv.toDataURL();
    document.querySelectorAll('#docs details').forEach(function (d) { d.open = true; });
  });
})();
