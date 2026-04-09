(function () {
  // Ne fusson le az alap products.html oldalon (csak ott van közvetlen tartalom)
  var currentPage = window.location.pathname.split('/').pop();
  if (currentPage === 'products.html') return;

  // Modal HTML és stílusok injektálása
  var style = document.createElement('style');
  style.textContent = [
    '#vasarlo-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9998;display:none;align-items:center;justify-content:center;}',
    '#vasarlo-overlay.active{display:flex;}',
    '#vasarlo-modal{background:#e9f7f2;border-radius:16px;padding:2.5rem 2rem;max-width:420px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.18);z-index:9999;animation:vasarlo-in .25s ease;}',
    '@keyframes vasarlo-in{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}',
    '#vasarlo-modal h2{font-size:1.3rem;font-weight:700;color:#1a3d2b;margin:0 0 0.5rem;}',
    '#vasarlo-modal p{font-size:0.95rem;color:#3a6b4a;margin:0 0 1.75rem;}',
    '#vasarlo-modal .vasarlo-btns{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;}',
    '#vasarlo-modal .vasarlo-btn{flex:1;min-width:130px;padding:0.75rem 1.25rem;border:none;border-radius:8px;font-size:0.95rem;font-weight:600;cursor:pointer;transition:transform .2s,box-shadow .2s;}',
    '#vasarlo-modal .vasarlo-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.15);}',
    '#vasarlo-modal .vasarlo-btn-primary{background:#2d7a4f;color:#fff;}',
    '#vasarlo-modal .vasarlo-btn-secondary{background:#fff;color:#2d7a4f;border:2px solid #2d7a4f;}',
    '#vasarlo-modal .vasarlo-close{display:block;margin-top:1.25rem;background:none;border:none;color:#7aaa8a;font-size:0.85rem;cursor:pointer;text-decoration:underline;}'
  ].join('');
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.id = 'vasarlo-overlay';
  overlay.innerHTML = [
    '<div id="vasarlo-modal">',
    '  <h2>Hogyan vásárol?</h2>',
    '  <p>Kérjük, válassza ki, hogy magánszemélyként<br>vagy cégként szeretne vásárolni.</p>',
    '  <div class="vasarlo-btns">',
    '    <button class="vasarlo-btn vasarlo-btn-primary" id="vasarlo-btn-magan">Magánszemélyként</button>',
    '    <button class="vasarlo-btn vasarlo-btn-secondary" id="vasarlo-btn-ceg">Cégként</button>',
    '  </div>',
    '  <button class="vasarlo-close" id="vasarlo-close">Mégsem</button>',
    '</div>'
  ].join('');
  document.body.appendChild(overlay);

  function openModal(e) {
    e.preventDefault();
    overlay.classList.add('active');
  }

  function closeModal() {
    overlay.classList.remove('active');
  }

  document.getElementById('vasarlo-btn-magan').addEventListener('click', function () {
    window.location.href = 'products-maganszemelyeknek.html';
  });

  document.getElementById('vasarlo-btn-ceg').addEventListener('click', function () {
    window.location.href = 'products-cegeknek.html';
  });

  document.getElementById('vasarlo-close').addEventListener('click', closeModal);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  // Linkek figyelése – jelenlegi és jövőbeli elemek kezelése
  function attachListeners() {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href && (href === 'products.html' || href.endsWith('/products.html'))) {
        if (!a.dataset.vasarloAttached) {
          a.dataset.vasarloAttached = '1';
          a.addEventListener('click', openModal);
        }
      }
    });
  }

  attachListeners();

  // MutationObserver a dinamikusan betöltött linkekhez
  var observer = new MutationObserver(attachListeners);
  observer.observe(document.body, { childList: true, subtree: true });
})();
