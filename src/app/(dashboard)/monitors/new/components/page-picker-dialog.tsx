'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { GlowButton } from '@/shared/components/motion-wrapper';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crosshair, Globe, Info } from 'lucide-react';

interface PickerElement {
  selector: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
}

interface PickerData {
  screenshotUrl: string;
  imageSize: { width: number; height: number };
  elements: PickerElement[];
}

export interface PickedElementInfo {
  selector: string;
  text: string;
  /** Bounding box in document coordinates (matches imageSize scale) */
  box: { x: number; y: number; w: number; h: number };
  /** The full-page screenshot URL from the picker session */
  screenshotUrl: string;
  /** The original image dimensions (for scaling the highlight overlay) */
  imageSize: { width: number; height: number };
}

interface PagePickerDialogProps {
  url: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectorPicked: (info: PickedElementInfo) => void;
  currentSelector?: string;
}

/**
 * Visual element picker. Replaces the old iframe-based picker which broke on
 * JS-heavy SPAs. Flow:
 *
 *   1. Open dialog, POST /api/monitors/pick with the URL
 *   2. Server returns a screenshot URL + a list of elements with bounding
 *      boxes (in document coordinates, captured at scroll=0) and
 *      pre-generated CSS selectors + an imageSize for scaling
 *   3. Render the screenshot as a static <img> inside a scrollable container
 *   4. On click, scale the click coordinates from displayed pixels back to
 *      image pixels, then find the smallest element whose box contains
 *      the point (smallest = innermost = most specific)
 *   5. User confirms, return the selector
 */
