'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Info,
  Lightbulb,
} from 'lucide-react';
import type { Robustness } from '@/modules/monitoring/lib/selector-validator';

interface PreviewData {
  selectorValid: boolean;
  robustness: Robustness;
  warnings: string[];
  suggestion: string | null;
  matchCount: number;
  extractedText: string;
}

interface SelectorPreviewPanelProps {
  url: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const ROBUSTNESS_CONFIG = {
  high: {
    icon: ShieldCheck,
    label: 'Reliable. Unlikely to break if the site updates',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
  medium: {
    icon: Shield,
    label: 'Should work. May need updating if the site changes',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
  },
  low: {
    icon: ShieldAlert,
    label: 'Fragile. Likely to break if the site changes layout',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
  },
} as const;

export function SelectorPreviewPanel({
  url,
  value,
  onChange,
  placeholder = '.price, #main-content',
}: SelectorPreviewPanelProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPreview = useCallback(
    async (selector: string) => {
      // Cancel previous request
      abortRef.current?.abort();

      if (!selector.trim() || !url) {
        setPreview(null);
        setError(null);
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/monitors/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, selector }),
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const result = await res.json();
        if (!res.ok) {
          setError(result.error || 'Preview failed');
          setPreview(null);
        } else {
          setPreview(result.data);
          setError(null);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Failed to load preview');
        setPreview(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [url]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPreview(value), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const robustness = preview ? ROBUSTNESS_CONFIG[preview.robustness] : null;
  const RobustnessIcon = robustness?.icon;

  return (
    <div className="space-y-2.5">
      {/* Selector input with match count badge */}
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-16"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && preview && value.trim() && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Badge
              variant="outline"
              className={`text-xs font-mono ${
                preview.matchCount === 0
                  ? 'border-red-400/30 text-red-400'
                  : preview.matchCount === 1
                    ? 'border-emerald-400/30 text-emerald-400'
                    : 'border-amber-400/30 text-amber-400'
              }`}
            >
              {preview.matchCount}
            </Badge>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-400 p-2.5 rounded-lg bg-red-400/5 border border-red-400/10">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Preview results */}
      {!error && preview && value.trim() && (
        <div className="space-y-2">
          {/* Robustness indicator */}
          {robustness && RobustnessIcon && (
            <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${robustness.bg} border ${robustness.border}`}>
              <RobustnessIcon className={`h-3.5 w-3.5 shrink-0 ${robustness.color}`} />
              <span className={robustness.color}>{robustness.label}</span>
            </div>
          )}

          {/* Warnings */}
          {preview.warnings.map((warning, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-amber-400 p-2 rounded-lg bg-amber-400/5 border border-amber-400/10"
            >
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {warning}
            </div>
          ))}

          {/* Suggestion */}
          {preview.suggestion && preview.suggestion !== value && (
            <button
              type="button"
              onClick={() => onChange(preview.suggestion!)}
              className="flex items-start gap-2 text-xs text-primary p-2 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors w-full text-left"
            >
              <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Try <code className="font-mono bg-primary/10 px-1 rounded">{preview.suggestion}</code> for better robustness
              </span>
            </button>
          )}

          {/* Match count messaging */}
          {preview.matchCount === 0 && (
            <div className="flex items-start gap-2 text-xs text-red-400 p-2.5 rounded-lg bg-red-400/5 border border-red-400/10">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              No elements found matching this selector
            </div>
          )}

          {/* Extracted text preview */}
          {preview.matchCount > 0 && preview.extractedText && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Preview
                  {preview.matchCount > 1 && (
                    <span className="text-amber-400">
                      ({preview.matchCount} elements matched, content will be combined)
                    </span>
                  )}
                </span>
              </div>
              <div className="text-xs bg-white/5 border border-white/10 rounded-lg p-3 max-h-32 overflow-y-auto font-mono text-muted-foreground leading-relaxed">
                {preview.extractedText.length >= 2000
                  ? preview.extractedText + '...'
                  : preview.extractedText}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help text when empty */}
      {!value.trim() && !loading && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground p-2.5 rounded-lg bg-white/5">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
          Pick a suggestion above or use the page picker to click on the section you want to monitor.
        </div>
      )}
    </div>
  );
}
