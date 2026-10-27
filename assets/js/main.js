document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

/* --- Compteur de clics sans cookie (27/10/2026) -----------------------------
 *
 * Au clic sur un bouton « Telecharger » (.exe) ou « Acheter » (Stripe), le
 * navigateur envoie au serveur de Solynov le bouton, l'edition, la page et la
 * provenance de la visite. Ni cookie, ni stockage, ni identifiant : rien
 * n'est lu ni ecrit sur l'appareil du visiteur, et le serveur ne garde que
 * des compteurs par jour (voir /veille).
 *
 * Independant du bandeau : c'est la mesure qui reste quand Google Ads ne
 * voit rien (visiteur qui refuse les cookies) et quand Cloudflare compte des
 * robots (ceux des messageries ouvrent les liens des mails, mais ne cliquent
 * pas sur les boutons).
 *
 * Provenance, calculee au clic, sans rien garder :
 *   annonce     identifiant de clic publicitaire dans l'adresse (gclid...)
 *   mail        utm_medium=email dans l'adresse, ou messagerie en ligne
 *   moteur      Google, Bing, Qwant, DuckDuckGo, Ecosia...
 *   interne     venu d'une autre page du site
 *   autre_site  lien depuis un autre site
 *   direct      aucun site d'origine (mail sans etiquette, favori, adresse
 *               tapee)
 *
 * Seul le site en ligne compte : une page ouverte depuis le poste (fichier
 * local) n'envoie rien, un navigateur automatise non plus. Un nouveau lien
 * de paiement Stripe doit etre ajoute a ACHATS, sinon ses clics ne sont pas
 * comptes.
 * -------------------------------------------------------------------------- */
(function () {
  if (!/(^|\.)solynov\.com$/i.test(location.hostname)) return;
  if (navigator.webdriver) return;

  var URL_CLIC = 'https://solynov-webhook.onrender.com/clic';
  var ACHATS = {
    '28E4gBfKd8qT1C41utaVa04': 'starter', // 189 EUR
    '14A6oJcy1ePhgwY5KJaVa05': 'bridge'   // 590 EUR
  };
  var MOTEURS = /(^|\.)(google\.[a-z]{2,3}(\.[a-z]{2})?|bing\.com|qwant\.com|duckduckgo\.com|ecosia\.org|search\.yahoo\.com|yandex\.[a-z]{2,3}|search\.brave\.com|startpage\.com|lilo\.org)$/;
  var MESSAGERIES = /^((web)?mail\d*|messagerie|zimbra)\.|^outlook\.(live|office|office365)\.com$|(^|\.)mail\.yahoo\.com$/;
  var envoyes = {}; // un envoi par bouton et par page vue (double-clic)

  function bouton(href) {
    var m;
    if (/SolynovFX-Starter-Setup\.exe/i.test(href)) return ['telecharger', 'starter'];
    if (/SolynovFX-Bridge-Setup\.exe/i.test(href)) return ['telecharger', 'bridge'];
    m = /buy\.stripe\.com\/([A-Za-z0-9]+)/.exec(href);
    if (m && ACHATS[m[1]]) return ['acheter', ACHATS[m[1]]];
    return null;
  }

  function hote(adresse) {
    try { return new URL(adresse).hostname.toLowerCase().replace(/^www\./, ''); }
    catch (e) { return ''; }
  }

  function provenance() {
    var q = location.search || '';
    if (/[?&](gclid|gbraid|wbraid|msclkid)=/i.test(q)) return 'annonce';
    if (/[?&]utm_medium=(cpc|ppc|paid|paid_search)(&|$)/i.test(q)) return 'annonce';
    if (/[?&]utm_medium=(e-?mail|courriel|mail)(&|$)/i.test(q)) return 'mail';
    if (!document.referrer) return 'direct';
    var h = hote(document.referrer);
    if (!h) return 'autre_site';
    if (h === location.hostname.toLowerCase().replace(/^www\./, '')) return 'interne';
    if (MESSAGERIES.test(h)) return 'mail';
    if (MOTEURS.test(h)) return 'moteur';
    return 'autre_site';
  }

  function envoyer(b) {
    var cle = b[0] + '/' + b[1];
    if (envoyes[cle]) return;
    envoyes[cle] = true;
    var corps = JSON.stringify({ bouton: b[0], edition: b[1], page: location.pathname, provenance: provenance() });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(URL_CLIC, corps)) return;
    } catch (e) {}
    try {
      fetch(URL_CLIC, { method: 'POST', body: corps, keepalive: true, mode: 'no-cors', credentials: 'omit' });
    } catch (e) {}
  }

  function surClic(e) {
    try {
      if (e.type === 'auxclick' && e.button !== 1) return; // clic molette seulement
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var b = bouton(a.getAttribute('href') || '');
      if (b) envoyer(b);
    } catch (err) {}
  }

  // Phase de capture : le compteur passe meme si un autre script arrete le clic.
  document.addEventListener('click', surClic, true);
  document.addEventListener('auxclick', surClic, true);
})();

