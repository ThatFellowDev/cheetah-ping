'use client';

import { useState } from 'react';

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  pauseOnHover?: boolean;
}

export function Marquee({
  children,
  speed = 30,
  className = '',
  pauseOnHover = true,
}: MarqueeProps) {
  const [paused, setPaused] = useState(false);

  return (
    <div
      className={`overflow-hidden relative py-3 -my-3 ${className}`}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />

      <div
        className="flex gap-6 w-max"
        style={{
          animation: `marquee ${speed}s linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {/* Duplicate children for seamless loop */}
        {children}
        {children}
      </div>
    </div>
  );
}

export function MarqueeItem({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        flex items-center gap-2 px-5 py-2.5 rounded-full
        glass text-sm text-muted-foreground whitespace-nowrap
        cursor-default select-none
        transition-all duration-300
        hover:text-foreground
        hover:ring-1 hover:ring-primary/50
        hover:shadow-[0_0_16px_oklch(0.78_0.16_75_/_20%)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}
