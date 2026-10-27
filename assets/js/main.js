document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

/* --- Consentement cookies et mesure (Google Consent Mode v2) -----------------
 *
 * Avant le 27/10/2026, la balise Google n'etait chargee QUE si le visiteur
 * cliquait « Accepter ». Resultat : celui qui refusait le bandeau, ou qui
 * l'ignorait et cliquait directement sur le bouton de telechargement, n'etait
 * jamais compte. Google Ads voyait 1 telechargement la ou GitHub en comptait 8.
 *
 * Desormais : la balise est chargee avec TOUS les consentements sur « denied ».
 * Dans cet etat elle n'ecrit ni ne lit aucun cookie et n'envoie que des signaux
 * anonymes, a partir desquels Google modelise les conversions manquantes.
 * Si le visiteur accepte, on passe a « granted » et la mesure devient complete.
 *
 * MODE_AVANCE = true  : balise chargee tout de suite, consentements refuses
 *                       par defaut (conversions modelisees -- recommande).
 * MODE_AVANCE = false : rien n'est charge avant un « Accepter » explicite,
 *                       comme avant le 27/10/2026 (aucune modelisation).
 * -------------------------------------------------------------------------- */
(function () {
  var KEY = 'solynov_consent'; // 'granted' | 'denied'
  var ID = 'AW-18339834557';
  var MODE_AVANCE = true;

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
  // par edition. Les ecouteurs sont poses meme sans consentement : en mode
  // refuse, l'evenement part sans cookie ni identifiant et alimente la
  // modelisation. Valeur = valeur attendue d'un telechargement (5 EUR
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

  // Pas encore de choix : la balise part quand meme en mode refuse, et le
  // bandeau est propose. Le visiteur qui l'ignore est donc mesure
  // anonymement ; celui qui accepte l'est nominativement.
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
