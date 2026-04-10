import * as cheerio from 'cheerio';

export function extractContent(html: string, selector?: string | null): string {
  const $ = cheerio.load(html);

  $(
    'script, style, nav, footer, noscript, iframe, svg, ' +
    // Cookie / consent banners
    '[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"], ' +
    // Ad containers
    '[class*="ad-"], [class*="advert"], ins.adsbygoogle, [data-ad], [class*="sponsored"], ' +
    // Chat widgets
    '[class*="chat-widget"], [id*="intercom"], [id*="drift"], [id*="hubspot"], ' +
    // Timestamps in common wrappers
    'time[datetime], [class*="timestamp"], [class*="time-ago"], ' +
    // Social share buttons
    '[class*="share-"], [class*="social-share"]'
  ).remove();

  if (selector) {
    const element = $(selector);
    if (element.length === 0) return '';
    return element.text().replace(/\s+/g, ' ').trim();
  }

  return $('body').text().replace(/\s+/g, ' ').trim();
}
