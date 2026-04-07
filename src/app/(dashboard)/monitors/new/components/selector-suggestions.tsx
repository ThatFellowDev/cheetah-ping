'use client';

import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import {
  Crosshair,
  Pencil,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { selectorTemplates } from '@/modules/monitoring/lib/selector-templates';
import type { Robustness } from '@/modules/monitoring/lib/selector-validator';

export interface SelectorSuggestion {
  selector: string;
  label: string;
  rationale: string;
  robustness?: Robustness;
}

interface SelectorSuggestionsProps {
  suggestions: SelectorSuggestion[];
  onSelect: (selector: string) => void;
  selectedSelector: string;
}

const robustnessConfig = {
  high: { icon: ShieldCheck, color: 'text-emerald-400', label: 'Reliable' },
  medium: { icon: Shield, color: 'text-amber-400', label: 'Okay' },
  low: { icon: ShieldAlert, color: 'text-red-400', label: 'Fragile' },
} as const;

export function SelectorSuggestions({
  suggestions,
  onSelect,
  selectedSelector,
}: SelectorSuggestionsProps) {
  const [templatesOpen, setTemplatesOpen] = useState(false);

  return (
    <div className="space-y-2">
      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground font-medium">AI Suggestions</span>
          <div className="space-y-1.5">
            {suggestions.map((suggestion, i) => {
              const isSelected = selectedSelector === suggestion.selector;
              const rob = suggestion.robustness
                ? robustnessConfig[suggestion.robustness]
                : null;
              const RobIcon = rob?.icon;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelect(suggestion.selector)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                    isSelected
                      ? 'glass glow-border border-primary/30'
                      : 'border-white/5 hover:border-white/15 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Crosshair className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium flex-1 truncate">{suggestion.label}</span>
                    {rob && RobIcon && (
                      <Badge variant="outline" className={`text-[10px] ${rob.color} border-current/20`}>
                        <RobIcon className="h-3 w-3 mr-0.5" />
                        {rob.label}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 ml-6 text-xs font-mono text-muted-foreground truncate">
                    {suggestion.selector}
                  </div>
                  <div className="mt-0.5 ml-6 text-xs text-muted-foreground/70">
                    {suggestion.rationale}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom selector option */}
      {suggestions.length > 0 && (
        <button
          type="button"
          onClick={() => onSelect('')}
          className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center gap-2 ${
            selectedSelector && !suggestions.some((s) => s.selector === selectedSelector)
              ? 'glass glow-border border-primary/30'
              : 'border-white/5 hover:border-white/15 hover:bg-white/5'
          }`}
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm">Custom selector...</span>
        </button>
      )}

      {/* Templates */}
      <Collapsible open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
          {templatesOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Common selectors
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-1.5 space-y-1">
            {Object.entries(
              selectorTemplates.reduce(
                (acc, t) => {
                  (acc[t.category] ??= []).push(t);
                  return acc;
                },
                {} as Record<string, typeof selectorTemplates>
              )
            ).map(([category, templates]) => (
              <div key={category}>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                  {category}
                </span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {templates.map((t) => (
                    <button
                      key={t.selector}
                      type="button"
                      onClick={() => onSelect(t.selector)}
                      title={t.description}
                      className="text-xs font-mono px-2 py-1 rounded-md border border-white/5 hover:border-white/15 hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                    >
                      {t.selector}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
