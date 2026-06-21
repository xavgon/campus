/** Cliente empacotado em Electron (desktop). */
export const IS_ELECTRON =
  typeof navigator !== 'undefined' && /\bElectron\b/i.test(navigator.userAgent);
