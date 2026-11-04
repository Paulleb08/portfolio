// Traduction du site dans toutes les langues de Google Traduction.
// À la première visite, la langue du navigateur (région comprise) est appliquée automatiquement ;
// ensuite, le choix du visiteur (cookie « googtrans » posé par Google) est respecté.

var SOURCE = 'fr';

// Code de langue du navigateur (BCP 47, ex. « pt-BR », « zh-TW ») -> code Google Traduction
function gtCode(tag) {
  var p = String(tag || '').toLowerCase().split('-');
  var lang = p[0], rest = p.slice(1);
  if (lang === 'zh') return rest.some(function (x) { return ['tw', 'hk', 'mo', 'hant'].indexOf(x) > -1; }) ? 'zh-TW' : 'zh-CN';
  return { he: 'iw', jv: 'jw', nb: 'no', nn: 'no', fil: 'tl' }[lang] || lang;
}

if (typeof document !== 'undefined') {
  var cookieSet = /(^|;\s*)googtrans=/.test(document.cookie);
  var target = gtCode((navigator.languages && navigator.languages[0]) || navigator.language);
  if (!cookieSet && target && target !== SOURCE) {
    document.cookie = 'googtrans=/' + SOURCE + '/' + target + '; path=/; max-age=31536000';
  }

  var css = document.createElement('style');
  css.textContent =
    '.lang{display:flex;align-items:center;gap:8px}' +
    '.lang .goog-te-gadget{font-size:0;color:transparent}' +
    '.lang .goog-te-gadget>span{display:none}' +
    /* !important : la feuille de style de Google est chargée après la nôtre */
    '.lang select.goog-te-combo{margin:0!important;font:600 .9rem/1.2 inherit!important;color:#fff!important;background:transparent!important;border:1.5px solid rgba(255,255,255,.55)!important;border-radius:999px!important;padding:7px 12px!important;cursor:pointer;max-width:190px}' +
    '.lang select.goog-te-combo:hover{border-color:#fff!important}' +
    '.lang select.goog-te-combo option{color:#111;background:#fff}' +
    /* bandeau, infobulle et surlignage injectés par Google */
    'body{top:0!important}' +
    'iframe.skiptranslate,.goog-te-banner-frame,#goog-gt-tt,.goog-te-balloon-frame{display:none!important}' +
    '.goog-text-highlight{background:none!important;box-shadow:none!important}' +
    '@media print{.lang{display:none!important}}';
  document.head.appendChild(css);

  window.gtInit = function () {
    new google.translate.TranslateElement({ pageLanguage: SOURCE, autoDisplay: false }, 'gt');
  };
  var s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=gtInit';
  s.async = true;
  document.head.appendChild(s);
}

if (typeof module !== 'undefined') module.exports = { gtCode: gtCode };
