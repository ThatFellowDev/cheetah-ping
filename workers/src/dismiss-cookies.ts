/**
 * Cookie/consent banner dismissal for screenshots.
 *
 * Two layers:
 * 1. JS that clicks common "Accept" buttons in known cookie containers
 * 2. CSS fallback that hides any remaining banners
 *
 * Injected into Browserless /chrome/screenshot via addScriptTag + addStyleTag.
 */

/** CSS selectors targeting known cookie/consent banner containers. */
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

/** CSS that hides known cookie/consent banners. Applied as a fallback. */
export const COOKIE_HIDE_CSS = `
${CONTAINER_SELECTORS.split(', ').join(',\n')} {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
`;

/**
 * Self-executing JS that finds and clicks "Accept" buttons inside known
 * cookie/consent containers. Runs before the CSS fallback takes effect,
 * so the banner is dismissed properly (not just hidden).
 */
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
