import * as cheerio from 'cheerio';

export type Robustness = 'high' | 'medium' | 'low';

export interface SelectorValidation {
  valid: boolean;
  robustness: Robustness;
  warnings: string[];
  suggestion: string | null;
}

/** Checks if a CSS selector string is syntactically valid using Cheerio. */
export function isValidCssSelector(selector: string): boolean {
  try {
    const $ = cheerio.load('<div></div>');
    $(selector);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a CSS selector and returns robustness scoring + warnings.
 * Optionally accepts HTML to provide richer suggestions (e.g. "use #id instead").
 */
export function validateSelector(
  selector: string,
  html?: string
): SelectorValidation {
  const warnings: string[] = [];
  let suggestion: string | null = null;

  // 1. Syntax check
  if (!isValidCssSelector(selector)) {
    return { valid: false, robustness: 'low', warnings: ['Invalid CSS selector syntax'], suggestion: null };
  }

  // 2. Fragility heuristics
  const parts = selector.split(/\s*>\s*|\s+/);
  const depth = parts.length;

  // Deep chains
  if (depth > 4) {
    warnings.push('Deeply nested selector — may break if page structure changes');
  }

  // nth-child / nth-of-type
  if (/nth-(child|of-type)/i.test(selector)) {
    warnings.push('nth-child/nth-of-type selectors are fragile and position-dependent');
  }

  // Auto-generated style selectors (multiple generic tags chained)
  const genericTags = parts.filter((p) => /^(div|span|section|ul|li|ol|table|tr|td|p)$/i.test(p.trim()));
  if (genericTags.length >= 3) {
    warnings.push('Selector chains multiple generic tags — likely auto-generated and fragile');
  }

  // 3. Robustness score
  let robustness: Robustness = 'medium';

  const hasId = /#[\w-]+/.test(selector);
  const hasDataAttr = /\[data-[\w-]+/.test(selector);
  const hasSemantic = /^(main|article|header|footer|aside|nav|section)\b/i.test(selector);

  if (hasId || hasDataAttr) {
    robustness = 'high';
  } else if (hasSemantic || depth <= 2) {
    robustness = 'medium';
  }

  if (depth > 4 || genericTags.length >= 3 || /nth-(child|of-type)/i.test(selector)) {
    robustness = 'low';
  }

  // 4. Suggest simplification if HTML provided
  if (html && robustness !== 'high') {
    try {
      const $ = cheerio.load(html);
      const el = $(selector).first();
      if (el.length > 0) {
        const id = el.attr('id');
        if (id) {
          suggestion = `#${id}`;
        } else {
          const node = el.get(0) as any;
          const dataAttrs = Object.keys(node?.attribs || {}).filter((a: string) => a.startsWith('data-'));
          if (dataAttrs.length > 0) {
            const tag = node?.tagName || '*';
            suggestion = `${tag}[${dataAttrs[0]}="${el.attr(dataAttrs[0])}"]`;
          }
        }
      }
    } catch {
      // Ignore — suggestion is optional
    }
  }

  return { valid: true, robustness, warnings, suggestion };
}

/**
 * Analyzes an HTML document and returns a preview of what a selector would extract.
 */
export function previewSelector(
  html: string,
  selector: string
): { matchCount: number; extractedText: string } {
  try {
    const $ = cheerio.load(html);
    $('script, style, nav, footer, noscript, iframe, svg').remove();

    const elements = $(selector);
    const matchCount = elements.length;

    if (matchCount === 0) {
      return { matchCount: 0, extractedText: '' };
    }

    const text = elements.text().replace(/\s+/g, ' ').trim();
    return { matchCount, extractedText: text.slice(0, 2000) };
  } catch {
    return { matchCount: 0, extractedText: '' };
  }
}
