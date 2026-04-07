import * as cheerio from 'cheerio';

export function extractContent(html: string, selector?: string | null): string {
  const $ = cheerio.load(html);

  $('script, style, nav, footer, noscript, iframe, svg').remove();

  if (selector) {
    const element = $(selector);
    if (element.length === 0) return '';
    return element.text().replace(/\s+/g, ' ').trim();
  }

  return $('body').text().replace(/\s+/g, ' ').trim();
}
