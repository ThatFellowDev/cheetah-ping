'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { GlowButton } from '@/shared/components/motion-wrapper';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crosshair, Globe, Info } from 'lucide-react';

interface PagePickerDialogProps {
  url: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectorPicked: (selector: string) => void;
  currentSelector?: string;
}

export function PagePickerDialog({
  url,
  open,
  onOpenChange,
  onSelectorPicked,
  currentSelector,
}: PagePickerDialogProps) {
  const [loading, setLoading] = useState(true);
  const [pickedSelector, setPickedSelector] = useState(currentSelector || '');
  const [pickedPreview, setPickedPreview] = useState('');

  // Reset state when dialog opens + fallback timeout
  useEffect(() => {
    if (open) {
      setLoading(true);
      setPickedSelector(currentSelector || '');
      setPickedPreview('');

      // Fallback: hide loading after 5s even if PICKER_READY never fires
      const timeout = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [open, currentSelector]);

  // Listen for postMessage from iframe
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'PICKER_READY') {
        setLoading(false);
      }

      if (data.type === 'ELEMENT_PICKED' && data.selector) {
        setPickedSelector(data.selector);
        setPickedPreview(data.textPreview || '');
      }
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [open, handleMessage]);

  function handleConfirm() {
    if (pickedSelector) {
      onSelectorPicked(pickedSelector);
      onOpenChange(false);
    }
  }

  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch { /* ignore */ }

  const iframeSrc = `/api/monitors/proxy?url=${encodeURIComponent(url)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="sm:max-w-[92vw] sm:max-h-[90vh] h-[88vh] w-[95vw] flex flex-col gap-3 p-0 overflow-hidden"
      >
        {/* Header toolbar */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-0 pr-12">
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          <DialogTitle className="text-sm text-muted-foreground truncate font-normal flex-1">
            {hostname}
          </DialogTitle>
          {!pickedSelector && (
            <p className="text-xs text-muted-foreground shrink-0">
              Click any element to select it for monitoring
            </p>
          )}
        </div>

        {/* Selector confirmation bar - separate from header so it doesn't overlap X */}
        {pickedSelector && (
          <div className="flex items-center gap-3 mx-4 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <Badge
              variant="outline"
              className="font-mono text-xs border-primary/30 text-primary max-w-[400px] truncate"
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

        {/* Picked element preview */}
        {pickedPreview && (
          <div className="px-4">
            <div className="text-xs text-muted-foreground bg-white/5 rounded-lg px-3 py-2 truncate">
              {pickedPreview}
            </div>
          </div>
        )}

        {/* Iframe container */}
        <div className="flex-1 relative mx-4 mb-3 rounded-lg overflow-hidden border border-white/10">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading page preview...</p>
            </div>
          )}
          {open && (
            <iframe
              src={iframeSrc}
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full bg-white"
              title="Page preview"
            />
          )}
        </div>

        {/* Footer disclaimer */}
        <div className="flex items-center gap-2 px-4 pb-3 text-[11px] text-muted-foreground/60">
          <Info className="h-3 w-3 shrink-0" />
          Pages requiring JavaScript may not display correctly. Styles may differ from the live site.
        </div>
      </DialogContent>
    </Dialog>
  );
}
