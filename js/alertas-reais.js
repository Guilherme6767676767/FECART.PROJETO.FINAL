/* Compatibilidade legada.
 * A fonte única de dados é js/alertas.js (window.SentinelAlertas.dados).
 * Este arquivo não mantém uma cópia dos alertas e não inclui data/hora.
 */
(function () {
  'use strict';
  window.SENTINEL_REAL_ALERTS = window.SentinelAlertas ? window.SentinelAlertas.dados : [];
})();