export function PagePickerDialog({
  url,
  open,
  onOpenChange,
  onSelectorPicked,
  currentSelector,
}: PagePickerDialogProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PickerData | null>(null);
  const [pickedSelector, setPickedSelector] = useState(currentSelector || '');
  const [pickedPreview, setPickedPreview] = useState('');
  const [hoveredElement, setHoveredElement] = useState<PickerElement | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state and fetch picker data when dialog opens
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setError(null);
    setData(null);
    setPickedSelector(currentSelector || '');
    setPickedPreview('');
    setHoveredElement(null);

    let cancelled = false;
    fetch('/api/monitors/pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !json?.data) {
          setError(json?.error || "Couldn't load the page picker");
          return;
        }
        setData(json.data as PickerData);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load picker');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, url, currentSelector]);

  /**
   * Map a pointer event from displayed-image coordinates to document coordinates
   * (the same coords Browserless used when collecting bounding boxes), then
   * find the smallest matching element. Smallest = most specific, so clicking
   * on a price inside a card hits the price not the card.
   */
  function findElementAtPoint(clientX: number, clientY: number): PickerElement | null {
    if (!data || !imgRef.current) return null;
    const img = imgRef.current;
    const rect = img.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    // Translate click into displayed-image coordinates
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) return null;

    // Scale to document coordinates (the coordinate space of the elements).
    const scaleX = data.imageSize.width / rect.width;
    const scaleY = data.imageSize.height / rect.height;
    const docX = localX * scaleX;
    const docY = localY * scaleY;

    let best: PickerElement | null = null;
    let bestArea = Infinity;
    for (const el of data.elements) {
      if (docX < el.x || docX > el.x + el.w) continue;
      if (docY < el.y || docY > el.y + el.h) continue;
      const area = el.w * el.h;
      if (area < bestArea) {
        best = el;
        bestArea = area;
      }
    }
    return best;
  }

  function handleClick(e: React.MouseEvent<HTMLImageElement>) {
    const el = findElementAtPoint(e.clientX, e.clientY);
    if (el) {
      setPickedSelector(el.selector);
      setPickedPreview(el.text);
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLImageElement>) {
    setHoveredElement(findElementAtPoint(e.clientX, e.clientY));
  }

  function handleConfirm() {
    if (pickedSelector && pickedElement && data) {
      onSelectorPicked({
        selector: pickedSelector,
        text: pickedPreview,
        box: { x: pickedElement.x, y: pickedElement.y, w: pickedElement.w, h: pickedElement.h },
        screenshotUrl: data.screenshotUrl,
        imageSize: data.imageSize,
      });
      onOpenChange(false);
    }
  }

  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    /* ignore */
  }

  // Scale a document-coordinate bounding box to displayed-image pixels
  // for the highlight overlay.
  function highlightStyle(el: PickerElement | null): React.CSSProperties | undefined {
    if (!el || !data || !imgRef.current) return undefined;
    const rect = imgRef.current.getBoundingClientRect();
    if (rect.width === 0) return undefined;
    const scaleX = rect.width / data.imageSize.width;
    const scaleY = rect.height / data.imageSize.height;
    return {
      left: el.x * scaleX,
      top: el.y * scaleY,
      width: el.w * scaleX,
      height: el.h * scaleY,
    };
  }

  // Find the picked element so we can show its highlight box even when not hovered
  const pickedElement = data?.elements.find((el) => el.selector === pickedSelector) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="sm:max-w-[92vw] sm:max-h-[90vh] h-[88vh] w-[95vw] flex flex-col gap-3 p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-0 pr-12">
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          <DialogTitle className="text-sm text-muted-foreground truncate font-normal flex-1">
            {hostname}
          </DialogTitle>
          {!pickedSelector && data && (
            <p className="hidden sm:block text-xs text-muted-foreground shrink-0">
              Click any element to select it for monitoring
            </p>
          )}
        </div>

        {/* Selector confirmation bar */}
        {pickedSelector && (
          <div className="flex items-center gap-3 mx-4 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <Badge
              variant="outline"
              className="font-mono text-xs border-primary/30 text-primary max-w-[60vw] sm:max-w-[400px] truncate"
            >
              <Crosshair className="h-3 w-3 mr-1 shrink-0" />
              {pickedSelector}
            </Badge>
            <div className="flex-1" />
            <GlowButton onClick={handleConfirm} size="default">
              Use this selector
            </GlowButton>
          </div>
        )}

        {/* Picked text preview */}
        {pickedPreview && (
          <div className="px-4">
            <div className="text-xs text-muted-foreground bg-white/5 rounded-lg px-3 py-2 truncate">
              {pickedPreview}
            </div>
          </div>
        )}

        {/* Screenshot canvas */}
        <div
          ref={containerRef}
          className="flex-1 relative mx-4 mb-3 rounded-lg overflow-hidden border border-white/10 bg-black/20 flex items-start justify-center"
        >
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Capturing the page...</p>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <p className="text-xs text-muted-foreground">
                Try a different URL or close this dialog and pick a selector manually.
              </p>
            </div>
          )}

          {data && (
            <div className="relative w-full h-full overflow-auto">
              <div className="relative inline-block">
                <img
                  ref={imgRef}
                  src={data.screenshotUrl}
                  alt="Page preview"
                  className="block max-w-full h-auto cursor-crosshair select-none"
                  draggable={false}
                  onClick={handleClick}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setHoveredElement(null)}
                />
                {/* Highlight for the currently picked element (persistent) */}
                {pickedElement && (
                  <div
                    className="pointer-events-none absolute border-2 border-primary bg-primary/15 rounded-sm"
                    style={highlightStyle(pickedElement)}
                  />
                )}
                {/* Highlight for the hovered element (transient) */}
                {hoveredElement && hoveredElement.selector !== pickedSelector && (
                  <div
                    className="pointer-events-none absolute border-2 border-primary/50 bg-primary/10 rounded-sm"
                    style={highlightStyle(hoveredElement)}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 pb-3 text-[11px] text-muted-foreground/60">
          <Info className="h-3 w-3 shrink-0" />
          {data
            ? `${data.elements.length} elements detected. Click any one to select it.`
            : 'Loading...'}
        </div>
      </DialogContent>
    </Dialog>
  );
}
