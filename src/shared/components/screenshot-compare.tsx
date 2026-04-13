'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScreenshotCompareProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beforeUrl: string | null;
  afterUrl: string | null;
}

type ViewMode = 'slider' | 'before' | 'after';

export function ScreenshotCompare({
  open,
  onOpenChange,
  beforeUrl,
  afterUrl,
}: ScreenshotCompareProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState<ViewMode>('slider');

  // Default to toggle mode on mobile
  useEffect(() => {
    if (open) {
      const isMobile = window.matchMedia('(max-width: 640px)').matches;
      setViewMode(isMobile ? 'before' : 'slider');
      setSliderPosition(50);
    }
  }, [open]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setSliderPosition((x / rect.width) * 100);
    },
    []
  );

  const [dragging, setDragging] = useState(false);

  if (!beforeUrl && !afterUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-5xl max-h-[90vh] p-0 bg-black/95 ring-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <DialogTitle className="text-sm font-medium text-white">
            Compare changes
          </DialogTitle>
          <div className="flex items-center gap-2">
            {/* View mode toggles */}
            <div className="flex items-center gap-1">
              {(['slider', 'before', 'after'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all capitalize ${
                    viewMode === mode
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  {mode === 'slider' ? 'Slider' : mode === 'before' ? 'Before' : 'After'}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Image area */}
        <div className="relative overflow-auto max-h-[calc(90vh-56px)]">
          {viewMode === 'slider' ? (
            <div
              className="relative select-none cursor-ew-resize"
              onPointerDown={(e) => {
                setDragging(true);
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                handlePointerMove(e);
              }}
              onPointerMove={(e) => {
                if (dragging) handlePointerMove(e);
              }}
              onPointerUp={() => setDragging(false)}
              onPointerCancel={() => setDragging(false)}
            >
              {/* After image (background) */}
              {afterUrl ? (
                <img
                  src={afterUrl}
                  alt="After"
                  className="w-full h-auto block"
                  draggable={false}
                />
              ) : (
                <div className="w-full aspect-[16/10] bg-black/50 flex items-center justify-center text-muted-foreground text-sm">
                  No after screenshot
                </div>
              )}

              {/* Before image (clipped overlay) */}
              {beforeUrl && (
                <img
                  src={beforeUrl}
                  alt="Before"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  draggable={false}
                />
              )}

              {/* Divider line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/70 pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                {/* Grab handle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border-2 border-white shadow-[0_0_12px_rgba(255,255,255,0.3)] flex items-center justify-center pointer-events-none">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M4 3L1 7L4 11" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 3L13 7L10 11" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 text-[10px] text-white/70 uppercase tracking-wider pointer-events-none">
                Before
              </div>
              <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/60 text-[10px] text-white/70 uppercase tracking-wider pointer-events-none">
                After
              </div>
            </div>
          ) : (
            /* Toggle view */
            <div className="relative">
              {viewMode === 'before' ? (
                beforeUrl ? (
                  <img src={beforeUrl} alt="Before" className="w-full h-auto block" />
                ) : (
                  <div className="w-full aspect-[16/10] bg-black/50 flex items-center justify-center text-muted-foreground text-sm">
                    No prior snapshot
                  </div>
                )
              ) : afterUrl ? (
                <img src={afterUrl} alt="After" className="w-full h-auto block" />
              ) : (
                <div className="w-full aspect-[16/10] bg-black/50 flex items-center justify-center text-muted-foreground text-sm">
                  No after screenshot
                </div>
              )}
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 text-[10px] text-white/70 uppercase tracking-wider pointer-events-none">
                {viewMode === 'before' ? 'Before' : 'After'}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
