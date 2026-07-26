// Curseur custom DogSister — petit point qui suit précisément la souris,
// plus un halo bordeaux qui suit avec un léger retard (lerp) et grossit au
// survol des éléments interactifs. Le curseur natif reste visible
// (indispensable pour les champs de formulaire) : ce script n'ajoute qu'un
// effet décoratif par-dessus.
//
// Script classique (pas un module ES) : chargé via <script src="cursor.js">
// normal, pour fonctionner aussi bien en local (file://) qu'en ligne — les
// modules ES bloquent les imports dynamiques cross-origin sous file://.
(function () {
  function initCursor() {
    if (window.__dsCursorInit) return;
    window.__dsCursorInit = true;

    // Pas de curseur custom sur mobile / tablette (pointeur tactile).
    if (!window.matchMedia || matchMedia('(pointer: coarse)').matches) return;

    var style = document.createElement('style');
    style.textContent =
      'html,body,a,button{cursor:none !important}' +
      'input,textarea,select,[contenteditable]{cursor:text !important}' +
      '.ds-cursor-dot{position:fixed;top:0;left:0;width:6px;height:6px;margin:-3px 0 0 -3px;' +
        'border-radius:50%;background:#8a2140;pointer-events:none;z-index:100000;opacity:0;' +
        'transition:opacity .3s ease;}' +
      '.ds-cursor-dot.ds-cursor-visible{opacity:1}' +
      '.ds-cursor-ring{position:fixed;top:0;left:0;width:28px;height:28px;margin:-14px 0 0 -14px;' +
        'border-radius:50%;border:1.5px solid rgba(138,33,64,.5);background:rgba(138,33,64,.06);' +
        'pointer-events:none;z-index:99999;opacity:0;' +
        'transition:opacity .3s ease,width .3s cubic-bezier(.22,.61,.36,1),height .3s cubic-bezier(.22,.61,.36,1),' +
        'margin .3s cubic-bezier(.22,.61,.36,1),background .3s ease,border-color .3s ease;}' +
      '.ds-cursor-ring.ds-cursor-visible{opacity:1}' +
      '.ds-cursor-ring.ds-cursor-hover{width:50px;height:50px;margin:-25px 0 0 -25px;background:rgba(138,33,64,.12);border-color:#8a2140}' +
      '@media (prefers-reduced-motion: reduce){.ds-cursor-ring,.ds-cursor-dot{transition:opacity .2s ease}}';
    document.head.appendChild(style);

    var dot = document.createElement('div');
    dot.className = 'ds-cursor-dot';
    document.body.appendChild(dot);

    var ring = document.createElement('div');
    ring.className = 'ds-cursor-ring';
    document.body.appendChild(ring);

    var x = window.innerWidth / 2, y = window.innerHeight / 2;
    var rx = x, ry = y;

    function loop() {
      // Lissage exponentiel (lerp) pour un mouvement "premium" avec inertie.
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      dot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    window.addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY;
      ring.classList.add('ds-cursor-visible');
      dot.classList.add('ds-cursor-visible');
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      ring.classList.remove('ds-cursor-visible');
      dot.classList.remove('ds-cursor-visible');
    });

    var HOVER_SEL = 'a, button, input, textarea, select, [style-hover]';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(HOVER_SEL)) ring.classList.add('ds-cursor-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(HOVER_SEL)) ring.classList.remove('ds-cursor-hover');
    });
  }

  window.initCursor = initCursor;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCursor);
  } else {
    initCursor();
  }
})();
