// Vérifie la conversion langue du navigateur -> code Google Traduction. Lancer : node assets/translate.test.js
const assert = require('node:assert/strict');
const { gtCode } = require('./translate.js');

assert.equal(gtCode('fr-FR'), 'fr');
assert.equal(gtCode('en-US'), 'en');
assert.equal(gtCode('pt-BR'), 'pt');
assert.equal(gtCode('zh-CN'), 'zh-CN');
assert.equal(gtCode('zh-TW'), 'zh-TW');
assert.equal(gtCode('zh-Hant-HK'), 'zh-TW');
assert.equal(gtCode('he-IL'), 'iw');
assert.equal(gtCode('nb-NO'), 'no');
assert.equal(gtCode(undefined), '');
console.log('translate.js OK');
