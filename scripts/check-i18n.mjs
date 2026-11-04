// Vérifie que les contenus FR et EN ont la même forme (mêmes clés, mêmes longueurs de listes).
import assert from 'node:assert/strict';
import { content } from '../src/content.js';

function shape(v) {
  if (Array.isArray(v)) return v.map(shape);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, shape(v[k])]));
  return typeof v;
}

assert.deepEqual(shape(content.en), shape(content.fr), 'Les contenus FR et EN divergent');
console.log('i18n OK : FR et EN ont la même structure');