/* --- Consentement cookies et mesure (Google Consent Mode v2) -----------------
 *
 * Avant le 27/10/2026, la balise Google n'etait chargee QUE si le visiteur
 * cliquait « Accepter ». Resultat : celui qui refusait le bandeau, ou qui
 * l'ignorait et cliquait directement sur le bouton de telechargement, n'etait
 * jamais compte. Google Ads voyait 1 telechargement la ou GitHub en comptait 8.
 *
 * MODE_AVANCE = true  : la balise est chargee tout de suite, avec TOUS les
 *                       consentements sur « denied » : aucun cookie, seulement
 *                       des signaux anonymes. Google n'en tire des conversions
 *                       modelisees qu'au-dela de 700 clics publicitaires sur
 *                       7 jours (par pays et domaine).
 * MODE_AVANCE = false : rien n'est charge avant un « Accepter » explicite.
 *                       Retenu le 27/10/2026 : sous le seuil des 700 clics,
 *                       Google Ads compte les memes conversions qu'en mode
 *                       avance (celles des visiteurs qui acceptent), sans
 *                       charger la balise avant tout choix (lecture stricte
 *                       de la CNIL).
 * -------------------------------------------------------------------------- */
(function () {
  var KEY = 'solynov_consent'; // 'granted' | 'denied'
  var ID = 'AW-18339834557';
  var MODE_AVANCE = false;

  var CONVERSION_ACHAT = 'AW-18339834557/Zo8JCKu5jNkcEL3VjqlE';
  var TELECHARGEMENTS = [
    { sel: 'a[href*="SolynovFX-Starter-Setup.exe"]', ev: 'download_starter', edition: 'starter', value: 5, sendTo: 'AW-18339834557/yoEsCL__2OscEL3VjqlE' },
    { sel: 'a[href*="SolynovFX-Bridge-Setup.exe"]', ev: 'download_bridge', edition: 'bridge', value: 20, sendTo: 'AW-18339834557/sQ2tCPz-2escEL3VjqlE' }
  ];

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}

  // La file et la fonction gtag existent avant tout chargement de script :
  // les appels passes ici sont rejoues par la balise des son arrivee.
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  // Etat par defaut : tout refuse. Aucun cookie n'est depose dans cet etat.
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'wait_for_update': 500
  });

  function accorder() {
    gtag('consent', 'update', {
      'ad_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted',
      'analytics_storage': 'granted'
    });
  }

  function chargerBalise() {
    if (window.__solynovBalise) return;
    window.__solynovBalise = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', ID);
    trackPurchaseIfMerci();
    trackDownloads();
  }

  // Page de confirmation /merci : enregistre la conversion « Achat » avec le
  // bon montant selon l'edition passee dans l'URL (?edition=starter|bridge).
  function trackPurchaseIfMerci() {
    var path = location.pathname.replace(/\/+$/, '').toLowerCase();
    if (!/(^|\/)merci(\.html)?$/.test(path)) return;
    var q = new URLSearchParams(location.search);
    var edition = (q.get('edition') || '').toLowerCase();
    var value = edition === 'bridge' ? 590 : (edition === 'starter' ? 189 : 1);
    var txn = q.get('session_id') || q.get('txn') || '';
    gtag('event', 'conversion', {
      'send_to': CONVERSION_ACHAT,
      'value': value,
      'currency': 'EUR',
      'transaction_id': txn
    });
  }

  // Suivi des telechargements (indicateur avance, avant l'achat).
  // Un ecouteur est pose sur chaque bouton menant a un installeur .exe,
  // par edition, des que la balise est chargee : tout de suite en mode
  // avance (l'evenement part alors sans cookie ni identifiant), apres
  // « Accepter » sinon. Valeur = valeur attendue d'un telechargement (5 EUR
  // Starter, 20 EUR Bridge), pas le prix de la version complete.
  function trackDownloads() {
    TELECHARGEMENTS.forEach(function (it) {
      document.querySelectorAll(it.sel).forEach(function (a) {
        if (a.__solynovDlTracked) return;
        a.__solynovDlTracked = true;
        a.addEventListener('click', function () {
          try {
            gtag('event', it.ev, { edition: it.edition, value: it.value, currency: 'EUR' });
            gtag('event', 'conversion', { send_to: it.sendTo, value: it.value, currency: 'EUR' });
          } catch (e) {}
        });
      });
    });
  }

  if (stored === 'granted') {
    accorder();
    chargerBalise();
    return;
  }
  if (stored === 'denied') {
    if (MODE_AVANCE) chargerBalise();
    return;
  }

  // Pas encore de choix : le bandeau est propose. En mode avance, la balise
  // part quand meme en mode refuse (visiteur mesure anonymement) ; sinon,
  // rien n'est charge avant « Accepter ».
  if (MODE_AVANCE) chargerBalise();

  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function build() {
    var b = document.createElement('div');
    b.className = 'rgpd-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Consentement aux cookies');
    b.innerHTML =
      '<p>Cookies de <strong>mesure d’audience</strong> et de <strong>publicité</strong> (dont Google), déposés seulement avec votre accord. <a href="mentions-legales.html">En savoir plus</a></p>' +
      '<div class="rgpd-actions"><button type="button" class="btn secondary rgpd-no">Refuser</button><button type="button" class="btn rgpd-yes">Accepter</button></div>';
    document.body.appendChild(b);
    function close() { if (b.parentNode) b.parentNode.removeChild(b); }
    b.querySelector('.rgpd-yes').addEventListener('click', function () { save('granted'); accorder(); chargerBalise(); close(); });
    b.querySelector('.rgpd-no').addEventListener('click', function () { save('denied'); close(); });
  }

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();
