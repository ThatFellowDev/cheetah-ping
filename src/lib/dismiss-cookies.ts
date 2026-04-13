/**
 * Cookie/consent banner dismissal for screenshots.
 *
 * Mirror of workers/src/dismiss-cookies.ts for the Next.js server side.
 * Both files must stay in sync since Workers and Next.js have separate builds.
 */

const CONTAINER_SELECTORS = [
  '[class*="cookie" i]',
  '[id*="cookie" i]',
  '[class*="consent" i]',
  '[id*="consent" i]',
  '[class*="gdpr" i]',
  '[id*="gdpr" i]',
  '#onetrust-banner-sdk',
  '#onetrust-consent-sdk',
  '#CybotCookiebotDialog',
  '.cc-window',
  '.cc-banner',
  '.cmp-container',
  '.fc-consent-root',
  '#didomi-host',
  '.qc-cmp2-container',
  '.evidon-consent-button',
  '[aria-label*="cookie" i]',
  '[aria-label*="consent" i]',
].join(', ');

export const COOKIE_HIDE_CSS = `
${CONTAINER_SELECTORS.split(', ').join(',\n')} {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
`;

export const COOKIE_DISMISS_JS = `
(function() {
  try {
    var sel = ${JSON.stringify(CONTAINER_SELECTORS)};
    var acceptTexts = [
      'accept all', 'accept cookies', 'accept', 'allow all', 'allow cookies',
      'allow', 'agree', 'i agree', 'got it', 'ok', 'okay', 'dismiss',
      'close', 'continue', 'understood', 'confirm'
    ];
    var containers = document.querySelectorAll(sel);
    for (var i = 0; i < containers.length; i++) {
      var buttons = containers[i].querySelectorAll('button, a, [role="button"], input[type="submit"]');
      for (var j = 0; j < buttons.length; j++) {
        var text = (buttons[j].textContent || '').toLowerCase().trim();
        for (var k = 0; k < acceptTexts.length; k++) {
          if (text.indexOf(acceptTexts[k]) !== -1) {
            buttons[j].click();
            return;
          }
        }
      }
    }
  } catch(e) {}
})();
`;
