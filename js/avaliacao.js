/* ============================================
   SENTINEL IA — Avaliação do Projeto (QR Code)
   Botão Fixo no Canto Superior Direito & Modal Interativo
   ============================================ */

(function () {
  'use strict';

  function initAvaliacao() {
    // 1. Injetar botão e modal se ainda não existirem no DOM
    if (!document.getElementById('btnFixedAvaliacao')) {
      const btn = document.createElement('button');
      btn.id = 'btnFixedAvaliacao';
      btn.className = 'btn-fixed-avaliacao';
      btn.setAttribute('title', 'Avalie nosso projeto FECART');
      btn.setAttribute('aria-label', 'Avalie nosso projeto');
      btn.innerHTML = `
        <svg class="star-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span>Avalie nosso projeto</span>
      `;
      document.body.appendChild(btn);
    }

    if (!document.getElementById('modalAvaliacao')) {
      const modal = document.createElement('div');
      modal.id = 'modalAvaliacao';
      modal.className = 'avaliacao-modal-overlay';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'modalAvaliacaoTitle');
      modal.innerHTML = `
        <div class="avaliacao-modal-card">
          <div class="avaliacao-modal-header">
            <div class="avaliacao-modal-title" id="modalAvaliacaoTitle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;">
                <circle cx="12" cy="8" r="7"></circle>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
              </svg>
              Avalie nosso <span>projeto</span>
            </div>
            <button class="avaliacao-modal-close" id="btnCloseAvaliacao" aria-label="Fechar modal de avaliação">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="avaliacao-modal-body">
            <p class="avaliacao-modal-subtitle">
              Sua opinião é fundamental para aprimorarmos o <strong>Sentinel IA</strong> na FECART!
            </p>
            
            <div class="avaliacao-qr-wrapper">
              <img src="img/qrcode-avaliacao.png" alt="QR Code para Avaliação do Projeto" id="qrCodeImg" />
            </div>

            <div class="avaliacao-stars-row" title="5 estrelas para Sentinel IA">
              ★ ★ ★ ★ ★
            </div>

            <p class="avaliacao-modal-instruction">
              Aponte a câmera do seu smartphone para o QR Code acima para abrir a avaliação do projeto.
            </p>
          </div>
          <div class="avaliacao-modal-footer">
            <button class="avaliacao-btn-close-main" id="btnCloseAvaliacaoFooter">Fechar</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // 2. Event Listeners
    const btnOpen = document.getElementById('btnFixedAvaliacao');
    const modal = document.getElementById('modalAvaliacao');
    const btnCloseX = document.getElementById('btnCloseAvaliacao');
    const btnCloseFooter = document.getElementById('btnCloseAvaliacaoFooter');

    function openModal() {
      if (!modal) return;
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (btnOpen) {
      btnOpen.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    }

    if (btnCloseX) btnCloseX.addEventListener('click', closeModal);
    if (btnCloseFooter) btnCloseFooter.addEventListener('click', closeModal);

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
        closeModal();
      }
    });

    // Adiciona classe de espaçamento na topbar se existir
    const topbar = document.querySelector('.dashboard-topbar');
    if (topbar) {
      topbar.classList.add('with-feedback-btn');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAvaliacao);
  } else {
    initAvaliacao();
  }
})();
