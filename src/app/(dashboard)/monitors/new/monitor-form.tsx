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
  Sparkles,
  Eye,
  Shield,
  Bell,
  Hash,
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
  confidence: 'ai' | 'basic';
  selectorSuggestions?: SelectorSuggestion[];
  pagePreview?: PagePreview;
}

const inspirations = [
  { icon: Briefcase, label: 'Job postings', placeholder: 'https://company.com/careers' },
  { icon: ShoppingCart, label: 'Restocks', placeholder: 'https://store.com/product' },
  { icon: TrendingDown, label: 'Price drops', placeholder: 'https://store.com/product' },
  { icon: Building2, label: 'Apartments', placeholder: 'https://apartments.com/listing' },
  { icon: CalendarCheck, label: 'Appointments', placeholder: 'https://appointments.gov' },
  { icon: Globe, label: 'News & blogs', placeholder: 'https://news.site.com' },
  { icon: Eye, label: 'Competitors', placeholder: 'https://competitor.com/pricing' },
  { icon: Shield, label: 'Government', placeholder: 'https://agency.gov/updates' },
  { icon: Bell, label: 'Event tickets', placeholder: 'https://ticketsite.com/event' },
  { icon: Hash, label: 'Social media', placeholder: 'https://twitter.com/username' },
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
    description: 'Monitor a specific element',
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
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [creating, setCreating] = useState(false);

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
    setFaviconError(false);
    try {
      const res = await fetch('/api/monitors/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl }),
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
      setFrequency(allowedFrequencies[0]?.value ?? 1440);
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
      {/* Suggestion chips */}
      {!analyzed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          <p className="text-xs text-center text-muted-foreground">
            Try watching for...
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {inspirations.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setUrlPlaceholder(item.placeholder)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs glass border border-transparent hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground"
              >
                <item.icon className="h-3 w-3 text-primary" />
                {item.label}
              </button>
            ))}
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
                <Input
                  id="url"
                  placeholder={urlPlaceholder}
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (analyzed) handleReset();
                  }}
                  className="h-12 text-base flex-1"
                  autoFocus
                  disabled={analyzing}
                />
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
            {/* Page preview card */}
            {pagePreview && (pagePreview.title || pagePreview.description) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-xl p-4 flex items-start gap-3"
              >
                {pagePreview.favicon && !faviconError ? (
                  <img
                    src={pagePreview.favicon}
                    alt=""
                    className="w-8 h-8 rounded-lg shrink-0 mt-0.5 bg-white/10"
                    onError={() => setFaviconError(true)}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {pagePreview.title || new URL(url).hostname}
                  </p>
                  {pagePreview.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {pagePreview.description}
                    </p>
                  )}
                </div>
                {suggestion?.confidence === 'ai' && (
                  <div className="flex items-center gap-1 text-[10px] text-primary/70 shrink-0">
                    <Sparkles className="h-3 w-3" />
                    AI analyzed
                  </div>
                )}
              </motion.div>
            )}

            {/* AI summary */}
            {suggestion?.summary && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-sm text-muted-foreground text-center px-4"
              >
                {suggestion.summary}
              </motion.p>
            )}

            {/* Watch mode selection — always prominent */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
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
                      {/* Visual element picker button */}
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
            </motion.div>

            {/* Label + Frequency */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
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
              <div className="space-y-2">
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
              </div>
            </motion.div>

            {/* Create button */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
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
