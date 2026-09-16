/* Ajuda padronizada do mapa: primeira visita automática + reabertura manual. */
(function () {
  'use strict';
  const STORAGE_KEY = 'sentinel_map_modal_seen';

  function inicializarAjudaMapa() {
    const modal = document.getElementById('mapInfoModal');
    const helpButton = document.getElementById('btnMapHelp');
    const closeButtons = [document.getElementById('btnCloseMapHelp'), document.getElementById('btnCloseMapHelpFooter')].filter(Boolean);
    if (!modal || !helpButton) return;

    const open = () => {
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      helpButton.setAttribute('aria-expanded', 'true');
      document.body.classList.add('map-info-modal-open');
      closeButtons[0]?.focus();
    };
    const close = () => {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      helpButton.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('map-info-modal-open');
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch (_) {}
      helpButton.focus();
    };

    helpButton.addEventListener('click', open);
    closeButtons.forEach(button => button.addEventListener('click', close));
    modal.addEventListener('click', event => { if (event.target === modal) close(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !modal.hidden) close();
    });

    let seen = false;
    try { seen = localStorage.getItem(STORAGE_KEY) === '1'; } catch (_) {}
    if (!seen) window.setTimeout(open, 350);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicializarAjudaMapa);
  else inicializarAjudaMapa();
})();
