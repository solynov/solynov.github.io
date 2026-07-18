document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

/* --- Consentement cookies (mesure d'audience + publicité, ex. Google) --- */
(function () {
  var KEY = 'solynov_consent'; // 'granted' | 'denied'

  function loadTracking() {
    if (window.__solynovTracking) return;
    window.__solynovTracking = true;
    /* Ne s'exécute qu'APRÈS consentement de l'utilisateur.
       TODO — insérer ici le tag Google (Analytics / Ads), par ex. :
         var s = document.createElement('script');
         s.async = true;
         s.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX';
         document.head.appendChild(s);
         window.dataLayer = window.dataLayer || [];
         function gtag(){ dataLayer.push(arguments); }
         gtag('js', new Date());
         gtag('config', 'G-XXXXXXX');
    */
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
