document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

/* --- Consentement cookies (mesure d'audience + publicité, ex. Google) --- */
(function () {
  var KEY = 'solynov_consent'; // 'granted' | 'denied'

  function loadTracking() {
    if (window.__solynovTracking) return;
    window.__solynovTracking = true;

    // Consentement obtenu : chargement de la balise Google (Google Ads).
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=AW-18339834557';
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'AW-18339834557');
    gtag('config', 'G-ZHP7FEGFK0');

    trackPurchaseIfMerci();
  }

  // Page de confirmation /merci : enregistre la conversion "Achat" avec le
  // bon montant selon l'edition passee dans l'URL (?edition=starter|bridge).
  function trackPurchaseIfMerci() {
    var path = location.pathname.replace(/\/+$/, '').toLowerCase();
    if (!/(^|\/)merci(\.html)?$/.test(path)) return;
    var q = new URLSearchParams(location.search);
    var edition = (q.get('edition') || '').toLowerCase();
    var value = edition === 'bridge' ? 249 : (edition === 'starter' ? 49 : 1);
    var txn = q.get('session_id') || q.get('txn') || '';
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'conversion', {
      'send_to': 'AW-18339834557/Zo8JCKu5jNkcEL3VjqlE',
      'value': value,
      'currency': 'EUR',
      'transaction_id': txn
    });
  }

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  if (stored === 'granted') { loadTracking(); return; }
  if (stored === 'denied') { return; }

  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function build() {
    var b = document.createElement('div');
    b.className = 'rgpd-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Consentement aux cookies');
    b.innerHTML =
      '<p>Nous utilisons des cookies de <strong>mesure d’audience</strong> et de <strong>publicité</strong> (dont Google) pour améliorer le site et accompagner le lancement. Ils ne sont déposés qu’avec votre accord. Vos données de facturation, elles, restent sur votre poste. <a href="mentions-legales.html">En savoir plus</a>.</p>' +
      '<div class="rgpd-actions"><button type="button" class="btn secondary rgpd-no">Refuser</button><button type="button" class="btn rgpd-yes">Accepter</button></div>';
    document.body.appendChild(b);
    function close() { if (b.parentNode) b.parentNode.removeChild(b); }
    b.querySelector('.rgpd-yes').addEventListener('click', function () { save('granted'); loadTracking(); close(); });
    b.querySelector('.rgpd-no').addEventListener('click', function () { save('denied'); close(); });
  }

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();
