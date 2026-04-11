'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlowButton } from '@/shared/components/motion-wrapper';
import { toast } from 'sonner';
import { PLAN_LIMITS, FREQUENCY_OPTIONS, type Plan } from '@/lib/plan-limits';
import {
  Globe,
  Crosshair,
  Search,
  Info,
  Loader2,
  Check,
  Briefcase,
  ShoppingCart,
  TrendingDown,
  Building2,
  CalendarCheck,
  ExternalLink,
  Brain,
  Radar,
  Eye,
  Shield,
  Bell,
  Hash,
  X,
} from 'lucide-react';
import { SelectorPreviewPanel } from './components/selector-preview-panel';
import { SelectorSuggestions, type SelectorSuggestion } from './components/selector-suggestions';
import { PagePickerDialog } from './components/page-picker-dialog';

interface PagePreview {
  title: string;
  description: string;
  favicon: string;
  ogImage: string;
}

interface AiSuggestion {
  label: string;
  watchMode: 'page' | 'selector' | 'keyword';
  keyword: string | null;
  selector: string | null;
  summary: string;
  intentSummary: string;
  alertExplanation: string;
  suggestedFrequencyMinutes: number;
  confidence: 'ai' | 'basic';
  selectorSuggestions?: SelectorSuggestion[];
  pagePreview?: PagePreview;
  contentPreview?: string;
}

const inspirations = [
  { icon: Briefcase, label: 'Job postings', placeholder: 'https://company.com/careers', intent: 'Alert me when new jobs are posted' },
  { icon: ShoppingCart, label: 'Restocks', placeholder: 'https://store.com/product', intent: 'Alert me when this is back in stock' },
  { icon: TrendingDown, label: 'Price drops', placeholder: 'https://store.com/product', intent: 'Alert me when the price drops' },
  { icon: Building2, label: 'Apartments', placeholder: 'https://apartments.com/listing', intent: 'Alert me when new listings appear' },
  { icon: CalendarCheck, label: 'Appointments', placeholder: 'https://appointments.gov', intent: 'Alert me when appointment slots open' },
  { icon: Globe, label: 'News & blogs', placeholder: 'https://news.site.com', intent: 'Alert me when new articles are published' },
  { icon: Eye, label: 'Competitors', placeholder: 'https://competitor.com/pricing', intent: 'Alert me when their pricing changes' },
  { icon: Shield, label: 'Government', placeholder: 'https://agency.gov/updates', intent: 'Alert me when this page is updated' },
  { icon: Bell, label: 'Event tickets', placeholder: 'https://ticketsite.com/event', intent: 'Alert me when tickets become available' },
  { icon: Hash, label: 'Social media', placeholder: 'https://twitter.com/username', intent: 'Alert me when new content is posted' },
];

const watchModes = [
  {
    id: 'page' as const,
    icon: Globe,
    title: 'Whole page',
    description: 'Alert on any visible change',
  },
  {
    id: 'selector' as const,
    icon: Crosshair,
    title: 'Page section',
    description: 'Watch one part of the page',
  },
  {
    id: 'keyword' as const,
    icon: Search,
    title: 'Keyword',
    description: 'Watch for a word to appear',
  },
];

