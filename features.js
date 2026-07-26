/*
 * DogSister — fonctionnalités dynamiques (chat, réservation, abonnement, avis)
 * Vanilla JS pur, aucune dépendance, tout est persisté en localStorage.
 * Ce fichier est chargé sur les 6 pages du site ; chaque module se
 * désactive tout seul (silencieusement) si les éléments dont il a besoin
 * ne sont pas présents sur la page courante.
 */
(function () {
  'use strict';

  var COLOR_BORDEAUX = '#8a2140';
  var COLOR_BORDEAUX_DARK = '#701a33';
  var COLOR_CREAM = '#f3ede6';
  var EASE = 'cubic-bezier(.22,.61,.36,1)';

  // ---------------------------------------------------------------------
  // Utilitaires localStorage (lecture/écriture JSON défensives)
  // ---------------------------------------------------------------------
  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      var v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function fmtDate(ts) {
    try {
      return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return ''; }
  }
  function esc(str) {
    var d = document.createElement('div');
    d.textContent = String(str == null ? '' : str);
    return d.innerHTML;
  }

  function injectStyle(css) {
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ---------------------------------------------------------------------
  // Styles partagés des nouveaux composants (mêmes codes couleur / rayons
  // 24px / easing que le reste du site)
  // ---------------------------------------------------------------------
  injectStyle(
    '@keyframes ds-chat-in{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:none}}' +
    '@keyframes ds-typing{0%,100%{opacity:.25}50%{opacity:1}}' +
    '.ds-chat-fab{position:fixed;right:24px;bottom:24px;width:60px;height:60px;border-radius:24px;background:' + COLOR_BORDEAUX + ';' +
      'display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;box-shadow:0 12px 32px rgba(0,0,0,.25);' +
      'z-index:9998;transition:transform .25s ' + EASE + ',background .25s}' +
    '.ds-chat-fab:hover{background:' + COLOR_BORDEAUX_DARK + ';transform:translateY(-2px)}' +
    '.ds-chat-badge{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#fff;color:' + COLOR_BORDEAUX + ';font:700 12px/20px -apple-system,sans-serif;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.25)}' +
    '.ds-chat-panel{position:fixed;right:24px;bottom:96px;width:min(340px,calc(100vw - 32px));max-height:min(480px,calc(100vh - 140px));' +
      'background:' + COLOR_CREAM + ';border-radius:24px;box-shadow:0 24px 60px rgba(0,0,0,.3);display:flex;flex-direction:column;overflow:hidden;' +
      'z-index:9999;opacity:0;transform:translateY(16px) scale(.97);pointer-events:none;transition:opacity .3s ' + EASE + ',transform .3s ' + EASE + '}' +
    '.ds-chat-panel.ds-open{opacity:1;transform:none;pointer-events:auto;animation:ds-chat-in .3s ' + EASE + '}' +
    '.ds-chat-head{background:' + COLOR_BORDEAUX + ';color:#fff;padding:16px 18px;display:flex;align-items:center;gap:10px;font-weight:700;font-size:15px}' +
    '.ds-chat-head span{flex:1}' +
    '.ds-chat-close{background:rgba(255,255,255,.18);border:none;color:#fff;width:28px;height:28px;border-radius:14px;cursor:pointer;font-size:15px;line-height:1}' +
    '.ds-chat-close:hover{background:rgba(255,255,255,.32)}' +
    '.ds-chat-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;min-height:180px}' +
    '.ds-msg{max-width:80%;padding:10px 14px;border-radius:18px;font-size:14px;line-height:1.4;word-wrap:break-word}' +
    '.ds-msg-pro{align-self:flex-start;background:#fff;color:#1d1d1f;border-bottom-left-radius:4px}' +
    '.ds-msg-client{align-self:flex-end;background:' + COLOR_BORDEAUX + ';color:#fff;border-bottom-right-radius:4px}' +
    '.ds-msg-typing span{display:inline-block;width:6px;height:6px;margin:0 1px;border-radius:50%;background:#8a8a8e;animation:ds-typing 1s infinite}' +
    '.ds-msg-typing span:nth-child(2){animation-delay:.15s}.ds-msg-typing span:nth-child(3){animation-delay:.3s}' +
    '.ds-chat-form{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(0,0,0,.08);background:#fff}' +
    '.ds-chat-input{flex:1;font-family:inherit;font-size:14px;padding:10px 14px;border-radius:24px;border:1px solid #d2d2d7;outline:none}' +
    '.ds-chat-input:focus{border-color:' + COLOR_BORDEAUX + '}' +
    '.ds-chat-send{background:' + COLOR_BORDEAUX + ';color:#fff;border:none;width:40px;height:40px;border-radius:20px;cursor:pointer;font-size:15px;flex-shrink:0}' +
    '.ds-chat-send:hover{background:' + COLOR_BORDEAUX_DARK + '}' +
    '@media (max-width:480px){.ds-chat-fab{right:16px;bottom:16px}.ds-chat-panel{right:16px;bottom:88px}}' +

    '.ds-abo-badge{display:none;align-items:center;background:' + COLOR_BORDEAUX + ';color:#fff;font-size:12px;font-weight:600;' +
      'padding:5px 12px;border-radius:14px;margin-right:8px;letter-spacing:.02em;white-space:nowrap}' +

    '.ds-field{display:flex;flex-direction:column;gap:7px}' +
    '.ds-field label{font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#a1a1a6}' +
    '.ds-field input[type=date]{font-family:inherit;font-size:15px;padding:12px 0;border:none;border-bottom:1px solid #48484a;background:transparent;color:#f5f5f7;outline:none}' +

    '.ds-resa-confirm{background:' + COLOR_BORDEAUX + ';border-radius:24px;padding:32px;display:flex;flex-direction:column;gap:14px;' +
      'color:#fff;box-shadow:0 24px 60px rgba(0,0,0,.35);animation:ds-chat-in .4s ' + EASE + '}' +
    '.ds-resa-confirm h3{margin:0;font-size:22px;font-weight:700}' +
    '.ds-resa-confirm p{margin:0;font-size:15px;line-height:1.5;color:rgba(255,255,255,.85)}' +
    '.ds-resa-confirm button{align-self:flex-start;background:#fff;color:' + COLOR_BORDEAUX + ';border:none;font-size:14px;font-weight:600;' +
      'padding:11px 22px;border-radius:22px;cursor:pointer;margin-top:6px}' +

    'nav.ds-nav-scrolled{background:rgba(255,255,255,.85) !important;backdrop-filter:saturate(180%) blur(20px);' +
      '-webkit-backdrop-filter:saturate(180%) blur(20px);box-shadow:0 1px 0 rgba(0,0,0,.07)}'
  );

  function initAll() {
    initLoader();
    initAbonneSync();
    initChat();
    initReservation();
    initLocalVideoParallax();
    initNavScroll();
  }

  // =======================================================================
  // 7) Nav transparente en haut de page, qui redevient blanche/floutée dès
  //    qu'on scrolle un peu (lisible au-dessus de n'importe quel contenu).
  // =======================================================================
  function initNavScroll() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    function update() {
      nav.classList.toggle('ds-nav-scrolled', window.scrollY > 20);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }
  // Ce script est ré-exécuté par le "bundler" du site après que le vrai
  // contenu de la page a déjà été inséré dans le DOM (bien après le
  // DOMContentLoaded d'origine) : cet évènement ne se déclenchera donc
  // jamais une seconde fois. On lance l'init tout de suite si le document
  // est déjà prêt, sinon on attend l'évènement comme d'habitude.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // =======================================================================
  // 1) Système abonné : persistance du choix tarif normal / abonné et
  //    badge visible sur toutes les pages.
  // =======================================================================
  function initAbonneSync() {
    var KEY = 'ds_abo';
    function isAbo() { return localStorage.getItem(KEY) === '1'; }

    // Badge "★ Abonné" injecté dans la nav de chaque page.
    var nav = document.querySelector('nav');
    var badge = null;
    if (nav) {
      badge = document.createElement('span');
      badge.className = 'ds-abo-badge';
      badge.textContent = 'Abonné';
      var reserveBtn = nav.querySelector('a[href="Contact.html"], a[href="#reserver"]');
      if (reserveBtn && reserveBtn.parentElement === nav) nav.insertBefore(badge, reserveBtn);
      else nav.appendChild(badge);
      refreshBadge();
    }
    function refreshBadge() {
      if (badge) badge.style.display = isAbo() ? 'inline-flex' : 'none';
    }

    // Persistance des clics sur les boutons "Tarif normal" / "Tarif abonné"
    // (délégation d'évènement : fonctionne même si ces boutons sont générés
    // après coup par le composant réactif de la page Services).
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('button') : null;
      if (!btn) return;
      var label = (btn.textContent || '').trim();
      if (label === 'Tarif abonné') { localStorage.setItem(KEY, '1'); refreshBadge(); }
      else if (label === 'Tarif normal') { localStorage.setItem(KEY, '0'); refreshBadge(); }
    });

    // Au chargement de la page Services, ré-applique le choix mémorisé en
    // simulant un clic sur le bon onglet dès qu'il est disponible (le
    // composant réactif de la page peut mettre un instant à s'hydrater).
    if (isAbo()) {
      var tries = 0;
      (function apply() {
        var buttons = Array.prototype.slice.call(document.querySelectorAll('button'));
        var aboBtn = buttons.filter(function (b) { return (b.textContent || '').trim() === 'Tarif abonné'; })[0];
        if (aboBtn) { aboBtn.click(); return; }
        if (++tries < 40) setTimeout(apply, 100);
      })();
    }

    // Synchronisation entre onglets.
    window.addEventListener('storage', function (e) { if (e.key === KEY) refreshBadge(); });
  }

  // =======================================================================
  // 2) Chat client ↔ propriétaire (bulle flottante + panneau, localStorage)
  // =======================================================================
  function initChat() {
    var MSG_KEY = 'ds_chat';
    var READ_KEY = 'ds_chat_read_count';
    var GREETED_KEY = 'ds_chat_greeted';
    var REPLIES = [
      'Merci pour votre message, on revient vers vous très vite !',
      'Bien reçu ! Sarah ou Hanna vous répond dans quelques instants.',
      'Message reçu. On regarde ça et on vous confirme rapidement.'
    ];

    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'ds-chat-fab';
    fab.setAttribute('aria-label', 'Ouvrir le chat DogSister');
    fab.innerHTML =
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4.4 3.3A.5.5 0 0 1 4 19V5Z" ' +
      'stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>' +
      '<span class="ds-chat-badge" style="display:none"></span>';

    var panel = document.createElement('div');
    panel.className = 'ds-chat-panel';
    panel.innerHTML =
      '<div class="ds-chat-head"><span>DogSister · Sarah &amp; Hanna</span>' +
      '<button type="button" class="ds-chat-close" aria-label="Fermer le chat">✕</button></div>' +
      '<div class="ds-chat-body"></div>' +
      '<form class="ds-chat-form">' +
      '<input class="ds-chat-input" type="text" maxlength="500" placeholder="Écrivez votre message…" autocomplete="off">' +
      '<button type="submit" class="ds-chat-send" aria-label="Envoyer">➤</button>' +
      '</form>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    var body = panel.querySelector('.ds-chat-body');
    var form = panel.querySelector('.ds-chat-form');
    var input = panel.querySelector('.ds-chat-input');
    var closeBtn = panel.querySelector('.ds-chat-close');
    var badgeEl = fab.querySelector('.ds-chat-badge');

    function getMessages() { return readJSON(MSG_KEY, []); }
    function saveMessages(list) { writeJSON(MSG_KEY, list); }

    function renderMessages() {
      var list = getMessages();
      body.innerHTML = '';
      list.forEach(function (m) {
        var div = document.createElement('div');
        div.className = 'ds-msg ' + (m.from === 'client' ? 'ds-msg-client' : 'ds-msg-pro');
        div.textContent = m.text;
        body.appendChild(div);
      });
      body.scrollTop = body.scrollHeight;
    }

    function updateBadge() {
      var list = getMessages();
      var proCount = list.filter(function (m) { return m.from === 'pro'; }).length;
      var readCount = parseInt(localStorage.getItem(READ_KEY) || '0', 10);
      var unread = Math.max(0, proCount - readCount);
      if (unread > 0 && !panel.classList.contains('ds-open')) {
        badgeEl.style.display = 'block';
        badgeEl.textContent = unread > 9 ? '9+' : String(unread);
      } else {
        badgeEl.style.display = 'none';
      }
    }

    function markAllRead() {
      var list = getMessages();
      var proCount = list.filter(function (m) { return m.from === 'pro'; }).length;
      localStorage.setItem(READ_KEY, String(proCount));
      updateBadge();
    }

    function addMessage(from, text) {
      var list = getMessages();
      list.push({ from: from, text: text, ts: Date.now() });
      saveMessages(list);
      renderMessages();
      if (panel.classList.contains('ds-open')) markAllRead(); else updateBadge();
    }

    function showTyping(cb) {
      var typing = document.createElement('div');
      typing.className = 'ds-msg ds-msg-pro ds-msg-typing';
      typing.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;
      var delay = 1000 + Math.random() * 1000;
      setTimeout(function () {
        typing.remove();
        cb();
      }, delay);
    }

    function openPanel() {
      panel.classList.add('ds-open');
      if (getMessages().length === 0 && !localStorage.getItem(GREETED_KEY)) {
        localStorage.setItem(GREETED_KEY, '1');
        showTyping(function () {
          addMessage('pro', 'Bonjour ! Je suis Sarah, de DogSister. Comment puis-je vous aider avec votre chien ?');
        });
      }
      markAllRead();
      input.focus();
    }
    function closePanel() {
      panel.classList.remove('ds-open');
    }

    fab.addEventListener('click', function () {
      if (panel.classList.contains('ds-open')) closePanel(); else openPanel();
    });
    closeBtn.addEventListener('click', closePanel);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      addMessage('client', text);
      input.value = '';
      showTyping(function () {
        var reply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
        addMessage('pro', reply);
      });
    });

    renderMessages();
    updateBadge();
  }

  // =======================================================================
  // 3) Réservation de créneaux (page Contact) : ajoute un champ date,
  //    persiste la demande en localStorage et affiche un écran de
  //    confirmation. Se greffe sur le formulaire existant sans toucher au
  //    composant réactif déjà en place (services / créneaux / récurrence).
  // =======================================================================
  function initReservation() {
    var header = document.getElementById('reserver');
    if (!header) return; // pas la page Contact

    var card = header.querySelector('div[style*="background:#f5f5f7"]');
    if (!card) return;

    // Ajoute le champ date juste avant le champ nom (une seule fois).
    function ensureDateField() {
      if (card.querySelector('.ds-resa-date')) return;
      var nameInput = Array.prototype.slice.call(card.querySelectorAll('input'))
        .filter(function (i) { return i.placeholder === 'Votre nom'; })[0];
      if (!nameInput) return;
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;gap:10px';
      wrap.innerHTML =
        '<span style="font-size:14px;font-weight:600;color:#424245">Date</span>' +
        '<input type="date" class="ds-resa-date" style="font-family:inherit;font-size:16px;padding:14px 18px;' +
        'border-radius:12px;border:1px solid #d2d2d7;background:#fff;color:#1d1d1f;outline:none">';
      card.insertBefore(wrap, nameInput);
      var today = new Date().toISOString().slice(0, 10);
      var dateInput = wrap.querySelector('.ds-resa-date');
      dateInput.min = today;
      dateInput.value = today;
    }
    ensureDateField();
    // Le composant réactif peut re-générer la carte au premier rendu ;
    // on s'assure que le champ date reste bien présent peu après.
    setTimeout(ensureDateField, 300);

    // Panneau de confirmation (masqué par défaut), inséré une seule fois.
    var confirmPanel = card.parentElement.querySelector('.ds-resa-confirm');
    if (!confirmPanel) {
      confirmPanel = document.createElement('div');
      confirmPanel.className = 'ds-resa-confirm';
      confirmPanel.style.display = 'none';
      card.parentElement.insertBefore(confirmPanel, card.nextSibling);
    }

    function selectedChipLabel(groupHeadingText) {
      var groups = Array.prototype.slice.call(card.querySelectorAll('div'))
        .filter(function (d) {
          var prev = d.previousElementSibling;
          return prev && prev.tagName === 'SPAN' && prev.textContent.trim() === groupHeadingText;
        });
      var group = groups[0];
      if (!group) return '';
      var chips = Array.prototype.slice.call(group.querySelectorAll('button'));
      var picked = chips.filter(function (b) {
        return b.style.backgroundColor === 'rgb(138, 33, 64)';
      })[0];
      return picked ? picked.textContent.trim() : (chips[0] ? chips[0].textContent.trim() : '');
    }

    function saveReservation() {
      ensureDateField();
      var nameInput = Array.prototype.slice.call(card.querySelectorAll('input'))
        .filter(function (i) { return i.placeholder === 'Votre nom'; })[0];
      var emailInput = Array.prototype.slice.call(card.querySelectorAll('input'))
        .filter(function (i) { return i.placeholder && i.placeholder.indexOf('Email') === 0; })[0];
      var dateInput = card.querySelector('.ds-resa-date');
      if (!nameInput) return;

      var service = selectedChipLabel('Service');
      var slot = selectedChipLabel('Créneau');
      var recur = selectedChipLabel('Récurrence');
      var name = nameInput.value.trim();
      var email = emailInput ? emailInput.value.trim() : '';
      var date = dateInput ? dateInput.value : '';

      if (!name) { nameInput.focus(); nameInput.style.borderColor = '#c0392b'; return; }

      var list = readJSON('ds_reservations', []);
      list.push({ service: service, date: date, slot: slot, recur: recur, name: name, email: email, ts: Date.now() });
      writeJSON('ds_reservations', list);

      confirmPanel.innerHTML =
        '<h3>C\'est noté, ' + esc(name.split(' ')[0]) + ' !</h3>' +
        '<p>' + esc(service) + ' — ' + esc(date ? fmtDate(date) : '') + ' à ' + esc(slot) +
        (recur && recur !== 'Une seule fois' ? ' · ' + esc(recur.toLowerCase()) : '') + '.<br>' +
        'Nous revenons vers vous par chat pour confirmer.</p>' +
        '<button type="button" class="ds-resa-new">Faire une nouvelle demande</button>';
      confirmPanel.style.display = 'flex';
      card.style.display = 'none';
      confirmPanel.querySelector('.ds-resa-new').addEventListener('click', function () {
        confirmPanel.style.display = 'none';
        card.style.display = 'flex';
      });
    }

    // Délégation d'évènement sur le document : reste fonctionnelle même si
    // le composant réactif de la page régénère le bouton entre deux clics
    // (changement de service / créneau / récurrence). Vient s'ajouter au
    // gestionnaire déjà présent sur ce bouton, sans le remplacer.
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('button') : null;
      if (!btn || !card.contains(btn)) return;
      if (/^Réserver|^Demande envoyée/.test((btn.textContent || '').trim())) saveReservation();
    });
  }

  // Note : le dépôt d'avis a été retiré de la page publique — ce sera une
  // action faite par le client depuis son espace, après le rendez-vous,
  // pas un formulaire ouvert à tous sur la page d'accueil.

  // =======================================================================
  // 5) Vidéo de fond du Hero (page Accueil) : lecture en boucle, mise en
  //    pause dès qu'elle sort de l'écran pour ménager le CPU.
  // =======================================================================
  function initLocalVideoParallax() {
    var video = document.getElementById('ds-local-video');
    if (!video) return; // pas sur cette page

    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    function tryPlay() { var p = video.play(); if (p && p.catch) p.catch(function () {}); }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) tryPlay(); else video.pause();
        });
      }, { threshold: 0.1 }).observe(video);
    } else {
      tryPlay();
    }
  }

  // =======================================================================
  // 6) Loader d'entrée : petit écran de chargement bordeaux avec le logo.
  //    Affiché seulement à la première ouverture du site dans l'onglet
  //    (un script inline, juste après le loader dans le HTML, le masque
  //    instantanément via sessionStorage quand on navigue simplement d'une
  //    page à l'autre). Ici on ne gère que le fondu de sortie du tout
  //    premier affichage.
  // =======================================================================
  function initLoader() {
    var loader = document.getElementById('ds-loader');
    if (!loader || loader.style.display === 'none') return;
    setTimeout(function () {
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
      setTimeout(function () { loader.remove(); }, 650);
    }, 500);
  }
})();
