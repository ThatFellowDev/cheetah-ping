import { chromium, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const OUT_DIR = path.join(__dirname, '..', 'docs', 'competitive');
const SCREENSHOTS_DIR = path.join(OUT_DIR, 'screenshots');

interface CompetitorConfig {
  name: string;
  slug: string;
  urls: { label: string; url: string }[];
}

const competitors: CompetitorConfig[] = [
  {
    name: 'Visualping',
    slug: 'visualping',
    urls: [
      { label: 'homepage', url: 'https://visualping.io/' },
      { label: 'pricing', url: 'https://visualping.io/pricing' },
    ],
  },
  {
    name: 'UptimeRobot',
    slug: 'uptimerobot',
    urls: [
      { label: 'homepage', url: 'https://uptimerobot.com/' },
      { label: 'pricing', url: 'https://uptimerobot.com/pricing/' },
    ],
  },
];

async function extractPageData(page: Page) {
  const title = await page.title();

  const metaDesc = await page
    .$eval('meta[name="description"]', (el) => el.getAttribute('content'))
    .catch(() => '');

  const h1 = await page.$eval('h1', (el) => el.textContent?.trim() || '').catch(() => '');

  const h2s = await page.$$eval('h2', (els) =>
    els.map((el) => el.textContent?.trim() || '').filter((t) => t.length > 3 && t.length < 200)
  ).catch(() => [] as string[]);

  const fullText = await page.$eval('body', (el) => el.innerText.slice(0, 10000)).catch(() => '');

  return { title, metaDesc, h1, h2s, fullText };
}

async function main() {
  console.log('Starting competitive analysis...\n');

  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  for (const competitor of competitors) {
    console.log(`\nAnalyzing ${competitor.name}...`);
    let markdown = `# ${competitor.name} - Competitive Analysis\n\n`;
    markdown += `*Crawled: ${new Date().toISOString()}*\n\n`;

    for (const { label, url } of competitor.urls) {
      const page = await context.newPage();
      console.log(`  Navigating to ${url}...`);

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);

        // Screenshot
        const screenshotPath = path.join(SCREENSHOTS_DIR, `${competitor.slug}-${label}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  Screenshot: ${screenshotPath}`);

        // Extract data
        const data = await extractPageData(page);

        markdown += `## ${label.charAt(0).toUpperCase() + label.slice(1)} (${url})\n\n`;
        markdown += `**Title:** ${data.title}\n\n`;
        markdown += `**Meta Description:** ${data.metaDesc}\n\n`;
        markdown += `**H1:** ${data.h1}\n\n`;

        if (data.h2s.length > 0) {
          markdown += `### Section Headlines\n`;
          data.h2s.forEach((h) => (markdown += `- ${h}\n`));
          markdown += '\n';
        }

        markdown += `### Full Page Text (first 5000 chars)\n\`\`\`\n${data.fullText.slice(0, 5000)}\n\`\`\`\n\n`;
        markdown += `---\n\n`;

        console.log(`  Extracted: "${data.h1}" + ${data.h2s.length} sections`);
      } catch (err) {
        markdown += `## ${label} (${url})\n\n**Error:** ${err}\n\n---\n\n`;
        console.error(`  Error: ${err}`);
      } finally {
        await page.close();
      }
    }

    const outPath = path.join(OUT_DIR, `${competitor.slug}.md`);
    fs.writeFileSync(outPath, markdown);
    console.log(`  Report: ${outPath}`);
  }

  await browser.close();
  console.log('\nDone! Check docs/competitive/ for reports and screenshots.');
}

main().catch(console.error);
