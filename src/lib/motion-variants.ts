/**
 * src/lib/motion-variants.ts
 * ──────────────────────────
 * Centralized Framer Motion variant definitions for all AI-first components.
 * Import these in any component to keep animation logic consistent.
 */

import type { Variants } from 'framer-motion';

// ── Page Transitions ──────────────────────────────────────────────────────────
export const pageVariants: Variants = {
  hidden:  { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.22, ease: 'easeIn' },
  },
};

// ── AI Bubble Entrance ────────────────────────────────────────────────────────
export const aiBubbleVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.84, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 320,
      damping: 22,
      mass: 0.8,
    },
  },
};

// ── User Bubble Entrance ──────────────────────────────────────────────────────
export const userBubbleVariants: Variants = {
  hidden:  { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.28, ease: 'easeOut' },
  },
};

// ── Staggered children container ─────────────────────────────────────────────
export const staggerContainer: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren:   0.05,
    },
  },
};

// ── Staggered child item ──────────────────────────────────────────────────────
export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── AI Suggestion Card ────────────────────────────────────────────────────────
export const suggestionCardVariants: Variants = {
  hidden:  { opacity: 0, y: 16, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
  hover: {
    y: -4,
    scale: 1.02,
    boxShadow: '0 10px 32px rgba(142, 195, 176, 0.22)',
    transition: { type: 'spring', stiffness: 400, damping: 18 },
  },
  tap: { scale: 0.97 },
};

// ── Button Interaction ────────────────────────────────────────────────────────
export const buttonVariants: Variants = {
  idle:  { scale: 1 },
  hover: {
    scale: 1.04,
    transition: { type: 'spring', stiffness: 400, damping: 14 },
  },
  tap:   { scale: 0.94 },
};

// ── Modal / Drawer ────────────────────────────────────────────────────────────
export const modalBackdropVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.18 } },
};

export const modalContentVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.94, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 22, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 20,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

// ── AI Panel Slide-in (from right) ────────────────────────────────────────────
export const aiPanelVariants: Variants = {
  hidden:  { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 280, damping: 26 },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.22, ease: 'easeIn' },
  },
};

// ── AI Logo Mark Entrance ─────────────────────────────────────────────────────
export const logoVariants: Variants = {
  hidden:  { opacity: 0, rotate: -20, scale: 0.6 },
  visible: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 18, delay: 0.1 },
  },
};

// ── Thinking dots container ───────────────────────────────────────────────────
export const thinkingContainerVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  exit:    { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};
