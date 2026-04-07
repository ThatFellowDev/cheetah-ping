'use client';

import { motion } from 'motion/react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = 'up',
}: ScrollRevealProps) {
  const offsets = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: 30 },
    right: { x: -30 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface FloatingOrbProps {
  className?: string;
  color?: string;
  size?: string;
  delay?: number;
}

export function FloatingOrb({
  className = '',
  color = 'oklch(0.78 0.16 75 / 25%)',
  size = '400px',
  delay = 0,
}: FloatingOrbProps) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none blur-3xl ${className}`}
      style={{
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
        width: size,
        height: size,
      }}
      animate={{
        y: [0, -20, 0],
        scale: [1, 1.05, 1],
        opacity: [0.4, 0.7, 0.4],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

interface GlowButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  size?: 'default' | 'lg';
}

export function GlowButton({
  children,
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  size = 'default',
}: GlowButtonProps) {
  const sizeClasses = size === 'lg' ? 'h-11 px-6 text-base' : 'h-9 px-4 text-sm';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-center gap-2 rounded-xl
        font-medium text-primary-foreground
        bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500
        transition-all duration-300
        hover:shadow-[0_0_30px_oklch(0.78_0.16_75_/_35%)]
        active:scale-[0.98]
        disabled:opacity-50 disabled:pointer-events-none
        ${sizeClasses} ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}