export function MonitorForm({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [urlPlaceholder, setUrlPlaceholder] = useState('https://example.com');
  const [intent, setIntent] = useState('');
  const [intentPlaceholder, setIntentPlaceholder] = useState('e.g. "Alert me when the price drops"');
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);

  const [label, setLabel] = useState('');
  const [watchMode, setWatchMode] = useState<'page' | 'selector' | 'keyword'>('page');
  const [keyword, setKeyword] = useState('');
  const [selector, setSelector] = useState('');
  const [frequency, setFrequency] = useState<number>(0);
  const [faviconError, setFaviconError] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const limits = PLAN_LIMITS[plan];
  const allowedFrequencies = FREQUENCY_OPTIONS.filter(
    (f) => f.value >= limits.minIntervalMinutes
  );

  const analyzed = suggestion !== null;

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
      setUrl(cleanUrl);
    }

    setAnalyzing(true);
    setScreenshotLoading(true);
    setScreenshotUrl(null);
    setFaviconError(false);

    // Fire the screenshot in the background — as soon as analyze finishes,
    // the post-analyzed view appears and the screenshot block shows its own
    // loading state. When the screenshot eventually arrives it swaps in.
    // Screenshot failures degrade silently (browserless / R2 hiccups should
    // not block monitor creation).
    void fetch('/api/monitors/screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl }),
    })
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (r.ok && j?.data?.screenshotUrl) {
          setScreenshotUrl(j.data.screenshotUrl);
        } else {
          console.warn('[screenshot] preview unavailable:', j?.error ?? r.statusText);
        }
      })
      .catch((err) => console.warn('[screenshot] preview unavailable:', err))
      .finally(() => setScreenshotLoading(false));

    try {
      const res = await fetch('/api/monitors/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, intent: intent.trim() || undefined }),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Couldn't analyze that page");
        return;
      }

      const data = result.data as AiSuggestion;
      setSuggestion(data);
      setLabel(data.label);
      setWatchMode(data.watchMode);
      setKeyword(data.keyword || '');
      setSelector(data.selector || '');
      // Use AI-suggested frequency, clamped to plan minimum
      const suggestedFreq = data.suggestedFrequencyMinutes || 60;
      const clampedFreq = Math.max(suggestedFreq, limits.minIntervalMinutes);
      const bestMatch = allowedFrequencies.reduce((prev, curr) =>
        Math.abs(curr.value - clampedFreq) < Math.abs(prev.value - clampedFreq) ? curr : prev
      );
      setFrequency(bestMatch.value);
    } catch {
      toast.error('Something went wrong analyzing the page');
    } finally {
      setAnalyzing(false);
    }
  }

  function handleReset() {
    setSuggestion(null);
    setLabel('');
    setWatchMode('page');
    setKeyword('');
    setSelector('');
    setFrequency(0);
    setShowCustomize(false);
    setScreenshotUrl(null);
    setScreenshotLoading(false);
  }

  function handleClearAll() {
    handleReset();
    setUrl('');
    setIntent('');
    setUrlPlaceholder('https://example.com');
    setIntentPlaceholder('e.g. "Alert me when the price drops"');
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        url: url.trim(),
        label: label || undefined,
        checkIntervalMinutes: frequency,
      };

      if (watchMode === 'keyword' && keyword) body.keyword = keyword;
      if (watchMode === 'selector' && selector) body.selector = selector;
      // Pass through the preview screenshot as the monitor's baseline so the
      // first detected change has a "before" image to compare against.
      if (screenshotUrl) body.lastScreenshotUrl = screenshotUrl;

      const res = await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Failed to create monitor');
        return;
      }

      toast.success("Monitor created! We'll start checking right away.");
      router.push(`/monitors/${result.data.id}`);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setCreating(false);
    }
  }

  const pagePreview = suggestion?.pagePreview;

  return (
    <div className="space-y-5">
      {/* Suggestion chips + try it example */}
      {!analyzed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Try it example */}
          <button
            type="button"
            onClick={() => {
              setUrl('https://www.apple.com/newsroom/');
              setIntent('Alert me when Apple publishes a new press release');
              setIntentPlaceholder('Alert me when Apple publishes a new press release');
            }}
            className="w-full glass rounded-xl p-3 text-left border border-transparent hover:border-primary/30 transition-all group cursor-pointer"
          >
            <p className="text-[11px] text-primary font-medium mb-1">Try it. See how it works.</p>
            <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Watch <span className="font-mono text-foreground/70">apple.com/newsroom</span> for new press releases
            </p>
          </button>

          <div className="space-y-2">
            <p className="text-xs text-center text-muted-foreground">
              Or try watching for...
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {inspirations.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setUrlPlaceholder(item.placeholder);
                    setIntentPlaceholder(item.intent);
                    setIntent(item.intent);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs glass border border-transparent hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground"
                >
                  <item.icon className="h-3 w-3 text-primary" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* URL input — always visible */}
      <Card className="glass border-0">
        <CardContent className="pt-6 pb-6">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-base font-medium">
                {analyzed ? 'Watching' : 'Paste the URL you want to watch'}
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="url"
                    placeholder={urlPlaceholder}
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (analyzed) handleReset();
                    }}
                    className="h-12 text-base pr-10"
                    autoFocus
                    disabled={analyzing}
                  />
                  {url && !analyzing && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                      title="Clear and start over"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {analyzed && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 w-12 flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/5 transition-all shrink-0"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
              </div>
            </div>

            {!analyzed && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="intent" className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-primary" />
                    What should we watch for? <span className="text-muted-foreground/50">(optional)</span>
                  </Label>
                  <Input
                    id="intent"
                    placeholder={intentPlaceholder}
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    className="h-10"
                    disabled={analyzing}
                  />
                </div>
                <GlowButton type="submit" className="w-full" disabled={analyzing || !url.trim()}>
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scanning page...
                    </>
                  ) : (
                    'Start watching'
                  )}
                </GlowButton>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Everything below appears after analysis — inline */}
      <AnimatePresence>
        {analyzed && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="space-y-4"
          >
            {/* Compact page preview — L4 reassurance, muted */}
            {pagePreview && (pagePreview.title || pagePreview.description) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 text-xs text-muted-foreground/70 px-1"
              >
                {pagePreview.favicon && !faviconError ? (
                  <img
                    src={pagePreview.favicon}
                    alt=""
                    className="w-4 h-4 rounded shrink-0"
                    onError={() => setFaviconError(true)}
                  />
                ) : (
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="truncate">
                  {pagePreview.title || new URL(url).hostname}
                </span>
              </motion.div>
            )}

            {/* Screenshot preview — the visual confirmation that we're watching the right page.
                 Shown as soon as Browserless returns the capture (in parallel with analyze).
                 Silently absent if Browserless / R2 are unavailable — we degrade gracefully. */}
            {(screenshotLoading || screenshotUrl) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/20 aspect-[16/10]"
              >
                {screenshotUrl ? (
                  <img
                    src={screenshotUrl}
                    alt="Page preview"
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Capturing your page...</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* AI intent summary — L1 hero, the moneyshot */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative pl-4 py-1 border-l-2 border-primary/60 space-y-2"
            >
              <div className="flex items-start gap-3">
                <Radar className="h-5 w-5 text-primary mt-1 shrink-0" />
                <p className="text-base sm:text-lg font-semibold leading-snug">
                  {suggestion?.intentSummary}
                </p>
              </div>
              {suggestion?.alertExplanation && (
                <p className="text-xs text-muted-foreground pl-8 leading-relaxed">
                  {suggestion.alertExplanation}
                </p>
              )}
            </motion.div>

            {/* Content being monitored — L4 reassurance, muted */}
            {suggestion?.contentPreview && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-1.5 px-1"
              >
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">What we'll monitor</p>
                <div className="bg-muted/10 rounded-lg p-2.5 text-[11px] text-muted-foreground/70 font-mono leading-relaxed max-h-20 overflow-y-auto">
                  {suggestion.contentPreview}
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  Open page to verify
                </a>
              </motion.div>
            )}

            {/* Frequency picker */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-2"
            >
              <Label className="text-xs text-muted-foreground">Check frequency</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FREQUENCY_OPTIONS.map((freq) => {
                  const locked = freq.value < limits.minIntervalMinutes;
                  const selected = (frequency || allowedFrequencies[0]?.value || 1440) === freq.value;
                  return (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => {
                        if (locked) {
                          toast('Upgrade your plan for faster checks', {
                            action: {
                              label: 'Upgrade',
                              onClick: () => router.push('/settings'),
                            },
                          });
                        } else {
                          setFrequency(freq.value);
                        }
                      }}
                      className={`
                        relative px-3 py-2.5 rounded-xl text-sm text-center transition-all
                        ${selected && !locked
                          ? 'glass glow-border border-primary/30 text-foreground'
                          : locked
                            ? 'border border-white/5 opacity-40 cursor-not-allowed'
                            : 'border border-white/5 hover:border-white/15 hover:bg-white/5 text-muted-foreground'
                        }
                      `}
                    >
                      {freq.label.replace('Every ', '')}
                      {locked && (
                        <span className="absolute -top-1.5 -right-1.5 text-[9px] text-primary-foreground font-medium px-1.5 py-0.5 rounded-full bg-primary">
                          PRO
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Create button — primary CTA */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlowButton className="w-full" onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Start monitoring'
                )}
              </GlowButton>
            </motion.div>

            {/* Customize — expandable advanced options */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <button
                type="button"
                onClick={() => setShowCustomize(!showCustomize)}
                className="w-full text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors text-center py-1"
              >
                {showCustomize ? '− Hide advanced options' : '+ Customize what to monitor'}
              </button>

              <AnimatePresence>
                {showCustomize && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-3 border-t border-white/5 mt-3">
                      {/* Watch mode selection */}
                      <div className="space-y-3">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                          What to monitor
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          {watchModes.map((mode) => {
                            const isActive = watchMode === mode.id;
                            return (
                              <button
                                key={mode.id}
                                type="button"
                                onClick={() => setWatchMode(mode.id)}
                                className={`
                                  relative flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all
                                  ${isActive
                                    ? 'glass glow-border border-primary/30'
                                    : 'border border-white/5 hover:border-white/15 hover:bg-white/5'
                                  }
                                `}
                              >
                                <mode.icon
                                  className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                                />
                                <div>
                                  <span className={`text-sm font-medium block ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {mode.title}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/70 block mt-0.5">
                                    {mode.description}
                                  </span>
                                </div>
                                {isActive && (
                                  <motion.div
                                    layoutId="mode-check"
                                    className="absolute top-2 right-2"
                                  >
                                    <Check className="h-3.5 w-3.5 text-primary" />
                                  </motion.div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Mode-specific configuration */}
                        <AnimatePresence mode="wait">
                          {watchMode === 'keyword' && (
                            <motion.div
                              key="keyword-config"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-2 pt-1">
                                <Input
                                  value={keyword}
                                  onChange={(e) => setKeyword(e.target.value)}
                                  placeholder='e.g. "In Stock", "Available", "Open"'
                                />
                                <div className="flex items-start gap-2 text-xs text-muted-foreground p-2.5 rounded-lg bg-white/5">
                                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
                                  We'll alert you when this word appears or disappears. Not case-sensitive.
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {watchMode === 'selector' && (
                            <motion.div
                              key="selector-config"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-3 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setPickerOpen(true)}
                                  className="w-full flex items-center justify-center gap-2.5 p-3.5 rounded-xl border border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all text-sm font-medium text-primary hover:shadow-[0_0_20px_oklch(0.78_0.16_75_/_15%)]"
                                >
                                  <Crosshair className="h-4 w-4" />
                                  Pick element from page
                                </button>

                                {suggestion?.selectorSuggestions && suggestion.selectorSuggestions.length > 0 && (
                                  <SelectorSuggestions
                                    suggestions={suggestion.selectorSuggestions}
                                    onSelect={(sel) => setSelector(sel)}
                                    selectedSelector={selector}
                                  />
                                )}
                                <SelectorPreviewPanel
                                  url={url}
                                  value={selector}
                                  onChange={setSelector}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Label */}
                      <div className="space-y-2">
                        <Label htmlFor="label" className="text-xs text-muted-foreground">Label</Label>
                        <Input
                          id="label"
                          value={label}
                          onChange={(e) => setLabel(e.target.value)}
                          placeholder="My monitor"
                          className="h-10"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual element picker dialog */}
      {analyzed && (
        <PagePickerDialog
          url={url}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelectorPicked={(sel) => {
            setSelector(sel);
            setWatchMode('selector');
          }}
          currentSelector={selector}
        />
      )}
    </div>
  );
}
