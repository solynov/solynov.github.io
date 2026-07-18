document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

/* Bandeau RGPD / confidentialité (mémorise l'acceptation, sans cookie tiers) */
(function () {
  var KEY = 'solynov_rgpd_ok';
  try { if (localStorage.getItem(KEY) === '1') return; } catch (e) {}
  function build() {
    var b = document.createElement('div');
    b.className = 'rgpd-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Information sur les données personnelles');
    b.innerHTML =
      '<p>SOLYNOV fonctionne <strong>localement</strong> : vos données de facturation restent sur votre poste et ne nous sont pas transmises. ' +
      'Ce site n’utilise <strong>aucun cookie de suivi</strong>. En savoir plus dans nos <a href="mentions-legales.html">mentions légales</a>.</p>' +
      '<button type="button" class="btn rgpd-ok">J’ai compris</button>';
    document.body.appendChild(b);
    b.querySelector('.rgpd-ok').addEventListener('click', function () {
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      b.parentNode && b.parentNode.removeChild(b);
    });
  }
  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();
