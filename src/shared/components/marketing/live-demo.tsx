'use client';

import { useState, useEffect } from 'react';

export function LiveDemo() {
  const [phase, setPhase] = useState<'watching' | 'detected' | 'sent'>('watching');
  const [dots, setDots] = useState('');

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    function cycle() {
      setPhase('watching');
      setDots('');

      const dotTimers = [
        setTimeout(() => setDots('.'), 800),
        setTimeout(() => setDots('..'), 1600),
        setTimeout(() => setDots('...'), 2400),
      ];

      timeout = setTimeout(() => {
        setPhase('detected');
        setTimeout(() => {
          setPhase('sent');
          setTimeout(cycle, 2500);
        }, 1200);
      }, 3200);

      return () => {
        dotTimers.forEach(clearTimeout);
        clearTimeout(timeout);
      };
    }

    const cleanup = cycle();
    return () => { cleanup?.(); clearTimeout(timeout); };
  }, []);

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="inline-flex items-center gap-3 glass rounded-full px-5 py-2.5 font-mono text-sm">
        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
          phase === 'watching' ? 'bg-primary animate-pulse' :
          phase === 'detected' ? 'bg-amber-400' :
          'bg-emerald-400'
        }`} />
        <span className={`transition-colors duration-300 ${
          phase === 'sent' ? 'text-emerald-400' : 'text-muted-foreground'
        }`}>
          {phase === 'watching' && `Checking page${dots}`}
          {phase === 'detected' && 'Change detected!'}
          {phase === 'sent' && 'Alert sent to your inbox'}
        </span>
      </div>
    </div>
  );
}
